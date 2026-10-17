const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

// Default Supabase connection for production deployment
const defaultSupabaseUrl = 'postgresql://postgres.plgjoszttkvitpqagxik:Jami%401811200@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres') || process.env.DATABASE_URL.includes('plgjoszttkvitpqagxik')) {
  process.env.DATABASE_URL = defaultSupabaseUrl;
}

// Check if PostgreSQL (Supabase) is configured
const isSupabase = process.env.DB_TYPE === 'sqlite' ? false : true;

let db;
let initDatabase;

if (isSupabase) {
  // ====================================================================
  // SUPABASE (POSTGRESQL) CLOUD DATABASE CLIENT
  // ====================================================================
  let connectionString = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '').trim();

  // If password contains unescaped special characters like '@' (e.g. postgres://user:pass@word@host:port/db)
  if (connectionString) {
    const atMatches = connectionString.match(/@/g);
    if (atMatches && atMatches.length > 1) {
      const lastAtIndex = connectionString.lastIndexOf('@');
      const protocolIndex = connectionString.indexOf('://');
      if (protocolIndex !== -1 && lastAtIndex > protocolIndex + 3) {
        const userInfo = connectionString.substring(protocolIndex + 3, lastAtIndex);
        const rest = connectionString.substring(lastAtIndex);
        const colonIndex = userInfo.indexOf(':');
        if (colonIndex !== -1) {
          const user = userInfo.substring(0, colonIndex);
          const rawPass = userInfo.substring(colonIndex + 1);
          const encodedPass = encodeURIComponent(decodeURIComponent(rawPass));
          connectionString = `${connectionString.substring(0, protocolIndex + 3)}${user}:${encodedPass}${rest}`;
        }
      }
    }
  }

  console.log('[Database] Connecting to Supabase (PostgreSQL) Cloud Database...');

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  // Convert SQLite "?" placeholders to PostgreSQL "$1, $2, $3..."
  function toPgSql(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  db = {
    isPostgres: true,
    raw: pool,

    async query(sql, params = []) {
      try {
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, params);
        return res.rows;
      } catch (err) {
        console.error(`[Supabase Query Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    async get(sql, params = []) {
      try {
        const pgSql = toPgSql(sql);
        const res = await pool.query(pgSql, params);
        return res.rows[0] || null;
      } catch (err) {
        console.error(`[Supabase Get Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    async run(sql, params = []) {
      try {
        let pgSql = toPgSql(sql);
        // Automatically append RETURNING * for INSERT statements if not present
        if (/^\s*insert\s+into\s+/i.test(sql) && !/returning/i.test(sql)) {
          pgSql += ' RETURNING *';
        }
        const res = await pool.query(pgSql, params);
        const insertedId = res.rows && res.rows.length > 0 && res.rows[0].id ? Number(res.rows[0].id) : 0;
        return {
          changes: res.rowCount,
          lastInsertRowid: insertedId
        };
      } catch (err) {
        console.error(`[Supabase Run Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    async exec(sql) {
      return pool.query(sql);
    }
  };

  initDatabase = async function() {
    try {
      console.log('[Database] Verifying Supabase connection...');
      const checkRes = await pool.query('SELECT 1 as connected');
      if (checkRes.rows.length > 0) {
        console.log('🌿 [Database] Connected successfully to Supabase (PostgreSQL)!');
      }

      // Check if users table exists, if not run supabase_schema.sql
      const usersTableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        ) as exists;
      `);
      if (!usersTableCheck.rows[0]?.exists) {
        console.log('[Database] Tables not found. Initializing PostgreSQL schema...');
        const possiblePgPaths = [
          path.resolve(__dirname, '../database/supabase_schema.sql'),
          path.resolve(__dirname, '../../database/supabase_schema.sql'),
          path.resolve(process.cwd(), 'database/supabase_schema.sql'),
          path.resolve(process.cwd(), 'supabase_schema.sql')
        ];
        for (const p of possiblePgPaths) {
          if (fs.existsSync(p)) {
            const sql = fs.readFileSync(p, 'utf8');
            await pool.query(sql);
            console.log('[Database] Initialized PostgreSQL schema from:', p);
            break;
          }
        }
      }

      // Ensure delivery tracking columns exist on orders table
      try {
        await pool.query(`
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(100) DEFAULT NULL;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100) DEFAULT 'India Post';
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500) DEFAULT NULL;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ DEFAULT NULL;
        `);
      } catch (err) {
        console.warn('[Orders Migration Warning]', err.message);
      }

      // Ensure default administrator exists
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vellanki.com').trim().toLowerCase();
      const adminCheck = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [adminEmail]);
      if (adminCheck.rows.length === 0) {
        const bcrypt = require('bcryptjs');
        const adminPass = process.env.ADMIN_PASSWORD || 'Admin@12345';
        const hash = bcrypt.hashSync(adminPass, 10);
        await pool.query(`
          INSERT INTO users (name, email, phone, password_hash, role, phone_verified, email_verified, status)
          VALUES ($1, $2, $3, $4, $5, 1, 1, 'active')
          ON CONFLICT (email) DO NOTHING
        `, ['Vellanki Admin', adminEmail, '+919876543210', hash, 'admin']);
        console.log('[Database] Seeded default administrator account in PostgreSQL:', adminEmail);
      }
    } catch (err) {
      console.error('❌ [Database] Failed to connect/initialize Supabase:', err.message);
    }
  };

} else {
  // ====================================================================
  // LOCAL SQLITE FALLBACK (Development & Offline Mode)
  // ====================================================================
  const { DatabaseSync } = require('node:sqlite');
  const bcrypt = require('bcryptjs');

  const dbDir = path.resolve(__dirname, '../../database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbFilePath = process.env.DB_FILE 
    ? path.resolve(__dirname, '../..', process.env.DB_FILE) 
    : path.join(dbDir, 'vellanki.db');

  console.log(`[Database] Connecting to local SQLite database at: ${dbFilePath}`);
  const sqlite = new DatabaseSync(dbFilePath);

  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  db = {
    isPostgres: false,
    raw: sqlite,

    query(sql, params = []) {
      try {
        const stmt = sqlite.prepare(sql);
        return stmt.all(...params);
      } catch (err) {
        console.error(`[SQLite Query Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    get(sql, params = []) {
      try {
        const stmt = sqlite.prepare(sql);
        return stmt.get(...params) || null;
      } catch (err) {
        console.error(`[SQLite Get Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    run(sql, params = []) {
      try {
        const stmt = sqlite.prepare(sql);
        const result = stmt.run(...params);
        return {
          changes: result.changes,
          lastInsertRowid: Number(result.lastInsertRowid)
        };
      } catch (err) {
        console.error(`[SQLite Run Error] SQL: ${sql}`, err);
        throw err;
      }
    },

    exec(sql) {
      return sqlite.exec(sql);
    }
  };

  initDatabase = function() {
    console.log('[Database] Initializing local SQLite tables...');
    const possibleSchemaPaths = [
      path.resolve(__dirname, '../database/schema.sql'),
      path.resolve(__dirname, '../../database/schema.sql'),
      path.resolve(__dirname, './schema.sql'),
      path.resolve(process.cwd(), 'database/schema.sql'),
      path.resolve(process.cwd(), 'schema.sql')
    ];
    for (const p of possibleSchemaPaths) {
      if (fs.existsSync(p)) {
        try {
          const schemaSql = fs.readFileSync(p, 'utf8');
          sqlite.exec(schemaSql);
          console.log('[Database] Loaded SQLite schema from:', p);
          break;
        } catch (err) {
          console.warn('[Database] Schema load error:', err.message);
        }
      }
    }

    // Ensure delivery tracking columns exist on orders table
    try {
      const columns = sqlite.prepare("PRAGMA table_info(orders)").all();
      const colNames = columns.map(c => c.name);
      if (!colNames.includes('tracking_id')) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN tracking_id VARCHAR(100) DEFAULT NULL;");
      }
      if (!colNames.includes('courier_name')) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN courier_name VARCHAR(100) DEFAULT 'India Post';");
      }
      if (!colNames.includes('tracking_url')) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN tracking_url VARCHAR(500) DEFAULT NULL;");
      }
      if (!colNames.includes('shipped_at')) {
        sqlite.exec("ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP DEFAULT NULL;");
      }
    } catch (e) {
      console.warn('[Migration Warning]', e.message);
    }

    // Ensure default administrator account exists
    try {
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vellanki.com').trim().toLowerCase();
      const existing = sqlite.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(adminEmail);
      if (!existing) {
        const adminPass = process.env.ADMIN_PASSWORD || 'Admin@12345';
        const hash = bcrypt.hashSync(adminPass, 10);
        sqlite.prepare(`
          INSERT INTO users (name, email, phone, password_hash, role, phone_verified, email_verified, status)
          VALUES (?, ?, ?, ?, ?, 1, 1, 'active')
        `).run('Vellanki Admin', adminEmail, '+919876543210', hash, 'admin');
        console.log('[Database] Seeded default administrator:', adminEmail);
      }
    } catch (err) {
      console.warn('[Admin Seed Warning]', err.message);
    }
  };
}

module.exports = {
  db,
  initDatabase,
  isSupabase
};
