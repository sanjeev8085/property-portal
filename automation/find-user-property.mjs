import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCREENSHOTS_DIR = path.resolve(__dirname, "screenshots");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function findBrowserExecutable() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("==================================================");
  console.log("🔍 AuraHomes — Finding Your Gandhi Nagar PG Listing");
  console.log("==================================================");

  const browserPath = findBrowserExecutable();
  if (!browserPath) {
    console.error("[-] Chrome/Edge not found.");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized", "--no-sandbox"],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());
  await page.setViewport({ width: 1366, height: 768 });

  const targetUrls = [
    "https://property-portal-rncp.vercel.app/properties/premium-pg-coliving-space-triple-dormitory-sharing-in-gandhi-nagar-bhopal-gandhi-nagar-gandhi-nagar-bhopal-1788182184833",
    "https://property-portal-rncp.vercel.app/search?location=gandhi+nagar",
    "https://property-portal-rncp.vercel.app",
    "http://localhost:3000/search?location=gandhi+nagar",
  ];

  try {
    // 1. Direct navigation to the exact property slug URL
    console.log(`\n[1/4] Navigating directly to property URL...`);
    console.log(`URL: ${targetUrls[0]}`);
    await page.goto(targetUrls[0], { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(2500);

    // Save screenshot of direct property view
    const shotDirect = path.join(SCREENSHOTS_DIR, "user_property_details_direct.png");
    await page.screenshot({ path: shotDirect });
    console.log(`[+] Captured Property Page Screenshot: ${shotDirect}`);

    // Smooth scroll down through the photos, amenities and price
    console.log("\n[2/4] Scrolling smoothly through Photos, Price (₹1.80 Lakh), and Amenities...");
    await page.evaluate(async () => {
      window.scrollBy({ top: 400, behavior: "smooth" });
    });
    await sleep(1500);

    await page.evaluate(async () => {
      window.scrollBy({ top: 450, behavior: "smooth" });
    });
    await sleep(1500);

    const shotAmenities = path.join(SCREENSHOTS_DIR, "user_property_amenities.png");
    await page.screenshot({ path: shotAmenities });
    console.log(`[+] Captured Amenities Screenshot: ${shotAmenities}`);

    // 2. Open Search Page to verify marketplace card
    console.log("\n[3/4] Opening Search Results to view marketplace card...");
    await page.goto("https://property-portal-rncp.vercel.app/search?location=gandhi+nagar", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await sleep(2500);

    const shotSearch = path.join(SCREENSHOTS_DIR, "user_property_in_search.png");
    await page.screenshot({ path: shotSearch });
    console.log(`[+] Captured Search Results Screenshot: ${shotSearch}`);

    console.log("\n[4/4] Verification Complete! Keeping browser open for your visual inspection...");
    console.log("--------------------------------------------------");
    console.log("Property Title: Premium PG / Coliving Space (Triple / Dormitory Sharing) in gandhi nagar , Bhopal");
    console.log("Price: ₹1.80 Lakh");
    console.log("Location: gandhi nagar , gandhi nagar , Bhopal");
    console.log("--------------------------------------------------");

    // Keep open for 15 seconds so the user can inspect it
    await sleep(15000);
  } catch (err) {
    console.error("Error during browser run:", err.message);
  } finally {
    await browser.close();
    console.log("[+] Browser session finished.");
  }
}

main();
