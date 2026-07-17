// test-agent.ts
// Verification script for Phase 8: AI Agent & Workflow Orchestrator.
// Run with: npx ts-node test-agent.ts

async function runTests() {
  const baseUrl = "http://localhost:5000";
  const email = `agenttester_${Date.now()}@example.com`;
  const password = "TestPassword123!";
  
  let token = "";
  let conversationId = "";
  let taskId = "";

  console.log("=== Phase 8 AI Agent Testing Started ===");

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
      body: JSON.stringify({ fullName: "Agent Tester", email, password }),
    });
    await checkStatus(regRes, 201, "Register User");

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = (await checkStatus(loginRes, 200, "Login User")) as any;
    token = loginData.accessToken;

    // 2. Chat with Agent (generates execution plan and task)
    console.log("\n2. Sending chat message to AI Agent...");
    const chatRes = await fetch(`${baseUrl}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: "Find React jobs in Berlin and apply if score > 90%",
      }),
    });
    const chatData = (await checkStatus(chatRes, 200, "Send Agent Chat")) as any;
    conversationId = chatData.conversationId;
    taskId = chatData.taskId;
    console.log("Reply from Agent:", chatData.reply);

    // 3. Get Conversations List
    console.log("\n3. Listing conversations...");
    const convsRes = await fetch(`${baseUrl}/agent/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const convsData = (await checkStatus(convsRes, 200, "Get Conversations List")) as any;
    console.log(`Conversations found: ${convsData.length}`);

    // 4. Get Conversation History
    console.log("\n4. Fetching conversation history...");
    const historyRes = await fetch(`${baseUrl}/agent/conversations/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const historyData = (await checkStatus(historyRes, 200, "Get Conversation History")) as any;
    console.log(`History count: ${historyData.length} messages.`);

    // 5. Query Task status
    console.log("\n5. Querying workflow task status...");
    const taskRes = await fetch(`${baseUrl}/agent/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const taskData = (await checkStatus(taskRes, 200, "Get Task Status")) as any;
    console.log(`Task Type: ${taskData.taskType}, Status: ${taskData.status}`);

    // 6. Test Task Cancellation
    console.log("\n6. Canceling task...");
    const cancelRes = await fetch(`${baseUrl}/agent/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (cancelRes.status === 400) {
      const body = await cancelRes.json();
      if (body.message && body.message.includes("already finished")) {
        console.log("[PASS] Cancel Task (Status: 400 - Task already finished as expected)");
      } else {
        throw new Error("Cancel Task failed with unexpected 400 error");
      }
    } else {
      await checkStatus(cancelRes, 200, "Cancel Task");
    }

    console.log("\n=== Phase 8 AI Agent Testing Completed Successfully ===");
  } catch (error) {
    console.error("\n[FAIL] Phase 8 Testing failed:", error);
    process.exit(1);
  }
}

runTests();
