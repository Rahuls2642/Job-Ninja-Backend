import { Injectable } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import { aiCache } from "../../../database/schema/ai-cache";
import { and, eq } from "drizzle-orm";
import * as crypto from "crypto";

@Injectable()
export class AiCacheService {
  computeHash(inputs: string[]): string {
    const combined = inputs.join("||");
    return crypto.createHash("sha256").update(combined).digest("hex");
  }

  async getCache(resumeId: string | null, jobId: string | null, hash: string): Promise<any | null> {
    const conditions = [eq(aiCache.hash, hash)];
    if (resumeId) conditions.push(eq(aiCache.resumeId, resumeId));
    if (jobId) conditions.push(eq(aiCache.jobId, jobId));

    const records = await db
      .select()
      .from(aiCache)
      .where(and(...conditions))
      .limit(1);

    return records.length > 0 ? records[0].response : null;
  }

  async setCache(resumeId: string | null, jobId: string | null, hash: string, response: any): Promise<void> {
    // Delete any old cache for this resume/job combo to avoid duplicate rows
    const conditions = [];
    if (resumeId) conditions.push(eq(aiCache.resumeId, resumeId));
    if (jobId) conditions.push(eq(aiCache.jobId, jobId));

    if (conditions.length > 0) {
      await db.delete(aiCache).where(and(...conditions));
    }

    await db.insert(aiCache).values({
      resumeId,
      jobId,
      hash,
      response,
    });
  }
}
