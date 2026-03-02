import { createClient } from '@libsql/client/web';

const url = (import.meta as any).env?.VITE_TURSO_DATABASE_URL || '';
const authToken = (import.meta as any).env?.VITE_TURSO_AUTH_TOKEN || '';

if (!url) {
    console.warn('⚠ VITE_TURSO_DATABASE_URL is not set.');
}

export const turso = createClient({ url, authToken });

// Initialize schema on first load
export async function initSchema() {
    const statements = [
        `CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      banner_image TEXT,
      logo TEXT,
      faculty_name TEXT,
      faculty_photo TEXT,
      faculty_role TEXT,
      theme_color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        `CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      club_id TEXT,
      club_name TEXT,
      date TEXT,
      report_url TEXT,
      photos TEXT DEFAULT '[]',
      video_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        `CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      participant_name TEXT,
      activity_id TEXT,
      activity_name TEXT,
      achievement TEXT,
      certificate_url TEXT,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        `CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      sender_name TEXT,
      is_global INTEGER DEFAULT 1,
      club_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        `CREATE TABLE IF NOT EXISTS career_items (
      id TEXT PRIMARY KEY,
      type TEXT,
      title TEXT NOT NULL,
      company TEXT,
      description TEXT,
      link TEXT,
      date TEXT,
      is_record INTEGER DEFAULT 0,
      student_name TEXT,
      package TEXT,
      student_photo TEXT,
      resume_url TEXT,
      linkedin_url TEXT,
      batch TEXT,
      quote TEXT,
      requirements TEXT,
      who_can_apply TEXT,
      posted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        `CREATE TABLE IF NOT EXISTS global_chat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name TEXT NOT NULL,
      sender_role TEXT,
      text TEXT NOT NULL,
      club_id TEXT,
      poll TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        `CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      image TEXT,
      club_id TEXT
    )`,
        `CREATE TABLE IF NOT EXISTS student_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_photo TEXT,
      topic TEXT,
      domain TEXT,
      rank TEXT,
      description TEXT,
      photos TEXT DEFAULT '[]',
      video_url TEXT,
      likes TEXT DEFAULT '[]',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        `CREATE TABLE IF NOT EXISTS post_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_name TEXT,
      text TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
    ];

    for (const sql of statements) {
        await turso.execute(sql);
    }
    console.log('✅ Turso schema initialized');
}
