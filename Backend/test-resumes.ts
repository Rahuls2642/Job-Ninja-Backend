// test-resumes.ts
// Verification script for Resumes API CRUD and validation flows.
// Run with: npx ts-node test-resumes.ts

async function runTests() {
  const baseUrl = "http://localhost:5000";
  const email = `testuser_${Date.now()}@example.com`;
  const password = "TestPassword123!";
  let token = "";
  let resumeId1 = "";
  let resumeId2 = "";

  console.log("=== Phase 3 Testing Started ===");
  console.log(`Using email: ${email}`);

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
    // 1. Register user
    console.log("\n1. Registering user...");
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test User",
        email,
        password,
      }),
    });
    await checkStatus(regRes, 201, "Register User");

    // 2. Login user
    console.log("\n2. Logging in...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = (await checkStatus(loginRes, 200, "Login User")) as any;
    token = loginData.accessToken;
    if (!token) throw new Error("No token received");

    // 3. Reject invalid file types (PNG)
    console.log("\n3. Testing PNG upload rejection (should fail)...");
    const pngForm = new FormData();
    pngForm.append("title", "Invalid Resume");
    const pngBlob = new Blob(["dummy png content"], { type: "image/png" });
    pngForm.append("file", pngBlob, "test.png");

    const pngRes = await fetch(`${baseUrl}/resumes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: pngForm,
    });
    await checkStatus(pngRes, 400, "Reject PNG upload");

    // 4. Reject files > 5MB
    console.log("\n4. Testing file size limit rejection (should fail)...");
    const largeForm = new FormData();
    largeForm.append("title", "Too Large Resume");
    // 6MB of dummy data
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, "x");
    const largeBlob = new Blob([largeBuffer], { type: "application/pdf" });
    largeForm.append("file", largeBlob, "large.pdf");

    const largeRes = await fetch(`${baseUrl}/resumes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: largeForm,
    });
    await checkStatus(largeRes, 400, "Reject > 5MB file upload");

    // 5. Upload valid PDF
    console.log("\n5. Uploading valid PDF resume...");
    const pdfForm = new FormData();
    pdfForm.append("title", "Frontend Resume PDF");
    const pdfBlob = new Blob(["%PDF-1.5 dummy content"], { type: "application/pdf" });
    pdfForm.append("file", pdfBlob, "resume.pdf");

    const pdfRes = await fetch(`${baseUrl}/resumes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: pdfForm,
    });
    const pdfData = (await checkStatus(pdfRes, 201, "Upload PDF Resume")) as any;
    resumeId1 = pdfData.id;
    console.log(`Uploaded PDF Resume ID: ${resumeId1}, Default: ${pdfData.isDefault}`);

    if (pdfData.isDefault !== true) {
      throw new Error("First uploaded resume should automatically be marked as default");
    }

    // 6. Upload valid DOCX
    console.log("\n6. Uploading valid DOCX resume...");
    const docxForm = new FormData();
    docxForm.append("title", "Backend Resume DOCX");
    const docxBlob = new Blob(["dummy word content"], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    docxForm.append("file", docxBlob, "resume.docx");

    const docxRes = await fetch(`${baseUrl}/resumes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: docxForm,
    });
    const docxData = (await checkStatus(docxRes, 201, "Upload DOCX Resume")) as any;
    resumeId2 = docxData.id;
    console.log(`Uploaded DOCX Resume ID: ${resumeId2}, Default: ${docxData.isDefault}`);

    if (docxData.isDefault !== false) {
      throw new Error("Second uploaded resume should NOT automatically be default");
    }

    // 7. List resumes
    console.log("\n7. Listing all resumes...");
    const listRes = await fetch(`${baseUrl}/resumes`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = (await checkStatus(listRes, 200, "List Resumes")) as any[];
    console.log(`Total resumes found: ${listData.length}`);
    listData.forEach((r) => {
      console.log(`- ID: ${r.id}, Title: ${r.title}, default: ${r.default}`);
    });

    // 8. Get resume details
    console.log(`\n8. Retrieving metadata for ID: ${resumeId1}...`);
    const getRes = await fetch(`${baseUrl}/resumes/${resumeId1}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const details = (await checkStatus(getRes, 200, "Get Resume Details")) as any;
    console.log(`File Key: ${details.fileKey}, Mime Type: ${details.mimeType}`);

    // 9. Rename resume
    console.log(`\n9. Renaming resume ID: ${resumeId1}...`);
    const renameRes = await fetch(`${baseUrl}/resumes/${resumeId1}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Updated Frontend Resume" }),
    });
    const renameData = (await checkStatus(renameRes, 200, "Rename Resume")) as any;
    console.log(`New Title: ${renameData.title}`);

    // 10. Set default resume
    console.log(`\n10. Setting resume ID: ${resumeId2} as default...`);
    const defaultRes = await fetch(`${baseUrl}/resumes/${resumeId2}/default`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const defaultData = (await checkStatus(defaultRes, 200, "Set Default Resume")) as any;
    console.log(`Resume ${defaultData.id} default state: ${defaultData.isDefault}`);

    // Verify flag swapped in list
    const verifyListRes = await fetch(`${baseUrl}/resumes`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyListData = (await checkStatus(verifyListRes, 200, "List Resumes after Default Swap")) as any[];
    const r1 = verifyListData.find(r => r.id === resumeId1);
    const r2 = verifyListData.find(r => r.id === resumeId2);
    console.log(`Resume 1 Default: ${r1?.default}, Resume 2 Default: ${r2?.default}`);
    if (r1?.default === true || r2?.default === false) {
      throw new Error("Default flag swap failed validation check");
    }

    // 11. Test download pre-signed URL redirect
    console.log(`\n11. Testing download redirect for ID: ${resumeId2}...`);
    const downloadRes = await fetch(`${baseUrl}/resumes/${resumeId2}/download`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      redirect: "manual", // Do not follow redirect so we can inspect it
    });
    console.log(`Response status (expected 302/307): ${downloadRes.status}`);
    const redirectUrl = downloadRes.headers.get("location");
    console.log("Pre-signed Redirect URL:", redirectUrl);
    if (downloadRes.status !== 302 && downloadRes.status !== 307) {
      throw new Error("Download redirect test failed - expected redirect status");
    }

    // 12. Delete resume and verify fallback default logic
    console.log(`\n12. Deleting default resume ID: ${resumeId2}...`);
    const deleteRes = await fetch(`${baseUrl}/resumes/${resumeId2}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await checkStatus(deleteRes, 204, "Delete Default Resume");

    // Verify resumeId1 has become the default resume now
    const postDeleteListRes = await fetch(`${baseUrl}/resumes`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const postDeleteList = (await checkStatus(postDeleteListRes, 200, "List Resumes post Delete")) as any[];
    const finalR1 = postDeleteList.find(r => r.id === resumeId1);
    console.log(`Resume 1 Default after Resume 2 Deleted: ${finalR1?.default}`);
    if (finalR1?.default !== true) {
      throw new Error("Fallback default selection failed");
    }

    // 13. Delete last resume
    console.log(`\n13. Deleting last resume ID: ${resumeId1}...`);
    const deleteLastRes = await fetch(`${baseUrl}/resumes/${resumeId1}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await checkStatus(deleteLastRes, 204, "Delete Last Resume");

    console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");

  } catch (error) {
    console.error("\n=== TESTING FAILED ===");
    console.error((error as Error).message);
    process.exit(1);
  }
}

runTests();

export {};
