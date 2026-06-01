#!/usr/bin/env node
/**
 * Validates Clerk env before deploy. Loads .env if present (dotenv not required).
 *
 *   node scripts/check-clerk-env.mjs
 *   node scripts/check-clerk-env.mjs --production
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const production = process.argv.includes("--production");
const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const publishable = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").trim();
const secret = (process.env.CLERK_SECRET_KEY ?? "").trim();
const signIn = (process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "").trim();
const signUp = (process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "").trim();

const issues = [];
if (!publishable) issues.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing");
if (!secret) issues.push("CLERK_SECRET_KEY is missing");
if (production && publishable.startsWith("pk_test_")) {
  issues.push("Production requires pk_live_ (got pk_test_)");
}
if (production && secret.startsWith("sk_test_")) {
  issues.push("Production requires sk_live_ (got sk_test_)");
}
if (!signIn) issues.push("NEXT_PUBLIC_CLERK_SIGN_IN_URL is missing (use /login)");
if (!signUp) issues.push("NEXT_PUBLIC_CLERK_SIGN_UP_URL is missing (use /cadastro)");

if (issues.length) {
  console.error("Clerk env check failed:\n");
  for (const i of issues) console.error(`  - ${i}`);
  console.error("\nSee docs/clerk-production-deploy.md and .env.example");
  process.exit(1);
}

console.log("Clerk env OK", production ? "(production mode)" : "(development mode)");
