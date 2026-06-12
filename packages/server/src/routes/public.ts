import { Router } from 'express';
import { db } from '../db/index.js';

export const publicRouter = Router();

// GET /api/settings
publicRouter.get('/settings', (_req, res) => {
  const rows = db
    .prepare('SELECT key, value FROM settings')
    .all() as Array<{ key: string; value: string }>;
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  res.json({
    siteDisplayName: settings.siteDisplayName ?? 'KEVIN PHOTOGRAPHY',
  });
});

// GET /api/categories
publicRouter.get('/categories', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, name, sort_order AS sortOrder FROM categories ORDER BY sort_order ASC'
    )
    .all();
  res.json(rows);
});

// GET /api/photos?category=<categoryId>
publicRouter.get('/photos', (req, res) => {
  const { category } = req.query;

  let rows: unknown[];
  if (category !== undefined) {
    const categoryId = Number(category);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      res.status(400).json({ error: 'Invalid category id' });
      return;
    }
    rows = db
      .prepare(
        `SELECT id, category_id AS categoryId, title,
                '/photos/thumb/' || filename AS thumbUrl,
                '/photos/medium/' || filename AS mediumUrl,
                sort_order AS sortOrder
         FROM photos
         WHERE published = 1 AND category_id = ?
         ORDER BY sort_order ASC`
      )
      .all(categoryId);
  } else {
    rows = db
      .prepare(
        `SELECT id, category_id AS categoryId, title,
                '/photos/thumb/' || filename AS thumbUrl,
                '/photos/medium/' || filename AS mediumUrl,
                sort_order AS sortOrder
         FROM photos
         WHERE published = 1
         ORDER BY sort_order ASC`
      )
      .all();
  }

  res.json(rows);
});

// GET /api/plans  — published only
publicRouter.get('/plans', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, description, items, price, sort_order AS sortOrder
       FROM plans
       WHERE published = 1
       ORDER BY sort_order ASC`
    )
    .all() as Array<{
    id: number;
    name: string;
    description: string;
    items: string;
    price: number;
    sortOrder: number;
  }>;

  const parsed = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    items: JSON.parse(r.items) as string[],
    price: r.price,
    sortOrder: r.sortOrder,
  }));

  res.json(parsed);
});
