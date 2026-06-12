import { useEffect, useState } from 'react';
import type { Category } from '../../api';

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    signal: AbortSignal.timeout(10_000),
    ...init,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message;
    throw new Error(msg ?? `錯誤 ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState('');

  // Add form
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Per-row edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Per-row feedback
  const [rowMsg, setRowMsg] = useState<{ id: number; type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    adminFetch<Category[]>('/api/categories')
      .then(setCategories)
      .catch((err) => setLoadError(err.message));
  }, []);

  function showRowMsg(id: number, type: 'ok' | 'err', text: string) {
    setRowMsg({ id, type, text });
    if (type === 'ok') setTimeout(() => setRowMsg(null), 2500);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setAddMsg(null);
    try {
      const { id } = await adminFetch<{ id: number }>('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.sortOrder), 0);
      setCategories((prev) => [...prev, { id, name: newName.trim(), sortOrder: maxOrder + 1 }]);
      setNewName('');
      setAddMsg({ type: 'ok', text: '新增成功' });
      setTimeout(() => setAddMsg(null), 2500);
    } catch (err) {
      setAddMsg({ type: 'err', text: err instanceof Error ? err.message : '新增失敗' });
    } finally {
      setAdding(false);
    }
  }

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setEditName(cat.name);
  }

  async function saveEdit(cat: Category) {
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      await adminFetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, name: editName.trim() } : c))
      );
      showRowMsg(cat.id, 'ok', '已儲存');
      setEditId(null);
    } catch (err) {
      showRowMsg(cat.id, 'err', err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`確定刪除分類「${cat.name}」？`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
        credentials: 'include',
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message;
        throw new Error(msg ?? `錯誤 ${res.status}`);
      }
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      showRowMsg(cat.id, 'err', err instanceof Error ? err.message : '刪除失敗');
    }
  }

  async function move(index: number, direction: 'up' | 'down') {
    const next = [...categories];
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setCategories(next);
    try {
      await adminFetch('/api/admin/categories/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((c) => c.id) }),
      });
    } catch {
      const reverted = [...next];
      [reverted[index], reverted[swapWith]] = [reverted[swapWith], reverted[index]];
      setCategories(reverted);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-[var(--color-sage-900)]">分類管理</h1>

      {/* Add form */}
      <section className="bg-white border border-[var(--color-sage-200)] rounded-lg p-6">
        <h2 className="text-sm font-semibold text-[var(--color-sage-800)] mb-4">新增分類</h2>
        <form onSubmit={handleAdd} className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-sage-700)]">分類名稱</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              disabled={adding}
              placeholder="輸入分類名稱"
              className="border border-[var(--color-sage-200)] rounded px-3 py-1.5 text-sm w-52 focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="bg-[var(--color-sage-700)] hover:bg-[var(--color-sage-800)] text-white text-sm rounded px-4 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {adding && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            新增
          </button>
        </form>

        {addMsg && (
          <p
            className={`mt-3 text-sm px-3 py-2 rounded ${
              addMsg.type === 'ok'
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-red-600 bg-red-50 border border-red-200'
            }`}
          >
            {addMsg.text}
          </p>
        )}
      </section>

      {/* Category list */}
      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {loadError}
        </p>
      )}

      <section className="bg-white border border-[var(--color-sage-200)] rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-[var(--color-sage-800)] px-6 py-4 border-b border-[var(--color-sage-100)]">
          分類列表（{categories.length} 項）
        </h2>

        {categories.length === 0 && !loadError && (
          <p className="text-sm text-[var(--color-text-secondary)] px-6 py-8 text-center">
            尚無分類
          </p>
        )}

        <ul className="divide-y divide-[var(--color-sage-100)]">
          {categories.map((cat, idx) => {
            const isEditing = editId === cat.id;
            const msg = rowMsg?.id === cat.id ? rowMsg : null;

            return (
              <li key={cat.id} className="flex items-center gap-4 px-6 py-3">
                {/* Name / edit input */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={editSaving}
                      className="border border-[var(--color-sage-300)] rounded px-2 py-1 text-sm w-48 focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm text-[var(--color-text-primary)]">{cat.name}</span>
                  )}
                  {msg && (
                    <p
                      className={`text-xs mt-0.5 ${
                        msg.type === 'ok' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {msg.text}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(cat)}
                        disabled={editSaving || !editName.trim()}
                        className="text-xs bg-[var(--color-sage-700)] text-white rounded px-2.5 py-1 hover:bg-[var(--color-sage-800)] transition-colors disabled:opacity-50"
                      >
                        儲存
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        disabled={editSaving}
                        className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-sage-700)] transition-colors"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(cat)}
                      className="text-xs text-[var(--color-sage-700)] hover:text-[var(--color-sage-900)] transition-colors"
                    >
                      編輯
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(cat)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    刪除
                  </button>

                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => move(idx, 'up')}
                      disabled={idx === 0}
                      className="text-[10px] text-[var(--color-sage-600)] hover:text-[var(--color-sage-900)] disabled:opacity-30 transition-colors leading-none px-1"
                      title="上移"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(idx, 'down')}
                      disabled={idx === categories.length - 1}
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
