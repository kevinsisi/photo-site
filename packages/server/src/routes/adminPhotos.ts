import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const adminPhotosRouter = Router();
adminPhotosRouter.use(requireAuth);

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const THUMB_WIDTH = 640;
const MEDIUM_WIDTH = 1600;

// Multer stores upload temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpeg, png, and webp files are allowed'));
    }
  },
});

function getPhotoDirs(): {
  original: string;
  thumb: string;
  medium: string;
} {
  const base = path.join(process.env.DATA_DIR ?? './data', 'photos');
  return {
    original: path.join(base, 'original'),
    thumb: path.join(base, 'thumb'),
    medium: path.join(base, 'medium'),
  };
}

function ensurePhotoDirs(): void {
  const dirs = getPhotoDirs();
  fs.mkdirSync(dirs.original, { recursive: true });
  fs.mkdirSync(dirs.thumb, { recursive: true });
  fs.mkdirSync(dirs.medium, { recursive: true });
}

function deletePhotoFiles(filename: string): void {
  const dirs = getPhotoDirs();
  for (const dir of [dirs.original, dirs.thumb, dirs.medium]) {
    const fp = path.join(dir, filename);
    try {
      fs.unlinkSync(fp);
    } catch {
      // ignore missing files
    }
  }
}

// GET /api/admin/photos
adminPhotosRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, category_id AS categoryId, title, filename, published, sort_order AS sortOrder,
              '/photos/thumb/' || filename AS thumbUrl,
              '/photos/medium/' || filename AS mediumUrl
       FROM photos
       ORDER BY sort_order ASC`
    )
    .all() as {
      id: number;
      categoryId: number;
      title: string;
      filename: string;
      published: number;
      sortOrder: number;
      thumbUrl: string;
      mediumUrl: string;
    }[];

  res.json(
    rows.map((row) => ({
      ...row,
      published: row.published === 1,
    }))
  );
});

// POST /api/admin/photos  (multipart: file, categoryId, title)
adminPhotosRouter.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'file is required' });
    return;
  }

  const { categoryId, title } = req.body as {
    categoryId?: string;
    title?: string;
  };

  const catId = Number(categoryId);
  if (!Number.isInteger(catId) || catId <= 0) {
    res.status(400).json({ error: 'categoryId must be a positive integer' });
    return;
  }

  const catRow = db
    .prepare('SELECT id FROM categories WHERE id = ?')
    .get(catId);
  if (!catRow) {
    res.status(400).json({ error: 'Category not found' });
    return;
  }

  const safeTitle = typeof title === 'string' ? title.trim() : '';

  ensurePhotoDirs();
  const dirs = getPhotoDirs();

  // Use a WebP filename for all three variants
  const filename = `${randomUUID()}.webp`;
  const originalPath = path.join(dirs.original, filename);
  const thumbPath = path.join(dirs.thumb, filename);
  const mediumPath = path.join(dirs.medium, filename);

  const writtenFiles: string[] = [];

  try {
    // Save original (convert to webp for consistency)
    await sharp(req.file.buffer).webp({ quality: 90 }).toFile(originalPath);
    writtenFiles.push(originalPath);

    // Generate a small grid image so category switching only loads low-res assets.
    await sharp(req.file.buffer)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(thumbPath);
    writtenFiles.push(thumbPath);

    // Generate a medium preview for lightbox use without loading the original.
    await sharp(req.file.buffer)
      .resize({ width: MEDIUM_WIDTH, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(mediumPath);
    writtenFiles.push(mediumPath);
  } catch (err) {
    // Rollback: delete any files already written
    for (const fp of writtenFiles) {
      try {
        fs.unlinkSync(fp);
      } catch {
        // ignore
      }
    }
    console.error('Image processing error', err);
    res.status(500).json({ error: 'Image processing failed' });
    return;
  }

  // Determine next sort_order
  const maxRow = db
    .prepare('SELECT MAX(sort_order) AS m FROM photos')
    .get() as { m: number | null };
  const sortOrder = (maxRow.m ?? 0) + 1;

  const result = db
    .prepare(
      `INSERT INTO photos (category_id, title, filename, published, sort_order)
       VALUES (?, ?, ?, 0, ?)`
    )
    .run(catId, safeTitle, filename, sortOrder);

  res.status(201).json({ id: result.lastInsertRowid });
});

// PATCH /api/admin/photos/:id
adminPhotosRouter.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM photos WHERE id = ?')
    .get(id);
  if (!existing) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }

  const { title, categoryId, published } = req.body as {
    title?: string;
    categoryId?: number;
    published?: boolean | number;
  };

  const fields: string[] = [];
  const values: unknown[] = [];

  if (title !== undefined) {
    if (typeof title !== 'string') {
      res.status(400).json({ error: 'title must be a string' });
      return;
    }
    fields.push('title = ?');
    values.push(title.trim());
  }

  if (categoryId !== undefined) {
    const catId = Number(categoryId);
    if (!Number.isInteger(catId) || catId <= 0) {
      res.status(400).json({ error: 'categoryId must be a positive integer' });
      return;
    }
    const catRow = db
      .prepare('SELECT id FROM categories WHERE id = ?')
      .get(catId);
    if (!catRow) {
      res.status(400).json({ error: 'Category not found' });
      return;
    }
    fields.push('category_id = ?');
    values.push(catId);
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
  db.prepare(`UPDATE photos SET ${fields.join(', ')} WHERE id = ?`).run(
    ...values
  );

  res.json({ ok: true });
});

// DELETE /api/admin/photos/:id
adminPhotosRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const row = db
    .prepare('SELECT filename FROM photos WHERE id = ?')
    .get(id) as { filename: string } | undefined;

  if (!row) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }

  db.prepare('DELETE FROM photos WHERE id = ?').run(id);
  deletePhotoFiles(row.filename);

  res.json({ ok: true });
});

// PUT /api/admin/photos/order  {ids: number[]}
adminPhotosRouter.put('/order', (req, res) => {
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
    'UPDATE photos SET sort_order = ? WHERE id = ?'
  );
  const updateAll = db.transaction((idList: number[]) => {
    idList.forEach((id, index) => {
      update.run(index, id);
    });
  });
  updateAll(ids as number[]);

  res.json({ ok: true });
});
