import { useEffect, useCallback } from 'react';

interface LightboxProps {
  src: string;
  title: string;
  onClose: () => void;
}

export default function Lightbox({ src, title, onClose }: LightboxProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    // Prevent body scroll while open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    // Backdrop — click to close
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Content panel — stop propagation so clicking image doesn't close */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={title}
          className="max-w-full max-h-[80vh] object-contain rounded-sm shadow-2xl"
        />
        {title && (
          <p className="mt-4 text-sm tracking-widest text-white/80 text-center px-4">
            {title}
          </p>
        )}

        {/* Close button */}
        <button
          aria-label="關閉"
          onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
