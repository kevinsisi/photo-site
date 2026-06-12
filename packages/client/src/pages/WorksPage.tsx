import { useState, useCallback } from 'react';
import { useAsync } from '../hooks/useAsync';
import { fetchCategories, fetchPhotos, type Photo } from '../api';
import Lightbox from '../components/Lightbox';

const ALL_ID = 0;

function PhotoGrid({
  activeCategoryId,
  onPhotoClick,
}: {
  activeCategoryId: number;
  onPhotoClick: (photo: Photo) => void;
}) {
  const { state, reload } = useAsync(
    () => fetchPhotos(activeCategoryId === ALL_ID ? undefined : activeCategoryId),
    [activeCategoryId]
  );

  if (state.status === 'loading') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-sage-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-[var(--color-text-secondary)] tracking-widest mb-4">
          載入失敗
        </p>
        <button
          onClick={reload}
          className="text-xs tracking-widest text-sage-600 underline underline-offset-4"
        >
          重新載入
        </button>
      </div>
    );
  }

  if (state.status !== 'success') return null;

  const photos = state.data;

  if (photos.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-[var(--color-text-secondary)] tracking-widest">
          作品即將上線，敬請期待
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
      {photos.map((photo) => (
        <button
          key={photo.id}
          onClick={() => onPhotoClick(photo)}
          className="group relative aspect-square overflow-hidden bg-sage-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
          aria-label={`查看大圖：${photo.title}`}
        >
          <img
            src={photo.thumbUrl}
            alt={photo.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Sage green label bar on hover */}
          <div className="absolute bottom-0 left-0 right-0 bg-sage-600/90 py-2 px-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <p className="text-white text-xs tracking-widest truncate">{photo.title}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function WorksPage() {
  const [activeCategoryId, setActiveCategoryId] = useState<number>(ALL_ID);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  const { state: categoriesState } = useAsync(() => fetchCategories(), []);

  const handlePhotoClick = useCallback((photo: Photo) => {
    setLightboxPhoto(photo);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxPhoto(null);
  }, []);

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <h1 className="text-xs tracking-[0.35em] text-sage-500 uppercase mb-2 text-center">
          Portfolio
        </h1>
        <p className="text-2xl md:text-3xl font-light tracking-wide text-center text-[var(--color-text-primary)] mb-10">
          作品集
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveCategoryId(ALL_ID)}
            className={`px-5 py-2 text-xs tracking-widest border transition-colors duration-150 ${
              activeCategoryId === ALL_ID
                ? 'bg-sage-600 text-white border-sage-600'
                : 'border-sage-200 text-[var(--color-text-secondary)] hover:border-sage-400 hover:text-sage-700'
            }`}
          >
            全部
          </button>

          {categoriesState.status === 'loading' &&
            Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="inline-block px-5 py-2 bg-sage-100 animate-pulse w-16" />
            ))}

          {categoriesState.status === 'success' &&
            categoriesState.data.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-5 py-2 text-xs tracking-widest border transition-colors duration-150 ${
                  activeCategoryId === cat.id
                    ? 'bg-sage-600 text-white border-sage-600'
                    : 'border-sage-200 text-[var(--color-text-secondary)] hover:border-sage-400 hover:text-sage-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </section>

      {/* Photo grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <PhotoGrid
          activeCategoryId={activeCategoryId}
          onPhotoClick={handlePhotoClick}
        />
      </section>

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox
          src={lightboxPhoto.mediumUrl}
          title={lightboxPhoto.title}
          onClose={handleCloseLightbox}
        />
      )}
    </>
  );
}
