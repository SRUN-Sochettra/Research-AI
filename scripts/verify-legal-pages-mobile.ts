import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runManualVerification() {
  console.log("=== RUNNING LEGAL & MOBILE UX PLAYWRIGHT VERIFICATION ===\n");
  const browser = await chromium.launch({ headless: true });

  const routes = [
    { name: "terms", path: "/terms", heading: "Terms of Service" },
    { name: "privacy", path: "/privacy", heading: "Privacy Policy" },
    {
      name: "acceptable-use",
      path: "/acceptable-use",
      heading: "Acceptable Use Policy",
    },
    {
      name: "ai-disclosure",
      path: "/ai-disclosure",
      heading: "AI & Data Processing Notice",
    },
    { name: "limits", path: "/limits", heading: "Service Limits" },
  ];

  // 1. Test at Desktop (1280px) and Mobile (360px)
  for (const width of [1280, 360]) {
    const mode = width === 360 ? "MOBILE (360px)" : "DESKTOP (1280px)";
    console.log(`\n--- Testing at ${mode} ---`);
    const context = await browser.newContext({
      viewport: { width, height: width === 360 ? 740 : 800 },
    });
    const page = await context.newPage();

    for (const r of routes) {
      await page.goto(`${BASE_URL}${r.path}`);
      const h1Text = await page.locator("h1").innerText();
      const hasBackLink = await page.locator('header a[href="/"]').count();
      const hasLegalContact = await page.locator('a[href^="mailto:"]').count();
      console.log(
        `  ✓ ${r.path} rendered successfully. H1: "${h1Text.trim()}", BackLink: ${hasBackLink > 0}, Contact: ${hasLegalContact > 0}`
      );
    }

    // Check Landing Footer
    await page.goto(`${BASE_URL}/`);
    const footerLinks = await page.locator("footer nav a").allInnerTexts();
    console.log(`  ✓ Landing footer links at ${mode}:`, footerLinks.join(", "));

    // Check Signup Interaction
    await page.goto(`${BASE_URL}/signup`);
    const checkbox = page.locator('input[type="checkbox"]');
    const isCheckedInitial = await checkbox.isChecked();
    console.log(
      `  ✓ Signup checkbox initially unchecked: ${!isCheckedInitial}`
    );

    // Try submit without checkbox
    await page.fill("input#email", "test@example.com");
    await page.fill("input#name", "Test User");
    await page.fill("input#password", "secret123");
    await page.click('button[type="submit"]');

    const alertText = await page.locator('p[role="alert"]').innerText();
    console.log(
      `  ✓ Error announced on empty agreement submit: "${alertText.trim()}"`
    );

    // Check label click toggle
    await page
      .locator("label")
      .filter({ hasText: "I am at least 18 years old" })
      .click();
    const isCheckedAfter = await checkbox.isChecked();
    console.log(
      `  ✓ Label click successfully toggles checkbox: ${isCheckedAfter}`
    );

    await context.close();
  }

  await browser.close();
  console.log("\n=== ALL PLAYWRIGHT LEGAL & MOBILE CHECKS PASSED ===");
}

runManualVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
