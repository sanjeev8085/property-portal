// reset_portal.mjs
async function run() {
  console.log("Checking health and calling reset database...");
  const h = await fetch("https://aurahomes-backend-tz1c.onrender.com/health");
  const hd = await h.json();
  console.log("Health:", hd);

  const res = await fetch("https://aurahomes-backend-tz1c.onrender.com/api/v1/admin/reset-database", {
    method: "POST"
  });
  const data = await res.json();
  console.log("Reset POST Status:", res.status);
  console.log("Reset Response:", data);
}

run();
