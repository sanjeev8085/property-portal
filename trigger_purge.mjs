// trigger_purge.mjs
async function run() {
  const res = await fetch("https://aurahomes-backend-tz1c.onrender.com/reset-database");
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", data);
}

run().catch(console.error);
