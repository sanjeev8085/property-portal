// reset_portal.mjs
async function run() {
  const res = await fetch("https://aurahomes-backend-tz1c.onrender.com/reset-database");
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response text:", text);
}

run();
