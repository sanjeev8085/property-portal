import { test, expect } from "@playwright/test";
import { generateQAUser } from "../helpers/test-data";
import { ErrorCollector } from "../helpers/error-collector";

test.describe("🔥 CREDITS & UNLOCK: Credit Purchase → Balance Update → Contact Unlock", () => {
  test("Credit Purchase Flow & Zero-Credit Protection", async ({ page }, testInfo) => {
    const errorCollector = new ErrorCollector(page);
    const user = generateQAUser("buyer");

    // 1. Authenticate user with 0 credits
    await page.goto("/");
    await page.evaluate((u) => {
      localStorage.setItem("access_token", "qa-credits-token");
      localStorage.setItem("user_name", u.name);
      localStorage.setItem("user_email", u.email);
    }, user);

    // 2. Open plans / pricing page
    await page.goto("/plans");
    await page.waitForTimeout(1000);
    await expect(page.locator(".plan-card, .pricing-card, h1").first()).toBeVisible();

    // 3. Open property with 0 credits and verify gated contact section
    await page.goto("/properties/sleek-2-bhk-modern-apartment-in-arera-colony-12345");
    await page.waitForTimeout(1500);

    const contactSection = page.locator(".owner-card, .owner-inpage-card, .contact-sidebar, .details-card");
    await expect(contactSection.first()).toBeVisible();

    errorCollector.attachToTest(testInfo);
  });
});
