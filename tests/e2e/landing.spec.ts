import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
    test("renders correctly", async ({ page }) => {
        await page.goto("/");

        // Check main heading exists
        await expect(
            page.getByRole("heading", { level: 1 })
        ).toBeVisible();

        // Check CTA buttons
        await expect(
            page.getByRole("link", { name: /get started/i })
        ).toBeVisible();

        await expect(
            page.getByRole("link", { name: /sign in/i })
        ).toBeVisible();
    });

    test("features section is visible", async ({ page }) => {
        await page.goto("/");

        // Check feature cards exist
        await expect(
            page.getByText("PDF Analysis")
        ).toBeVisible();

        await expect(
            page.getByText("Intelligent Q&A")
        ).toBeVisible();
    });

    test("navigates to login from CTA", async ({ page }) => {
        await page.goto("/");

        await page
            .getByRole("link", { name: /sign in/i })
            .first()
            .click();

        await expect(page).toHaveURL(/\/login/);
    });

    test("health check returns 200", async ({ request }) => {
        const response = await request.get("/api/health");
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.status).toBe("healthy");
    });
});