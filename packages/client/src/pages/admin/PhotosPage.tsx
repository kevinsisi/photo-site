import { useEffect, useRef, useState } from 'react';
import type { Category } from '../../api';

interface AdminPhoto {
  id: number;
  categoryId: number;
  title: string;
  filename: string;
  published: boolean;
  sortOrder: number;
  thumbUrl: string;
  mediumUrl: string;
}

const PHOTO_PREFIX = '/photos/';

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    signal: AbortSignal.timeout(15_000),
    ...init,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message;
    throw new Error(msg ?? `錯誤 ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function categoryName(categories: Category[], id: number): string {
  return categories.find((c) => c.id === id)?.name ?? '—';
}

interface EditState {
  id: number;
  title: string;
  categoryId: number;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState('');

  // Upload form state
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategoryId, setUploadCategoryId] = useState<number | ''>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Per-row operation feedback
  const [opMsg, setOpMsg] = useState<{ id: number; type: 'ok' | 'err'; text: string } | null>(null);

  // Inline edit state
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminFetch<AdminPhoto[]>('/api/admin/photos'),
      adminFetch<Category[]>('/api/categories'),
    ])
      .then(([p, c]) => {
        setPhotos(p);
        setCategories(c);
        if (c.length > 0) setUploadCategoryId(c[0].id);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  function showOpMsg(id: number, type: 'ok' | 'err', text: string) {
    setOpMsg({ id, type, text });
    if (type === 'ok') setTimeout(() => setOpMsg(null), 2500);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || uploadCategoryId === '') return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('categoryId', String(uploadCategoryId));
      fd.append('title', uploadTitle);
      await adminFetch<{ id: number }>('/api/admin/photos', {
        method: 'POST',
        body: fd,
        // No Content-Type header — browser sets multipart boundary automatically
        headers: undefined,
      });
      // Re-fetch full list to get the new photo with all computed fields
      const updated = await adminFetch<AdminPhoto[]>('/api/admin/photos');
      setPhotos(updated);
      setUploadFile(null);
      setUploadTitle('');
      if (fileRef.current) fileRef.current.value = '';
      setUploadMsg({ type: 'ok', text: '上傳成功' });
      setTimeout(() => setUploadMsg(null), 2500);
    } catch (err) {
      setUploadMsg({ type: 'err', text: err instanceof Error ? err.message : '上傳失敗' });
    } finally {
      setUploading(false);
    }
  }

  async function handleTogglePublished(photo: AdminPhoto) {
    const next = !photo.published;
    setPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, published: next } : p))
    );
    try {
      await adminFetch(`/api/admin/photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      });
      showOpMsg(photo.id, 'ok', next ? '已上架' : '已下架');
    } catch (err) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, published: photo.published } : p))
      );
      showOpMsg(photo.id, 'err', err instanceof Error ? err.message : '操作失敗');
    }
  }

  async function handleDelete(photo: AdminPhoto) {
    if (!confirm(`確定刪除「${photo.title || photo.filename}」？`)) return;
    try {
      await fetch(`/api/admin/photos/${photo.id}`, {
        method: 'DELETE',
        credentials: 'include',
        signal: AbortSignal.timeout(10_000),
      });
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (err) {
      showOpMsg(photo.id, 'err', err instanceof Error ? err.message : '刪除失敗');
    }
  }

  function startEdit(photo: AdminPhoto) {
    setEditState({ id: photo.id, title: photo.title, categoryId: photo.categoryId });
  }

  async function saveEdit() {
    if (!editState) return;
    setEditSaving(true);
    try {
      await adminFetch(`/api/admin/photos/${editState.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editState.title, categoryId: editState.categoryId }),
      });
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === editState.id
            ? { ...p, title: editState.title, categoryId: editState.categoryId }
            : p
        )
      );
      showOpMsg(editState.id, 'ok', '已儲存');
      setEditState(null);
    } catch (err) {
      showOpMsg(editState.id, 'err', err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setEditSaving(false);
    }
  }

  async function movePhoto(index: number, direction: 'up' | 'down') {
    const next = [...photos];
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setPhotos(next);
    try {
      await adminFetch('/api/admin/photos/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      });
    } catch (err) {
      // Revert on failure
      const reverted = [...next];
      [reverted[index], reverted[swapWith]] = [reverted[swapWith], reverted[index]];
      setPhotos(reverted);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-[var(--color-sage-900)]">作品管理</h1>

      {/* Upload form */}
      <section className="bg-white border border-[var(--color-sage-200)] rounded-lg p-6">
        <h2 className="text-sm font-semibold text-[var(--color-sage-800)] mb-4">上傳新照片</h2>
        <form onSubmit={handleUpload} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-sage-700)]">檔案</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              disabled={uploading}
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="text-sm text-[var(--color-text-primary)] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[var(--color-sage-100)] file:text-[var(--color-sage-800)] file:cursor-pointer disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-sage-700)]">標題</label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              disabled={uploading}
              placeholder="（可選）"
              className="border border-[var(--color-sage-200)] rounded px-3 py-1.5 text-sm w-44 focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-sage-700)]">分類</label>
            <select
              value={uploadCategoryId}
              onChange={(e) => setUploadCategoryId(Number(e.target.value))}
              required
              disabled={uploading}
              className="border border-[var(--color-sage-200)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={uploading || !uploadFile}
            className="bg-[var(--color-sage-700)] hover:bg-[var(--color-sage-800)] text-white text-sm rounded px-4 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {uploading ? '上傳中...' : '上傳'}
          </button>
        </form>

        {uploadMsg && (
          <p
            className={`mt-3 text-sm px-3 py-2 rounded ${
              uploadMsg.type === 'ok'
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-red-600 bg-red-50 border border-red-200'
            }`}
          >
            {uploadMsg.text}
          </p>
        )}
      </section>

      {/* Photo list */}
      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {loadError}
        </p>
      )}

      <section className="bg-white border border-[var(--color-sage-200)] rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-[var(--color-sage-800)] px-6 py-4 border-b border-[var(--color-sage-100)]">
          照片列表（{photos.length} 張）
        </h2>

        {photos.length === 0 && !loadError && (
          <p className="text-sm text-[var(--color-text-secondary)] px-6 py-8 text-center">
            尚無照片
          </p>
        )}

        <ul className="divide-y divide-[var(--color-sage-100)]">
          {photos.map((photo, idx) => {
            const isEditing = editState?.id === photo.id;
            const msg = opMsg?.id === photo.id ? opMsg : null;

            return (
              <li key={photo.id} className="flex items-start gap-4 px-6 py-4">
                {/* Thumbnail */}
                <img
                  src={`${PHOTO_PREFIX}${photo.thumbUrl}`}
                  alt={photo.title || photo.filename}
                  className="w-16 h-16 object-cover rounded border border-[var(--color-sage-200)] shrink-0"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                      <input
                        type="text"
                        value={editState.title}
                        onChange={(e) =>
                          setEditState((s) => s && { ...s, title: e.target.value })
                        }
                        disabled={editSaving}
                        className="border border-[var(--color-sage-300)] rounded px-2 py-1 text-sm w-44 focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50"
                      />
                      <select
                        value={editState.categoryId}
                        onChange={(e) =>
                          setEditState((s) => s && { ...s, categoryId: Number(e.target.value) })
                        }
                        disabled={editSaving}
                        className="border border-[var(--color-sage-300)] rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={saveEdit}
                        disabled={editSaving}
                        className="text-xs bg-[var(--color-sage-700)] text-white rounded px-2.5 py-1 hover:bg-[var(--color-sage-800)] transition-colors disabled:opacity-50"
                      >
                        儲存
                      </button>
                      <button
                        onClick={() => setEditState(null)}
                        disabled={editSaving}
                        className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-sage-700)] transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {photo.title || photo.filename}
                    </p>
                  )}

                  {!isEditing && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {categoryName(categories, photo.categoryId)}
                    </p>
                  )}

                  {msg && (
                    <p
                      className={`text-xs mt-1 ${
                        msg.type === 'ok' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {msg.text}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {/* Published toggle */}
                  <button
                    onClick={() => handleTogglePublished(photo)}
                    title={photo.published ? '點擊下架' : '點擊上架'}
                    className={`text-xs rounded px-2.5 py-1 transition-colors ${
                      photo.published
                        ? 'bg-[var(--color-sage-100)] text-[var(--color-sage-800)] hover:bg-[var(--color-sage-200)]'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {photo.published ? '已上架' : '未上架'}
                  </button>

                  {/* Edit */}
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(photo)}
                      className="text-xs text-[var(--color-sage-700)] hover:text-[var(--color-sage-900)] transition-colors"
                    >
                      編輯
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(photo)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    刪除
                  </button>

                  {/* Order buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => movePhoto(idx, 'up')}
                      disabled={idx === 0}
                      className="text-[10px] text-[var(--color-sage-600)] hover:text-[var(--color-sage-900)] disabled:opacity-30 transition-colors leading-none px-1"
                      title="上移"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => movePhoto(idx, 'down')}
                      disabled={idx === photos.length - 1}
                      className="text-[10px] text-[var(--color-sage-600)] hover:text-[var(--color-sage-900)] disabled:opacity-30 transition-colors leading-none px-1"
                      title="下移"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
