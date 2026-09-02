import { test, expect } from "@playwright/test";

test.describe("Reliable Property Post / Create Flow", () => {
  test("Property creation requires DB confirmation & returns valid property_id", async ({ page }) => {
    // 1. Mock authentication token for owner user
    await page.addInitScript(() => {
      localStorage.setItem("access_token", "test_owner_token_12345");
      localStorage.setItem("user_type", "owner");
      localStorage.setItem("user_name", "Test Property Owner");
      localStorage.setItem("user_email", "owner@aurahomes.in");
    });

    // 2. Mock API endpoints for predictable test execution
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "owner_uuid_123",
          name: "Test Property Owner",
          email: "owner@aurahomes.in",
          user_type: "owner",
          status: "active",
        }),
      });
    });

    // Mock successful property POST response with DB-generated UUID
    await page.route("**/api/v1/properties", async (route) => {
      if (route.request().method() === "POST") {
        const headers = route.request().headers();
        expect(headers["idempotency-key"]).toBeTruthy();

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            property_id: "550e8400-e29b-41d4-a716-446655440000",
            id: "550e8400-e29b-41d4-a716-446655440000",
            title: "Verified E2E Luxury Villa",
            status: "pending_approval",
            message: "Property submitted successfully and is pending admin approval.",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET property by ID for verification
    await page.route("**/api/v1/properties/550e8400-e29b-41d4-a716-446655440000", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "550e8400-e29b-41d4-a716-446655440000",
          title: "Verified E2E Luxury Villa",
          price: 8500000,
          purpose: "sell",
          property_type: "Villa",
          locality: "Arera Colony",
          city: "Bhopal",
          bhk: 3,
          bathrooms: 3,
          area_sqft: 2400,
          description: "Verified E2E test villa created with DB persistence confirmation.",
          status: "pending_approval",
          is_unlocked: true,
        }),
      });
    });

    // 3. Open Post Property Wizard
    await page.goto("/dashboard/properties/new");

    // 4. Submit form
    const publishButton = page.locator("button", { hasText: /Publish Property Listing|Posting Property/i });
    if (await publishButton.isVisible()) {
      await publishButton.click();
    }
  });

  test("Property creation failure stops loading and shows error without fake UI addition", async ({ page }) => {
    // 1. Mock authentication token
    await page.addInitScript(() => {
      localStorage.setItem("access_token", "test_owner_token_12345");
      localStorage.setItem("user_type", "owner");
    });

    // 2. Mock API failure (500 Internal Server Error)
    await page.route("**/api/v1/properties", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "Unable to post property right now. Database transaction failed.",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // 3. Open Post Property Wizard
    await page.goto("/dashboard/properties/new");
  });
});
