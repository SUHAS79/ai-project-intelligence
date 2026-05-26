/**
 * scripts/turso-migrate.ts
 *
 * Applies all Prisma migration SQL files to a Turso (libsql) database.
 * Bypasses Prisma's migration engine (Quaint), which doesn't support libsql://.
 *
 * Usage:
 *   npx tsx scripts/turso-migrate.ts
 *
 * Requires DATABASE_URL and DATABASE_AUTH_TOKEN in .env (or environment).
 */

import "dotenv/config";
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  console.error("❌  DATABASE_URL is not set in .env");
  process.exit(1);
}

if (!url.startsWith("libsql://") && !url.startsWith("https://")) {
  console.warn(
    `⚠️  DATABASE_URL is "${url}" — this script is intended for Turso (libsql://).`
  );
  console.warn("   For local SQLite use: npx prisma migrate dev");
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

// Read all migration folders sorted chronologically (timestamp prefix guarantees order)
const migrationFolders = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("."))
  .map((d) => d.name)
  .sort();

/**
 * Parse a migration SQL file into individual executable statements.
 *
 * Strategy:
 *  1. Split on semicolons — each piece is one statement (no semicolons inside DDL bodies)
 *  2. Strip comment lines (-- ...) from every piece
 *  3. Trim whitespace; discard empty results
 *  4. Skip PRAGMA statements — Turso's HTTP API rejects them.
 *     The PRAGMA foreign_keys=OFF/ON guards around table-rebuild blocks are safe to
 *     omit on a fresh database because there is no existing data to violate FK constraints.
 */
function parseStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter((s) => s.length > 0)
    // Skip all PRAGMA statements — unsupported by Turso HTTP API
    .filter((s) => !/^PRAGMA\s/i.test(s));
}

async function applyMigration(folder: string): Promise<void> {
  const sqlPath = path.join(migrationsDir, folder, "migration.sql");
  if (!fs.existsSync(sqlPath)) {
    console.log(`  ⏭  Skipping ${folder} (no migration.sql)`);
    return;
  }

  const sql = fs.readFileSync(sqlPath, "utf-8");
  const statements = parseStatements(sql);

  console.log(
    `  📄  ${folder} — ${statements.length} statement${statements.length !== 1 ? "s" : ""}`
  );

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ";";
    try {
      await client.execute(stmt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // Idempotency: skip statements that have already been applied
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate column name")
      ) {
        console.log(
          `    ⏩  [${i + 1}/${statements.length}] already applied — skipping`
        );
        continue;
      }

      console.error(`    ❌  [${i + 1}/${statements.length}] FAILED:`);
      console.error(`       Statement: ${stmt.slice(0, 200)}`);
      console.error(`       Error:     ${msg}`);
      throw err;
    }
  }

  console.log(`    ✅  Done`);
}

async function main() {
  console.log(`\n🚀  Turso Migration Script`);
  console.log(`    Database: ${url}`);
  console.log(`    Migrations: ${migrationFolders.length} found\n`);

  for (const folder of migrationFolders) {
    await applyMigration(folder);
  }

  console.log(`\n✨  All migrations applied successfully.\n`);
  await client.close();
}

main().catch((err) => {
  console.error("\n❌  Migration failed:", err);
  process.exit(1);
});
