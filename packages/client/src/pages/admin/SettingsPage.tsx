import { useEffect, useMemo, useState } from 'react';
import {
  ANIMATIONS,
  DEFAULT_APPEARANCE,
  LAYOUTS,
  THEMES,
  isAnimationId,
  isLayoutId,
  isThemeId,
  type AnimationId,
  type LayoutId,
  type ThemeId,
} from '../../appearance';
import type { Photo } from '../../api';
import Gallery from '../../components/Gallery';

interface AdminSettings {
  siteDisplayName: string;
  theme: string;
  layout: string;
  animation: string;
}

interface AdminPhoto extends Photo {
  published: boolean;
  filename: string;
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

const PREVIEW_PHOTO_COUNT = 9;

/**
 * Live WYSIWYG preview: a miniature public site rendered with the *selected*
 * (unsaved) appearance. data-theme/data-anim on this container scope the same
 * token CSS and reveal animations the real site uses.
 */
function AppearancePreview({
  siteDisplayName,
  theme,
  layout,
  animation,
  photos,
}: {
  siteDisplayName: string;
  theme: ThemeId;
  layout: LayoutId;
  animation: AnimationId;
  photos: Photo[];
}) {
  return (
    <div
      data-theme={theme}
      data-anim={animation}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-canvas text-ink transition-colors duration-300"
    >
      {/* Mini header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="text-[10px] font-semibold tracking-[0.25em]">{siteDisplayName}</span>
        <span className="text-[9px] tracking-[0.15em] text-muted-ink">作品集 · 價目表 · 聯絡</span>
      </div>

      <div className="px-5 py-5">
        <p className="mb-1 text-center text-[9px] uppercase tracking-[0.35em] text-muted-ink">
          Portfolio
        </p>
        <p className="mb-4 text-center text-sm font-light tracking-wide">作品集</p>

        {/* Mini filter chips */}
        <div className="mb-5 flex justify-center gap-1.5">
          <span className="border border-accent bg-accent px-2.5 py-1 text-[9px] tracking-widest text-on-accent">
            全部
          </span>
          <span className="border border-line px-2.5 py-1 text-[9px] tracking-widest text-muted-ink">
            人像
          </span>
          <span className="border border-line px-2.5 py-1 text-[9px] tracking-widest text-muted-ink">
            婚禮
          </span>
        </div>

        {photos.length > 0 ? (
          // Re-mount when appearance changes so entrance animations replay
          <div key={`${theme}-${layout}-${animation}`} className="max-h-80 overflow-hidden">
            <Gallery photos={photos} layout={layout} onPhotoClick={() => {}} />
          </div>
        ) : (
          <p className="py-10 text-center text-[11px] tracking-widest text-muted-ink">
            上傳照片後即可預覽
          </p>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [siteDisplayName, setSiteDisplayName] = useState('');
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_APPEARANCE.theme);
  const [layout, setLayout] = useState<LayoutId>(DEFAULT_APPEARANCE.layout);
  const [animation, setAnimation] = useState<AnimationId>(DEFAULT_APPEARANCE.animation);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch<AdminSettings>('/api/admin/settings'),
      adminFetch<AdminPhoto[]>('/api/admin/photos'),
    ])
      .then(([settings, allPhotos]) => {
        setSiteDisplayName(settings.siteDisplayName);
        if (isThemeId(settings.theme)) setTheme(settings.theme);
        if (isLayoutId(settings.layout)) setLayout(settings.layout);
        if (isAnimationId(settings.animation)) setAnimation(settings.animation);
        setPhotos(allPhotos);
      })
      .catch((err) => setMessage({ type: 'err', text: err.message }))
      .finally(() => setLoading(false));
  }, []);

  // Prefer published photos for the preview, top up with drafts if needed
  const previewPhotos = useMemo(() => {
    const published = photos.filter((p) => p.published);
    const pool = published.length >= 3 ? published : photos;
    return pool.slice(0, PREVIEW_PHOTO_COUNT);
  }, [photos]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await adminFetch<AdminSettings>('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteDisplayName, theme, layout, animation }),
      });
      setMessage({ type: 'ok', text: '網站設定已更新，前台重新整理後生效' });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : '儲存失敗' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-zinc-900">網站設定</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-6">
          {/* Brand */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800">品牌顯示</h2>
            <div className="flex max-w-xl flex-col gap-1">
              <label className="text-xs text-zinc-500" htmlFor="siteDisplayName">
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
                className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition focus:border-zinc-500 focus:outline-none disabled:opacity-50"
                placeholder="例如：CHING PHOTOGRAPHY"
              />
            </div>
          </section>

          {/* Appearance */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="mb-1 text-sm font-semibold text-zinc-800">外觀</h2>
            <p className="mb-5 text-xs text-zinc-400">
              變更會即時顯示在右側預覽，按下儲存才會套用到前台
            </p>

            {/* Theme swatches */}
            <p className="mb-2 text-xs font-medium text-zinc-600">配色主題</p>
            <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                    theme === t.id
                      ? 'border-zinc-800 ring-1 ring-zinc-800'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {/* Swatch chip rendered with the theme's own tokens */}
                  <span
                    data-theme={t.id}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas"
                  >
                    <span className="h-3.5 w-3.5 rounded-full bg-accent" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-zinc-800">
                      {t.label}
                    </span>
                    <span className="block truncate text-[10px] text-zinc-400">{t.note}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Layout */}
            <p className="mb-2 text-xs font-medium text-zinc-600">作品版型</p>
            <div className="mb-6 grid grid-cols-3 gap-2">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLayout(l.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    layout === l.id
                      ? 'border-zinc-800 ring-1 ring-zinc-800'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {/* Tiny layout glyph */}
                  <span className="mb-2 grid h-10 grid-cols-3 gap-0.5">
                    {l.id === 'masonry' && (
                      <>
                        <span className="flex flex-col gap-0.5">
                          <span className="h-5 rounded-sm bg-zinc-300" />
                          <span className="h-3 rounded-sm bg-zinc-200" />
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="h-3 rounded-sm bg-zinc-200" />
                          <span className="h-5 rounded-sm bg-zinc-300" />
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="h-4 rounded-sm bg-zinc-300" />
                          <span className="h-4 rounded-sm bg-zinc-200" />
                        </span>
                      </>
                    )}
                    {l.id === 'editorial' && (
                      <>
                        <span className="col-span-3 h-5 rounded-sm bg-zinc-300" />
                        <span className="h-4 rounded-sm bg-zinc-200" />
                        <span className="h-4 rounded-sm bg-zinc-200" />
                        <span />
                      </>
                    )}
                    {l.id === 'justified' && (
                      <>
                        <span className="col-span-2 h-4 rounded-sm bg-zinc-300" />
                        <span className="h-4 rounded-sm bg-zinc-200" />
                        <span className="h-4 rounded-sm bg-zinc-200" />
                        <span className="col-span-2 h-4 rounded-sm bg-zinc-300" />
                      </>
                    )}
                  </span>
                  <span className="block text-xs font-medium text-zinc-800">{l.label}</span>
                  <span className="block text-[10px] text-zinc-400">{l.note}</span>
                </button>
              ))}
            </div>

            {/* Animation */}
            <p className="mb-2 text-xs font-medium text-zinc-600">進場動畫</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ANIMATIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAnimation(a.id)}
                  className={`rounded-lg border p-2.5 text-left transition-colors ${
                    animation === a.id
                      ? 'border-zinc-800 ring-1 ring-zinc-800'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <span className="block text-xs font-medium text-zinc-800">{a.label}</span>
                  <span className="block text-[10px] text-zinc-400">{a.note}</span>
                </button>
              ))}
            </div>
          </section>

          {message && (
            <p
              className={`rounded border px-3 py-2 text-sm ${
                message.type === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || saving}
            className="self-start rounded bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-xs font-medium text-zinc-600">即時預覽</p>
          <AppearancePreview
            siteDisplayName={siteDisplayName || 'KEVIN PHOTOGRAPHY'}
            theme={theme}
            layout={layout}
            animation={animation}
            photos={previewPhotos}
          />
        </div>
      </form>
    </div>
  );
}
