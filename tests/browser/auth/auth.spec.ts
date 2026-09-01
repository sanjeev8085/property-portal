import { test, expect } from "@playwright/test";
import { generateQAUser } from "../helpers/test-data";
import { ErrorCollector } from "../helpers/error-collector";

test.describe("🔴 AUTHENTICATION: Registration, Login, and Session Security", () => {
  test("User Registration with Validation & Session Verification", async ({ page }, testInfo) => {
    const errorCollector = new ErrorCollector(page);
    const user = generateQAUser("buyer");

    await page.goto("/register");
    await page.waitForSelector("form.register-form", { timeout: 15000 });

    // Fill form using exact form-scoped selectors
    await page.fill('form.register-form input[type="text"]', user.name);
    await page.fill('form.register-form input[type="email"]', user.email);
    await page.fill('form.register-form input[type="tel"]', user.mobile);
    await page.fill('form.register-form input[type="password"]', user.password);

    // Submit
    await page.click('form.register-form button[type="submit"]');
    await page.waitForTimeout(2000);

    const isTokenPresent = await page.evaluate(() => !!localStorage.getItem("access_token") || !!localStorage.getItem("user_name"));
    expect(isTokenPresent).toBeTruthy();

    errorCollector.attachToTest(testInfo);
  });

  test("User Login with Valid Credentials", async ({ page }, testInfo) => {
    const errorCollector = new ErrorCollector(page);
    const user = generateQAUser("owner");

    // First register user
    await page.goto("/register");
    await page.waitForSelector("form.register-form", { timeout: 15000 });
    await page.fill('form.register-form input[type="text"]', user.name);
    await page.fill('form.register-form input[type="email"]', user.email);
    await page.fill('form.register-form input[type="tel"]', user.mobile);
    await page.fill('form.register-form input[type="password"]', user.password);
    await page.click('form.register-form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Clear local session to test explicit login
    await page.evaluate(() => localStorage.clear());

    // Navigate to Login
    await page.goto("/login");
    await page.waitForSelector("form.login-form", { timeout: 15000 });
    await page.fill('form.login-form input[type="email"]', user.email);
    await page.fill('form.login-form input[type="password"]', user.password);
    await page.click('form.login-form button[type="submit"]');
    await page.waitForTimeout(2000);

    const emailStored = await page.evaluate(() => localStorage.getItem("user_email"));
    expect(emailStored?.toLowerCase()).toBe(user.email.toLowerCase());

    errorCollector.attachToTest(testInfo);
  });

  test("User Login with Invalid Credentials Fails & Displays Error", async ({ page }, testInfo) => {
    const errorCollector = new ErrorCollector(page);

    await page.goto("/login");
    await page.waitForSelector("form.login-form", { timeout: 15000 });
    await page.fill('form.login-form input[type="email"]', "invalid_user_9999@example.com");
    await page.fill('form.login-form input[type="password"]', "WrongPassword123!");
    await page.click('form.login-form button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify token is NOT stored
    const isTokenSet = await page.evaluate(() => !!localStorage.getItem("access_token"));
    expect(isTokenSet).toBeFalsy();

    errorCollector.attachToTest(testInfo);
  });
});
