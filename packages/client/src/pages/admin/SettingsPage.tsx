import { useEffect, useState } from 'react';

interface SiteSettings {
  siteDisplayName: string;
}

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

export default function SettingsPage() {
  const [siteDisplayName, setSiteDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    adminFetch<SiteSettings>('/api/admin/settings')
      .then((settings) => setSiteDisplayName(settings.siteDisplayName))
      .catch((err) => setMessage({ type: 'err', text: err.message }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const settings = await adminFetch<SiteSettings>('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteDisplayName }),
      });
      setSiteDisplayName(settings.siteDisplayName);
      setMessage({ type: 'ok', text: '網站設定已更新' });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : '儲存失敗' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-[var(--color-sage-900)]">網站設定</h1>

      <section className="bg-white border border-[var(--color-sage-200)] rounded-lg p-6">
        <h2 className="text-sm font-semibold text-[var(--color-sage-800)] mb-4">品牌顯示</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-sage-700)]" htmlFor="siteDisplayName">
              網站顯示名稱
            </label>
            <input
              id="siteDisplayName"
              type="text"
              value={siteDisplayName}
              onChange={(e) => setSiteDisplayName(e.target.value)}
              disabled={loading || saving}
              maxLength={80}
              required
              className="border border-[var(--color-sage-200)] rounded px-3 py-2 text-sm text-[var(--color-text-primary)] bg-white placeholder-[var(--color-sage-300)] focus:outline-none focus:border-[var(--color-sage-500)] focus:ring-1 focus:ring-[var(--color-sage-300)] transition disabled:opacity-50"
              placeholder="例如：CHING PHOTOGRAPHY"
            />
          </div>

          {message && (
            <p
              className={`text-sm rounded px-3 py-2 border ${
                message.type === 'ok'
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || saving}
            className="self-start bg-[var(--color-sage-700)] hover:bg-[var(--color-sage-800)] text-white text-sm font-medium rounded px-4 py-2 transition-colors duration-150 disabled:opacity-50"
          >
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </form>
      </section>
    </div>
  );
}
