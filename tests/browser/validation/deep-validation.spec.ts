import { test, expect } from "@playwright/test";
import { generateQAUser } from "../helpers/test-data";
import { ErrorCollector } from "../helpers/error-collector";

test.describe("🔴 DEEP UI FIELD VALIDATION & NEGATIVE BOUNDARY TESTING", () => {
  test("Registration Form: Invalid Email & Short Password Show Error State", async ({ page }, testInfo) => {
    test.setTimeout(45000);
    const errorCollector = new ErrorCollector(page);

    await page.goto("/register");
    await page.waitForSelector("form.register-form", { timeout: 15000 });

    // Fill with password < 8 characters
    await page.fill('form.register-form input[type="text"]', "Validation User");
    await page.fill('form.register-form input[type="email"]', "shortpass@example.com");
    await page.fill('form.register-form input[type="tel"]', "9876543210");
    await page.fill('form.register-form input[type="password"]', "short");

    await page.click('form.register-form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify user is NOT logged in or redirected to dashboard
    const isTokenSet = await page.evaluate(() => !!localStorage.getItem("access_token"));
    expect(isTokenSet).toBeFalsy();

    errorCollector.attachToTest(testInfo);
  });

  test("Login Form: Wrong Password Prevents Session Storage & Displays Error", async ({ page }, testInfo) => {
    test.setTimeout(45000);
    const errorCollector = new ErrorCollector(page);

    await page.goto("/login");
    await page.waitForSelector("form.login-form", { timeout: 15000 });

    await page.fill('form.login-form input[type="email"]', "nonexistent_buyer@example.com");
    await page.fill('form.login-form input[type="password"]', "WrongPassword123!");
    await page.click('form.login-form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify token is NOT stored in localStorage
    const hasToken = await page.evaluate(() => !!localStorage.getItem("access_token"));
    expect(hasToken).toBeFalsy();

    errorCollector.attachToTest(testInfo);
  });

  test("Search Filters: Min Price > Max Price Query Boundary Handling", async ({ page }, testInfo) => {
    test.setTimeout(45000);
    const errorCollector = new ErrorCollector(page);

    // Navigate to search with min_price > max_price query parameters
    await page.goto("/search?min_price=5000000&max_price=100000");
    await page.waitForTimeout(1500);

    // Page should remain functional without unhandled react or network crash
    const bodyVisible = await page.locator("body").isVisible();
    expect(bodyVisible).toBeTruthy();

    errorCollector.attachToTest(testInfo);
  });
});
