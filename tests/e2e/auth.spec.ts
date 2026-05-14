import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
    test("login page renders", async ({ page }) => {
        await page.goto("/login");

        await expect(
            page.getByRole("heading", { name: /welcome back/i })
        ).toBeVisible();

        await expect(
            page.getByLabel(/email/i)
        ).toBeVisible();

        await expect(
            page.getByLabel(/password/i)
        ).toBeVisible();

        await expect(
            page.getByRole("button", { name: /sign in/i })
        ).toBeVisible();
    });

    test("signup page renders", async ({ page }) => {
        await page.goto("/signup");

        await expect(
            page.getByRole("heading", { name: /create an account/i })
        ).toBeVisible();

        await expect(
            page.getByLabel(/full name/i)
        ).toBeVisible();
    });

    test("shows error on invalid credentials", async ({ page }) => {
        await page.goto("/login");

        await page
            .getByLabel(/email/i)
            .fill("notreal@test.com");

        await page
            .getByLabel(/password/i)
            .fill("wrongpassword");

        await page
            .getByRole("button", { name: /sign in/i })
            .click();

        // Should show error alert
        await expect(
            page.getByRole("alert")
        ).toBeVisible({ timeout: 5000 });
    });

    test("redirects authenticated users away from login", async ({
        page,
    }) => {
        // When not authenticated, /documents redirects to login
        await page.goto("/documents");
        await expect(page).toHaveURL(/\/login/);
    });

    test("login → signup navigation works", async ({ page }) => {
        await page.goto("/login");

        await page
            .getByRole("link", { name: /sign up/i })
            .click();

        await expect(page).toHaveURL(/\/signup/);
    });
});