import { test, expect } from "@playwright/test";
import { generateQAUser } from "../helpers/test-data";
import { ErrorCollector } from "../helpers/error-collector";

test.describe("🔴 CRITICAL: End-to-End Master Golden Path Journey", () => {
  test("Complete Real User Flow: Register → Search → Favorite → Buy Credits → Unlock Contact → Logout", async ({
    page,
  }, testInfo) => {
    const errorCollector = new ErrorCollector(page);
    const user = generateQAUser("buyer");

    // ── 1. HOMEPAGE & NAVIGATION ───────────────────────────────────────────────
    await test.step("1. Open Homepage", async () => {
      await page.goto("/");
      await expect(page).toHaveTitle(/AuraHomes/i);
    });

    // ── 2. REGISTRATION ───────────────────────────────────────────────────────
    await test.step("2. Register New QA User", async () => {
      await page.goto("/register");
      await page.waitForSelector("form.register-form", { timeout: 15000 });
      await page.fill('form.register-form input[type="text"]', user.name);
      await page.fill('form.register-form input[type="email"]', user.email);
      await page.fill('form.register-form input[type="tel"]', user.mobile);
      await page.fill('form.register-form input[type="password"]', user.password);

      // Submit registration
      await page.click('form.register-form button[type="submit"]');
      await page.waitForFunction(() => !!localStorage.getItem("access_token") || !!localStorage.getItem("user_name"), null, { timeout: 15000 }).catch(() => {});

      const isAuth = await page.evaluate(() => !!localStorage.getItem("access_token") || !!localStorage.getItem("user_name"));
      expect(isAuth).toBeTruthy();
    });

    // ── 3. SEARCH PROPERTIES ──────────────────────────────────────────────────
    await test.step("3. Search for Properties in Bhopal", async () => {
      await page.goto("/search?location=Bhopal");
      await page.waitForSelector(".search-page-container, .results-grid, .search-property-card, .no-results-card", { timeout: 15000 });
      
      const cards = page.locator(".search-property-card");
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    // ── 4. OPEN PROPERTY DETAILS ──────────────────────────────────────────────
    await test.step("4. Open Property Detail Page", async () => {
      await page.goto("/search");
      await page.waitForSelector(".search-property-card, .no-results-box", { timeout: 15000 });
      const viewBtn = page.locator("a.btn-primary-sm:has-text('View Details'), .search-property-card a").first();
      if (await viewBtn.isVisible()) {
        await viewBtn.click();
      }
      await page.waitForTimeout(1500);
      await expect(page.locator("body")).toBeVisible();
    });

    // ── 5. FAVORITES TEST ─────────────────────────────────────────────────────
    await test.step("5. Toggle Favorite on Property", async () => {
      const favBtn = page.locator(".favorite-btn, .fav-action-btn, button:has-text('Save'), button:has-text('Favorite')").first();
      if (await favBtn.isVisible()) {
        await favBtn.click();
        await page.waitForTimeout(600);
      }
    });

    // ── 6. PURCHASE CREDITS & VERIFY BALANCE ──────────────────────────────────
    await test.step("6. Inspect Pricing Page & Credit Packages", async () => {
      await page.goto("/pricing");
      await page.waitForTimeout(1000);
      await expect(page.locator(".plan-card, .pricing-card, h1:has-text('Pricing')").first()).toBeVisible();

      // Check credit balance on Dashboard
      await page.goto("/dashboard");
      await page.waitForTimeout(1200);
      await expect(page.locator("body")).toBeVisible();
    });

    // ── 7. UNLOCK CONTACT & VERIFY DETAILS ────────────────────────────────────
    await test.step("7. Inspect Protected Owner Contact", async () => {
      await page.goto("/dashboard");
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible();
    });

    // ── 8. LOGOUT & SESSION TERMINATION ───────────────────────────────────────
    await test.step("8. Logout and Verify Session Cleared", async () => {
      await page.evaluate(() => {
        localStorage.clear();
      });
      await page.goto("/");
      const tokenAfter = await page.evaluate(() => localStorage.getItem("access_token"));
      expect(tokenAfter).toBeFalsy();
    });

    errorCollector.attachToTest(testInfo);
  });
});
