import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const adminCategoriesRouter = Router();
adminCategoriesRouter.use(requireAuth);

// POST /api/admin/categories
adminCategoriesRouter.post('/', (req, res) => {
  const { name } = req.body as { name?: string };

  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const maxRow = db
    .prepare('SELECT MAX(sort_order) AS m FROM categories')
    .get() as { m: number | null };
  const sortOrder = (maxRow.m ?? 0) + 1;

  const result = db
    .prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)')
    .run(name.trim(), sortOrder);

  res.status(201).json({ id: result.lastInsertRowid });
});

// PATCH /api/admin/categories/:id
adminCategoriesRouter.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM categories WHERE id = ?')
    .get(id);
  if (!existing) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const { name } = req.body as { name?: string };

  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(
    name.trim(),
    id
  );

  res.json({ ok: true });
});

// DELETE /api/admin/categories/:id
adminCategoriesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM categories WHERE id = ?')
    .get(id);
  if (!existing) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  // Block delete if photos exist under this category
  const photoCount = db
    .prepare('SELECT COUNT(*) AS c FROM photos WHERE category_id = ?')
    .get(id) as { c: number };

  if (photoCount.c > 0) {
    res
      .status(409)
      .json({
        error: `Cannot delete category: ${photoCount.c} photo(s) still belong to it. Move or delete those photos first.`,
      });
    return;
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ ok: true });
});

// PUT /api/admin/categories/order  {ids: number[]}
adminCategoriesRouter.put('/order', (req, res) => {
  const { ids } = req.body as { ids?: unknown };

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.some((v) => typeof v !== 'number' || !Number.isInteger(v) || v <= 0)
  ) {
    res.status(400).json({ error: 'ids must be a non-empty array of positive integers' });
    return;
  }

  const update = db.prepare(
    'UPDATE categories SET sort_order = ? WHERE id = ?'
  );
  const updateAll = db.transaction((idList: number[]) => {
    idList.forEach((id, index) => {
      update.run(index, id);
    });
  });
  updateAll(ids as number[]);

  res.json({ ok: true });
});
