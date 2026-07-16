import { Injectable, NotFoundException, BadRequestException, OnApplicationBootstrap } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import { jobs } from "../../../database/schema/jobs";
import { savedJobs } from "../../../database/schema/saved-jobs";
import { and, eq, ilike, or, gte, desc, count } from "drizzle-orm";
import { SearchJobsDto } from "../dto/search-jobs.dto";
import { GreenhouseProvider } from "../providers/greenhouse.provider";
import { LeverProvider } from "../providers/lever.provider";
import { AshbyProvider } from "../providers/ashby.provider";

@Injectable()
export class JobsService implements OnApplicationBootstrap {
  constructor(
    private readonly greenhouseProvider: GreenhouseProvider,
    private readonly leverProvider: LeverProvider,
    private readonly ashbyProvider: AshbyProvider,
  ) {}

  // Automatically sync mock jobs on application boot so the database has jobs for search testing
  async onApplicationBootstrap() {
    console.log("[JobsService] Populating initial mock jobs...");
    try {
      await this.syncJobs("greenhouse", "mock-stripe");
      await this.syncJobs("lever", "mock-figma");
      await this.syncJobs("ashby", "mock-linear");
      console.log("[JobsService] Initial jobs synced successfully!");
    } catch (err) {
      console.error("[JobsService] Failed to sync initial mock jobs:", err);
    }
  }

  async searchJobs(dto: SearchJobsDto) {
    const conditions = [];

    // Filter active jobs only
    conditions.push(eq(jobs.isActive, true));

    if (dto.keyword) {
      conditions.push(
        or(
          ilike(jobs.title, `%${dto.keyword}%`),
          ilike(jobs.company, `%${dto.keyword}%`),
          ilike(jobs.description, `%${dto.keyword}%`),
          ilike(jobs.requirements, `%${dto.keyword}%`),
        ),
      );
    }

    if (dto.location) {
      conditions.push(ilike(jobs.location, `%${dto.location}%`));
    }

    if (dto.remote !== undefined) {
      conditions.push(eq(jobs.remote, dto.remote));
    }

    if (dto.company) {
      conditions.push(ilike(jobs.company, `%${dto.company}%`));
    }

    if (dto.employmentType) {
      conditions.push(ilike(jobs.employmentType, `%${dto.employmentType}%`));
    }

    if (dto.experienceLevel) {
      conditions.push(ilike(jobs.experienceLevel, `%${dto.experienceLevel}%`));
    }

    if (dto.salaryMin !== undefined) {
      // Return jobs where salary_max is >= salaryMin or salary_min is >= salaryMin
      conditions.push(
        or(
          gte(jobs.salaryMax, dto.salaryMin),
          gte(jobs.salaryMin, dto.salaryMin),
        ),
      );
    }

    const whereClause = and(...conditions);

    // 1. Calculate count
    const countResult = await db
      .select({ value: count() })
      .from(jobs)
      .where(whereClause);
    const total = countResult[0]?.value || 0;

    // 2. Query paginated results
    const limit = dto.limit;
    const page = dto.page;
    const offset = (page - 1) * limit;

    const items = await db
      .select()
      .from(jobs)
      .where(whereClause)
      .orderBy(desc(jobs.postedAt), desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      page,
      limit,
      total,
      totalPages,
    };
  }

  async findOne(id: string) {
    const result = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException("Job not found");
    }

    return result[0];
  }

  async saveJob(userId: string, jobId: string) {
    // Verify job exists
    await this.findOne(jobId);

    // Check if already saved
    const existing = await db
      .select()
      .from(savedJobs)
      .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
      .limit(1);

    if (existing.length > 0) {
      return {
        message: "Job already saved",
        savedJob: existing[0],
      };
    }

    const [saved] = await db
      .insert(savedJobs)
      .values({
        userId,
        jobId,
      })
      .returning();

    return {
      message: "Job saved successfully",
      savedJob: saved,
    };
  }

  async removeSavedJob(userId: string, jobId: string) {
    const existing = await db
      .select()
      .from(savedJobs)
      .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException("Saved job not found");
    }

    await db.delete(savedJobs).where(eq(savedJobs.id, existing[0].id));

    return {
      message: "Job removed from saved list",
    };
  }

  async findSavedJobs(userId: string) {
    const list = await db
      .select({
        id: savedJobs.id,
        createdAt: savedJobs.createdAt,
        job: jobs,
      })
      .from(savedJobs)
      .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .where(eq(savedJobs.userId, userId))
      .orderBy(desc(savedJobs.createdAt));

    return list;
  }

  async syncJobs(providerName: string, boardToken: string) {
    let parsedJobs = [];

    if (providerName === "greenhouse") {
      parsedJobs = await this.greenhouseProvider.fetchJobs(boardToken);
    } else if (providerName === "lever") {
      parsedJobs = await this.leverProvider.fetchJobs(boardToken);
    } else if (providerName === "ashby") {
      parsedJobs = await this.ashbyProvider.fetchJobs(boardToken);
    } else {
      throw new BadRequestException(`Unknown provider: ${providerName}`);
    }

    let importedCount = 0;

    for (const jobData of parsedJobs) {
      try {
        await db
          .insert(jobs)
          .values({
            ...jobData,
            updatedAt: new Date(),
          })
          .onConflictDoNothing({
            target: [jobs.provider, jobs.externalId],
          });
        importedCount++;
      } catch (err) {
        console.error(`Failed to insert job ${jobData.externalId}:`, err);
      }
    }

    return {
      provider: providerName,
      boardToken,
      fetched: parsedJobs.length,
      synced: importedCount,
    };
  }
}
