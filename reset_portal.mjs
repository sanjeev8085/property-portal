// reset_portal.mjs
async function run() {
  console.log("Triggering database reset on live cloud backend...");
  for (let i = 1; i <= 25; i++) {
    try {
      const res = await fetch("https://aurahomes-backend-tz1c.onrender.com/reset-database");
      const data = await res.json();
      console.log(`Attempt ${i} Status:`, res.status, "Data:", data);
      if (res.status === 200 && data.status === "success") {
        console.log("🎉 DATABASE IS NOW 100% CLEAN AND FRESH!");
        return;
      }
    } catch (err) {
      console.log(`Attempt ${i} waiting for deployment:`, err.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
}

run();
