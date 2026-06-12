import type { Photo } from '../api';
import type { LayoutId } from '../appearance';
import { useReveal } from '../hooks/useReveal';
import { useContainerWidth } from '../hooks/useContainerWidth';
import {
  justifiedRows,
  justifiedTargetHeight,
  masonryColumnCount,
  masonryColumns,
  photoRatio,
} from '../utils/galleryLayout';

interface GalleryProps {
  photos: Photo[];
  layout: LayoutId;
  onPhotoClick: (photo: Photo) => void;
}

function staggerStyle(index: number, extra?: React.CSSProperties): React.CSSProperties {
  return {
    '--reveal-delay': `${(index % 6) * 0.08}s`,
    ...extra,
  } as React.CSSProperties;
}

function PhotoTile({
  photo,
  index,
  onClick,
  revealRef,
  style,
  className = '',
}: {
  photo: Photo;
  index: number;
  onClick: () => void;
  revealRef: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <button
      ref={revealRef}
      onClick={onClick}
      style={staggerStyle(index, style)}
      className={`reveal-item group relative block w-full overflow-hidden bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
      aria-label={`查看大圖：${photo.title || '作品'}`}
    >
      <img
        src={photo.thumbUrl}
        alt={photo.title}
        loading="lazy"
        className="block w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {photo.title && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2.5 pt-8 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="block truncate text-xs tracking-[0.2em] text-white/90">
            {photo.title}
          </span>
        </span>
      )}
    </button>
  );
}

function MasonryGallery({ photos, onPhotoClick }: Omit<GalleryProps, 'layout'>) {
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const revealRef = useReveal();
  const columnCount = width > 0 ? masonryColumnCount(width) : 0;
  const columns = columnCount > 0 ? masonryColumns(photos, columnCount) : [];

  return (
    <div ref={ref} className="flex gap-3 md:gap-4">
      {columns.map((column, ci) => (
        <div key={ci} className="flex flex-1 flex-col gap-3 md:gap-4">
          {column.map((photo, pi) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              index={ci + pi * columns.length}
              onClick={() => onPhotoClick(photo)}
              revealRef={revealRef}
              style={{ aspectRatio: String(photoRatio(photo)) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function JustifiedGallery({ photos, onPhotoClick }: Omit<GalleryProps, 'layout'>) {
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const revealRef = useReveal();
  const gap = width < 640 ? 8 : 12;
  const rows =
    width > 0 ? justifiedRows(photos, width, justifiedTargetHeight(width), gap) : [];

  let runningIndex = 0;
  return (
    <div ref={ref} className="flex flex-col" style={{ gap }}>
      {rows.map((row, ri) => (
        <div key={ri} className="flex" style={{ gap }}>
          {row.map((item) => {
            const index = runningIndex++;
            return (
              <PhotoTile
                key={item.photo.id}
                photo={item.photo}
                index={index}
                onClick={() => onPhotoClick(item.photo)}
                revealRef={revealRef}
                style={{
                  width: item.width,
                  height: item.height,
                  flex: '0 0 auto',
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EditorialGallery({ photos, onPhotoClick }: Omit<GalleryProps, 'layout'>) {
  const revealRef = useReveal();

  // Fixed exhibition rhythm: full-width piece, then a staggered pair, repeat
  const groups: Photo[][] = [];
  let i = 0;
  while (i < photos.length) {
    if (groups.length % 2 === 0) {
      groups.push([photos[i]]);
      i += 1;
    } else {
      groups.push(photos.slice(i, i + 2));
      i += 2;
    }
  }

  let runningIndex = 0;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-16 md:gap-24">
      {groups.map((group, gi) =>
        group.length === 1 ? (
          <figure key={`g${gi}`}>
            <PhotoTile
              photo={group[0]}
              index={runningIndex++}
              onClick={() => onPhotoClick(group[0])}
              revealRef={revealRef}
              style={{ aspectRatio: String(photoRatio(group[0])) }}
            />
            {group[0].title && (
              <figcaption className="reveal-caption mt-3 text-[11px] uppercase tracking-[0.25em] text-muted-ink">
                {group[0].title}
              </figcaption>
            )}
          </figure>
        ) : (
          <div key={`g${gi}`} className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
            {group.map((photo, pi) => (
              <figure key={photo.id} className={pi === 1 ? 'md:mt-20' : ''}>
                <PhotoTile
                  photo={photo}
                  index={runningIndex++}
                  onClick={() => onPhotoClick(photo)}
                  revealRef={revealRef}
                  style={{ aspectRatio: String(photoRatio(photo)) }}
                />
                {photo.title && (
                  <figcaption className="reveal-caption mt-3 text-[11px] uppercase tracking-[0.25em] text-muted-ink">
                    {photo.title}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function Gallery({ photos, layout, onPhotoClick }: GalleryProps) {
  if (layout === 'justified') {
    return <JustifiedGallery photos={photos} onPhotoClick={onPhotoClick} />;
  }
  if (layout === 'editorial') {
    return <EditorialGallery photos={photos} onPhotoClick={onPhotoClick} />;
  }
  return <MasonryGallery photos={photos} onPhotoClick={onPhotoClick} />;
}
