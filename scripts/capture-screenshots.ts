import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.join(process.cwd(), "artifacts", "screenshots");

async function captureAllScreenshots() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const testEmail = `screenshot-qa-${Date.now()}@synapsedoc.local`;
  const testPassword = "TestPassword123!";

  console.log("1. Creating test user for authenticated screenshot captures...");
  const { data: userRecord } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });
  const userId = userRecord!.user!.id;

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "mobile-360", width: 360, height: 740 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "desktop-1280", width: 1280, height: 800 },
    { name: "large-1536", width: 1536, height: 960 },
  ];

  // 1. Public Pages (Light & Dark)
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    const publicRoutes = [
      { name: "landing", path: "/" },
      { name: "login", path: "/login" },
      { name: "signup", path: "/signup" },
      { name: "not-found", path: "/nonexistent-page-for-404" },
    ];

    for (const route of publicRoutes) {
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle" });
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${route.name}-${vp.name}-light.png`),
        fullPage: true,
      });

      // Toggle dark mode
      await page.emulateMedia({ colorScheme: "dark" });
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${route.name}-${vp.name}-dark.png`),
        fullPage: true,
      });
      await page.emulateMedia({ colorScheme: "light" });
    }
    await context.close();
  }

  // 2. Authenticated Pages
  const authContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const authPage = await authContext.newPage();
  await authPage.goto(`${BASE_URL}/login`);
  await authPage.fill("input[type='email']", testEmail);
  await authPage.fill("input[type='password']", testPassword);
  await authPage.click("button[type='submit']");
  await authPage.waitForURL("**/documents**", { timeout: 15000 });

  const authRoutes = [
    { name: "dashboard", path: "/dashboard" },
    { name: "documents-empty", path: "/documents" },
    { name: "compare", path: "/compare" },
    { name: "settings", path: "/settings" },
    { name: "chat-multi", path: "/chat/multi" },
  ];

  for (const route of authRoutes) {
    await authPage.goto(`${BASE_URL}${route.path}`, {
      waitUntil: "networkidle",
    });
    await authPage.screenshot({
      path: path.join(SCREENSHOT_DIR, `${route.name}-desktop-light.png`),
      fullPage: true,
    });
  }

  await authContext.close();
  await browser.close();

  console.log("3. Cleaning up test user...");
  await adminClient.auth.admin.deleteUser(userId);
  console.log(`✓ Screenshots saved to ${SCREENSHOT_DIR}`);
}

captureAllScreenshots().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
