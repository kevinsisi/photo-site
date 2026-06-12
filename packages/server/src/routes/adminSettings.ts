import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAuth);

function getSettings(): { siteDisplayName: string } {
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('siteDisplayName') as { value: string } | undefined;
  return { siteDisplayName: row?.value ?? 'KEVIN PHOTOGRAPHY' };
}

adminSettingsRouter.get('/', (_req, res) => {
  res.json(getSettings());
});

adminSettingsRouter.put('/', (req, res) => {
  const { siteDisplayName } = req.body as { siteDisplayName?: unknown };

  if (typeof siteDisplayName !== 'string') {
    res.status(400).json({ error: 'siteDisplayName must be a string' });
    return;
  }

  const normalizedName = siteDisplayName.trim();
  if (normalizedName.length === 0 || normalizedName.length > 80) {
    res.status(400).json({ error: 'siteDisplayName must be 1-80 characters' });
    return;
  }

  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('siteDisplayName', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(normalizedName);

  res.json(getSettings());
});
