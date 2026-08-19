import { test, expect } from "@playwright/test";

test.describe("Legal and Disclosure Pages", () => {
  const routes = [
    { path: "/terms", title: "Terms of Service" },
    { path: "/privacy", title: "Privacy Policy" },
    { path: "/acceptable-use", title: "Acceptable Use Policy" },
    { path: "/ai-disclosure", title: "AI & Data Processing Notice" },
    { path: "/limits", title: "Service Limits" },
  ];

  for (const { path, title } of routes) {
    test(`renders ${path} page with correct title and heading`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toContainText(title);
      await expect(page.locator("body")).toBeVisible();
    });
  }

  test("footer links on landing page navigate to legal disclosures", async ({
    page,
  }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const expectedLinks = [
      { text: "Limits", href: "/limits" },
      { text: "AI notice", href: "/ai-disclosure" },
      { text: "Privacy", href: "/privacy" },
      { text: "Terms", href: "/terms" },
      { text: "Acceptable use", href: "/acceptable-use" },
    ];

    for (const { text, href } of expectedLinks) {
      const link = footer.locator(`a[href="${href}"]`);
      await expect(link).toBeVisible();
      await expect(link).toContainText(text);
    }
  });

  test("signup agreement gating prevents email and Google signup until agreed", async ({
    page,
  }) => {
    await page.goto("/signup");

    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    // 1. Try email signup without checking box
    await page.fill("input#email", "testuser@example.com");
    await page.fill("input#name", "Test User");
    await page.fill("input#password", "Password123!");
    await page.click('button[type="submit"]');

    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(
      "Confirm that you are 18 or older and agree to the Terms and Privacy Policy."
    );

    // 2. Try Google sign-in without checking box
    await page.reload();
    const googleBtn = page.getByRole("button", { name: /Google/i });
    await expect(googleBtn).toBeVisible();
    await googleBtn.click();
    await expect(page.locator('p[role="alert"]')).toContainText(
      "Confirm that you are 18 or older and agree to the Terms and Privacy Policy."
    );

    // 3. Check the box via label click or keyboard
    const label = page
      .locator("label")
      .filter({ hasText: "I am at least 18 years old" });
    await label.click();
    await expect(page.locator('input[type="checkbox"]')).toBeChecked();
  });
});
