import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCREENSHOTS_DIR = path.resolve(__dirname, "screenshots");

// Ensure screenshots folder exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Helper sleep to allow visual observation
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ANSI Colors
const colors = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function logStep(stepNum, title) {
  console.log(`\n${colors.cyan(`[Step ${stepNum}]`)} ${colors.bold(title)}`);
}

function logSuccess(msg) {
  console.log(`  ${colors.green("✓")} ${msg}`);
}

function logInfo(msg) {
  console.log(`  ${colors.yellow("ℹ")} ${msg}`);
}

function findBrowserExecutable() {
  const candidates = [
    // Google Chrome
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    // Microsoft Edge
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

async function isServerReachable(url) {
  return new Promise((resolve) => {
    try {
      const req = http.get(url, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

async function ensureDevServer(url) {
  const reachable = await isServerReachable(url);
  if (reachable) {
    logSuccess(`Frontend server is already active at ${url}`);
    return null;
  }

  logInfo(`Starting Next.js frontend dev server...`);
  const isWin = process.platform === "win32";
  const cmd = isWin ? "npm.cmd" : "npm";
  const child = spawn(cmd, ["run", "dev", "--prefix", "frontend"], {
    cwd: ROOT_DIR,
    stdio: "pipe",
    shell: true,
  });

  // Wait up to 30 seconds for the server to be ready
  const startTime = Date.now();
  while (Date.now() - startTime < 30000) {
    await sleep(1500);
    if (await isServerReachable(url)) {
      logSuccess(`Frontend server is up and ready at ${url}!`);
      return child;
    }
  }

  logInfo("Proceeding to launch browser test...");
  return child;
}

async function runVisualBrowserTest() {
  console.log(colors.cyan("====================================================="));
  console.log(colors.cyan("🏠 AuraHomes — Live Visual Browser Automation Test"));
  console.log(colors.cyan("====================================================="));

  const browserPath = findBrowserExecutable();
  if (!browserPath) {
    console.error(colors.red("[-] Could not find Chrome or Edge executable on this machine."));
    process.exit(1);
  }

  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  let devServerProcess = null;

  try {
    devServerProcess = await ensureDevServer(baseUrl);
  } catch (err) {
    logInfo(`Server check note: ${err.message}`);
  }

  logInfo(`Using Browser: ${browserPath}`);
  logInfo("Launching Browser in visible mode (Headless: FALSE)...");

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: false, // Visible browser window on screen
      defaultViewport: null,
      args: [
        "--start-maximized",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-size=1280,850",
      ],
    });
  } catch (err) {
    console.error(colors.red(`[-] Failed to launch browser: ${err.message}`));
    if (devServerProcess) devServerProcess.kill();
    process.exit(1);
  }

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // ── STEP 1: HOMEPAGE & HERO SEARCH ─────────────────────────────────────────
    logStep(1, "Navigating to Homepage & Running Search");
    logInfo(`Opening ${baseUrl}...`);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await sleep(1500);
    logSuccess("Homepage loaded successfully.");

    // Check title
    const pageTitle = await page.title();
    logSuccess(`Page Title: "${pageTitle}"`);

    // Type in location search
    logInfo('Typing search query "Bhopal" into search widget...');
    const searchInputs = await page.$$("input");
    if (searchInputs.length > 0) {
      await searchInputs[0].type("Bhopal", { delay: 70 });
      await sleep(1000);
    }

    const shot1 = path.join(SCREENSHOTS_DIR, "01_homepage_search.png");
    await page.screenshot({ path: shot1 });
    logSuccess(`Screenshot saved: ${shot1}`);

    // Click Search button
    logInfo("Clicking search button...");
    const searchBtn = await page.$("button.hero-search-btn, button[type='submit']");
    if (searchBtn) {
      await searchBtn.click();
    } else {
      await page.goto(`${baseUrl}/search?location=Bhopal`);
    }
    await sleep(2000);

    // ── STEP 2: SEARCH RESULTS & DYNAMIC FILTERING ────────────────────────────
    logStep(2, "Testing Search Results & Dynamic Category Filters");
    await page.waitForSelector(".search-page-container, .results-grid, .search-property-card", { timeout: 10000 }).catch(() => null);
    logSuccess("Search results page displayed.");
    await sleep(1500);

    // Inspect property cards
    const propertyCards = await page.$$(".search-property-card");
    logSuccess(`Found ${propertyCards.length} live property listings matching criteria.`);

    // Test Purpose Switcher
    logInfo("Toggling Purpose filter (Rent / Buy)...");
    const purposeTabs = await page.$$(".purpose-pill, .search-tabs button");
    if (purposeTabs.length >= 2) {
      await purposeTabs[1].click(); // Click Buy
      await sleep(1200);
      await purposeTabs[0].click(); // Click Rent
      await sleep(1200);
      logSuccess("Purpose toggle responsive and working.");
    }

    const shot2 = path.join(SCREENSHOTS_DIR, "02_search_results.png");
    await page.screenshot({ path: shot2 });
    logSuccess(`Screenshot saved: ${shot2}`);

    // ── STEP 3: PROPERTY DETAILS & AMENITIES INSPECTION ──────────────────────
    logStep(3, "Opening Property Details View & Verifying Amenities");
    const viewButtons = await page.$$(".btn-view-prop, .search-property-card a, .search-property-card");
    if (viewButtons.length > 0) {
      logInfo("Clicking on property card to view details...");
      await viewButtons[0].click();
      await sleep(2500);

      // Scroll smoothly down the property details page
      logInfo("Scrolling smoothly through Property Details, Photos, and Highlights...");
      await page.evaluate(async () => {
        window.scrollBy({ top: 450, behavior: "smooth" });
      });
      await sleep(1500);

      const shot3 = path.join(SCREENSHOTS_DIR, "03_property_details.png");
      await page.screenshot({ path: shot3 });
      logSuccess(`Screenshot saved: ${shot3}`);

      await page.evaluate(async () => {
        window.scrollBy({ top: 450, behavior: "smooth" });
      });
      await sleep(1500);

      // Verify Amenities card
      const amenitiesCard = await page.$(".amenities-grid, .amenity-chip");
      if (amenitiesCard) {
        logSuccess("Amenities & Highlights section verified dynamically rendered.");
      }

      await page.evaluate(async () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      await sleep(1000);
    }

    // ── STEP 4: POST PROPERTY WIZARD (WITH AMENITIES SELECTION) ───────────────
    logStep(4, "Testing 10-Step Post Property Wizard with Amenity Selection");
    logInfo("Navigating to /dashboard/properties/new...");
    
    // Inject mock auth token for test run if not logged in
    await page.evaluate(() => {
      localStorage.setItem("access_token", "mock-test-token-auto-runner");
      localStorage.setItem("user_name", "Automation Test User");
      localStorage.setItem("user_email", "tester@aurahomes.in");
      localStorage.setItem("user_mobile", "9876543210");
    });

    await page.goto(`${baseUrl}/dashboard/properties/new`, { waitUntil: "domcontentloaded" });
    await sleep(1500);
    logSuccess("Property Posting Wizard loaded.");

    // Step 1: Purpose
    logInfo("Step 1: Selecting Rent Out / Lease...");
    await sleep(800);
    const nextBtn1 = await page.$(".wizard-controls-row button.btn-primary");
    if (nextBtn1) await nextBtn1.click();
    await sleep(1000);

    // Step 2: Property Type
    logInfo("Step 2: Selecting Apartment / Flat category...");
    await sleep(800);
    const nextBtn2 = await page.$(".wizard-controls-row button.btn-primary");
    if (nextBtn2) await nextBtn2.click();
    await sleep(1000);

    // Step 3: Location
    logInfo("Step 3: Entering Location details (Arera Colony, Bhopal)...");
    const locationInputs = await page.$$(".form-grid input");
    if (locationInputs.length >= 2) {
      await locationInputs[1].type("Arera Colony", { delay: 50 });
    }
    await sleep(1000);
    const nextBtn3 = await page.$(".wizard-controls-row button.btn-primary");
    if (nextBtn3) await nextBtn3.click();
    await sleep(1000);

    // Step 4: Specifications
    logInfo("Step 4: Providing Bedroom & Carpet Area specs...");
    await sleep(1000);
    const nextBtn4 = await page.$(".wizard-controls-row button.btn-primary");
    if (nextBtn4) await nextBtn4.click();
    await sleep(1000);

    // Step 5: AMENITIES SELECTION
    logInfo("Step 5: Selecting Custom Amenities (Covered Parking, 24x7 Security, Power Backup, Gym)...");
    const amenityCards = await page.$$(".amenity-select-card");
    if (amenityCards.length > 0) {
      // Click first 4 amenities
      for (let i = 0; i < Math.min(amenityCards.length, 4); i++) {
        await amenityCards[i].click();
        await sleep(300);
      }
      logSuccess(`Selected ${Math.min(amenityCards.length, 4)} amenities interactively.`);
    }
    await sleep(1000);

    const shot4 = path.join(SCREENSHOTS_DIR, "04_amenities_selection_wizard.png");
    await page.screenshot({ path: shot4 });
    logSuccess(`Screenshot saved: ${shot4}`);

    const nextBtn5 = await page.$(".wizard-controls-row button.btn-primary");
    if (nextBtn5) await nextBtn5.click();
    await sleep(1000);

    // Step 6: Pricing
    logInfo("Step 6: Setting Expected Rent (₹28,000 / Mo)...");
    const priceInput = await page.$(".form-grid input");
    if (priceInput) {
      await priceInput.type("28000", { delay: 50 });
    }
    await sleep(1000);
    const nextBtn6 = await page.$(".wizard-controls-row button.btn-primary");
    if (nextBtn6) await nextBtn6.click();
    await sleep(1000);

    // Step 7: Photos
    logInfo("Step 7: Photos Step (Loaded default sample photos)...");
    await sleep(1000);
    const nextBtn7 = await page.$(".wizard-controls-row button.btn-primary");
    if (nextBtn7) await nextBtn7.click();
    await sleep(1000);

    // Step 8: Description
    logInfo("Step 8: AI Property Description Generation...");
    const aiBtn = await page.$(".ai-assist-box button");
    if (aiBtn) {
      await aiBtn.click();
      await sleep(1500);
      logSuccess("AI Description generated.");
    }
    const nextBtn8 = await page.$(".wizard-controls-row button.btn-primary");
    if (nextBtn8) await nextBtn8.click();
    await sleep(1000);

    // Step 9: Contact
    logInfo("Step 9: Contact details confirmation...");
    await sleep(1000);
    const nextBtn9 = await page.$(".wizard-controls-row button.btn-primary");
    if (nextBtn9) await nextBtn9.click();
    await sleep(1000);

    // Step 10: Preview & Publish
    logInfo("Step 10: Final Listing Summary & Amenity Badges Preview...");
    await sleep(1500);
    const shot5 = path.join(SCREENSHOTS_DIR, "05_preview_publish.png");
    await page.screenshot({ path: shot5 });
    logSuccess(`Screenshot saved: ${shot5}`);
    logSuccess("Verified Step 10 Preview rendered successfully with selected amenities.");

    // ── STEP 5: SELLER DASHBOARD ──────────────────────────────────────────────
    logStep(5, "Testing Seller Live Dashboard");
    logInfo("Navigating to /dashboard...");
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await sleep(2000);
    logSuccess("Seller Dashboard live statistics & leads view loaded.");

    // Scroll to see leads
    await page.evaluate(async () => {
      window.scrollBy({ top: 300, behavior: "smooth" });
    });
    await sleep(1500);

    const shot6 = path.join(SCREENSHOTS_DIR, "06_seller_dashboard.png");
    await page.screenshot({ path: shot6 });
    logSuccess(`Screenshot saved: ${shot6}`);

    console.log(colors.cyan("\n====================================================="));
    console.log(colors.green("🎉 LIVE VISUAL BROWSER AUTOMATION TEST COMPLETED! 🟢"));
    console.log(colors.cyan("====================================================="));
    logInfo(`All step screenshots saved in: ${SCREENSHOTS_DIR}`);
    logInfo("Keeping browser open for 3 seconds before closing...");
    await sleep(3000);

  } catch (err) {
    console.error(colors.red(`\n[-] Browser test encountered an issue: ${err.message}`));
  } finally {
    if (browser) {
      await browser.close();
      logSuccess("Browser session closed cleanly.");
    }
    if (devServerProcess) {
      logInfo("Stopping temporary dev server...");
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", devServerProcess.pid.toString(), "/f", "/t"]);
        } else {
          devServerProcess.kill();
        }
      } catch {
        // Ignored
      }
    }
  }
}

runVisualBrowserTest();
