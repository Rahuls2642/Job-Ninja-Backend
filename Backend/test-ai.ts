// test-ai.ts
// Verification script for AI Matching Engine (Phase 5).
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

  console.log("=== Phase 5 AI Matching Engine Testing Started ===");

  // Helper to print response status and body
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

    // 5. Test Unauthorized Analysis (should return 401)
    console.log("\n5. Testing unauthorized analysis request (missing JWT)...");
    const unauthRes = await fetch(`${baseUrl}/ai/analyze/${testJobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId: user1ResumeId }),
    });
    await checkStatus(unauthRes, 401, "Reject Unauthorized Analysis");

    // 6. Test User 2 trying to analyze using User 1's resume (should return 403 Forbidden)
    console.log("\n6. Testing cross-user resume access block (should return 403)...");
    const crossRes = await fetch(`${baseUrl}/ai/analyze/${testJobId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ resumeId: user1ResumeId }),
    });
    await checkStatus(crossRes, 403, "Block cross-user resume analysis");

    // 7. Perform first analysis (User 1 analyzing User 1's resume against test job)
    console.log("\n7. Performing initial AI match analysis...");
    const analyzeRes1 = await fetch(`${baseUrl}/ai/analyze/${testJobId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ resumeId: user1ResumeId }),
    });
    const analysis1 = (await checkStatus(analyzeRes1, 200, "Perform Initial Analysis")) as any;
    console.log("Analysis Result properties:");
    console.log(`- Score: ${analysis1.overallScore}%`);
    console.log(`- Strengths: ${JSON.stringify(analysis1.strengths)}`);
    console.log(`- Missing Skills: ${JSON.stringify(analysis1.missingSkills)}`);
    console.log(`- Suggestions: ${JSON.stringify(analysis1.suggestions)}`);
    console.log(`- Summary: ${JSON.stringify(analysis1.summary)}`);

    if (
      analysis1.overallScore === undefined ||
      !Array.isArray(analysis1.strengths) ||
      !Array.isArray(analysis1.missingSkills) ||
      !Array.isArray(analysis1.suggestions) ||
      !analysis1.summary.company ||
      !analysis1.summary.role
    ) {
      throw new Error("Analysis result structure is incomplete or invalid");
    }

    // 8. Test Caching (perform analysis again, should return identical record and match first analysis's createdAt timestamp)
    console.log("\n8. Performing analysis again to test caching...");
    const analyzeRes2 = await fetch(`${baseUrl}/ai/analyze/${testJobId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ resumeId: user1ResumeId }),
    });
    const analysis2 = (await checkStatus(analyzeRes2, 200, "Retrieve Cached Analysis")) as any;
    console.log(`- Original CreatedAt: ${analysis1.createdAt}`);
    console.log(`- Cached CreatedAt:   ${analysis2.createdAt}`);
    if (analysis1.createdAt !== analysis2.createdAt) {
      throw new Error("Cache missed! The createdAt timestamp changed between runs.");
    }
    console.log("[PASS] Cache returned identical timestamp!");

    // 9. Test Cache Refresh (perform analysis with refresh=true, should return a new record with a different createdAt timestamp)
    console.log("\n9. Testing cache refresh parameter (?refresh=true)...");
    // Wait 1.5 seconds to make sure timestamp changes
    await new Promise((r) => setTimeout(r, 1500));
    
    const analyzeRes3 = await fetch(`${baseUrl}/ai/analyze/${testJobId}?refresh=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ resumeId: user1ResumeId }),
    });
    const analysis3 = (await checkStatus(analyzeRes3, 200, "Perform Forced Refresh Analysis")) as any;
    console.log(`- Original CreatedAt: ${analysis1.createdAt}`);
    console.log(`- Refreshed CreatedAt:  ${analysis3.createdAt}`);
    if (analysis1.createdAt === analysis3.createdAt) {
      throw new Error("Refresh parameter failed to clear cache and force re-analysis!");
    }
    console.log("[PASS] Forced refresh generated a new analysis record successfully!");

    // 10. Retrieve analysis using GET /ai/analyze/:jobId
    console.log("\n10. Fetching latest cached analysis via GET endpoint...");
    const getRes = await fetch(`${baseUrl}/ai/analyze/${testJobId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const getAnalysisData = (await checkStatus(getRes, 200, "Get Cached Analysis")) as any;
    if (getAnalysisData.id !== analysis3.id) {
      throw new Error("GET endpoint returned wrong analysis record");
    }

    // 11. Test non-existent analysis query (should return 404 for User 2 since they haven't analyzed it yet)
    console.log("\n11. Testing non-existent analysis retrieval for User 2 (should return 404)...");
    const getRes404 = await fetch(`${baseUrl}/ai/analyze/${testJobId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    await checkStatus(getRes404, 404, "Verify 404 on missing analysis");

    // 12. Test non-existent Job UUID for analysis
    console.log("\n12. Testing non-existent job UUID for analysis (should return 404)...");
    const invalidJobId = "55555555-5555-5555-5555-555555555555";
    const invalidJobRes = await fetch(`${baseUrl}/ai/analyze/${invalidJobId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ resumeId: user1ResumeId }),
    });
    await checkStatus(invalidJobRes, 404, "Verify 404 on invalid Job ID");

    // 13. Test non-existent Resume UUID for analysis
    console.log("\n13. Testing non-existent resume UUID for analysis (should return 404)...");
    const invalidResumeId = "99999999-9999-4999-9999-999999999999";
    const invalidResumeRes = await fetch(`${baseUrl}/ai/analyze/${testJobId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ resumeId: invalidResumeId }),
    });
    await checkStatus(invalidResumeRes, 404, "Verify 404 on invalid Resume ID");

    console.log("\n=== ALL AI MATCHING ENGINE MODULE TESTS PASSED SUCCESSFULLY ===");

  } catch (error) {
    console.error("\n=== AI MATCHING ENGINE TESTING FAILED ===");
    console.error((error as Error).message);
    process.exit(1);
  }
}

runTests();

export {};
