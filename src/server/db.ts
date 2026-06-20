import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

let database: Database.Database | null = null;

function resolveDatabaseFile() {
  const configured = process.env.DATABASE_FILE || "./data/portal.db";
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), configured);
}

export function getDatabase() {
  if (database) {
    return database;
  }

  const databaseFile = resolveDatabaseFile();
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

  database = new Database(databaseFile);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  return database;
}

export function initializeDatabase() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      discipline TEXT NOT NULL,
      mtype TEXT NOT NULL,
      year TEXT NOT NULL,
      language TEXT NOT NULL,
      status TEXT NOT NULL,
      access TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      desc TEXT NOT NULL,
      course TEXT NOT NULL,
      file_path TEXT,
      preview_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      attachments_json TEXT DEFAULT '[]',
      related_topic_ids_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS publications (
      id TEXT PRIMARY KEY,
      year TEXT NOT NULL,
      authors TEXT NOT NULL,
      title TEXT NOT NULL,
      ptype TEXT NOT NULL,
      journal TEXT NOT NULL,
      doi TEXT NOT NULL,
      external_url TEXT NOT NULL,
      pdf_path TEXT,
      pdf_public INTEGER NOT NULL DEFAULT 1,
      summary TEXT NOT NULL,
      topic TEXT NOT NULL,
      region TEXT NOT NULL,
      age TEXT NOT NULL,
      keywords_json TEXT NOT NULL,
      language TEXT NOT NULL,
      featured INTEGER NOT NULL,
      access TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      attachments_json TEXT DEFAULT '[]',
      related_topic_ids_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      year TEXT NOT NULL,
      image_path TEXT,
      location TEXT NOT NULL,
      region TEXT NOT NULL,
      otype TEXT NOT NULL,
      age TEXT NOT NULL,
      desc TEXT NOT NULL,
      author TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      usage_policy TEXT NOT NULL,
      group_name TEXT NOT NULL,
      access TEXT NOT NULL,
      status TEXT NOT NULL,
      related_publication_ids_json TEXT NOT NULL,
      related_topic_ids_json TEXT NOT NULL,
      tint TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      age TEXT NOT NULL,
      desc TEXT NOT NULL,
      body TEXT NOT NULL,
      cover_path TEXT,
      keywords_json TEXT NOT NULL,
      access TEXT NOT NULL,
      related_publication_ids_json TEXT NOT NULL,
      related_photo_ids_json TEXT NOT NULL,
      related_archive_ids_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      attachments_json TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS archive_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      atype TEXT NOT NULL,
      desc TEXT NOT NULL,
      file_path TEXT,
      year TEXT NOT NULL,
      region TEXT NOT NULL,
      topic TEXT NOT NULL,
      owner_comment TEXT NOT NULL,
      access TEXT NOT NULL,
      status_label TEXT NOT NULL,
      related_publication_ids_json TEXT NOT NULL,
      related_photo_ids_json TEXT NOT NULL,
      dot TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      attachments_json TEXT DEFAULT '[]',
      related_topic_ids_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS library_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      year TEXT NOT NULL,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      pdf_path TEXT,
      notes TEXT NOT NULL,
      access TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      related_topic_ids_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS pages (
      slug TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ui_text (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      ts TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_page_views_ts ON page_views (ts);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS map_places (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      desc TEXT NOT NULL DEFAULT '',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      year TEXT NOT NULL DEFAULT '',
      year_end TEXT NOT NULL DEFAULT '',
      era TEXT NOT NULL DEFAULT 'modern',
      region TEXT NOT NULL DEFAULT '',
      cover_path TEXT,
      related_publication_ids_json TEXT NOT NULL DEFAULT '[]',
      related_photo_ids_json TEXT NOT NULL DEFAULT '[]',
      related_material_ids_json TEXT NOT NULL DEFAULT '[]',
      related_topic_ids_json TEXT NOT NULL DEFAULT '[]',
      related_archive_ids_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try {
    db.exec("ALTER TABLE publications ADD COLUMN attachments_json TEXT DEFAULT '[]'");
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    db.exec("ALTER TABLE publications ADD COLUMN pdf_public INTEGER NOT NULL DEFAULT 1");
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    db.exec("ALTER TABLE materials ADD COLUMN attachments_json TEXT DEFAULT '[]'");
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    db.exec("ALTER TABLE archive_items ADD COLUMN attachments_json TEXT DEFAULT '[]'");
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    db.exec("ALTER TABLE topics ADD COLUMN attachments_json TEXT DEFAULT '[]'");
  } catch (e) {
    // Column already exists, ignore error
  }

  for (const table of ["materials", "publications", "archive_items", "library_items"]) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN related_topic_ids_json TEXT NOT NULL DEFAULT '[]'`);
    } catch {
      // Column already exists.
    }
  }

  return db;
}

export function closeDatabase() {
  if (!database) {
    return;
  }

  database.close();
  database = null;
}

export function getDatabaseFilePath() {
  return resolveDatabaseFile();
}
