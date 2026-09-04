import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDirectory =
    process.env.RAILWAY_VOLUME_MOUNT_PATH ||
    path.resolve(__dirname, "../../data");

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, {
        recursive: true
    });
}

const databasePath =
    path.join(dataDirectory, "bot.sqlite");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");


// ==========================================
// USERS
// ==========================================

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    discord_id TEXT PRIMARY KEY,

    username TEXT NOT NULL,

    primary_role TEXT,

    secondary_role TEXT,

    registered_at TEXT,

    current_streak INTEGER DEFAULT 0,

    longest_streak INTEGER DEFAULT 0,

    last_completed_day TEXT
);
`);


// ==========================================
// DRILLS
// ==========================================

db.exec(`
CREATE TABLE IF NOT EXISTS drills (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    discord_id TEXT NOT NULL,

    day_key TEXT NOT NULL,

    role_type TEXT NOT NULL,

    gun_role TEXT NOT NULL,

    kills INTEGER NOT NULL,

    accuracy REAL NOT NULL,

    headshot_accuracy REAL NOT NULL,

    screenshot_url TEXT NOT NULL,

    screenshot_message_id TEXT,

    screenshot_channel_id TEXT,

    fingerprint TEXT NOT NULL UNIQUE,

    status TEXT NOT NULL DEFAULT 'PENDING',

    submitted_at TEXT NOT NULL,

    approved_at TEXT,

    approved_by TEXT,

    FOREIGN KEY(discord_id)
        REFERENCES users(discord_id)
);
`);


// ==========================================
// DAILY PROGRESS
// ==========================================

db.exec(`
CREATE TABLE IF NOT EXISTS daily_progress (

    discord_id TEXT NOT NULL,

    day_key TEXT NOT NULL,

    primary_count INTEGER DEFAULT 0,

    secondary_count INTEGER DEFAULT 0,

    total_count INTEGER DEFAULT 0,

    completed INTEGER DEFAULT 0,

    PRIMARY KEY(discord_id, day_key),

    FOREIGN KEY(discord_id)
        REFERENCES users(discord_id)
);
`);


// ==========================================
// LIFETIME DRILL STATISTICS ARCHIVE
// ==========================================
//
// This table preserves lifetime approved-drill totals
// when individual drill records become older than the
// one-year retention period.
//
// IMPORTANT:
// - Existing users are never deleted.
// - Existing drills are not changed when this table is created.
// - Existing statistics remain in the drills table until
//   the retention cleanup actually runs.
// - Archive rows are added only when old approved drills
//   are intentionally archived.
// ==========================================

db.exec(`
CREATE TABLE IF NOT EXISTS lifetime_drill_stats (

    discord_id TEXT PRIMARY KEY,

    approved_count INTEGER NOT NULL DEFAULT 0,

    total_kills REAL NOT NULL DEFAULT 0,

    total_accuracy REAL NOT NULL DEFAULT 0,

    total_headshot_accuracy REAL NOT NULL DEFAULT 0,

    last_archived_day TEXT,

    updated_at TEXT,

    FOREIGN KEY(discord_id)
        REFERENCES users(discord_id)
);
`);


// ==========================================
// INDEXES
// ==========================================

db.exec(`
CREATE INDEX IF NOT EXISTS
idx_drills_user
ON drills(discord_id);
`);

db.exec(`
CREATE INDEX IF NOT EXISTS
idx_drills_day
ON drills(day_key);
`);

db.exec(`
CREATE INDEX IF NOT EXISTS
idx_drills_status
ON drills(status);
`);

db.exec(`
CREATE INDEX IF NOT EXISTS
idx_drills_role
ON drills(role_type);
`);

db.exec(`
CREATE INDEX IF NOT EXISTS
idx_lifetime_stats_user
ON lifetime_drill_stats(discord_id);
`);

console.log("Database initialized successfully.");

export default db;
