/**
 * One-time migration: Supabase Auth users → Clerk (bcrypt password import).
 *
 * Required env:
 * - DATABASE_URL
 * - CLERK_SECRET_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - NEXT_PUBLIC_SUPABASE_URL
 *
 * Usage:
 *   node scripts/migrate-users-to-clerk.mjs [--dry-run]
 */
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

const databaseUrl = required("DATABASE_URL");
const clerkSecret = required("CLERK_SECRET_KEY");
const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");

const sql = postgres(databaseUrl, { max: 1 });
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function createClerkUser(user) {
  const body = {
    external_id: user.id,
    email_address: [user.email],
    skip_password_checks: true,
    skip_password_requirement: false,
    password_hasher: "bcrypt",
    password_digest: user.encrypted_password,
  };

  if (dryRun) {
    console.log("[dry-run] would import", user.email, user.id);
    return { id: `dry_run_${user.id}` };
  }

  const res = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Clerk import failed for ${user.email}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of data.users) {
    if (!user.email || !user.encrypted_password) {
      skipped += 1;
      continue;
    }

    const existing = await sql`
      select clerk_id from profiles where id = ${user.id} limit 1
    `;
    if (existing[0]?.clerk_id) {
      skipped += 1;
      continue;
    }

    try {
      const clerkUser = await createClerkUser(user);
      if (!dryRun) {
        await sql`
          update profiles
          set clerk_id = ${clerkUser.id}, updated_at = now()
          where id = ${user.id}
        `;
      }
      migrated += 1;
      console.log("migrated", user.email, "→", clerkUser.id);
    } catch (e) {
      failed += 1;
      console.error(e instanceof Error ? e.message : e);
    }
  }

  console.log(JSON.stringify({ migrated, skipped, failed, dryRun }, null, 2));
  await sql.end({ timeout: 5 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
