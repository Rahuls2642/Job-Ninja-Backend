// test-ai.ts
// Verification script for AI Intelligence Engine (Phase 5).
// Run with: npx ts-node test-ai.ts

import * as fs from "fs";

async function runTests() {
  const baseUrl = "http://localhost:5000";
  const user1Email = `aitester1_${Date.now()}@example.com`;
  const user2Email = `aitester2_${Date.now()}@example.com`;
  const password = "TestPassword123!";
  
  let user1Token = "";
  let user2Token = "";
  let user1ResumeId = "";
  let testJobId = "";

  console.log("=== Phase 5 AI Intelligence Engine Testing Started ===");

  const checkStatus = async (res: Response, expectedStatus: number, actionName: string) => {
    const text = await res.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {}

    if (res.status === expectedStatus) {
      console.log(`[PASS] ${actionName} (Status: ${res.status})`);
      return body;
    } else {
      console.error(`[FAIL] ${actionName} (Expected: ${expectedStatus}, Got: ${res.status})`);
      console.error("Response:", body);
      throw new Error(`${actionName} failed`);
    }
  };

  try {
    // 1. Register and login User 1
    console.log("\n1. Registering and logging in User 1...");
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "AI Tester One", email: user1Email, password }),
    });
    await checkStatus(reg1Res, 201, "Register User 1");

    const login1Res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user1Email, password }),
    });
    const login1Data = (await checkStatus(login1Res, 200, "Login User 1")) as any;
    user1Token = login1Data.accessToken;

    // 2. Register and login User 2
    console.log("\n2. Registering and logging in User 2...");
    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "AI Tester Two", email: user2Email, password }),
    });
    await checkStatus(reg2Res, 201, "Register User 2");

    const login2Res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user2Email, password }),
    });
    const login2Data = (await checkStatus(login2Res, 200, "Login User 2")) as any;
    user2Token = login2Data.accessToken;

    // 3. Upload a PDF resume for User 1
    console.log("\n3. Uploading resume for User 1...");
    if (!fs.existsSync("prd.pdf")) {
      throw new Error("prd.pdf file not found in root. Cannot run upload test.");
    }
    const fileBuffer = fs.readFileSync("prd.pdf");
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer], { type: "application/pdf" }), "prd.pdf");
    formData.append("title", "ApplyPilot AI PRD");

    const uploadRes = await fetch(`${baseUrl}/resumes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
      body: formData,
    });
    const uploadData = (await checkStatus(uploadRes, 201, "Upload Resume")) as any;
    user1ResumeId = uploadData.id;
    console.log(`Uploaded Resume ID: ${user1ResumeId}`);

    // 4. Retrieve a job from public search
    console.log("\n4. Retrieving an active job from public search...");
    const jobsRes = await fetch(`${baseUrl}/jobs`, { method: "GET" });
    const jobsData = (await checkStatus(jobsRes, 200, "Get Public Jobs")) as any;
    if (!jobsData.items || jobsData.items.length === 0) {
      throw new Error("No jobs found in database to analyze.");
    }
    testJobId = jobsData.items[0].id;
    console.log(`Selected Job ID: ${testJobId} (${jobsData.items[0].title} @ ${jobsData.items[0].company})`);

    // 5. Test Feature 1: Score Job
    console.log("\n5. Testing Feature 1: Score Job...");
    const scoreRes = await fetch(`${baseUrl}/ai/jobs/${testJobId}/score?resumeId=${user1ResumeId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const scoreData = await checkStatus(scoreRes, 201, "Job Score Endpoint");
    console.log(`Match Score: ${scoreData.overallScore}%`);
    console.log(`Reasons: ${JSON.stringify(scoreData.reasons)}`);
    console.log(`Missing Skills: ${JSON.stringify(scoreData.missingSkills)}`);
    console.log(`Suggestions: ${JSON.stringify(scoreData.suggestions)}`);

    // 6. Test Feature 2: Tailor Resume
    console.log("\n6. Testing Feature 2: Tailor Resume...");
    const tailorRes = await fetch(`${baseUrl}/ai/resumes/${user1ResumeId}/tailor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ jobId: testJobId }),
    });
    const tailorData = await checkStatus(tailorRes, 201, "Tailor Resume Endpoint");
    console.log(`Tailored Resume Content length: ${tailorData.tailoredResume.length} characters`);

    // 7. Test Feature 3: ATS Score
    console.log("\n7. Testing Feature 3: ATS Score...");
    const atsRes = await fetch(`${baseUrl}/ai/resumes/${user1ResumeId}/ats?jobId=${testJobId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const atsData = await checkStatus(atsRes, 201, "ATS Score Endpoint");
    console.log(`ATS Score: ${atsData.atsScore}%`);
    console.log(`ATS Suggestions: ${JSON.stringify(atsData.suggestions)}`);

    // 8. Test Feature 4: Cover Letter
    console.log("\n8. Testing Feature 4: Cover Letter...");
    const coverRes = await fetch(`${baseUrl}/ai/jobs/${testJobId}/cover-letter?resumeId=${user1ResumeId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const coverData = await checkStatus(coverRes, 201, "Cover Letter Endpoint");
    console.log(`Cover Letter length: ${coverData.coverLetter.length} characters`);

    // 9. Test Feature 5: Job Summary
    console.log("\n9. Testing Feature 5: Job Summary...");
    const summaryRes = await fetch(`${baseUrl}/ai/jobs/${testJobId}/summary`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const summaryData = await checkStatus(summaryRes, 200, "Job Summary Endpoint");
    console.log(`Extracted Role: ${summaryData.role}`);
    console.log(`Salary: ${summaryData.salary}`);
    console.log(`Remote: ${summaryData.remote}`);
    console.log(`Required skills: ${JSON.stringify(summaryData.required)}`);

    // 10. Test Feature 6: AI Cache retrieval GET endpoint
    console.log("\n10. Testing Feature 6: GET Job Cache analysis...");
    const cacheRes = await fetch(`${baseUrl}/ai/jobs/${testJobId}/cache`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const cacheData = await checkStatus(cacheRes, 200, "Get Cached Score Endpoint");
    console.log(`Successfully verified cached score retrieval: ${cacheData.overallScore}%`);

    // 11. Test cache hit verification by scoring again and validating response is instantaneous/identical
    console.log("\n11. Verifying cached score results match first run...");
    const scoreRes2 = await fetch(`${baseUrl}/ai/jobs/${testJobId}/score?resumeId=${user1ResumeId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const scoreData2 = await checkStatus(scoreRes2, 201, "Job Score Cache Check");
    if (scoreData.overallScore !== scoreData2.overallScore) {
      throw new Error("Score cache mismatch!");
    }

    console.log("\n=== ALL AI INTELLIGENCE ENGINE MODULE TESTS PASSED SUCCESSFULLY ===");

  } catch (error) {
    console.error("\n=== AI INTELLIGENCE ENGINE TESTING FAILED ===");
    console.error((error as Error).message);
    process.exit(1);
  }
}

runTests();

export {};
