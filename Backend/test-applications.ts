// test-applications.ts
// Verification script for Phase 6: Application Management.
// Run with: npx ts-node test-applications.ts

import * as fs from "fs";

async function runTests() {
  const baseUrl = "http://localhost:5000";
  const user1Email = `apptester1_${Date.now()}@example.com`;
  const user2Email = `apptester2_${Date.now()}@example.com`;
  const password = "TestPassword123!";
  
  let user1Token = "";
  let user2Token = "";
  let user1ResumeId = "";
  let user2ResumeId = "";
  let testJobId = "";
  let applicationId = "";

  console.log("=== Phase 6 Application Management Testing Started ===");

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
      body: JSON.stringify({ fullName: "App Tester One", email: user1Email, password }),
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
      body: JSON.stringify({ fullName: "App Tester Two", email: user2Email, password }),
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
    formData.append("title", "AppTester 1 Resume");

    const uploadRes = await fetch(`${baseUrl}/resumes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
      body: formData,
    });
    const uploadData = (await checkStatus(uploadRes, 201, "Upload Resume User 1")) as any;
    user1ResumeId = uploadData.id;

    // 4. Upload a PDF resume for User 2
    console.log("\n4. Uploading resume for User 2...");
    const formData2 = new FormData();
    formData2.append("file", new Blob([fileBuffer], { type: "application/pdf" }), "prd.pdf");
    formData2.append("title", "AppTester 2 Resume");

    const uploadRes2 = await fetch(`${baseUrl}/resumes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user2Token}` },
      body: formData2,
    });
    const uploadData2 = (await checkStatus(uploadRes2, 201, "Upload Resume User 2")) as any;
    user2ResumeId = uploadData2.id;

    // 5. Retrieve an active job from public search
    console.log("\n5. Retrieving an active job from public search...");
    const jobsRes = await fetch(`${baseUrl}/jobs`, { method: "GET" });
    const jobsData = (await checkStatus(jobsRes, 200, "Get Public Jobs")) as any;
    if (!jobsData.items || jobsData.items.length === 0) {
      throw new Error("No jobs found in database to apply.");
    }
    testJobId = jobsData.items[0].id;
    console.log(`Selected Job ID: ${testJobId}`);

    // 6. Create Application
    console.log("\n6. Creating an application...");
    const createRes = await fetch(`${baseUrl}/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ jobId: testJobId, resumeId: user1ResumeId }),
    });
    const createData = await checkStatus(createRes, 201, "Create Application");
    applicationId = createData.id;
    console.log(`Application Created ID: ${applicationId}`);

    // 7. Duplicate Prevention Check (Should return 409 Conflict)
    console.log("\n7. Testing duplicate prevention...");
    const dupRes = await fetch(`${baseUrl}/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ jobId: testJobId, resumeId: user1ResumeId }),
    });
    await checkStatus(dupRes, 409, "Prevent Duplicate Application");

    // 8. Application Details Check
    console.log("\n8. Fetching application details...");
    const detailsRes = await fetch(`${baseUrl}/applications/${applicationId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const detailsData = await checkStatus(detailsRes, 200, "Get Application Details");
    console.log(`- Status: ${detailsData.status}`);
    console.log(`- Timeline: ${JSON.stringify(detailsData.timeline)}`);
    if (detailsData.timeline.length === 0 || detailsData.timeline[0].eventType !== "CREATED") {
      throw new Error("Timeline event CREATED not logged correctly!");
    }

    // 9. Update Status to SUBMITTED
    console.log("\n9. Updating status to SUBMITTED...");
    const statusRes = await fetch(`${baseUrl}/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ status: "SUBMITTED" }),
    });
    const statusData = await checkStatus(statusRes, 200, "Update Status to SUBMITTED");
    if (!statusData.appliedAt) {
      throw new Error("appliedAt timestamp was not automatically set upon submission!");
    }

    // Verify timeline updated
    const detailsRes2 = await fetch(`${baseUrl}/applications/${applicationId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const detailsData2 = await checkStatus(detailsRes2, 200, "Get Application Details post-submission");
    const timelineEvents = detailsData2.timeline.map((e: any) => e.eventType);
    console.log("- Timeline events:", timelineEvents);
    if (!timelineEvents.includes("SUBMITTED") || !timelineEvents.includes("STATUS_CHANGE")) {
      throw new Error("Status update timeline events were not logged!");
    }

    // 10. Update Notes
    console.log("\n10. Updating notes...");
    const notesRes = await fetch(`${baseUrl}/applications/${applicationId}/notes`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ notes: "Follow up next Tuesday." }),
    });
    const notesData = await checkStatus(notesRes, 200, "Update Notes");
    if (notesData.notes !== "Follow up next Tuesday.") {
      throw new Error("Notes were not updated correctly!");
    }

    // 11. Security Check: User 2 accessing User 1's application details (should return 404)
    console.log("\n11. Testing unauthorized application details access (should return 404)...");
    const secRes = await fetch(`${baseUrl}/applications/${applicationId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    await checkStatus(secRes, 404, "Block unauthorized details query");

    // 12. Security Check: User 2 updating User 1's status (should return 404)
    console.log("\n12. Testing unauthorized status update (should return 404)...");
    const secStatusRes = await fetch(`${baseUrl}/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ status: "INTERVIEW" }),
    });
    await checkStatus(secStatusRes, 404, "Block unauthorized status update");

    // 13. Dashboard Stats Check
    console.log("\n13. Fetching dashboard statistics...");
    const statsRes = await fetch(`${baseUrl}/applications/stats`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const statsData = await checkStatus(statsRes, 200, "Get Stats");
    console.log(`- Stats payload: ${JSON.stringify(statsData)}`);
    if (statsData.total !== 1 || statsData.pending !== 1) {
      throw new Error("Statistics calculation mismatch!");
    }

    // 14. Filters & Pagination Check
    console.log("\n14. Filtering applications by status and company...");
    const filterRes = await fetch(`${baseUrl}/applications?status=SUBMITTED&limit=5&page=1`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const filterData = await checkStatus(filterRes, 200, "Filter applications");
    if (filterData.items.length !== 1 || filterData.meta.totalPages !== 1) {
      throw new Error("Filtering / Pagination failed!");
    }

    // 15. Delete Application
    console.log("\n15. Deleting application...");
    const delRes = await fetch(`${baseUrl}/applications/${applicationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    await checkStatus(delRes, 200, "Delete Application");

    // Verify it is gone
    const getDeletedRes = await fetch(`${baseUrl}/applications/${applicationId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    await checkStatus(getDeletedRes, 404, "Verify Application is Deleted");

    console.log("\n=== ALL APPLICATION MODULE TESTS PASSED SUCCESSFULLY ===");

  } catch (error) {
    console.error("\n=== APPLICATION TRACKING SYSTEM TESTING FAILED ===");
    console.error((error as Error).message);
    process.exit(1);
  }
}

runTests();

export {};
