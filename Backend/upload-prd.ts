// upload-prd.ts
// Test script to upload the prd.pdf to the resumes service.
// Run with: npx ts-node upload-prd.ts

import * as fs from "fs";
import * as path from "path";

async function uploadPRD() {
  const baseUrl = "http://localhost:5000";
  const email = `prdtester_${Date.now()}@example.com`;
  const password = "TestPassword123!";

  console.log("=== Uploading PRD Test File ===");

  try {
    // 1. Register
    console.log("Registering test user...");
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "PRD Tester", email, password }),
    });
    if (!regRes.ok) {
      throw new Error(`Registration failed: ${await regRes.text()}`);
    }

    // 2. Login
    console.log("Logging in...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!loginRes.ok) {
      throw new Error("Login failed");
    }
    const loginData = (await loginRes.json()) as any;
    const accessToken = loginData.accessToken;

    // 3. Read prd.pdf
    console.log("Reading prd.pdf from disk...");
    const fileBuffer = fs.readFileSync(path.join(__dirname, "prd.pdf"));
    
    // Create form data
    const formData = new FormData();
    formData.append("title", "ApplyPilot PRD");
    const fileBlob = new Blob([fileBuffer], { type: "application/pdf" });
    formData.append("file", fileBlob, "prd.pdf");

    // 4. Upload
    console.log("Uploading to /resumes endpoint...");
    const uploadRes = await fetch(`${baseUrl}/resumes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${await uploadRes.text()}`);
    }

    const result = (await uploadRes.json()) as any;
    console.log("\n[SUCCESS] File uploaded successfully!");
    console.log("Response:", result);

    // 5. Get details
    console.log("\nRetrieving metadata from Neon DB...");
    const detailsRes = await fetch(`${baseUrl}/resumes/${result.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("Metadata:", await detailsRes.json());

    // 6. Generate download URL
    console.log("\nGenerating pre-signed download redirect URL...");
    const downloadRes = await fetch(`${baseUrl}/resumes/${result.id}/download`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: "manual",
    });
    console.log("Redirect Status (should be 302):", downloadRes.status);
    console.log("Pre-signed Download URL:", downloadRes.headers.get("location"));

  } catch (error) {
    console.error("Test failed:", (error as Error).message);
  }
}

uploadPRD();
