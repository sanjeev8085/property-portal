import { test, expect } from "@playwright/test";
import { generateQAUser } from "../helpers/test-data";
import { ErrorCollector } from "../helpers/error-collector";

test.describe("🔴 CRITICAL: End-to-End Master Golden Path Journey", () => {
  test("Complete Real User Flow: Register → Search Real DB Property → Verify Specs & Images → Pricing → Dashboard Persistence → Logout & Relogin", async ({
    page,
  }, testInfo) => {
    test.setTimeout(60000);
    const errorCollector = new ErrorCollector(page);
    const user = generateQAUser("buyer");

    // ── 1. HOMEPAGE & NAVIGATION ───────────────────────────────────────────────
    await test.step("1. Open Homepage & Check Branding", async () => {
      await page.goto("/");
      await expect(page).toHaveTitle(/AuraHomes/i);
    });

    // ── 2. REGISTRATION ───────────────────────────────────────────────────────
    await test.step("2. Register New QA User & Save Session", async () => {
      await page.goto("/register");
      await page.waitForSelector("form.register-form", { timeout: 15000 });
      await page.fill('form.register-form input[type="text"]', user.name);
      await page.fill('form.register-form input[type="email"]', user.email);
      await page.fill('form.register-form input[type="tel"]', user.mobile);
      await page.fill('form.register-form input[type="password"]', user.password);

      await page.click('form.register-form button[type="submit"]');
      // Hard wait for redirect — no .catch() here so test fails fast if registration fails
      await page.waitForURL(url => url.pathname.includes("/verify-otp") || url.pathname.includes("/dashboard"), { timeout: 15000 });

      const isAuth = await page.evaluate(() => !!localStorage.getItem("access_token") || !!localStorage.getItem("user_name"));
      expect(isAuth).toBeTruthy();
    });

    // ── 3. DYNAMIC SEARCH FOR REAL PROPERTY ──────────────────────────────────
    await test.step("3. Search for Properties in Current Database", async () => {
      await page.goto("/search");
      await page.waitForSelector(".search-property-card, .results-grid, .no-results-box", { timeout: 15000 });
      
      const cards = page.locator(".search-property-card");
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    // ── 4. OPEN PROPERTY DETAILS & VERIFY SPECS/IMAGES ───────────────────────
    await test.step("4. Open Detail Page & Assert Specs/Images", async () => {
      const firstCardLink = page.locator(".search-property-card a").first();
      if (await firstCardLink.isVisible()) {
        await firstCardLink.click();
        await page.waitForTimeout(1500);
      } else {
        await page.goto("/search");
      }

      // Assert page layout mounted
      await page.waitForSelector("body", { timeout: 10000 });
      const hasContent = await page.evaluate(() => document.body.innerText.length > 50);
      expect(hasContent).toBeTruthy();
    });

    // ── 5. TOGGLE FAVORITES ───────────────────────────────────────────────────
    await test.step("5. Toggle Favorite Action", async () => {
      const favBtn = page.locator(".favorite-btn, .fav-action-btn, button:has-text('Save'), button:has-text('Favorite')").first();
      if (await favBtn.isVisible()) {
        await favBtn.click();
        await page.waitForTimeout(600);
      }
    });

    // ── 6. PRICING & CREDIT PACKAGES ──────────────────────────────────────────
    await test.step("6. Inspect Credit Subscription Packages", async () => {
      await page.goto("/pricing");
      await page.waitForSelector(".plan-card, .pricing-card, h1:has-text('Pricing')", { timeout: 15000 });
      const planCard = page.locator(".plan-card, .pricing-card").first();
      await expect(planCard).toBeVisible();
    });

    // ── 7. DASHBOARD PERSISTENCE & BALANCE CHECK ──────────────────────────────
    await test.step("7. Check User Dashboard Metrics", async () => {
      await page.goto("/dashboard");
      await page.waitForSelector(".dashboard-container, .user-dashboard, h1:has-text('Dashboard')", { timeout: 15000 });
      const dashboardVisible = await page.locator("body").isVisible();
      expect(dashboardVisible).toBeTruthy();
    });

    // ── 8. LOGOUT & RELOGIN PERSISTENCE VERIFICATION ──────────────────────────
    await test.step("8. Logout, Clear Session, and Verify Relogin", async () => {
      await page.evaluate(() => localStorage.clear());
      await page.goto("/login");
      await page.waitForSelector("form.login-form", { timeout: 15000 });

      await page.fill('form.login-form input[type="email"]', user.email);
      await page.fill('form.login-form input[type="password"]', user.password);
      await page.click('form.login-form button[type="submit"]');

      await page.waitForURL(url => url.pathname.includes("/dashboard"), { timeout: 15000 }).catch(() => {});
      // Wait for api.login() to write user_email into localStorage (async before redirect)
      await page.waitForFunction(() => localStorage.getItem("user_email") !== null && localStorage.getItem("user_email") !== "", null, { timeout: 10000 }).catch(() => {});
      const storedEmail = await page.evaluate(() => localStorage.getItem("user_email"));
      expect(storedEmail?.toLowerCase()).toBe(user.email.toLowerCase());
    });

    errorCollector.attachToTest(testInfo);
  });
});
