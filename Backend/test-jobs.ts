// test-jobs.ts
// Verification script for Job Discovery Engine (Phase 4).
// Run with: npx ts-node test-jobs.ts

async function runTests() {
  const baseUrl = "http://localhost:5000";
  const email = `jobtester_${Date.now()}@example.com`;
  const password = "TestPassword123!";
  let token = "";
  let testJobId = "";
  let anotherJobId = "";

  console.log("=== Phase 4 Job Discovery Testing Started ===");
  console.log(`Using test email: ${email}`);

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
    // 1. Register test user
    console.log("\n1. Registering test user...");
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Job Tester", email, password }),
    });
    await checkStatus(regRes, 201, "Register User");

    // 2. Login test user
    console.log("\n2. Logging in...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = (await checkStatus(loginRes, 200, "Login User")) as any;
    token = loginData.accessToken;
    if (!token) throw new Error("No token received");

    // 3. Test public search /jobs
    console.log("\n3. Testing public search /jobs...");
    const searchRes = await fetch(`${baseUrl}/jobs`, { method: "GET" });
    const searchData = (await checkStatus(searchRes, 200, "Public Job Search")) as any;
    
    console.log(`Total jobs in DB: ${searchData.total}`);
    if (searchData.items.length === 0) {
      throw new Error("No jobs found. Seed database sync failed on boot.");
    }
    
    // Pick the first job as our test job
    testJobId = searchData.items[0].id;
    if (searchData.items.length > 1) {
      anotherJobId = searchData.items[1].id;
    }
    console.log(`Selected Test Job ID: ${testJobId} (${searchData.items[0].title} @ ${searchData.items[0].company})`);

    // 4. Test remote filter
    console.log("\n4. Testing remote filter (remote=true)...");
    const remoteRes = await fetch(`${baseUrl}/jobs?remote=true`, { method: "GET" });
    const remoteData = (await checkStatus(remoteRes, 200, "Filter Remote Jobs")) as any;
    console.log(`Remote jobs found: ${remoteData.total}`);
    remoteData.items.forEach((item: any) => {
      if (!item.remote) throw new Error(`Non-remote job found in remote filtered list: ${item.title}`);
    });

    // 5. Test keyword filter
    console.log("\n5. Testing keyword filter (keyword=rust)...");
    const keywordRes = await fetch(`${baseUrl}/jobs?keyword=rust`, { method: "GET" });
    const keywordData = (await checkStatus(keywordRes, 200, "Filter Keyword (Rust)")) as any;
    console.log(`Rust jobs found: ${keywordData.total}`);
    keywordData.items.forEach((item: any) => {
      const match =
        item.title.toLowerCase().includes("rust") ||
        item.description?.toLowerCase().includes("rust") ||
        item.requirements?.toLowerCase().includes("rust");
      if (!match) {
        console.warn(`[WARNING] Keyword match weak for job: ${item.title}`);
      }
    });

    // 6. Test salaryMin filter
    console.log("\n6. Testing salaryMin filter (salaryMin=150000)...");
    const salaryRes = await fetch(`${baseUrl}/jobs?salaryMin=150000`, { method: "GET" });
    const salaryData = (await checkStatus(salaryRes, 200, "Filter Salary (>= 150000)")) as any;
    console.log(`High-salary jobs found: ${salaryData.total}`);
    salaryData.items.forEach((item: any) => {
      const maxSalary = item.salaryMax || 0;
      const minSalary = item.salaryMin || 0;
      if (maxSalary < 150000 && minSalary < 150000) {
        throw new Error(`Job does not match salary criteria: ${item.title} (Salary range: ${item.salaryMin} - ${item.salaryMax})`);
      }
    });

    // 7. Test Pagination
    console.log("\n7. Testing pagination (page=1, limit=2)...");
    const paginatedRes = await fetch(`${baseUrl}/jobs?page=1&limit=2`, { method: "GET" });
    const paginatedData = (await checkStatus(paginatedRes, 200, "Paginated Jobs")) as any;
    console.log(`Items count: ${paginatedData.items.length}, totalPages: ${paginatedData.totalPages}`);
    if (paginatedData.items.length > 2) {
      throw new Error(`Limit violated: received ${paginatedData.items.length} items`);
    }

    // 8. Test Unauthorized Save Job (should fail with 401)
    console.log("\n8. Testing save job without JWT auth token (should fail)...");
    const unauthSaveRes = await fetch(`${baseUrl}/jobs/${testJobId}/save`, {
      method: "POST",
    });
    await checkStatus(unauthSaveRes, 401, "Reject Unauthorized Save");

    // 9. Test Save Job
    console.log("\n9. Saving job to user list...");
    const saveRes = await fetch(`${baseUrl}/jobs/${testJobId}/save`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const saveResult = (await checkStatus(saveRes, 200, "Save Job")) as any;
    console.log("Save Response Message:", saveResult.message);

    // 10. Test Save Job Duplicate handling (should be handled gracefully)
    console.log("\n10. Testing duplicate save job handling (should return already saved)...");
    const dupSaveRes = await fetch(`${baseUrl}/jobs/${testJobId}/save`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const dupResult = (await checkStatus(dupSaveRes, 200, "Duplicate Save Job")) as any;
    console.log("Duplicate Save Response Message:", dupResult.message);

    // 11. List Saved Jobs
    console.log("\n11. Listing saved jobs for user...");
    const savedListRes = await fetch(`${baseUrl}/jobs/saved`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const savedListData = (await checkStatus(savedListRes, 200, "List Saved Jobs")) as any[];
    console.log(`Saved jobs count: ${savedListData.length}`);
    const found = savedListData.some((item: any) => item.job.id === testJobId);
    if (!found) {
      throw new Error("Saved job not found in saved list retrieval");
    }

    // 12. Test manual sync endpoint and duplicate prevention
    console.log("\n12. Testing manual sync and duplicate prevention...");
    const syncRes = await fetch(`${baseUrl}/jobs/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "greenhouse",
        boardToken: "mock-stripe",
      }),
    });
    const syncData = (await checkStatus(syncRes, 201, "Trigger Sync")) as any;
    console.log(`Sync Completed: Fetched ${syncData.fetched}, Mapped/Synced ${syncData.synced}`);
    
    // Fetch search again and check total jobs did not grow (since they were duplicates)
    const checkTotalRes = await fetch(`${baseUrl}/jobs`, { method: "GET" });
    const checkTotalData = (await checkStatus(checkTotalRes, 200, "Check Job Count Post Sync")) as any;
    console.log(`Count after sync: ${checkTotalData.total} (Original count: ${searchData.total})`);
    if (checkTotalData.total !== searchData.total) {
      throw new Error(`Duplicate job was inserted! Count grew from ${searchData.total} to ${checkTotalData.total}`);
    }

    // 13. Test Unsave Job
    console.log("\n13. Removing saved job from list...");
    const unsaveRes = await fetch(`${baseUrl}/jobs/${testJobId}/save`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await checkStatus(unsaveRes, 200, "Remove Saved Job");

    // Verify list is empty
    const checkSavedListRes = await fetch(`${baseUrl}/jobs/saved`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkSavedListData = (await checkStatus(checkSavedListRes, 200, "Verify Saved List Empty")) as any[];
    console.log(`Saved jobs count after unsave: ${checkSavedListData.length}`);
    const stillExists = checkSavedListData.some((item: any) => item.job.id === testJobId);
    if (stillExists) {
      throw new Error("Job was not unsaved successfully from list");
    }

    console.log("\n=== ALL JOB MODULE TESTS PASSED SUCCESSFULLY ===");

  } catch (error) {
    console.error("\n=== JOB MODULE TESTING FAILED ===");
    console.error((error as Error).message);
    process.exit(1);
  }
}

runTests();

export {};
