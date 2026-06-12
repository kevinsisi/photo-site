import { useState } from 'react';
import { useUploadManager, type UploadItem } from '../../contexts/UploadManagerContext';

function StatusIcon({ item }: { item: UploadItem }) {
  if (item.status === 'done') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-emerald-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    );
  }
  if (item.status === 'error') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-red-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
    );
  }
  if (item.status === 'uploading') {
    return (
      <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
    );
  }
  return <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-300" />;
}

/**
 * Google Drive style upload panel pinned to the bottom-left corner.
 * Lives in AdminLayout so it survives route changes within the admin SPA.
 */
export default function UploadPanel() {
  const { items, retry, clearFinished } = useUploadManager();
  const [collapsed, setCollapsed] = useState(false);

  if (items.length === 0) return null;

  const doneCount = items.filter((it) => it.status === 'done').length;
  const errorCount = items.filter((it) => it.status === 'error').length;
  const activeCount = items.length - doneCount - errorCount;
  const totalProgress = Math.round(
    items.reduce((sum, it) => sum + (it.status === 'done' ? 100 : it.progress), 0) / items.length
  );

  const title =
    activeCount > 0
      ? `上傳中 ${doneCount}/${items.length}（${totalProgress}%）`
      : errorCount > 0
      ? `完成，${errorCount} 個失敗`
      : `已完成 ${doneCount} 個上傳`;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5 text-white">
        <span className="text-xs font-medium tracking-wide">{title}</span>
        <div className="flex items-center gap-1">
          {doneCount > 0 && activeCount === 0 && (
            <button
              onClick={clearFinished}
              className="rounded px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              清除完成
            </button>
          )}
          <button
            aria-label={collapsed ? '展開' : '收合'}
            onClick={() => setCollapsed((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Aggregate progress strip (always visible, even collapsed) */}
      <div className="h-0.5 bg-zinc-100">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      {/* Item list */}
      {!collapsed && (
        <ul className="max-h-72 divide-y divide-zinc-100 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
              <img
                src={item.previewUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-zinc-700">{item.fileName}</p>
                {item.status === 'error' ? (
                  <p className="mt-0.5 truncate text-[11px] text-red-500">{item.error}</p>
                ) : (
                  <div className="mt-1.5 h-1 rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full transition-[width] duration-200 ${
                        item.status === 'done' ? 'bg-emerald-500' : 'bg-zinc-500'
                      }`}
                      style={{ width: `${item.status === 'done' ? 100 : item.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <StatusIcon item={item} />
              {item.status === 'error' && (
                <button
                  onClick={() => retry(item.id)}
                  className="shrink-0 rounded border border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-900"
                >
                  重試
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
