import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { sqlite } from "./Client.js";

const SQL_DIR = path.join(process.cwd(), "src", "database", "migrations");

function getMigrationVersion(fileName: string): number | null {
  const match = /^(\d+)_.*\.sql$/.exec(fileName);
  if (!match) return null;
  return parseInt(match[1], 10);
}

function ensureMigrationTable(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      version INTEGER NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
}

function getAppliedMigrationNames(): Set<string> {
  const rows = sqlite
    .prepare("SELECT name FROM schema_migrations")
    .all() as { name: string }[];

  return new Set(rows.map(r => r.name));
}

type MigrationFile = {
  fileName: string;
  version: number;
  fullPath: string;
};

function getMigrationFiles(): MigrationFile[] {
  if (!existsSync(SQL_DIR)) {
    throw new Error(`Migrations folder not found: ${SQL_DIR}`);
  }

  const files = readdirSync(SQL_DIR)
    .filter(f => f.endsWith(".sql"))
    .map(f => ({
      fileName: f,
      version: getMigrationVersion(f),
      fullPath: path.join(SQL_DIR, f),
    }))
    .filter((f): f is MigrationFile => f.version !== null);

  const versions = new Set<number>();
  for (const f of files) {
    if (versions.has(f.version)) {
      throw new Error(`Duplicate migration version: ${f.version}`);
    }
    versions.add(f.version);
  }

  files.sort((a, b) => {
    if (a.version !== b.version) return a.version - b.version;
    return a.fileName.localeCompare(b.fileName);
  });

  return files;
}

export function initializeDatabase(): void {
  mkdirSync("data", { recursive: true });

  ensureMigrationTable();

  const applied = getAppliedMigrationNames();
  const files = getMigrationFiles();
  const pending = files.filter(f => !applied.has(f.fileName));

  if (pending.length === 0) {
    console.log("No new migrations.");
    return;
  }

  const applyAll = sqlite.transaction(() => {
    const insert = sqlite.prepare(
      "INSERT INTO schema_migrations (name, version, applied_at) VALUES (?, ?, ?)",
    );

    for (const migration of pending) {
      const sql = readFileSync(migration.fullPath, "utf8");
      sqlite.exec(sql);
      insert.run(
        migration.fileName,
        migration.version,
        new Date().toISOString(),
      );
    }
  });

  applyAll();
  console.log(`${pending.length} migration(s) applied.`);
}
