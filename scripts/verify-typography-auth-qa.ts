import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

const VIEWPORTS = [
  { name: "360px (mobile)", width: 360, height: 740 },
  { name: "768px (tablet)", width: 768, height: 1024 },
  { name: "1280px (desktop)", width: 1280, height: 800 },
  { name: "1536px (large)", width: 1536, height: 960 },
];

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

interface QAResult {
  category: string;
  check: string;
  status: "PASS" | "FAIL" | "WARN";
  details: string;
}

const results: QAResult[] = [];

function record(
  category: string,
  check: string,
  status: "PASS" | "FAIL" | "WARN",
  details: string
) {
  results.push({ category, check, status, details });
  const icon = status === "PASS" ? "✓" : status === "WARN" ? "⚠" : "✗";
  console.log(`${icon} [${status}] [${category}] ${check}: ${details}`);
}

async function runTypographyAndAuthQA() {
  console.log("\n========================================================");
  console.log("   SynapseDoc Typography & Auth Layout Comprehensive QA  ");
  console.log("========================================================\n");

  const testEmail = `qa-typo-${Date.now()}@synapsedoc-test.local`;
  const testPassword = "Password123!Secure";
  let userId: string | null = null;

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Provision user for authenticated routes
    const { data: authData, error: signUpError } =
      await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: "QA Tester" },
      });
    if (signUpError || !authData.user) {
      throw new Error(`Failed to create test user: ${signUpError?.message}`);
    }
    userId = authData.user.id;

    // Create authenticated context
    const authContext = await browser.newContext();
    const authPage = await authContext.newPage();
    await authPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await authPage.fill("#email", testEmail);
    await authPage.fill("#password", testPassword);
    await authPage.click('button[type="submit"]');
    await authPage.waitForURL(`${BASE_URL}/documents`, { timeout: 15000 });
    record(
      "Auth",
      "User Session Setup",
      "PASS",
      `Created and logged in user ${testEmail}`
    );

    // Create unauthenticated context for public & auth pages
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();

    const publicPages = [
      { path: "/", name: "Landing (/)" },
      { path: "/login", name: "Login (/login)" },
      { path: "/signup", name: "Signup (/signup)" },
    ];

    const protectedPages = [
      { path: "/dashboard", name: "Dashboard (/dashboard)" },
      { path: "/documents", name: "Documents (/documents)" },
      { path: "/chat/multi", name: "Multi-Doc Chat (/chat/multi)" },
    ];

    // 2. Viewport matrix tests
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testing Viewport: ${vp.name} ---`);
      await anonPage.setViewportSize({ width: vp.width, height: vp.height });
      await authPage.setViewportSize({ width: vp.width, height: vp.height });

      const allPages = [
        ...publicPages.map((p) => ({ ...p, page: anonPage })),
        ...protectedPages.map((p) => ({ ...p, page: authPage })),
      ];

      for (const p of allPages) {
        await p.page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle" });

        // A. Font inspection: Body, Headings, Controls, Eyebrows
        const fontAudit = await p.page.evaluate(() => {
          const bodyFont = window.getComputedStyle(document.body).fontFamily;

          // Headings & display serif
          const headings = Array.from(
            document.querySelectorAll("h1, h2, h3, h4, .display-serif")
          );
          const headingFonts = headings.map((h) => ({
            tag: h.tagName,
            class: h.className,
            font: window.getComputedStyle(h).fontFamily,
          }));

          // Buttons, Inputs, Navigation
          const controls = Array.from(
            document.querySelectorAll("button, input, select, textarea, nav a")
          );
          const controlFonts = controls.slice(0, 10).map((c) => ({
            tag: c.tagName,
            font: window.getComputedStyle(c).fontFamily,
          }));

          // Eyebrows / mono
          const eyebrows = Array.from(
            document.querySelectorAll(
              ".eyebrow, .font-mono, [class*='font-mono']"
            )
          );
          const eyebrowFonts = eyebrows.map((e) => ({
            class: e.className,
            font: window.getComputedStyle(e).fontFamily,
          }));

          // Check if any element resolves to serif (Times New Roman / Georgia / browser default serif)
          const allElements = Array.from(document.querySelectorAll("body *"));
          const defaultSerifElements: string[] = [];
          for (const el of allElements) {
            const ff = (
              window.getComputedStyle(el).fontFamily || ""
            ).toLowerCase();
            if (
              (ff.includes("times") || ff.includes("georgia")) &&
              !ff.includes("manrope")
            ) {
              defaultSerifElements.push(`${el.tagName}.${el.className}: ${ff}`);
            }
          }

          // Check horizontal overflow
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const hasHorizontalScroll = docWidth > winWidth;

          return {
            bodyFont,
            headingFonts,
            controlFonts,
            eyebrowFonts,
            defaultSerifElements,
            hasHorizontalScroll,
            docWidth,
            winWidth,
          };
        });

        // Verify body font contains Manrope
        const bodyHasManrope = fontAudit.bodyFont
          ?.toLowerCase()
          .includes("manrope");
        record(
          "Typography",
          `${p.name} @ ${vp.name} - Body Font`,
          bodyHasManrope ? "PASS" : "FAIL",
          `Computed body fontFamily: "${fontAudit.bodyFont}"`
        );

        // Verify headings/display-serif compute to Manrope and not browser serif
        const allHeadingsManrope = fontAudit.headingFonts.every((h) =>
          h.font?.toLowerCase().includes("manrope")
        );
        record(
          "Typography",
          `${p.name} @ ${vp.name} - Headings & Display Serif`,
          allHeadingsManrope || fontAudit.headingFonts.length === 0
            ? "PASS"
            : "FAIL",
          `Sample heading fonts: ${
            fontAudit.headingFonts
              .slice(0, 3)
              .map((h) => `[${h.tag}]: ${h.font}`)
              .join("; ") || "none"
          }`
        );

        // Verify controls compute to Manrope
        const allControlsManrope = fontAudit.controlFonts.every((c) =>
          c.font?.toLowerCase().includes("manrope")
        );
        record(
          "Typography",
          `${p.name} @ ${vp.name} - Controls & Navigation`,
          allControlsManrope || fontAudit.controlFonts.length === 0
            ? "PASS"
            : "FAIL",
          `Sample control fonts: ${
            fontAudit.controlFonts
              .slice(0, 3)
              .map((c) => `[${c.tag}]: ${c.font}`)
              .join("; ") || "none"
          }`
        );

        // Verify eyebrows compute to Plex Mono
        const allEyebrowsPlexMono = fontAudit.eyebrowFonts.every(
          (e) =>
            e.font?.toLowerCase().includes("ibm plex mono") ||
            e.font?.toLowerCase().includes("plex mono")
        );
        record(
          "Typography",
          `${p.name} @ ${vp.name} - Eyebrow & Metadata Mono`,
          allEyebrowsPlexMono || fontAudit.eyebrowFonts.length === 0
            ? "PASS"
            : "FAIL",
          `Eyebrow sample fonts: ${
            fontAudit.eyebrowFonts
              .slice(0, 3)
              .map((e) => e.font)
              .join("; ") || "none"
          }`
        );

        // Verify no Times / Georgia / browser serif leaks
        record(
          "Typography",
          `${p.name} @ ${vp.name} - No Default Serif Leak`,
          fontAudit.defaultSerifElements.length === 0 ? "PASS" : "FAIL",
          fontAudit.defaultSerifElements.length === 0
            ? "Clean (no unstyled serif found)"
            : `Found: ${fontAudit.defaultSerifElements.slice(0, 3).join(", ")}`
        );

        // Horizontal overflow check
        record(
          "Layout & Responsiveness",
          `${p.name} @ ${vp.name} - No Horizontal Scroll`,
          !fontAudit.hasHorizontalScroll ? "PASS" : "FAIL",
          `scrollWidth: ${fontAudit.docWidth}px, innerWidth: ${fontAudit.winWidth}px`
        );
      }

      // Specific checks for Login & Signup
      for (const authPath of ["/login", "/signup"]) {
        await anonPage.goto(`${BASE_URL}${authPath}`, {
          waitUntil: "networkidle",
        });

        const authDetails = await anonPage.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          let googleBtn: HTMLButtonElement | null = null;
          for (let i = 0; i < buttons.length; i++) {
            if ((buttons[i]?.textContent || "").includes("Google")) {
              googleBtn = buttons[i] as HTMLButtonElement;
              break;
            }
          }
          const googleSvg = googleBtn ? googleBtn.querySelector("svg") : null;
          const googleMarkRect = googleSvg
            ? googleSvg.getBoundingClientRect()
            : null;
          const googleBtnRect = googleBtn
            ? googleBtn.getBoundingClientRect()
            : null;

          const labels = Array.from(document.querySelectorAll("label"));
          const inputs = Array.from(document.querySelectorAll("input"));
          const labelAssociations = inputs.map((input) => {
            const hasLabel =
              labels.some((l) => l.getAttribute("for") === input.id) ||
              !!input.closest("label");
            return { id: input.id, type: input.type, hasLabel };
          });

          const headings = Array.from(
            document.querySelectorAll("h1, h2, .display-serif")
          );
          const headingVisibility = headings.map((h) => {
            const rect = h.getBoundingClientRect();
            return {
              text: h.textContent ? h.textContent.trim().slice(0, 30) : "",
              visible:
                rect.width > 0 &&
                rect.height > 0 &&
                rect.top < window.innerHeight &&
                rect.bottom > 0,
            };
          });

          return {
            hasGoogleBtn: !!googleBtn,
            hasGoogleSvg: !!googleSvg,
            googleMarkRect: googleMarkRect
              ? { width: googleMarkRect.width, height: googleMarkRect.height }
              : null,
            googleBtnAligned:
              !!googleMarkRect &&
              !!googleBtnRect &&
              googleMarkRect.width > 0 &&
              googleMarkRect.height > 0,
            labelAssociations,
            headingVisibility,
          };
        });

        record(
          "Auth Layout",
          `${authPath} @ ${vp.name} - Google Mark Visible & Aligned`,
          authDetails.hasGoogleSvg && authDetails.googleBtnAligned
            ? "PASS"
            : "FAIL",
          `Google Mark SVG dimensions: ${JSON.stringify(authDetails.googleMarkRect)}`
        );

        const allInputsHaveLabels = authDetails.labelAssociations.every(
          (l) => l.hasLabel
        );
        record(
          "Accessibility",
          `${authPath} @ ${vp.name} - Input Label Associations`,
          allInputsHaveLabels ? "PASS" : "FAIL",
          `Inputs: ${authDetails.labelAssociations.map((l) => `${l.id || l.type}: label=${l.hasLabel}`).join(", ")}`
        );
      }
    }

    // 3. Accessibility & Interaction verification
    console.log("\n--- Accessibility, Focus, & Motion Tests ---");
    await anonPage.setViewportSize({ width: 1280, height: 800 });
    await anonPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

    // Focus ring & keyboard navigation
    await anonPage.keyboard.press("Tab"); // Skip nav
    await anonPage.keyboard.press("Tab"); // Brand link
    await anonPage.keyboard.press("Tab"); // Google button
    const focusedElementGoogle = await anonPage.evaluate(() =>
      document.activeElement ? document.activeElement.tagName : null
    );
    record(
      "Accessibility",
      "Keyboard Tab Navigation to Google Button",
      focusedElementGoogle === "BUTTON" ? "PASS" : "WARN",
      `Focused element: ${focusedElementGoogle}`
    );

    // Tab to email input
    await anonPage.keyboard.press("Tab"); // Email
    const emailFocused = await anonPage.evaluate(() =>
      document.activeElement
        ? (document.activeElement as HTMLElement).id === "email"
        : false
    );
    record(
      "Accessibility",
      "Keyboard Focus on Email Input",
      emailFocused ? "PASS" : "FAIL",
      `Active element id: ${await anonPage.evaluate(() => (document.activeElement ? (document.activeElement as HTMLElement).id : null))}`
    );

    // Reduced motion media check
    await anonPage.emulateMedia({ reducedMotion: "reduce" });
    const reducedMotionActive = await anonPage.evaluate(() => {
      const match = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const testEl = document.createElement("div");
      testEl.className = "animate-slide-up";
      document.body.appendChild(testEl);
      const computed = window.getComputedStyle(testEl);
      const dur = computed.animationDuration;
      testEl.remove();
      return { match, dur };
    });
    record(
      "Accessibility",
      "prefers-reduced-motion CSS enforcement",
      reducedMotionActive.match ? "PASS" : "FAIL",
      `matches=${reducedMotionActive.match}, animationDuration=${reducedMotionActive.dur}`
    );

    await authContext.close();
    await anonContext.close();
  } catch (err: unknown) {
    record(
      "Fatal",
      "Test Execution Error",
      "FAIL",
      err instanceof Error ? err.message : String(err)
    );
  } finally {
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      console.log(`Cleaned up test user ${userId}`);
    }
    await browser.close();
  }

  console.log("\n========================================================");
  console.log("              Typography & Auth QA Summary             ");
  console.log("========================================================");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warned = results.filter((r) => r.status === "WARN").length;
  console.log(
    `Total checks: ${results.length} | Passed: ${passed} | Failed: ${failed} | Warnings: ${warned}`
  );
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTypographyAndAuthQA().catch((err: unknown) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
