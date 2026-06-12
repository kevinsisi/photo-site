import { useEffect, useCallback } from 'react';
import type { Photo } from '../api';

interface LightboxProps {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

export default function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const count = photos.length;
  const photo = photos[index];

  const goPrev = useCallback(
    () => onNavigate((index - 1 + count) % count),
    [index, count, onNavigate]
  );
  const goNext = useCallback(
    () => onNavigate((index + 1) % count),
    [index, count, onNavigate]
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  if (!photo) return null;

  return (
    <div
      className="lightbox-backdrop fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ background: 'var(--overlay)' }}
      onClick={onClose}
    >
      {/* Prev */}
      {count > 1 && (
        <button
          aria-label="上一張"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center text-white/60 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Content panel — stop propagation so clicking image doesn't close */}
      <div
        key={photo.id}
        className="lightbox-content relative flex max-h-[90vh] max-w-[90vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.mediumUrl}
          alt={photo.title}
          className="max-h-[80vh] max-w-full rounded-sm object-contain shadow-2xl"
        />
        <div className="mt-4 flex items-baseline gap-4 px-4">
          {photo.title && (
            <p className="text-sm tracking-[0.2em] text-white/85">{photo.title}</p>
          )}
          <p className="text-xs tabular-nums tracking-widest text-white/50">
            {index + 1} / {count}
          </p>
        </div>

        {/* Close button */}
        <button
          aria-label="關閉"
          onClick={onClose}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center text-white/70 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Next */}
      {count > 1 && (
        <button
          aria-label="下一張"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center text-white/60 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
