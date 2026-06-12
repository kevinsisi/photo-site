import { useEffect, useRef, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { fetchCategories, fetchPhotos, type Photo } from '../api';
import { useSiteSettings } from '../hooks/useSiteSettings';
import Gallery from '../components/Gallery';
import Lightbox from '../components/Lightbox';

const ALL_ID = 0;
const FADE_MS = 220;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Keeps the previous photo set on screen and crossfades when the category
 * changes: fade out (FADE_MS) runs concurrently with the fetch, then the
 * new set fades in with its entrance animations.
 */
function usePhotosWithCrossfade(categoryId: number) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [fading, setFading] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  useEffect(() => {
    const id = ++requestIdRef.current;
    setError('');
    const hasContent = photos !== null;
    if (hasContent) setFading(true);

    Promise.all([
      fetchPhotos(categoryId === ALL_ID ? undefined : categoryId),
      hasContent ? delay(FADE_MS) : Promise.resolve(),
    ])
      .then(([data]) => {
        if (requestIdRef.current !== id) return;
        setPhotos(data);
        setFading(false);
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== id) return;
        setError(err instanceof Error ? err.message : String(err));
        setFading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  return { photos, fading, error };
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-xs tracking-widest border transition-colors duration-200 ${
        active
          ? 'bg-accent text-on-accent border-accent'
          : 'border-line text-muted-ink hover:border-accent hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

export default function WorksPage() {
  const [activeCategoryId, setActiveCategoryId] = useState<number>(ALL_ID);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { layout } = useSiteSettings();

  const { state: categoriesState } = useAsync(() => fetchCategories(), []);
  const { photos, fading, error } = usePhotosWithCrossfade(activeCategoryId);

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <h1 className="text-xs tracking-[0.35em] text-muted-ink uppercase mb-2 text-center">
          Portfolio
        </h1>
        <p className="text-2xl md:text-3xl font-light tracking-wide text-center text-ink mb-10">
          作品集
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <FilterButton
            active={activeCategoryId === ALL_ID}
            label="全部"
            onClick={() => setActiveCategoryId(ALL_ID)}
          />

          {categoriesState.status === 'loading' &&
            Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="inline-block px-5 py-2 bg-surface border border-line animate-pulse w-16" />
            ))}

          {categoriesState.status === 'success' &&
            categoriesState.data.map((cat) => (
              <FilterButton
                key={cat.id}
                active={activeCategoryId === cat.id}
                label={cat.name}
                onClick={() => setActiveCategoryId(cat.id)}
              />
            ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        {error && (
          <div className="py-24 text-center">
            <p className="text-sm text-muted-ink tracking-widest">載入失敗：{error}</p>
          </div>
        )}

        {!error && photos === null && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/2] bg-surface border border-line animate-pulse" />
            ))}
          </div>
        )}

        {!error && photos !== null && photos.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-sm text-muted-ink tracking-widest">
              作品即將上線，敬請期待
            </p>
          </div>
        )}

        {!error && photos !== null && photos.length > 0 && (
          <div className={`gallery-stage ${fading ? 'is-fading' : ''}`}>
            <Gallery
              key={activeCategoryId}
              photos={photos}
              layout={layout}
              onPhotoClick={(photo) =>
                setLightboxIndex(photos.findIndex((p) => p.id === photo.id))
              }
            />
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && photos && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
