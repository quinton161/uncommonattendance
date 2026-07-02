const { ConvexHttpClient } = require("convex/browser");

async function main() {
  const client = new ConvexHttpClient("https://focused-lyrebird-470.convex.cloud");
  
  // Step 1: Send code
  try {
    const result1 = await client.action("auth:signIn", {
      provider: "email",
      params: { email: "quinton.ndlovu@uncommon.org" }
    });
    console.log("Step 1 (send code):", JSON.stringify(result1));
  } catch (e) {
    console.log("Step 1 error:", e.message);
    return;
  }
  
  // Step 2: We need the code, but we can get it from the DB
  // For now, just report success of step 1
  console.log("Email sent successfully (if Resend delivered it)");
}

main().catch(console.error);
