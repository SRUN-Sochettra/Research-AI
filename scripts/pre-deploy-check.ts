#!/usr/bin/env tsx
/**
 * Pre-deployment checklist
 * Run: npx tsx scripts/pre-deploy-check.ts
 */

const REQUIRED_ENV_VARS = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GOOGLE_API_KEY",
    "NEXT_PUBLIC_APP_URL",
] as const;

const OPTIONAL_ENV_VARS = [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "LANGFUSE_PUBLIC_KEY",
    "LANGFUSE_SECRET_KEY",
] as const;

interface CheckResult {
    name: string;
    passed: boolean;
    message: string;
    critical: boolean;
}

function checkEnvVars(): CheckResult[] {
    const results: CheckResult[] = [];

    for (const varName of REQUIRED_ENV_VARS) {
        const value = process.env[varName];
        results.push({
            name: `ENV: ${varName}`,
            passed: !!value && value.length > 0,
            message: value
                ? `✓ Set (${value.slice(0, 8)}...)`
                : "✗ MISSING - Required!",
            critical: true,
        });
    }

    for (const varName of OPTIONAL_ENV_VARS) {
        const value = process.env[varName];
        results.push({
            name: `ENV: ${varName}`,
            passed: !!value,
            message: value
                ? `✓ Set`
                : "⚠ Not set (optional - feature disabled)",
            critical: false,
        });
    }

    return results;
}

function checkUrlFormat(): CheckResult[] {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    return [
        {
            name: "Supabase URL format",
            passed:
                !!supabaseUrl &&
                supabaseUrl.startsWith("https://") &&
                supabaseUrl.includes(".supabase.co"),
            message: supabaseUrl?.includes(".supabase.co")
                ? "✓ Valid Supabase URL"
                : "✗ Should be https://xxx.supabase.co",
            critical: true,
        },
        {
            name: "App URL format",
            passed:
                !!appUrl &&
                (appUrl.startsWith("https://") ||
                    appUrl.startsWith("http://localhost")),
            message: appUrl?.startsWith("https://")
                ? "✓ HTTPS URL"
                : "⚠ Should be HTTPS in production",
            critical: false,
        },
    ];
}

async function runChecks() {
    console.log("\n🔍 Pre-Deployment Checklist\n");
    console.log("=".repeat(50));

    const allChecks = [...checkEnvVars(), ...checkUrlFormat()];

    let criticalFailures = 0;
    let warnings = 0;

    for (const check of allChecks) {
        const icon = check.passed
            ? "✅"
            : check.critical
                ? "❌"
                : "⚠️ ";

        console.log(`${icon} ${check.name}`);
        console.log(`   ${check.message}`);

        if (!check.passed) {
            if (check.critical) criticalFailures++;
            else warnings++;
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`\nResults:`);
    console.log(`  Critical failures: ${criticalFailures}`);
    console.log(`  Warnings: ${warnings}`);
    console.log(
        `  Status: ${criticalFailures === 0
            ? "✅ READY TO DEPLOY"
            : "❌ FIX CRITICAL ISSUES FIRST"
        }\n`
    );

    if (criticalFailures > 0) {
        process.exit(1);
    }
}

runChecks().catch(console.error);