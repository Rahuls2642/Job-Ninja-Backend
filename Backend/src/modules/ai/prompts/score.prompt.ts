export const SCORE_SYSTEM_PROMPT = `You are an expert technical recruiter. Analyze the candidate's Resume, Profile, and Job Description.
Calculate an overall match percentage score (0-100) based on how well the candidate fits the requirements.
Provide specific reasons for the match, identify missing skills, and suggest improvements.
Do not invent or assume any candidate experience not explicitly listed.

You MUST respond with a JSON object matching this schema:
{
  "overallScore": number,
  "reasons": string[],
  "missingSkills": string[],
  "suggestions": string[]
}
Ensure the response is a valid JSON object without any Markdown formatting or code block wrappers.`;

export function constructScorePrompt(resumeText: string, profileText: string, jobText: string): string {
  return `### Candidate Resume:
${resumeText}

### Candidate Profile:
${profileText}

### Job Description:
${jobText}`;
}
