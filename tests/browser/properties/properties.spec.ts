import { test, expect } from "@playwright/test";
import { generateQAProperty, generateQAUser } from "../helpers/test-data";
import { ErrorCollector } from "../helpers/error-collector";

test.describe("🔴 PROPERTIES: Search, Filtering, Creation Wizard & Details", () => {
  test("Property Search by Location & Purpose Filter", async ({ page }, testInfo) => {
    const errorCollector = new ErrorCollector(page);

    await page.goto("/search?location=Bhopal&purpose=rent");
    await page.waitForSelector(".search-page-container, .results-grid, .search-property-card, .no-results-card", { timeout: 15000 });

    const searchInput = page.locator("input.nav-search-input, input[placeholder*='Search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Arera Colony");
      await page.waitForTimeout(600);
    }

    // Toggle Buy tab
    const buyPill = page.locator(".purpose-pill, .search-tabs button, button:has-text('Buy')").first();
    if (await buyPill.isVisible()) {
      await buyPill.click();
      await page.waitForTimeout(1000);
    }

    errorCollector.attachToTest(testInfo);
  });

  test("10-Step Property Creation Wizard with Step 5 Amenity Checklist", async ({ page }, testInfo) => {
    const errorCollector = new ErrorCollector(page);
    const user = generateQAUser("owner");
    const property = generateQAProperty();

    // Authenticate test user
    await page.goto("/");
    await page.evaluate((u) => {
      localStorage.setItem("access_token", "qa-mock-token");
      localStorage.setItem("user_name", u.name);
      localStorage.setItem("user_email", u.email);
      localStorage.setItem("user_mobile", u.mobile);
    }, user);

    await page.goto("/dashboard/properties/new");
    await page.waitForSelector(".wizard-content-box, .step-title-row, .wizard-page-container", { timeout: 15000 });

    const nextBtn = page.locator(".wizard-controls-row button.btn-primary");

    // Step 1: Purpose
    await nextBtn.click();
    await page.waitForTimeout(600);

    // Step 2: Type
    await nextBtn.click();
    await page.waitForTimeout(600);

    // Step 3: Location
    const localityInput = page.locator(".form-grid input").nth(1);
    if (await localityInput.isVisible()) {
      await localityInput.fill(property.locality);
    }
    await nextBtn.click();
    await page.waitForTimeout(600);

    // Step 4: Specs
    await nextBtn.click();
    await page.waitForTimeout(600);

    // Step 5: AMENITIES SELECTION
    const amenityCards = page.locator(".amenity-select-card");
    const count = await amenityCards.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        await amenityCards.nth(i).click();
        await page.waitForTimeout(200);
      }
    }
    await nextBtn.click();
    await page.waitForTimeout(600);

    // Step 6: Pricing
    const priceInput = page.locator(".form-grid input").first();
    if (await priceInput.isVisible()) {
      await priceInput.fill(property.price.toString());
    }
    await nextBtn.click();
    await page.waitForTimeout(600);

    // Step 7: Photos
    await nextBtn.click();
    await page.waitForTimeout(600);

    // Step 8: Description
    await nextBtn.click();
    await page.waitForTimeout(600);

    // Step 9: Contact
    await nextBtn.click();
    await page.waitForTimeout(600);

    // Step 10: Preview & Publish
    await expect(page.locator(".preview-summary-card, h2:has-text('Preview'), .details-card").first()).toBeVisible();

    errorCollector.attachToTest(testInfo);
  });
});
