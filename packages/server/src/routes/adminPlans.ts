import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const adminPlansRouter = Router();
adminPlansRouter.use(requireAuth);

// POST /api/admin/plans
adminPlansRouter.post('/', (req, res) => {
  const { name, description, items, price, published } = req.body as {
    name?: string;
    description?: string;
    items?: unknown;
    price?: unknown;
    published?: unknown;
  };

  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const priceNum = Number(price);
  if (!Number.isInteger(priceNum) || priceNum < 0) {
    res.status(400).json({ error: 'price must be a non-negative integer' });
    return;
  }

  if (!Array.isArray(items) || items.some((v) => typeof v !== 'string')) {
    res.status(400).json({ error: 'items must be an array of strings' });
    return;
  }

  const maxRow = db
    .prepare('SELECT MAX(sort_order) AS m FROM plans')
    .get() as { m: number | null };
  const sortOrder = (maxRow.m ?? 0) + 1;

  const result = db
    .prepare(
      `INSERT INTO plans (name, description, items, price, published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      name.trim(),
      typeof description === 'string' ? description.trim() : '',
      JSON.stringify(items),
      priceNum,
      published ? 1 : 0,
      sortOrder
    );

  res.status(201).json({ id: result.lastInsertRowid });
});

// PATCH /api/admin/plans/:id
adminPlansRouter.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM plans WHERE id = ?')
    .get(id);
  if (!existing) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }

  const { name, description, items, price, published } = req.body as {
    name?: string;
    description?: string;
    items?: unknown;
    price?: unknown;
    published?: unknown;
  };

  const fields: string[] = [];
  const values: unknown[] = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name must be a non-empty string' });
      return;
    }
    fields.push('name = ?');
    values.push(name.trim());
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      res.status(400).json({ error: 'description must be a string' });
      return;
    }
    fields.push('description = ?');
    values.push(description.trim());
  }

  if (items !== undefined) {
    if (!Array.isArray(items) || items.some((v) => typeof v !== 'string')) {
      res.status(400).json({ error: 'items must be an array of strings' });
      return;
    }
    fields.push('items = ?');
    values.push(JSON.stringify(items));
  }

  if (price !== undefined) {
    const priceNum = Number(price);
    if (!Number.isInteger(priceNum) || priceNum < 0) {
      res.status(400).json({ error: 'price must be a non-negative integer' });
      return;
    }
    fields.push('price = ?');
    values.push(priceNum);
  }

  if (published !== undefined) {
    fields.push('published = ?');
    values.push(published ? 1 : 0);
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(id);
  db.prepare(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`).run(
    ...values
  );

  res.json({ ok: true });
});

// DELETE /api/admin/plans/:id
adminPlansRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM plans WHERE id = ?')
    .get(id);
  if (!existing) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }

  db.prepare('DELETE FROM plans WHERE id = ?').run(id);
  res.json({ ok: true });
});

// PUT /api/admin/plans/order  {ids: number[]}
adminPlansRouter.put('/order', (req, res) => {
  const { ids } = req.body as { ids?: unknown };

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.some((v) => typeof v !== 'number' || !Number.isInteger(v) || v <= 0)
  ) {
    res.status(400).json({ error: 'ids must be a non-empty array of positive integers' });
    return;
  }

  const update = db.prepare('UPDATE plans SET sort_order = ? WHERE id = ?');
  const updateAll = db.transaction((idList: number[]) => {
    idList.forEach((id, index) => {
      update.run(index, id);
    });
  });
  updateAll(ids as number[]);

  res.json({ ok: true });
});
