import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  fileName: string;
  previewUrl: string;
  status: UploadStatus;
  /** 0-100, real bytes-based progress */
  progress: number;
  error: string | null;
  attempts: number;
}

interface UploadManagerValue {
  items: UploadItem[];
  /** bumps every time an upload finishes — pages subscribe to refetch lists */
  completedCount: number;
  enqueue: (files: File[], categoryId: number) => void;
  retry: (id: string) => void;
  clearFinished: () => void;
}

const MAX_CONCURRENT = 2;
const UPLOAD_TIMEOUT_MS = 120_000;
const AUTO_RETRY_DELAY_MS = 2_000;
const MAX_AUTO_ATTEMPTS = 2; // first try + one automatic retry

const UploadManagerContext = createContext<UploadManagerValue | null>(null);

export function useUploadManager(): UploadManagerValue {
  const ctx = useContext(UploadManagerContext);
  if (!ctx) throw new Error('useUploadManager must be used within UploadManagerProvider');
  return ctx;
}

let nextId = 0;

export function UploadManagerProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  // Files/categories live outside React state — they never affect rendering
  const payloadRef = useRef(new Map<string, { file: File; categoryId: number }>());
  const inFlightRef = useRef(new Set<string>());

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const startUpload = useCallback(
    (id: string) => {
      const payload = payloadRef.current.get(id);
      if (!payload || inFlightRef.current.has(id)) return;
      inFlightRef.current.add(id);

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, status: 'uploading', progress: 0, error: null, attempts: it.attempts + 1 }
            : it
        )
      );

      const fd = new FormData();
      fd.append('file', payload.file);
      fd.append('categoryId', String(payload.categoryId));
      fd.append('title', '');

      // XHR instead of fetch: we need upload.onprogress for a real progress bar
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/photos');
      xhr.withCredentials = true;
      xhr.timeout = UPLOAD_TIMEOUT_MS;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          updateItem(id, { progress: Math.round((e.loaded / e.total) * 100) });
        }
      };

      const fail = (reason: string) => {
        inFlightRef.current.delete(id);
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it;
            if (it.attempts < MAX_AUTO_ATTEMPTS) {
              // Auto-retry once after a short backoff
              setTimeout(() => {
                setItems((p) =>
                  p.map((x) => (x.id === id && x.status === 'error' ? { ...x, status: 'queued' } : x))
                );
              }, AUTO_RETRY_DELAY_MS);
              return { ...it, status: 'error', error: `${reason}（自動重試中…）`, progress: 0 };
            }
            return { ...it, status: 'error', error: reason, progress: 0 };
          })
        );
      };

      xhr.onload = () => {
        inFlightRef.current.delete(id);
        if (xhr.status >= 200 && xhr.status < 300) {
          payloadRef.current.delete(id);
          updateItem(id, { status: 'done', progress: 100, error: null });
          setCompletedCount((c) => c + 1);
        } else {
          let msg = `錯誤 ${xhr.status}`;
          try {
            const body = JSON.parse(xhr.responseText) as { error?: string };
            if (body.error) msg = body.error;
          } catch {
            // keep the status-code message
          }
          fail(msg);
        }
      };
      xhr.onerror = () => fail('網路錯誤');
      xhr.ontimeout = () => fail('上傳逾時');

      xhr.send(fd);
    },
    [updateItem]
  );

  // Scheduler: whenever the queue changes, fill free slots (max 2 concurrent)
  useEffect(() => {
    const uploading = items.filter((it) => it.status === 'uploading').length;
    if (uploading >= MAX_CONCURRENT) return;
    const next = items
      .filter((it) => it.status === 'queued' && !inFlightRef.current.has(it.id))
      .slice(0, MAX_CONCURRENT - uploading);
    for (const item of next) startUpload(item.id);
  }, [items, startUpload]);

  // Warn before leaving while uploads are active (closing the tab kills them)
  useEffect(() => {
    const active = items.some((it) => it.status === 'queued' || it.status === 'uploading');
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [items]);

  const enqueue = useCallback((files: File[], categoryId: number) => {
    const newItems: UploadItem[] = files.map((file) => {
      const id = `u${++nextId}`;
      payloadRef.current.set(id, { file, categoryId });
      return {
        id,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        status: 'queued',
        progress: 0,
        error: null,
        attempts: 0,
      };
    });
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const retry = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id && it.status === 'error'
          ? { ...it, status: 'queued', attempts: 0, error: null }
          : it
      )
    );
  }, []);

  const clearFinished = useCallback(() => {
    setItems((prev) => {
      for (const it of prev) {
        if (it.status === 'done') {
          URL.revokeObjectURL(it.previewUrl);
          payloadRef.current.delete(it.id);
        }
      }
      return prev.filter((it) => it.status !== 'done');
    });
  }, []);

  return (
    <UploadManagerContext.Provider
      value={{ items, completedCount, enqueue, retry, clearFinished }}
    >
      {children}
    </UploadManagerContext.Provider>
  );
}
