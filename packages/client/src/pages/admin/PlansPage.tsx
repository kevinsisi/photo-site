import { useEffect, useState } from 'react';

interface AdminPlan {
  id: number;
  name: string;
  description: string;
  items: string[];
  price: number;
  published: boolean;
  sortOrder: number;
}

interface PlanFormData {
  name: string;
  description: string;
  itemsText: string; // newline-separated items
  price: string;     // string for controlled input, parsed to number on submit
  published: boolean;
}

const EMPTY_FORM: PlanFormData = {
  name: '',
  description: '',
  itemsText: '',
  price: '',
  published: true,
};

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

function planToForm(plan: AdminPlan): PlanFormData {
  return {
    name: plan.name,
    description: plan.description,
    itemsText: plan.items.join('\n'),
    price: String(plan.price),
    published: plan.published,
  };
}

function PlanForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: PlanFormData;
  onSave: (data: PlanFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PlanFormData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 bg-[var(--color-sage-50)] border border-[var(--color-sage-200)] rounded-lg p-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--color-sage-700)]">名稱 *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            disabled={saving}
            className="border border-[var(--color-sage-200)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--color-sage-700)]">價格 (NTD) *</label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            required
            disabled={saving}
            className="border border-[var(--color-sage-200)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--color-sage-700)]">說明</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          disabled={saving}
          rows={2}
          className="border border-[var(--color-sage-200)] rounded px-3 py-1.5 text-sm resize-none focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--color-sage-700)]">內容項目（每行一項）</label>
        <textarea
          value={form.itemsText}
          onChange={(e) => set('itemsText', e.target.value)}
          disabled={saving}
          rows={4}
          placeholder="每行輸入一個項目"
          className="border border-[var(--color-sage-200)] rounded px-3 py-1.5 text-sm resize-none focus:outline-none focus:border-[var(--color-sage-500)] disabled:opacity-50 font-mono"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(e) => set('published', e.target.checked)}
          disabled={saving}
          className="w-4 h-4 accent-[var(--color-sage-700)]"
        />
        上架
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 mt-1">
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="bg-[var(--color-sage-700)] hover:bg-[var(--color-sage-800)] text-white text-sm rounded px-4 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          儲存
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-sage-700)] transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loadError, setLoadError] = useState('');

  // Add form visibility
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit state: which plan id is being edited
  const [editId, setEditId] = useState<number | null>(null);

  // Per-row feedback
  const [rowMsg, setRowMsg] = useState<{ id: number; type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    adminFetch<AdminPlan[]>('/api/admin/plans')
      .then(setPlans)
      .catch((err) => setLoadError(err.message));
  }, []);

  function showRowMsg(id: number, type: 'ok' | 'err', text: string) {
    setRowMsg({ id, type, text });
    if (type === 'ok') setTimeout(() => setRowMsg(null), 2500);
  }

  async function handleAdd(data: PlanFormData) {
    const items = data.itemsText.split('\n').map((s) => s.trim()).filter(Boolean);
    const price = parseInt(data.price, 10) || 0;
    const { id } = await adminFetch<{ id: number }>('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name.trim(),
        description: data.description.trim(),
        items,
        price,
        published: data.published,
      }),
    });
    const maxOrder = plans.reduce((m, p) => Math.max(m, p.sortOrder), 0);
    const newPlan: AdminPlan = {
      id,
      name: data.name.trim(),
      description: data.description.trim(),
      items,
      price,
      published: data.published,
      sortOrder: maxOrder + 1,
    };
    setPlans((prev) => [...prev, newPlan]);
    setShowAddForm(false);
  }

  async function handleEdit(plan: AdminPlan, data: PlanFormData) {
    const items = data.itemsText.split('\n').map((s) => s.trim()).filter(Boolean);
    const price = parseInt(data.price, 10) || 0;
    await adminFetch<{ ok: boolean }>(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name.trim(),
        description: data.description.trim(),
        items,
        price,
        published: data.published,
      }),
    });
    const updatedPlan: AdminPlan = {
      ...plan,
      name: data.name.trim(),
      description: data.description.trim(),
      items,
      price,
      published: data.published,
    };
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? updatedPlan : p)));
    setEditId(null);
    showRowMsg(plan.id, 'ok', '已儲存');
  }

  async function handleTogglePublished(plan: AdminPlan) {
    const next = !plan.published;
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, published: next } : p)));
    try {
      await adminFetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      });
      showRowMsg(plan.id, 'ok', next ? '已上架' : '已下架');
    } catch (err) {
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, published: plan.published } : p)));
      showRowMsg(plan.id, 'err', err instanceof Error ? err.message : '操作失敗');
    }
  }

  async function handleDelete(plan: AdminPlan) {
    if (!confirm(`確定刪除方案「${plan.name}」？`)) return;
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'DELETE',
        credentials: 'include',
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message;
        throw new Error(msg ?? `錯誤 ${res.status}`);
      }
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    } catch (err) {
      showRowMsg(plan.id, 'err', err instanceof Error ? err.message : '刪除失敗');
    }
  }

  async function move(index: number, direction: 'up' | 'down') {
    const next = [...plans];
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= next.length) return;
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    setPlans(next);
    try {
      await adminFetch('/api/admin/plans/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      });
    } catch {
      const reverted = [...next];
      [reverted[index], reverted[swapWith]] = [reverted[swapWith], reverted[index]];
      setPlans(reverted);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--color-sage-900)]">方案管理</h1>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setEditId(null); }}
            className="bg-[var(--color-sage-700)] hover:bg-[var(--color-sage-800)] text-white text-sm rounded px-4 py-1.5 transition-colors"
          >
            新增方案
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <PlanForm
          initial={EMPTY_FORM}
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Error */}
      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {loadError}
        </p>
      )}

      {/* Plan list */}
      <section className="bg-white border border-[var(--color-sage-200)] rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-[var(--color-sage-800)] px-6 py-4 border-b border-[var(--color-sage-100)]">
          方案列表（{plans.length} 項）
        </h2>

        {plans.length === 0 && !loadError && (
          <p className="text-sm text-[var(--color-text-secondary)] px-6 py-8 text-center">
            尚無方案
          </p>
        )}

        <ul className="divide-y divide-[var(--color-sage-100)]">
          {plans.map((plan, idx) => {
            const isEditing = editId === plan.id;
            const msg = rowMsg?.id === plan.id ? rowMsg : null;

            return (
              <li key={plan.id} className="px-6 py-4 flex flex-col gap-3">
                {isEditing ? (
                  <PlanForm
                    initial={planToForm(plan)}
                    onSave={(data) => handleEdit(plan, data)}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <div className="flex items-start gap-4">
                    {/* Plan info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {plan.name}
                        </span>
                        <span className="text-sm text-[var(--color-sage-700)] font-semibold">
                          NT$ {plan.price.toLocaleString()}
                        </span>
                        <span
                          className={`text-xs rounded px-2 py-0.5 ${
                            plan.published
                              ? 'bg-[var(--color-sage-100)] text-[var(--color-sage-800)]'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {plan.published ? '已上架' : '未上架'}
                        </span>
                      </div>

                      {plan.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                      )}

                      {plan.items.length > 0 && (
                        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          {plan.items.map((item, i) => (
                            <li
                              key={i}
                              className="text-xs text-[var(--color-text-secondary)] before:content-['·'] before:mr-1"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
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
                      <button
                        onClick={() => handleTogglePublished(plan)}
                        className="text-xs text-[var(--color-sage-700)] hover:text-[var(--color-sage-900)] transition-colors"
                        title={plan.published ? '點擊下架' : '點擊上架'}
                      >
                        {plan.published ? '下架' : '上架'}
                      </button>

                      <button
                        onClick={() => { setEditId(plan.id); setShowAddForm(false); }}
                        className="text-xs text-[var(--color-sage-700)] hover:text-[var(--color-sage-900)] transition-colors"
                      >
                        編輯
                      </button>

                      <button
                        onClick={() => handleDelete(plan)}
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
                          disabled={idx === plans.length - 1}
                          className="text-[10px] text-[var(--color-sage-600)] hover:text-[var(--color-sage-900)] disabled:opacity-30 transition-colors leading-none px-1"
                          title="下移"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
