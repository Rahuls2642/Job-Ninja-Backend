import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { db } from "../../../database/drizzle";
import { resumes } from "../../../database/schema/resumes";
import { jobs } from "../../../database/schema/jobs";
import { profiles } from "../../../database/schema/profiles";
import { aiAnalysis } from "../../../database/schema/ai-analysis";
import { tailoredResumes } from "../../../database/schema/tailored-resumes";
import { coverLetters } from "../../../database/schema/cover-letters";
import { and, eq } from "drizzle-orm";
import { StorageProvider } from "../../../common/storage/storage.interface";
import { ResumeAnalyzerService } from "./resume-analyzer.service";
import { JobAnalyzerService } from "./job-analyzer.service";
import { ATSScoreService } from "./ats.service";
import { ResumeTailorService } from "./tailor-resume.service";
import { CoverLetterService } from "./cover-letter.service";
import { JobSummaryService } from "./job-summary.service";
import { JobScoreService } from "./job-score.service";
import { AiCacheService } from "./cache.service";

@Injectable()
export class AIOrchestratorService {
  private readonly groqApiKey?: string;
  private readonly openaiApiKey?: string;
  private readonly geminiApiKey?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly resumeAnalyzer: ResumeAnalyzerService,
    private readonly jobAnalyzer: JobAnalyzerService,
    private readonly atsService: ATSScoreService,
    private readonly tailorService: ResumeTailorService,
    private readonly coverLetterService: CoverLetterService,
    private readonly summaryService: JobSummaryService,
    private readonly scoreService: JobScoreService,
    private readonly cacheService: AiCacheService,
    @Inject("StorageProvider")
    private readonly storageProvider: StorageProvider,
  ) {
    this.groqApiKey = this.configService.get<string>("GROQ_API_KEY");
    this.openaiApiKey = this.configService.get<string>("OPENAI_API_KEY");
    this.geminiApiKey = this.configService.get<string>("GEMINI_API_KEY");
  }

  // Helper: Centralized LLM Query
  private async queryLLM(systemPrompt: string, userPrompt: string, fallbackMock: () => any): Promise<any> {
    if (this.groqApiKey) {
      return this.queryGroq(systemPrompt, userPrompt);
    } else if (this.openaiApiKey) {
      return this.queryOpenAI(systemPrompt, userPrompt);
    } else if (this.geminiApiKey) {
      return this.queryGemini(systemPrompt, userPrompt);
    } else {
      console.warn("[AIOrchestrator] No LLM API Keys set. Using local mock generator.");
      return fallbackMock();
    }
  }

  private async queryGroq(system: string, user: string): Promise<any> {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Groq HTTP error ${response.status}: ${text}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices?.[0]?.message?.content || "{}");
    } catch (e) {
      console.error("[AIOrchestrator] Groq error:", e);
      throw new InternalServerErrorException(`AI query failed: ${(e as Error).message}`);
    }
  }

  private async queryOpenAI(system: string, user: string): Promise<any> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI HTTP error ${response.status}: ${text}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices?.[0]?.message?.content || "{}");
    } catch (e) {
      console.error("[AIOrchestrator] OpenAI error:", e);
      throw new InternalServerErrorException(`AI query failed: ${(e as Error).message}`);
    }
  }

  private async queryGemini(system: string, user: string): Promise<any> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gemini HTTP error ${response.status}: ${text}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return JSON.parse(content);
    } catch (e) {
      console.error("[AIOrchestrator] Gemini error:", e);
      throw new InternalServerErrorException(`AI query failed: ${(e as Error).message}`);
    }
  }

  // Helper: Load user's default resume or specific resume and verify ownership
  private async loadResume(userId: string, resumeId?: string): Promise<any> {
    if (resumeId) {
      const res = await db.select().from(resumes).where(eq(resumes.id, resumeId)).limit(1);
      if (res.length === 0) throw new NotFoundException("Resume not found");
      if (res[0].userId !== userId) throw new ForbiddenException("Unauthorized access to this resume");
      return res[0];
    }

    const defaultRes = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.userId, userId), eq(resumes.isDefault, true)))
      .limit(1);

    if (defaultRes.length === 0) {
      // Fallback to first resume uploaded if no default is checked
      const firstRes = await db.select().from(resumes).where(eq(resumes.userId, userId)).limit(1);
      if (firstRes.length === 0) throw new NotFoundException("No resumes uploaded. Please upload a resume first.");
      return firstRes[0];
    }
    return defaultRes[0];
  }

  // Helper: Load job and format
  private async loadJob(jobId: string): Promise<any> {
    const jobList = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (jobList.length === 0) throw new NotFoundException("Job posting not found");
    return jobList[0];
  }

  // Feature 1: Score Job
  async scoreJob(userId: string, jobId: string, resumeId?: string, refresh = false): Promise<any> {
    const resumeObj = await this.loadResume(userId, resumeId);
    const jobObj = await this.loadJob(jobId);

    const signedUrl = await this.storageProvider.getSignedUrl(resumeObj.fileKey);
    const resumeText = await this.resumeAnalyzer.extractText(signedUrl, resumeObj.mimeType);
    const jobText = this.jobAnalyzer.formatJob(jobObj);

    const profileList = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    const profileText = profileList.length > 0 ? JSON.stringify(profileList[0]) : "No profile details set.";

    const inputHash = this.cacheService.computeHash([resumeText, profileText, jobText, "score"]);

    if (!refresh) {
      const cached = await this.cacheService.getCache(resumeObj.id, jobObj.id, inputHash);
      if (cached) return cached;
    }

    const systemPrompt = this.scoreService.getSystemPrompt();
    const userPrompt = this.scoreService.getUserPrompt(resumeText, profileText, jobText);

    const result = await this.queryLLM(systemPrompt, userPrompt, () =>
      this.scoreService.generateMock(resumeText, profileText, jobText)
    );

    // Save to specific domain table
    await db.delete(aiAnalysis).where(and(eq(aiAnalysis.resumeId, resumeObj.id), eq(aiAnalysis.jobId, jobObj.id)));
    await db.insert(aiAnalysis).values({
      userId,
      resumeId: resumeObj.id,
      jobId: jobObj.id,
      overallScore: result.overallScore,
      reasons: result.reasons,
      missingSkills: result.missingSkills,
      suggestions: result.suggestions,
    });

    await this.cacheService.setCache(resumeObj.id, jobObj.id, inputHash, result);
    return result;
  }

  // Feature 2: Tailor Resume
  async tailorResume(userId: string, resumeId: string, jobId: string, refresh = false): Promise<any> {
    const resumeObj = await this.loadResume(userId, resumeId);
    const jobObj = await this.loadJob(jobId);

    const signedUrl = await this.storageProvider.getSignedUrl(resumeObj.fileKey);
    const resumeText = await this.resumeAnalyzer.extractText(signedUrl, resumeObj.mimeType);
    const jobText = this.jobAnalyzer.formatJob(jobObj);

    const inputHash = this.cacheService.computeHash([resumeText, jobText, "tailor"]);

    if (!refresh) {
      const cached = await this.cacheService.getCache(resumeObj.id, jobObj.id, inputHash);
      if (cached) return cached;
    }

    const systemPrompt = this.tailorService.getSystemPrompt();
    const userPrompt = this.tailorService.getUserPrompt(resumeText, jobText);

    const result = await this.queryLLM(systemPrompt, userPrompt, () =>
      this.tailorService.generateMock(resumeText, jobText)
    );

    // Save to tailored_resumes table
    await db.delete(tailoredResumes).where(and(eq(tailoredResumes.resumeId, resumeObj.id), eq(tailoredResumes.jobId, jobObj.id)));
    await db.insert(tailoredResumes).values({
      resumeId: resumeObj.id,
      jobId: jobObj.id,
      content: result.tailoredResume,
    });

    await this.cacheService.setCache(resumeObj.id, jobObj.id, inputHash, result);
    return result;
  }

  // Feature 3: ATS Score
  async atsScore(userId: string, resumeId: string, jobId: string, refresh = false): Promise<any> {
    const resumeObj = await this.loadResume(userId, resumeId);
    const jobObj = await this.loadJob(jobId);

    const signedUrl = await this.storageProvider.getSignedUrl(resumeObj.fileKey);
    const resumeText = await this.resumeAnalyzer.extractText(signedUrl, resumeObj.mimeType);
    const jobText = this.jobAnalyzer.formatJob(jobObj);

    const inputHash = this.cacheService.computeHash([resumeText, jobText, "ats"]);

    if (!refresh) {
      const cached = await this.cacheService.getCache(resumeObj.id, jobObj.id, inputHash);
      if (cached) return cached;
    }

    const systemPrompt = this.atsService.getSystemPrompt();
    const userPrompt = this.atsService.getUserPrompt(resumeText, jobText);

    const result = await this.queryLLM(systemPrompt, userPrompt, () =>
      this.atsService.generateMock(resumeText, jobText)
    );

    await this.cacheService.setCache(resumeObj.id, jobObj.id, inputHash, result);
    return result;
  }

  // Feature 4: Cover Letter
  async coverLetter(userId: string, jobId: string, resumeId?: string, refresh = false): Promise<any> {
    const resumeObj = await this.loadResume(userId, resumeId);
    const jobObj = await this.loadJob(jobId);

    const signedUrl = await this.storageProvider.getSignedUrl(resumeObj.fileKey);
    const resumeText = await this.resumeAnalyzer.extractText(signedUrl, resumeObj.mimeType);
    const jobText = this.jobAnalyzer.formatJob(jobObj);

    const profileList = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    const profileText = profileList.length > 0 ? JSON.stringify(profileList[0]) : "No profile details set.";

    const inputHash = this.cacheService.computeHash([resumeText, profileText, jobText, "cover"]);

    if (!refresh) {
      const cached = await this.cacheService.getCache(resumeObj.id, jobObj.id, inputHash);
      if (cached) return cached;
    }

    const systemPrompt = this.coverLetterService.getSystemPrompt();
    const userPrompt = this.coverLetterService.getUserPrompt(resumeText, profileText, jobText);

    const result = await this.queryLLM(systemPrompt, userPrompt, () =>
      this.coverLetterService.generateMock(resumeText, profileText, jobText)
    );

    // Save to cover_letters table
    await db.delete(coverLetters).where(and(eq(coverLetters.resumeId, resumeObj.id), eq(coverLetters.jobId, jobObj.id)));
    await db.insert(coverLetters).values({
      userId,
      resumeId: resumeObj.id,
      jobId: jobObj.id,
      content: result.coverLetter,
    });

    await this.cacheService.setCache(resumeObj.id, jobObj.id, inputHash, result);
    return result;
  }

  // Feature 5: Job Summary
  async jobSummary(jobId: string, refresh = false): Promise<any> {
    const jobObj = await this.loadJob(jobId);
    const jobText = this.jobAnalyzer.formatJob(jobObj);

    const inputHash = this.cacheService.computeHash([jobText, "summary"]);

    if (!refresh) {
      const cached = await this.cacheService.getCache(null, jobObj.id, inputHash);
      if (cached) return cached;
    }

    const systemPrompt = this.summaryService.getSystemPrompt();
    const userPrompt = this.summaryService.getUserPrompt(jobText);

    const result = await this.queryLLM(systemPrompt, userPrompt, () =>
      this.summaryService.generateMock(jobText)
    );

    await this.cacheService.setCache(null, jobObj.id, inputHash, result);
    return result;
  }

  // Feature 6: Cache Retrieval GET endpoint
  async getCachedAnalysis(userId: string, jobId: string): Promise<any> {
    // Return latest computed job score analysis from the ai_analysis table
    const analysisList = await db
      .select()
      .from(aiAnalysis)
      .where(and(eq(aiAnalysis.userId, userId), eq(aiAnalysis.jobId, jobId)))
      .limit(1);

    if (analysisList.length === 0) {
      throw new NotFoundException("No cached analysis exists for this job. Score it first.");
    }
    return analysisList[0];
  }
}
