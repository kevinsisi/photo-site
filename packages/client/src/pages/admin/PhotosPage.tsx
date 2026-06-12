import { useEffect, useRef, useState } from 'react';
import type { Category } from '../../api';
import { useUploadManager } from '../../contexts/UploadManagerContext';

interface AdminPhoto {
  id: number;
  categoryId: number;
  title: string;
  filename: string;
  published: boolean;
  sortOrder: number;
  width: number | null;
  height: number | null;
  thumbUrl: string;
  mediumUrl: string;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

/** Drag & drop + multi-select intake; resolves category then hands files to the queue */
function UploadDropzone({
  categories,
  categoriesLoaded,
  onCategoryCreated,
}: {
  categories: Category[];
  categoriesLoaded: boolean;
  onCategoryCreated: (category: Category) => void;
}) {
  const { enqueue } = useUploadManager();
  const fileRef = useRef<HTMLInputElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!categoriesLoaded) return;
    if (categories.length > 0 && categoryId === '' && !creatingCategory) {
      setCategoryId(categories[0].id);
    }
    if (categories.length === 0) {
      setCreatingCategory(true);
    }
  }, [categoriesLoaded, categories, categoryId, creatingCategory]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!categoryMenuRef.current?.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  async function resolveCategoryId(): Promise<number | null> {
    if (!creatingCategory && categoryId !== '') return categoryId;
    const name = newCategoryName.trim();
    if (!name) {
      setMessage({ type: 'err', text: '請選擇或新增分類' });
      return null;
    }
    const existing = categories.find((c) => c.name === name);
    if (existing) {
      setCategoryId(existing.id);
      setCreatingCategory(false);
      return existing.id;
    }
    const { id } = await adminFetch<{ id: number }>('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sortOrder), 0);
    onCategoryCreated({ id, name, sortOrder: maxOrder + 1 });
    setCategoryId(id);
    setCreatingCategory(false);
    setCategoryMenuOpen(false);
    setNewCategoryName('');
    return id;
  }

  async function handleFiles(fileList: FileList | File[]) {
    const all = Array.from(fileList);
    const valid = all.filter((f) => ALLOWED_TYPES.has(f.type));
    const rejected = all.length - valid.length;

    if (valid.length === 0) {
      setMessage({ type: 'err', text: '沒有可上傳的檔案（僅接受 JPEG / PNG / WebP）' });
      return;
    }

    try {
      const catId = await resolveCategoryId();
      if (catId === null) return;
      enqueue(valid, catId);
      setMessage({
        type: 'ok',
        text:
          rejected > 0
            ? `${valid.length} 個檔案已加入佇列，${rejected} 個非影像檔已略過`
            : `${valid.length} 個檔案已加入上傳佇列`,
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : '加入佇列失敗' });
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <section className="bg-white border border-zinc-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-zinc-800 mb-4">上傳照片</h2>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">分類</label>
          <div ref={categoryMenuRef} className="relative w-full sm:w-56">
            <button
              type="button"
              disabled={!categoriesLoaded}
              onClick={() => setCategoryMenuOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-800 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
            >
              <span>
                {!categoriesLoaded
                  ? '分類載入中...'
                  : creatingCategory
                  ? '新增分類'
                  : categoryName(categories, categoryId as number)}
              </span>
              <span aria-hidden="true" className="text-zinc-500">⌄</span>
            </button>

            {categoryMenuOpen && categoriesLoaded && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded border border-zinc-200 bg-white shadow-lg">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(category.id);
                      setCreatingCategory(false);
                      setNewCategoryName('');
                      setCategoryMenuOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                  >
                    {category.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCategoryId('');
                    setCreatingCategory(true);
                    setCategoryMenuOpen(false);
                  }}
                  className="block w-full border-t border-zinc-100 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  ＋ 新增分類
                </button>
              </div>
            )}
          </div>
        </div>

        {creatingCategory && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">新分類名稱</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={!categoriesLoaded}
              placeholder="例如：婚禮紀錄"
              className="border border-zinc-200 rounded px-3 py-1.5 text-sm w-44 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
            />
          </div>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver
            ? 'border-zinc-500 bg-zinc-50'
            : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50/50'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-zinc-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-zinc-600">拖放多張照片到這裡，或點擊選擇檔案</p>
        <p className="text-xs text-zinc-400">
          JPEG / PNG / WebP・加入佇列後在背景上傳，可繼續其他操作
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void handleFiles(e.target.files);
            }
          }}
        />
      </div>

      {message && (
        <p
          className={`mt-3 text-sm px-3 py-2 rounded ${
            message.type === 'ok'
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              : 'text-red-600 bg-red-50 border border-red-200'
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { completedCount } = useUploadManager();

  const [opMsg, setOpMsg] = useState<{ id: number; type: 'ok' | 'err'; text: string } | null>(null);
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
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setCategoriesLoaded(true));
  }, []);

  // Refresh the list whenever a background upload finishes
  useEffect(() => {
    if (completedCount === 0) return;
    adminFetch<AdminPhoto[]>('/api/admin/photos')
      .then(setPhotos)
      .catch(() => {
        // panel already shows upload state; list refresh failure is non-fatal
      });
  }, [completedCount]);

  function showOpMsg(id: number, type: 'ok' | 'err', text: string) {
    setOpMsg({ id, type, text });
    if (type === 'ok') setTimeout(() => setOpMsg(null), 2500);
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
    } catch {
      // Revert on failure
      const reverted = [...next];
      [reverted[index], reverted[swapWith]] = [reverted[swapWith], reverted[index]];
      setPhotos(reverted);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-zinc-900">作品管理</h1>

      <UploadDropzone
        categories={categories}
        categoriesLoaded={categoriesLoaded}
        onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat])}
      />

      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {loadError}
        </p>
      )}

      {/* Photo card grid */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-800 mb-4">
          照片列表（{photos.length} 張）
        </h2>

        {photos.length === 0 && !loadError && (
          <p className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            尚無照片，從上方拖放幾張開始吧
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, idx) => {
            const isEditing = editState?.id === photo.id;
            const msg = opMsg?.id === photo.id ? opMsg : null;

            return (
              <div
                key={photo.id}
                className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-zinc-100">
                  <img
                    src={photo.thumbUrl}
                    alt={photo.title || photo.filename}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {/* Publish state badge */}
                  <button
                    onClick={() => handleTogglePublished(photo)}
                    title={photo.published ? '點擊下架' : '點擊上架'}
                    className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm transition-colors ${
                      photo.published
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-white/90 text-zinc-500 hover:bg-white'
                    }`}
                  >
                    {photo.published ? '已上架' : '草稿'}
                  </button>

                  {/* Order controls */}
                  <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => movePhoto(idx, 'up')}
                      disabled={idx === 0}
                      className="flex h-6 w-6 items-center justify-center rounded bg-white/90 text-xs text-zinc-600 shadow-sm hover:bg-white disabled:opacity-30"
                      title="上移"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => movePhoto(idx, 'down')}
                      disabled={idx === photos.length - 1}
                      className="flex h-6 w-6 items-center justify-center rounded bg-white/90 text-xs text-zinc-600 shadow-sm hover:bg-white disabled:opacity-30"
                      title="下移"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-3">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editState.title}
                        placeholder="標題"
                        onChange={(e) =>
                          setEditState((s) => s && { ...s, title: e.target.value })
                        }
                        disabled={editSaving}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none disabled:opacity-50"
                      />
                      <select
                        value={editState.categoryId}
                        onChange={(e) =>
                          setEditState((s) => s && { ...s, categoryId: Number(e.target.value) })
                        }
                        disabled={editSaving}
                        className="w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none disabled:opacity-50"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={editSaving}
                          className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-white transition-colors hover:bg-zinc-900 disabled:opacity-50"
                        >
                          儲存
                        </button>
                        <button
                          onClick={() => setEditState(null)}
                          disabled={editSaving}
                          className="text-xs text-zinc-500 transition-colors hover:text-zinc-800"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="truncate text-sm font-medium text-zinc-800">
                        {photo.title || <span className="text-zinc-400">（未命名）</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {categoryName(categories, photo.categoryId)}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          onClick={() =>
                            setEditState({
                              id: photo.id,
                              title: photo.title,
                              categoryId: photo.categoryId,
                            })
                          }
                          className="text-xs text-zinc-600 transition-colors hover:text-zinc-900"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(photo)}
                          className="text-xs text-red-500 transition-colors hover:text-red-700"
                        >
                          刪除
                        </button>
                      </div>
                    </>
                  )}

                  {msg && (
                    <p
                      className={`mt-1.5 text-xs ${
                        msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {msg.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
