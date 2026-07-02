const { ConvexHttpClient } = require("convex/browser");

async function main() {
  const client = new ConvexHttpClient("https://focused-lyrebird-470.convex.cloud");
  
  // Step 2: Verify with the code
  try {
    const result2 = await client.action("auth:signIn", {
      provider: "email",
      params: { email: "quinton.ndlovu@uncommon.org", code: "320282" }
    });
    console.log("Step 2 result:", JSON.stringify(result2, null, 2));
  } catch (e) {
    console.log("Step 2 error:", e.message);
    console.log("Full error:", e);
  }
}

main().catch(console.error);
