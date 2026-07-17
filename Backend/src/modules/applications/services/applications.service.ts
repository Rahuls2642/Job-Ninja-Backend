import { Injectable, ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import { applications } from "../../../database/schema/applications";
import { applicationTimeline } from "../../../database/schema/application-timeline";
import { jobs } from "../../../database/schema/jobs";
import { resumes } from "../../../database/schema/resumes";
import { coverLetters } from "../../../database/schema/cover-letters";
import { aiAnalysis } from "../../../database/schema/ai-analysis";
import { and, eq, like, desc, or, sql } from "drizzle-orm";
import { CreateApplicationDto } from "../dto/create-application.dto";
import { GetApplicationsFilterDto } from "../dto/get-applications-filter.dto";
import { ApplicationStatus } from "../dto/update-status.dto";

@Injectable()
export class ApplicationsService {
  
  // Helper: Log timeline event
  private async logTimelineEvent(applicationId: string, eventType: string, description: string): Promise<void> {
    await db.insert(applicationTimeline).values({
      applicationId,
      eventType,
      description,
    });
  }

  // Create Application
  async create(userId: string, dto: CreateApplicationDto): Promise<any> {
    // 1. Check for existing application to prevent duplicates (409 Conflict)
    const existing = await db
      .select()
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.jobId, dto.jobId)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException("Already applied to this job posting");
    }

    // 2. Validate Job exists
    const jobList = await db.select().from(jobs).where(eq(jobs.id, dto.jobId)).limit(1);
    if (jobList.length === 0) {
      throw new NotFoundException("Job posting not found");
    }

    // 3. Validate Resume exists and belongs to the user
    const resumeList = await db.select().from(resumes).where(eq(resumes.id, dto.resumeId)).limit(1);
    if (resumeList.length === 0) {
      throw new NotFoundException("Resume not found");
    }
    if (resumeList[0].userId !== userId) {
      throw new ForbiddenException("Unauthorized access to this resume");
    }

    // 4. Auto-associate existing cover letter if available
    const latestCover = await db
      .select()
      .from(coverLetters)
      .where(and(
        eq(coverLetters.userId, userId),
        eq(coverLetters.jobId, dto.jobId),
        eq(coverLetters.resumeId, dto.resumeId)
      ))
      .orderBy(desc(coverLetters.createdAt))
      .limit(1);

    // 5. Auto-associate existing AI analysis report if available
    const latestAnalysis = await db
      .select()
      .from(aiAnalysis)
      .where(and(
        eq(aiAnalysis.userId, userId),
        eq(aiAnalysis.jobId, dto.jobId),
        eq(aiAnalysis.resumeId, dto.resumeId)
      ))
      .orderBy(desc(aiAnalysis.createdAt))
      .limit(1);

    // 6. Insert new application record
    const [newApp] = await db
      .insert(applications)
      .values({
        userId,
        jobId: dto.jobId,
        resumeId: dto.resumeId,
        coverLetterId: latestCover.length > 0 ? latestCover[0].id : null,
        aiAnalysisId: latestAnalysis.length > 0 ? latestAnalysis[0].id : null,
        status: "DRAFT",
      })
      .returning();

    // 7. Log creation timeline event
    await this.logTimelineEvent(newApp.id, "CREATED", "Application created as DRAFT");

    if (latestCover.length > 0) {
      await this.logTimelineEvent(newApp.id, "COVER_LETTER_ATTACHED", "Latest cover letter auto-associated");
    }
    if (latestAnalysis.length > 0) {
      await this.logTimelineEvent(newApp.id, "AI_ANALYSIS_ATTACHED", "Job match analysis report auto-associated");
    }

    return newApp;
  }

  // List Applications (Filters, Search, Pagination)
  async findAll(userId: string, filter: GetApplicationsFilterDto): Promise<any> {
    const conditions = [eq(applications.userId, userId)];

    if (filter.status) {
      conditions.push(eq(applications.status, filter.status));
    }

    if (filter.appliedDate) {
      const dateStart = new Date(filter.appliedDate);
      conditions.push(sql`${applications.appliedAt} >= ${dateStart}`);
    }

    // Join with jobs table to enable keyword search and company filtering
    let baseQuery = db
      .select({
        id: applications.id,
        status: applications.status,
        notes: applications.notes,
        appliedAt: applications.appliedAt,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        job: {
          id: jobs.id,
          title: jobs.title,
          company: jobs.company,
          location: jobs.location,
        },
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id));

    if (filter.company) {
      conditions.push(like(jobs.company, `%${filter.company}%`));
    }

    if (filter.keyword) {
      conditions.push(
        or(
          like(jobs.title, `%${filter.keyword}%`),
          like(jobs.description, `%${filter.keyword}%`),
          like(applications.notes, `%${filter.keyword}%`)
        )
      );
    }

    // Apply sorting
    const sortField = filter.sort?.split(":")[0] || "createdAt";
    const sortOrder = filter.sort?.split(":")[1] || "desc";
    const orderByExpr = sortOrder === "asc" 
      ? sql`${applications[sortField]} ASC` 
      : sql`${applications[sortField]} DESC`;

    const limit = filter.limit || 10;
    const offset = ((filter.page || 1) - 1) * limit;

    const items = await baseQuery
      .where(and(...conditions))
      .orderBy(orderByExpr)
      .limit(limit)
      .offset(offset);

    // Calculate pagination metadata count
    const totalRecords = await db
      .select({ count: sql`count(*)` })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(...conditions));
    
    const count = parseInt((totalRecords[0]?.count as string) || "0");

    return {
      items,
      meta: {
        totalItems: count,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(count / limit),
        currentPage: filter.page || 1,
      },
    };
  }

  // Get Application Details
  async findOne(userId: string, id: string): Promise<any> {
    const appList = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1);

    if (appList.length === 0) {
      throw new NotFoundException("Application not found");
    }

    const app = appList[0];

    // Fetch related Job details
    const jobList = await db.select().from(jobs).where(eq(jobs.id, app.jobId)).limit(1);
    
    // Fetch related Resume metadata
    const resumeList = await db.select().from(resumes).where(eq(resumes.id, app.resumeId)).limit(1);
    
    // Fetch related Cover Letter
    let coverLetterObj = null;
    if (app.coverLetterId) {
      const covers = await db.select().from(coverLetters).where(eq(coverLetters.id, app.coverLetterId)).limit(1);
      coverLetterObj = covers.length > 0 ? covers[0] : null;
    }

    // Fetch related AI Analysis
    let aiAnalysisObj = null;
    if (app.aiAnalysisId) {
      const analyses = await db.select().from(aiAnalysis).where(eq(aiAnalysis.id, app.aiAnalysisId)).limit(1);
      aiAnalysisObj = analyses.length > 0 ? analyses[0] : null;
    }

    // Fetch full timeline events
    const timeline = await db
      .select()
      .from(applicationTimeline)
      .where(eq(applicationTimeline.applicationId, app.id))
      .orderBy(desc(applicationTimeline.createdAt));

    return {
      ...app,
      job: jobList[0] || null,
      resume: resumeList[0] || null,
      coverLetter: coverLetterObj,
      aiAnalysis: aiAnalysisObj,
      timeline,
    };
  }

  // Update Status
  async updateStatus(userId: string, id: string, status: ApplicationStatus): Promise<any> {
    const appList = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1);

    if (appList.length === 0) {
      throw new NotFoundException("Application not found");
    }

    const app = appList[0];
    const updateValues: any = { status, updatedAt: new Date() };

    // Automatically stamp applied_at if status becomes SUBMITTED
    if (status === "SUBMITTED" && !app.appliedAt) {
      updateValues.appliedAt = new Date();
    }

    const [updatedApp] = await db
      .update(applications)
      .set(updateValues)
      .where(eq(applications.id, id))
      .returning();

    // Log the status change event in timeline
    await this.logTimelineEvent(app.id, "STATUS_CHANGE", `Status updated to ${status}`);

    if (status === "SUBMITTED") {
      await this.logTimelineEvent(app.id, "SUBMITTED", "Application submitted successfully");
    }

    return updatedApp;
  }

  // Update Notes
  async updateNotes(userId: string, id: string, notes: string): Promise<any> {
    const appList = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1);

    if (appList.length === 0) {
      throw new NotFoundException("Application not found");
    }

    const [updatedApp] = await db
      .update(applications)
      .set({ notes, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    await this.logTimelineEvent(id, "NOTES_UPDATED", "Notes updated");

    return updatedApp;
  }

  // Delete Application
  async delete(userId: string, id: string): Promise<any> {
    const appList = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1);

    if (appList.length === 0) {
      throw new NotFoundException("Application not found");
    }

    await db.delete(applications).where(eq(applications.id, id));
    return { success: true, message: "Application deleted successfully" };
  }

  // Dashboard Statistics
  async getStats(userId: string): Promise<any> {
    const appList = await db.select().from(applications).where(eq(applications.userId, userId));
    const total = appList.length;

    if (total === 0) {
      return {
        total: 0,
        interviewRate: 0,
        offerRate: 0,
        rejected: 0,
        pending: 0,
      };
    }

    const interviews = appList.filter(app => 
      app.status === "INTERVIEW" || 
      app.status === "ASSESSMENT" || 
      app.status === "FINAL_INTERVIEW"
    ).length;

    const offers = appList.filter(app => 
      app.status === "OFFER" || 
      app.status === "HIRED"
    ).length;

    const rejected = appList.filter(app => app.status === "REJECTED").length;
    const withdraws = appList.filter(app => app.status === "WITHDRAWN").length;

    // Pending applications are not decided yet (not rejected, hired, offer, or withdrawn)
    const pending = appList.filter(app => 
      app.status !== "REJECTED" && 
      app.status !== "WITHDRAWN" && 
      app.status !== "HIRED" && 
      app.status !== "OFFER"
    ).length;

    return {
      total,
      interviewRate: Math.round((interviews / total) * 100),
      offerRate: Math.round((offers / total) * 100),
      rejected,
      pending,
    };
  }
}
