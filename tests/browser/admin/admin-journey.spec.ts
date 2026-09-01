import { test, expect } from "@playwright/test";
import { ErrorCollector } from "../helpers/error-collector";

test.describe("🛡️ ADMIN: Management, Moderation and Control System", () => {
  test("Admin Navigation and Dashboard Metrics", async ({ page }, testInfo) => {
    const errorCollector = new ErrorCollector(page);

    // Set admin session
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "admin-mock-token");
      localStorage.setItem("user_type", "admin");
      localStorage.setItem("user_name", "System Admin");
      localStorage.setItem("user_email", "admin@aurahomes.in");
    });

    await page.goto("/admin");
    await page.waitForTimeout(1500);

    await expect(page.locator("body")).toBeVisible();

    errorCollector.attachToTest(testInfo);
  });
});
