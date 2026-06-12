import { Link } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { fetchPhotos, type Photo } from '../api';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_TAGLINE_EN } from '../constants';
import { CONTACT_INSTAGRAM, CONTACT_EMAIL, CONTACT_LINE } from '../constants';

const FEATURED_COUNT = 6;

function FeaturedPhotoGrid() {
  const { state } = useAsync(() => fetchPhotos(), []);

  if (state.status === 'loading') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
        {Array.from({ length: FEATURED_COUNT }).map((_, i) => (
          <div key={i} className="aspect-square bg-sage-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="py-20 text-center text-sm text-[var(--color-text-secondary)] tracking-widest">
        作品載入失敗，請稍後再試
      </div>
    );
  }

  if (state.status !== 'success') return null;

  const photos = state.data.slice(0, FEATURED_COUNT);

  if (photos.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-[var(--color-text-secondary)] tracking-widest">
        精選作品即將上線
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
      {photos.map((photo: Photo) => (
        <Link
          to="/works"
          key={photo.id}
          className="group block aspect-square overflow-hidden bg-sage-50"
        >
          <img
            src={photo.thumbUrl}
            alt={photo.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <p className="text-xs tracking-[0.35em] text-sage-500 mb-6 uppercase">
          {BRAND_TAGLINE_EN}
        </p>
        <h1 className="text-4xl md:text-6xl font-light tracking-[0.12em] text-[var(--color-text-primary)] mb-6 leading-tight">
          {BRAND_NAME}
        </h1>
        <p className="text-base md:text-lg text-[var(--color-text-secondary)] tracking-widest font-light mb-10">
          {BRAND_TAGLINE}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/works"
            className="inline-block px-8 py-3 bg-sage-600 text-white text-sm tracking-widest hover:bg-sage-700 transition-colors duration-200"
          >
            瀏覽作品集
          </Link>
          <Link
            to="/pricing"
            className="inline-block px-8 py-3 border border-sage-300 text-sage-700 text-sm tracking-widest hover:bg-sage-50 transition-colors duration-200"
          >
            查看價目表
          </Link>
        </div>
      </section>

      {/* Thin divider */}
      <div className="w-12 h-px bg-sage-300 mx-auto mb-16" />

      {/* Featured works */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-xs tracking-[0.35em] text-sage-500 uppercase mb-8 text-center">
          精選作品
        </h2>
        <FeaturedPhotoGrid />
        <div className="mt-8 text-center">
          <Link
            to="/works"
            className="text-sm tracking-widest text-sage-600 hover:text-sage-800 transition-colors border-b border-sage-300 pb-0.5"
          >
            查看所有作品
          </Link>
        </div>
      </section>

      {/* Services entry */}
      <section className="bg-sage-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xs tracking-[0.35em] text-sage-500 uppercase mb-12 text-center">
            服務項目
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Link
              to="/works"
              className="group block p-8 bg-white border border-sage-100 hover:border-sage-300 transition-colors duration-200"
            >
              <p className="text-xs tracking-[0.25em] text-sage-500 uppercase mb-3">Portfolio</p>
              <h3 className="text-lg font-light tracking-wide text-[var(--color-text-primary)] mb-2 group-hover:text-sage-700 transition-colors">
                作品集
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                婚禮、人像、家庭、商業攝影，瀏覽各類精彩作品。
              </p>
            </Link>
            <Link
              to="/pricing"
              className="group block p-8 bg-white border border-sage-100 hover:border-sage-300 transition-colors duration-200"
            >
              <p className="text-xs tracking-[0.25em] text-sage-500 uppercase mb-3">Pricing</p>
              <h3 className="text-lg font-light tracking-wide text-[var(--color-text-primary)] mb-2 group-hover:text-sage-700 transition-colors">
                價目表
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                透明固定定價，清楚了解各方案內容與費用。
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact section (3.5) */}
      <section id="contact" className="py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-xs tracking-[0.35em] text-sage-500 uppercase mb-4">Contact</h2>
          <p className="text-2xl font-light tracking-wide text-[var(--color-text-primary)] mb-3">
            與我聯絡
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mb-10 leading-relaxed max-w-md mx-auto">
            有任何問題或合作邀約，歡迎透過以下方式洽詢。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-10">
            <a
              href={CONTACT_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2"
            >
              <span className="w-12 h-12 border border-sage-200 flex items-center justify-center group-hover:border-sage-400 group-hover:bg-sage-50 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-sage-600">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="text-xs tracking-widest text-[var(--color-text-secondary)] group-hover:text-sage-600 transition-colors">
                Instagram
              </span>
            </a>

            <a
              href={CONTACT_EMAIL}
              className="group flex flex-col items-center gap-2"
            >
              <span className="w-12 h-12 border border-sage-200 flex items-center justify-center group-hover:border-sage-400 group-hover:bg-sage-50 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-sage-600">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m2 7 10 7 10-7" />
                </svg>
              </span>
              <span className="text-xs tracking-widest text-[var(--color-text-secondary)] group-hover:text-sage-600 transition-colors">
                Email
              </span>
            </a>

            <a
              href={CONTACT_LINE}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2"
            >
              <span className="w-12 h-12 border border-sage-200 flex items-center justify-center group-hover:border-sage-400 group-hover:bg-sage-50 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-sage-600">
                  <path d="M21 11.5c0 4.14-4.03 7.5-9 7.5a10.7 10.7 0 0 1-3.5-.58L3 20l1.5-3.5A7.18 7.18 0 0 1 3 11.5C3 7.36 7.03 4 12 4s9 3.36 9 7.5Z" />
                </svg>
              </span>
              <span className="text-xs tracking-widest text-[var(--color-text-secondary)] group-hover:text-sage-600 transition-colors">
                LINE
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
