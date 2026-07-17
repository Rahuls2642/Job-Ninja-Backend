// test-automation.ts
// Verification script for Phase 7: Automation Engine.
// Run with: npx ts-node test-automation.ts

import * as fs from "fs";
import * as path from "path";

async function runTests() {
  const baseUrl = "http://localhost:5000";
  const email = `autotester_${Date.now()}@example.com`;
  const password = "TestPassword123!";
  
  let token = "";
  let resumeId = "";
  let jobId = "";
  let applicationId = "";
  let taskId = "";

  console.log("=== Phase 7 Automation Engine Testing Started ===");

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
    // 1. Register and login
    console.log("\n1. Registering and logging in...");
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Auto Tester", email, password }),
    });
    await checkStatus(regRes, 201, "Register User");

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = (await checkStatus(loginRes, 200, "Login User")) as any;
    token = loginData.accessToken;

    // 2. Upload Mock Resume
    console.log("\n2. Uploading a mock resume...");
    const dummyPath = path.join(__dirname, "dummy_resume.pdf");
    fs.writeFileSync(dummyPath, "Mock PDF Content");

    const form = new FormData();
    form.append("title", "Test Resume");
    const fileBlob = new Blob(["Mock PDF Content"], { type: "application/pdf" });
    form.append("file", fileBlob, "dummy_resume.pdf");

    const uploadRes = await fetch(`${baseUrl}/resumes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const resumeData = (await checkStatus(uploadRes, 201, "Upload Resume")) as any;
    resumeId = resumeData.id;
    fs.unlinkSync(dummyPath);

    // 3. Sync Greenhouse Jobs and Select One
    console.log("\n3. Syncing job board to get test Greenhouse jobs...");
    const syncRes = await fetch(`${baseUrl}/jobs/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "greenhouse",
        boardToken: "airbnb",
      }),
    });
    await checkStatus(syncRes, 200, "Sync Jobs");

    // Fetch synced jobs
    const searchRes = await fetch(`${baseUrl}/jobs?limit=50`, { method: "GET" });
    const searchData = (await checkStatus(searchRes, 200, "Get Synced Jobs")) as any;
    
    const greenhouseJob = searchData.items.find((item: any) => 
      item.applicationUrl && item.applicationUrl.includes("greenhouse.io")
    );

    if (!greenhouseJob) {
      throw new Error("No Greenhouse jobs found in synced results");
    }

    jobId = greenhouseJob.id;
    console.log(`Selected Greenhouse Job ID: ${jobId} (${greenhouseJob.title} @ ${greenhouseJob.company})`);

    // 4. Create Application (DRAFT)
    console.log("\n4. Creating job application record...");
    const appRes = await fetch(`${baseUrl}/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jobId,
        resumeId,
      }),
    });
    const appData = (await checkStatus(appRes, 201, "Create Application")) as any;
    applicationId = appData.id;

    // 5. Start Automation
    console.log("\n5. Starting automation engine...");
    const startRes = await fetch(`${baseUrl}/automation/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        applicationId,
        reviewBeforeSubmit: true,
      }),
    });
    const taskData = (await checkStatus(startRes, 200, "Start Automation")) as any;
    taskId = taskData.id;

    // 6. Get Task Status
    console.log("\n6. Fetching task status...");
    const statusRes = await fetch(`${baseUrl}/automation/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const statusData = (await checkStatus(statusRes, 200, "Get Task Status")) as any;
    console.log(`Task Status: ${statusData.status}, Progress: ${statusData.progress}%`);

    // 7. Get Logs
    console.log("\n7. Fetching task logs...");
    const logsRes = await fetch(`${baseUrl}/automation/tasks/${taskId}/logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const logsData = (await checkStatus(logsRes, 200, "Get Task Logs")) as any;
    console.log(`Logs retrieved: ${logsData.length} entries.`);

    // 8. Cancel Task
    console.log("\n8. Canceling running task...");
    const cancelRes = await fetch(`${baseUrl}/automation/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await checkStatus(cancelRes, 200, "Cancel Task");

    // 9. Retry Task
    console.log("\n9. Retrying failed/canceled task...");
    const retryRes = await fetch(`${baseUrl}/automation/tasks/${taskId}/retry`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await checkStatus(retryRes, 200, "Retry Task");

    console.log("\n=== Phase 7 Automation Engine Testing Completed Successfully ===");
  } catch (error) {
    console.error("\n[FAIL] Phase 7 Testing failed:", error);
    process.exit(1);
  }
}

runTests();
