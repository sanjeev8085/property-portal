// reset_portal.mjs
async function run() {
  console.log("Polling Render for /reset-database deployment...");
  for (let i = 1; i <= 20; i++) {
    try {
      const res = await fetch("https://aurahomes-backend-tz1c.onrender.com/reset-database");
      if (res.status === 200) {
        const data = await res.json();
        console.log(`✓ Deployment Live! Attempt ${i}: Status 200`);
        console.log("Database Reset Output:", data);
        return;
      } else {
        console.log(`Attempt ${i}: Status ${res.status}, waiting 6 seconds for Render build...`);
      }
    } catch (err) {
      console.log(`Attempt ${i} network error: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
}

run();
