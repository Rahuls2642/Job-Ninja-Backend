import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { db } from "../../../database/drizzle";
import { aiJobAnalysis } from "../../../database/schema/ai-job-analysis";
import { resumes } from "../../../database/schema/resumes";
import { jobs } from "../../../database/schema/jobs";
import { profiles } from "../../../database/schema/profiles";
import { and, eq } from "drizzle-orm";
import { ResumeAnalyzerService } from "./resume-analyzer.service";
import { JobAnalyzerService } from "./job-analyzer.service";
import { SYSTEM_PROMPT, constructUserPrompt } from "../prompts/prompts";
import { StorageProvider } from "../../../common/storage/storage.interface";

interface AnalysisResponse {
  overallScore: number;
  strengths: string[];
  missingSkills: string[];
  suggestions: string[];
  summary: {
    company: string;
    role: string;
    remote: boolean;
  };
}

@Injectable()
export class MatchScoreService {
  private readonly openaiApiKey?: string;
  private readonly geminiApiKey?: string;
  private readonly groqApiKey?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly resumeAnalyzer: ResumeAnalyzerService,
    private readonly jobAnalyzer: JobAnalyzerService,
    @Inject("StorageProvider")
    private readonly storageProvider: StorageProvider,
  ) {
    this.openaiApiKey = this.configService.get<string>("OPENAI_API_KEY");
    this.geminiApiKey = this.configService.get<string>("GEMINI_API_KEY");
    this.groqApiKey = this.configService.get<string>("GROQ_API_KEY");
  }

  async analyzeJob(
    userId: string,
    jobId: string,
    resumeId: string,
    refresh = false,
  ): Promise<any> {
    // 1. Verify resume exists and ownership
    const resumeList = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, resumeId))
      .limit(1);

    if (resumeList.length === 0) {
      throw new NotFoundException("Resume not found");
    }

    const resume = resumeList[0];
    if (resume.userId !== userId) {
      throw new ForbiddenException("You can only analyze jobs using your own resumes");
    }

    // 2. Verify job exists
    const jobList = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (jobList.length === 0) {
      throw new NotFoundException("Job not found");
    }

    const job = jobList[0];

    // 3. Check cache if refresh is false
    if (!refresh) {
      const cached = await db
        .select()
        .from(aiJobAnalysis)
        .where(
          and(
            eq(aiJobAnalysis.resumeId, resumeId),
            eq(aiJobAnalysis.jobId, jobId),
          ),
        )
        .limit(1);

      if (cached.length > 0) {
        console.log(`[MatchScoreService] Cache HIT for resume=${resumeId}, job=${jobId}`);
        return {
          ...cached[0],
          summary: JSON.parse(cached[0].summary),
        };
      }
    }

    // 4. Download resume and extract text using pre-signed URL to guarantee read permission
    const signedUrl = await this.storageProvider.getSignedUrl(resume.fileKey);
    const resumeText = await this.resumeAnalyzer.extractText(signedUrl, resume.mimeType);

    // 5. Format job details
    const jobText = this.jobAnalyzer.formatJob(job);

    // 6. Fetch user profile data
    const profileList = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    const profileText = profileList.length > 0 ? JSON.stringify(profileList[0]) : "No profile details set.";

    // 7. Get analysis JSON either from live LLM or mock generator fallback
    let analysisResult: AnalysisResponse;
    const userPrompt = constructUserPrompt(resumeText, profileText, jobText);

    if (this.groqApiKey) {
      analysisResult = await this.queryGroq(userPrompt);
    } else if (this.openaiApiKey) {
      analysisResult = await this.queryOpenAI(userPrompt);
    } else if (this.geminiApiKey) {
      analysisResult = await this.queryGemini(userPrompt);
    } else {
      console.warn("[MatchScoreService] No LLM API Key set. Generating mock analysis fallback.");
      analysisResult = this.generateMockAnalysis(resume.title, resumeText, job);
    }

    // 8. Delete cached record if refreshing
    if (refresh) {
      await db
        .delete(aiJobAnalysis)
        .where(
          and(
            eq(aiJobAnalysis.resumeId, resumeId),
            eq(aiJobAnalysis.jobId, jobId),
          ),
        );
    }

    // 9. Save new analysis
    const [inserted] = await db
      .insert(aiJobAnalysis)
      .values({
        userId,
        resumeId,
        jobId,
        overallScore: analysisResult.overallScore,
        strengths: analysisResult.strengths,
        missingSkills: analysisResult.missingSkills,
        suggestions: analysisResult.suggestions,
        summary: JSON.stringify(analysisResult.summary),
      })
      .returning();

    return {
      ...inserted,
      summary: analysisResult.summary,
    };
  }

  async getExistingAnalysis(userId: string, jobId: string): Promise<any> {
    // Return the latest analysis for this user and jobId
    const cached = await db
      .select()
      .from(aiJobAnalysis)
      .where(
        and(
          eq(aiJobAnalysis.userId, userId),
          eq(aiJobAnalysis.jobId, jobId),
        ),
      )
      .orderBy(desc(aiJobAnalysis.createdAt))
      .limit(1);

    if (cached.length === 0) {
      throw new NotFoundException("No analysis exists for this job posting yet");
    }

    return {
      ...cached[0],
      summary: JSON.parse(cached[0].summary),
    };
  }

  private async queryGroq(prompt: string): Promise<AnalysisResponse> {
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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[MatchScoreService] Groq API returned error status:", response.status, errText);
        throw new Error(`Groq HTTP error ${response.status}: ${errText}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response content from Groq");
      }

      return JSON.parse(content) as AnalysisResponse;
    } catch (error) {
      console.error("[MatchScoreService] Groq query failed:", error);
      throw new InternalServerErrorException(`AI service unavailable (${(error as Error).message})`);
    }
  }

  private async queryOpenAI(prompt: string): Promise<AnalysisResponse> {
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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI HTTP error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response content from OpenAI");
      }

      return JSON.parse(content) as AnalysisResponse;
    } catch (error) {
      console.error("[MatchScoreService] OpenAI query failed:", error);
      throw new InternalServerErrorException("AI service unavailable (OpenAI failed)");
    }
  }

  private async queryGemini(prompt: string): Promise<AnalysisResponse> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[MatchScoreService] Gemini API returned error status ${response.status}:`, errText);
        throw new Error(`Gemini HTTP error ${response.status}: ${errText}`);
      }

      const data = (await response.json()) as any;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("Empty response content from Gemini");
      }

      return JSON.parse(content) as AnalysisResponse;
    } catch (error) {
      console.error("[MatchScoreService] Gemini query failed:", error);
      throw new InternalServerErrorException(`AI service unavailable (${(error as Error).message})`);
    }
  }

  private generateMockAnalysis(resumeTitle: string, resumeText: string, job: any): AnalysisResponse {
    // Generate realistic matching details using simple keyword checking
    const combinedText = (resumeText + " " + resumeTitle).toLowerCase();
    const mockSkills = ["react", "typescript", "node", "postgresql", "docker", "redis", "aws", "graphql", "rust", "figma"];
    const strengths: string[] = [];
    const missingSkills: string[] = [];

    // Analyze skills matching in description or requirements
    const jobInfo = ((job.description || "") + " " + (job.requirements || "")).toLowerCase();

    mockSkills.forEach((skill) => {
      const hasSkillInJob = jobInfo.includes(skill) || job.title.toLowerCase().includes(skill);
      if (hasSkillInJob) {
        const hasSkillInResume = combinedText.includes(skill);
        if (hasSkillInResume) {
          strengths.push(skill.toUpperCase());
        } else {
          missingSkills.push(skill.toUpperCase());
        }
      }
    });

    // Compute an overall matching score
    const totalMatching = strengths.length;
    const totalRequired = strengths.length + missingSkills.length;
    const baseScore = totalRequired > 0 ? Math.round((totalMatching / totalRequired) * 40) + 50 : 75;
    // ensure score stays in range
    const overallScore = Math.min(Math.max(baseScore, 0), 100);

    const suggestions: string[] = [];
    if (missingSkills.length > 0) {
      suggestions.push(`Consider learning or adding projects using: ${missingSkills.join(", ")}.`);
    }
    suggestions.push("Reorganize project achievements to emphasize technical contributions.");
    suggestions.push("Add a specific skills section summarizing modern frameworks and systems.");

    return {
      overallScore,
      strengths: strengths.length > 0 ? strengths : ["React", "TypeScript"],
      missingSkills: missingSkills.length > 0 ? missingSkills : ["Docker", "AWS"],
      suggestions,
      summary: {
        company: job.company,
        role: job.title,
        remote: job.remote,
      },
    };
  }
}
// Helper to import desc
import { desc } from "drizzle-orm";
