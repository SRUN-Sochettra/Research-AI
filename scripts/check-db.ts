// scripts/check-db.ts  →  npx tsx --env-file=.env.local scripts/check-db.ts
import { createClient } from "@supabase/supabase-js";

const timeout = setTimeout(() => {
  console.error(
    "❌ Timed out after 8s — bad URL/key or network (campus wifi?)."
  );
  process.exit(1);
}, 8000);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { error } = await supabase.from("profiles").select("id").limit(1);
  clearTimeout(timeout);
  console.log(error ? `❌ ${error.message}` : "✅ Connection OK");
  process.exit(error ? 1 : 0);
}

main().catch((err) => {
  clearTimeout(timeout);
  console.error("❌", err);
  process.exit(1);
});
