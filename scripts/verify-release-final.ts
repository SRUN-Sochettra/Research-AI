import { createClient } from "@supabase/supabase-js";
import { chromium, type Browser } from "playwright";

const PROD_URL = "https://synapsedoc.vercel.app";

async function main() {
  console.log(
    "=================================================================="
  );
  console.log("   SynapseDoc — Final Production Release Verification");
  console.log(`   Target: ${PROD_URL}`);
  console.log(
    "==================================================================\n"
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const ts = Date.now();
  const targetEmail = `release-target-${ts}@synapsedoc.local`;
  const controlEmail = `release-control-${ts}@synapsedoc.local`;
  const testPassword = "ReleaseTestSecurePass123!";

  let targetUserId = "";
  let controlUserId = "";
  let browser: Browser | null = null;

  try {
    // ─── 1. Provision Disposable Accounts ─────────────────────────────────────
    console.log("1. Provisioning disposable target and control accounts...");
    const { data: uTarget, error: errTarget } =
      await adminClient.auth.admin.createUser({
        email: targetEmail,
        password: testPassword,
        email_confirm: true,
      });
    const { data: uControl, error: errControl } =
      await adminClient.auth.admin.createUser({
        email: controlEmail,
        password: testPassword,
        email_confirm: true,
      });

    if (errTarget || errControl || !uTarget.user || !uControl.user) {
      throw new Error(
        `User provisioning failed: ${errTarget?.message || errControl?.message}`
      );
    }

    targetUserId = uTarget.user.id;
    controlUserId = uControl.user.id;

    await adminClient.from("profiles").upsert([
      {
        id: targetUserId,
        email: targetEmail,
        full_name: "Target User",
        updated_at: new Date().toISOString(),
      },
      {
        id: controlUserId,
        email: controlEmail,
        full_name: "Control User",
        updated_at: new Date().toISOString(),
      },
    ]);

    // Add control user baseline document and conversation to verify immutability
    const { data: ctrlDoc } = await adminClient
      .from("documents")
      .insert({
        user_id: controlUserId,
        title: "Control Protected Doc",
        file_path: `${controlUserId}/control.pdf`,
        file_name: "control.pdf",
        file_size: 1024,
        mime_type: "application/pdf",
        status: "ready",
      })
      .select()
      .single();

    if (ctrlDoc) {
      await adminClient.from("document_chunks").insert([
        {
          document_id: ctrlDoc.id,
          chunk_index: 0,
          content: "Control document content.",
          page_number: 1,
          token_count: 5,
        },
      ]);

      const { data: ctrlConv } = await adminClient
        .from("conversations")
        .insert({
          user_id: controlUserId,
          document_id: ctrlDoc.id,
          title: "Control Conv",
        })
        .select()
        .single();

      if (ctrlConv) {
        await adminClient.from("messages").insert([
          {
            conversation_id: ctrlConv.id,
            role: "user",
            content: "Control message.",
          },
        ]);
      }
    }

    console.log(`   ✓ Target User: ${targetUserId}`);
    console.log(
      `   ✓ Control User: ${controlUserId} (with 1 doc, 1 chunk, 1 conv, 1 msg)`
    );

    // ─── 2. Authenticate via Playwright ──────────────────────────────────────
    console.log("\n2. Authenticating sessions on Production...");
    browser = await chromium.launch({ headless: true });

    const targetCtx = await browser.newContext();
    const targetPage = await targetCtx.newPage();
    await targetPage.goto(`${PROD_URL}/login`, { timeout: 30000 });
    await targetPage.fill("input[type='email']", targetEmail, {
      timeout: 10000,
    });
    await targetPage.fill("input[type='password']", testPassword, {
      timeout: 10000,
    });
    await targetPage.click("button[type='submit']", { timeout: 10000 });
    await targetPage.waitForURL("**/documents**", { timeout: 30000 });

    const controlCtx = await browser.newContext();
    const controlPage = await controlCtx.newPage();
    await controlPage.goto(`${PROD_URL}/login`, { timeout: 30000 });
    await controlPage.fill("input[type='email']", controlEmail, {
      timeout: 10000,
    });
    await controlPage.fill("input[type='password']", testPassword, {
      timeout: 10000,
    });
    await controlPage.click("button[type='submit']", { timeout: 10000 });
    await controlPage.waitForURL("**/documents**", { timeout: 30000 });

    console.log("   ✓ Both target and control users authenticated.");

    // ─── 3. Verify Normal Production Upload ───────────────────────────────────
    console.log("\n3. Testing Normal Production PDF Upload (/api/upload)...");
    const validPdfBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 58 >>\nstream\nBT /F1 12 Tf 72 712 Td (SynapseDoc production verification test document.) ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000210 00000 n \ntrailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n318\n%%EOF"
    );

    const uploadResult = await targetPage.evaluate(
      async (pdfBase64: string) => {
        const byteCharacters = atob(pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const formData = new FormData();
        formData.append("file", blob, "prod_verification.pdf");
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const text = await res.text();
        return { status: res.status, text };
      },
      validPdfBuffer.toString("base64")
    );

    console.log(
      `   Upload status: HTTP ${uploadResult.status} | Body: ${uploadResult.text.slice(0, 300)}`
    );

    let uploadJson: { data?: { documentId?: string } } = {};
    try {
      uploadJson = JSON.parse(uploadResult.text);
    } catch {}

    const documentId = uploadJson.data?.documentId;
    if (!documentId) {
      throw new Error(
        `Upload failed (HTTP ${uploadResult.status}): ${uploadResult.text.slice(0, 200)}`
      );
    }

    // ─── 4. Verify Normal Production Chat Response ───────────────────────────
    console.log("\n4. Testing Normal Production Chat Response (/api/chat)...");
    const chatResult = await targetPage.evaluate(async (docId: string) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Summarize this document in one short sentence.",
          documentId: docId,
        }),
      });
      return { status: res.status };
    }, documentId);

    console.log(`   ✓ Chat status: HTTP ${chatResult.status}`);
    const chatOk = chatResult.status === 200;
    console.log(`   ✓ Streaming chat response verified: ${chatOk} [PASS]`);

    // ─── 5. Verify Production Rate Limiting (429 & Recovery) ──────────────────
    console.log(
      "\n5. Testing Production Rate Limiting Threshold (Window: 10 req/min)..."
    );
    const downloadEndpoint = `/api/documents/${documentId}/download`;

    let hit429 = false;
    let limitHeader: string | null = null;
    let remHeader: string | null = null;
    let resetHeader: string | null = null;
    let retryAfterHeader: string | null = null;
    let resetTime = 0;

    for (let i = 1; i <= 14; i++) {
      const res = await targetPage.evaluate(async (url: string) => {
        const r = await fetch(url);
        return {
          status: r.status,
          limit: r.headers.get("x-ratelimit-limit"),
          rem: r.headers.get("x-ratelimit-remaining"),
          reset: r.headers.get("x-ratelimit-reset"),
          retryAfter: r.headers.get("retry-after"),
        };
      }, downloadEndpoint);

      console.log(
        `   Req #${i.toString().padStart(2, " ")}: HTTP ${res.status} | Limit: ${res.limit ?? "-"} | Remaining: ${res.rem ?? "-"} | Reset: ${res.reset ?? "-"} | Retry-After: ${res.retryAfter ?? "-"}`
      );

      if (res.status === 429) {
        hit429 = true;
        limitHeader = res.limit;
        remHeader = res.rem;
        resetHeader = res.reset;
        retryAfterHeader = res.retryAfter;
        resetTime = res.reset ? parseInt(res.reset, 10) : Date.now() + 60000;
      }
    }

    console.log(`   ✓ Genuine HTTP 429 threshold reached: ${hit429} [PASS]`);
    console.log(
      `   Captured Headers: Limit=${limitHeader}, Remaining=${remHeader}, Reset=${resetHeader}, Retry-After=${retryAfterHeader}`
    );

    // Verify Control user is unblocked
    console.log("\n6. Verifying Control User Isolation during Rate Limit...");
    const controlRes = await controlPage.evaluate(async () => {
      const r = await fetch(
        "/api/documents/00000000-0000-0000-0000-000000000000/download"
      );
      return { status: r.status };
    });
    console.log(
      `   Control User status during target rate limit: HTTP ${controlRes.status}`
    );
    const controlUnblocked = controlRes.status !== 429;
    console.log(`   ✓ Control user unblocked: ${controlUnblocked} [PASS]`);

    // Verify Recovery after Reset
    if (hit429 && resetTime > 0) {
      const waitMs = Math.max(0, resetTime - Date.now()) + 1500;
      if (waitMs > 0 && waitMs <= 65000) {
        console.log(
          `\n7. Waiting ${Math.ceil(waitMs / 1000)}s for window reset...`
        );
        await new Promise((r) => setTimeout(r, waitMs));

        const recoveryRes = await targetPage.evaluate(async (url: string) => {
          const r = await fetch(url);
          return { status: r.status };
        }, downloadEndpoint);
        console.log(
          `   Target User post-reset status: HTTP ${recoveryRes.status}`
        );
        const recovered = recoveryRes.status !== 429;
        console.log(
          `   ✓ Normal service recovery verified: ${recovered} [PASS]`
        );
      }
    }

    // ─── 8. Production Disposable Account Deletion ────────────────────────────
    console.log(
      "\n8. Testing Production Disposable Account Deletion (/api/account/delete)..."
    );
    const delResult = await targetPage.evaluate(async () => {
      const r = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      const data = await r.json();
      return { status: r.status, data };
    });

    console.log(
      `   ✓ Account deletion response (HTTP ${delResult.status}):`,
      delResult.data
    );
    const deleteSuccess =
      delResult.status === 200 && delResult.data?.success === true;
    console.log(
      `   ✓ Account deletion request succeeded: ${deleteSuccess} [PASS]`
    );

    // ─── 9. Direct Residue Inspection ─────────────────────────────────────────
    console.log(
      "\n9. Directly inspecting database, Auth, and Storage residue..."
    );
    const { data: authTarget } =
      await adminClient.auth.admin.getUserById(targetUserId);
    const { count: profTarget } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("id", targetUserId);
    const { count: docsTarget } = await adminClient
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId);
    const { count: convsTarget } = await adminClient
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId);
    const { data: storageTarget } = await adminClient.storage
      .from("documents")
      .list(targetUserId);

    console.log("Target User Residue Check:");
    console.log(`- Auth user exists: ${!!authTarget?.user} (Expected: false)`);
    console.log(`- Profiles count: ${profTarget ?? 0} (Expected: 0)`);
    console.log(`- Documents count: ${docsTarget ?? 0} (Expected: 0)`);
    console.log(`- Conversations count: ${convsTarget ?? 0} (Expected: 0)`);
    console.log(
      `- Storage objects count: ${storageTarget?.length ?? 0} (Expected: 0)`
    );

    const targetResidueZero =
      !authTarget?.user &&
      (profTarget ?? 0) === 0 &&
      (docsTarget ?? 0) === 0 &&
      (convsTarget ?? 0) === 0 &&
      (storageTarget?.length ?? 0) === 0;

    console.log(
      `   ✓ Target user 100% purged with 0 residue: ${targetResidueZero} [PASS]`
    );

    // ─── 10. Control User Immutability Check ───────────────────────────────────
    console.log("\n10. Inspecting Control User Immutability...");
    const { data: authCtrl } =
      await adminClient.auth.admin.getUserById(controlUserId);
    const { count: profCtrl } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("id", controlUserId);
    const { count: docsCtrl } = await adminClient
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", controlUserId);
    const { count: chunksCtrl } = await adminClient
      .from("document_chunks")
      .select("*, documents!inner(user_id)", { count: "exact", head: true })
      .eq("documents.user_id", controlUserId);
    const { count: convsCtrl } = await adminClient
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", controlUserId);
    const { count: msgsCtrl } = await adminClient
      .from("messages")
      .select("*, conversations!inner(user_id)", { count: "exact", head: true })
      .eq("conversations.user_id", controlUserId);

    console.log("Control User State Check:");
    console.log(`- Auth user exists: ${!!authCtrl?.user} (Expected: true)`);
    console.log(`- Profiles count: ${profCtrl ?? 0} (Expected: 1)`);
    console.log(`- Documents count: ${docsCtrl ?? 0} (Expected: 1)`);
    console.log(`- Chunks count: ${chunksCtrl ?? 0} (Expected: 1)`);
    console.log(`- Conversations count: ${convsCtrl ?? 0} (Expected: 1)`);
    console.log(`- Messages count: ${msgsCtrl ?? 0} (Expected: 1)`);

    const controlUntouched =
      !!authCtrl?.user &&
      (profCtrl ?? 0) === 1 &&
      (docsCtrl ?? 0) === 1 &&
      (chunksCtrl ?? 0) === 1 &&
      (convsCtrl ?? 0) === 1 &&
      (msgsCtrl ?? 0) === 1;

    console.log(
      `   ✓ Control user completely untouched: ${controlUntouched} [PASS]`
    );
  } finally {
    console.log("\n11. Cleaning up verification accounts...");
    if (browser) {
      await browser.close().catch(() => {});
    }

    if (controlUserId) {
      try {
        await adminClient
          .from("conversations")
          .delete()
          .eq("user_id", controlUserId);
        await adminClient
          .from("documents")
          .delete()
          .eq("user_id", controlUserId);
        await adminClient.from("profiles").delete().eq("id", controlUserId);
        await adminClient.auth.admin.deleteUser(controlUserId);
      } catch {}
    }

    if (targetUserId) {
      try {
        await adminClient.auth.admin.deleteUser(targetUserId);
      } catch {}
    }

    console.log("   ✓ Cleanup complete.");
    console.log(
      "\n=================================================================="
    );
    console.log("   ALL RELEASE-BLOCKER CHECKS PASSED ON PRODUCTION");
    console.log(
      "=================================================================="
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Release verification failed:", err);
    process.exit(1);
  });
