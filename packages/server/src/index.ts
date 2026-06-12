import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { initDb } from './db/index.js';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { adminPhotosRouter } from './routes/adminPhotos.js';
import { adminCategoriesRouter } from './routes/adminCategories.js';
import { adminPlansRouter } from './routes/adminPlans.js';

function checkRequiredEnv(): void {
  const required = ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'SESSION_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `Missing required environment variable(s): ${missing.join(', ')}`
    );
    process.exit(1);
  }
}

checkRequiredEnv();
initDb();

export const app = express();

// Trust reverse proxy (Caddy / Docker)
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session store backed by SQLite so sessions survive restarts
const SQLiteStore = connectSqlite3(session);
const dataDir = process.env.DATA_DIR ?? './data';
fs.mkdirSync(dataDir, { recursive: true });

app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: dataDir,
    }) as session.Store,
    secret: process.env.SESSION_SECRET ?? '',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// --- Static photo files ---
const photosDir = path.join(dataDir, 'photos');
app.use('/photos/thumb', express.static(path.join(photosDir, 'thumb')));
app.use('/photos/medium', express.static(path.join(photosDir, 'medium')));
app.use('/photos/original', express.static(path.join(photosDir, 'original')));

// --- Public API ---
app.use('/api', publicRouter);

// --- Admin auth (no requireAuth on login itself) ---
app.use('/api/admin', authRouter);

// --- Admin management APIs ---
app.use('/api/admin/photos', adminPhotosRouter);
app.use('/api/admin/categories', adminCategoriesRouter);
app.use('/api/admin/plans', adminPlansRouter);

// --- Global error handler ---
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
);

const PORT = process.env.PORT ?? '3000';

app.listen(Number(PORT), () => {
  console.log(`Server listening on port ${PORT}`);
});
