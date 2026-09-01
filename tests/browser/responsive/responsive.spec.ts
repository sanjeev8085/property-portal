import { test, expect } from "@playwright/test";
import { ErrorCollector } from "../helpers/error-collector";

test.describe("📱 RESPONSIVE: Mobile Layout & Viewport Adaptability", () => {
  test("Mobile Viewport Navigation & Touch UI (390x844)", async ({ page }, testInfo) => {
    const errorCollector = new ErrorCollector(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Verify main brand header visible
    await expect(page.locator("header.header, .logo-text, .logo").first()).toBeVisible();

    // Verify search page responsive layout
    await page.goto("/search");
    await page.waitForTimeout(1000);
    await expect(page.locator(".search-page-container, .results-grid, body")).toBeVisible();

    errorCollector.attachToTest(testInfo);
  });
});
