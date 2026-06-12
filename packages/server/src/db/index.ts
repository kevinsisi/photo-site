import Database from 'better-sqlite3';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = process.env.DATA_DIR ?? './data';
const dbPath = path.join(dataDir, 'photo-site.db');

// Ensure data directory exists before opening the DB
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id),
      title TEXT NOT NULL DEFAULT '',
      filename TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      items TEXT NOT NULL DEFAULT '[]',
      price INTEGER NOT NULL,
      published INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('siteDisplayName', 'KEVIN PHOTOGRAPHY')`
  ).run();

  migratePhotoDimensions();
}

/**
 * Adds width/height columns to photos and backfills them from the original
 * files. Idempotent: column add is guarded by PRAGMA, backfill only touches
 * rows where width IS NULL. A missing/corrupt file logs a warning and the
 * row keeps NULL dimensions (the client falls back to a 3:2 ratio).
 */
function migratePhotoDimensions(): void {
  const columns = db.prepare(`PRAGMA table_info(photos)`).all() as Array<{
    name: string;
  }>;
  const names = new Set(columns.map((c) => c.name));
  if (!names.has('width')) {
    db.exec(`ALTER TABLE photos ADD COLUMN width INTEGER`);
  }
  if (!names.has('height')) {
    db.exec(`ALTER TABLE photos ADD COLUMN height INTEGER`);
  }

  const pending = db
    .prepare(`SELECT id, filename FROM photos WHERE width IS NULL OR height IS NULL`)
    .all() as Array<{ id: number; filename: string }>;
  if (pending.length === 0) return;

  const originalDir = path.join(
    process.env.DATA_DIR ?? './data',
    'photos',
    'original'
  );
  const update = db.prepare(
    `UPDATE photos SET width = ?, height = ? WHERE id = ?`
  );

  // Fire-and-forget: backfill runs async after startup, photos without
  // dimensions render with the client-side fallback ratio in the meantime.
  void (async () => {
    let done = 0;
    for (const row of pending) {
      try {
        const meta = await sharp(path.join(originalDir, row.filename)).metadata();
        if (meta.width && meta.height) {
          update.run(meta.width, meta.height, row.id);
          done++;
        } else {
          console.warn(`[backfill] no dimensions for photo ${row.id} (${row.filename})`);
        }
      } catch (err) {
        console.warn(`[backfill] failed for photo ${row.id} (${row.filename}):`, err);
      }
    }
    console.log(`[backfill] photo dimensions: ${done}/${pending.length} updated`);
  })();
}
