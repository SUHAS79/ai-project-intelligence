/**
 * scripts/debug-turso.ts
 *
 * Diagnoses why @libsql/client execute() returns HTTP 400.
 * Tests three independent approaches against your Turso database:
 *   1. @libsql/client execute()       — what the migration script uses
 *   2. @libsql/client batch()         — alternative within the library
 *   3. Raw fetch → Turso /v2/pipeline — bypasses the library entirely
 *
 * Run: npx tsx scripts/debug-turso.ts
 */

import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL!;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

console.log("\n🔍  Turso Connection Debug");
console.log(`    URL:   ${url}`);
console.log(`    Token: ${authToken ? authToken.slice(0, 12) + "..." : "(not set)"}`);
console.log(`    Token length: ${authToken?.length ?? 0} chars`);
console.log(`    Token looks like JWT: ${authToken?.startsWith("eyJ") ? "✅ yes" : "❌ no — may be malformed"}\n`);

const SIMPLE_SQL   = "SELECT 1 AS test";
const SIMPLE_DDL   = "CREATE TABLE IF NOT EXISTS _debug_test (id TEXT NOT NULL PRIMARY KEY)";
const DROP_TEST    = "DROP TABLE IF EXISTS _debug_test";
const FULL_PROJECT = `CREATE TABLE IF NOT EXISTS "_DebugProject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
)`;

// ── 1. @libsql/client execute() ────────────────────────────────────────────
async function testLibsqlExecute() {
  console.log("── Test 1: @libsql/client execute() ──────────────────────────");
  const client = createClient({ url, authToken });
  try {
    const r = await client.execute(SIMPLE_SQL);
    console.log(`  SELECT 1: ✅  rows=${JSON.stringify(r.rows)}`);
  } catch (e: any) {
    console.log(`  SELECT 1: ❌  ${e.message}`);
  }
  try {
    await client.execute(SIMPLE_DDL);
    console.log(`  CREATE TABLE _debug_test: ✅`);
    await client.execute(DROP_TEST);
  } catch (e: any) {
    console.log(`  CREATE TABLE _debug_test: ❌  ${e.message}`);
  }
  try {
    await client.execute(FULL_PROJECT);
    console.log(`  CREATE TABLE _DebugProject (DATETIME cols): ✅`);
    await client.execute('DROP TABLE IF EXISTS "_DebugProject"');
  } catch (e: any) {
    console.log(`  CREATE TABLE _DebugProject (DATETIME cols): ❌  ${e.message}`);
  }
  await client.close();
  console.log();
}

// ── 2. @libsql/client batch() ──────────────────────────────────────────────
async function testLibsqlBatch() {
  console.log("── Test 2: @libsql/client batch() ────────────────────────────");
  const client = createClient({ url, authToken });
  try {
    await client.batch([
      { sql: SIMPLE_DDL, args: [] },
      { sql: DROP_TEST,  args: [] },
    ], "write");
    console.log("  batch CREATE + DROP: ✅");
  } catch (e: any) {
    console.log(`  batch CREATE + DROP: ❌  ${e.message}`);
  }
  await client.close();
  console.log();
}

// ── 3. Raw fetch → /v2/pipeline ────────────────────────────────────────────
async function testRawFetch() {
  console.log("── Test 3: raw fetch → /v2/pipeline ──────────────────────────");
  // Convert libsql:// → https://  (Turso REST endpoint)
  const host = url.replace(/^libsql:\/\//, "").replace(/^https?:\/\//, "");
  const endpoint = `https://${host}/v2/pipeline`;

  async function rawExec(sql: string, label: string) {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql } },
          { type: "close" },
        ],
      }),
    });
    const body = await resp.json().catch(() => ({}));
    const resultType = body?.results?.[0]?.type;
    const errMsg     = body?.results?.[0]?.error?.message ?? JSON.stringify(body);
    if (resp.ok && resultType !== "error") {
      console.log(`  ${label}: ✅  HTTP ${resp.status}`);
      return true;
    } else {
      console.log(`  ${label}: ❌  HTTP ${resp.status} — ${errMsg}`);
      return false;
    }
  }

  await rawExec(SIMPLE_SQL, "SELECT 1");
  const ok = await rawExec(SIMPLE_DDL, "CREATE TABLE _debug_test");
  if (ok) await rawExec(DROP_TEST, "DROP TABLE _debug_test");
  const ok2 = await rawExec(FULL_PROJECT, "CREATE TABLE _DebugProject (DATETIME cols)");
  if (ok2) await rawExec('DROP TABLE IF EXISTS "_DebugProject"', "DROP TABLE _DebugProject");
  console.log();
}

(async () => {
  await testLibsqlExecute();
  await testLibsqlBatch();
  await testRawFetch();
  console.log("🔍  Debug complete. Paste ALL output above to your assistant.");
})();
