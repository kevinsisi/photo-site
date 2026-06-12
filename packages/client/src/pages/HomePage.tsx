import { Link, useNavigate } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { fetchPhotos } from '../api';
import { BRAND_TAGLINE, BRAND_TAGLINE_EN } from '../constants';
import { CONTACT_INSTAGRAM, CONTACT_EMAIL, CONTACT_LINE } from '../constants';
import { useSiteSettings } from '../hooks/useSiteSettings';
import Gallery from '../components/Gallery';

const FEATURED_COUNT = 6;

function FeaturedWorks() {
  const { state } = useAsync(() => fetchPhotos(), []);
  const { layout } = useSiteSettings();
  const navigate = useNavigate();

  if (state.status === 'loading') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: FEATURED_COUNT }).map((_, i) => (
          <div key={i} className="aspect-[3/2] bg-surface border border-line animate-pulse" />
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="py-20 text-center text-sm text-muted-ink tracking-widest">
        作品載入失敗，請稍後再試
      </div>
    );
  }

  if (state.status !== 'success') return null;

  const photos = state.data.slice(0, FEATURED_COUNT);

  if (photos.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-muted-ink tracking-widest">
        精選作品即將上線
      </div>
    );
  }

  return (
    <Gallery
      photos={photos}
      layout={layout}
      onPhotoClick={() => navigate('/works')}
    />
  );
}

export default function HomePage() {
  const { siteDisplayName } = useSiteSettings();

  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <p className="text-xs tracking-[0.35em] text-muted-ink mb-6 uppercase">
          {BRAND_TAGLINE_EN}
        </p>
        <h1 className="text-4xl md:text-6xl font-light tracking-[0.12em] text-ink mb-6 leading-tight">
          {siteDisplayName}
        </h1>
        <p className="text-base md:text-lg text-muted-ink tracking-widest font-light mb-10">
          {BRAND_TAGLINE}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/works"
            className="inline-block px-8 py-3 bg-accent text-on-accent text-sm tracking-widest hover:opacity-85 transition-opacity duration-200"
          >
            瀏覽作品集
          </Link>
          <Link
            to="/pricing"
            className="inline-block px-8 py-3 border border-line text-ink text-sm tracking-widest hover:border-accent transition-colors duration-200"
          >
            查看價目表
          </Link>
        </div>
      </section>

      {/* Thin divider */}
      <div className="w-12 h-px bg-accent mx-auto mb-16" />

      {/* Featured works */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-xs tracking-[0.35em] text-muted-ink uppercase mb-8 text-center">
          精選作品
        </h2>
        <FeaturedWorks />
        <div className="mt-10 text-center">
          <Link
            to="/works"
            className="text-sm tracking-widest text-ink hover:text-muted-ink transition-colors border-b border-accent pb-0.5"
          >
            查看所有作品
          </Link>
        </div>
      </section>

      {/* Services entry */}
      <section className="bg-surface border-y border-line py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xs tracking-[0.35em] text-muted-ink uppercase mb-12 text-center">
            服務項目
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Link
              to="/works"
              className="group block p-8 bg-canvas border border-line hover:border-accent transition-colors duration-200"
            >
              <p className="text-xs tracking-[0.25em] text-muted-ink uppercase mb-3">Portfolio</p>
              <h3 className="text-lg font-light tracking-wide text-ink mb-2 group-hover:text-muted-ink transition-colors">
                作品集
              </h3>
              <p className="text-sm text-muted-ink leading-relaxed">
                婚禮、人像、家庭、商業攝影，瀏覽各類精彩作品。
              </p>
            </Link>
            <Link
              to="/pricing"
              className="group block p-8 bg-canvas border border-line hover:border-accent transition-colors duration-200"
            >
              <p className="text-xs tracking-[0.25em] text-muted-ink uppercase mb-3">Pricing</p>
              <h3 className="text-lg font-light tracking-wide text-ink mb-2 group-hover:text-muted-ink transition-colors">
                價目表
              </h3>
              <p className="text-sm text-muted-ink leading-relaxed">
                透明固定定價，清楚了解各方案內容與費用。
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section id="contact" className="py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-xs tracking-[0.35em] text-muted-ink uppercase mb-4">Contact</h2>
          <p className="text-2xl font-light tracking-wide text-ink mb-3">
            與我聯絡
          </p>
          <p className="text-sm text-muted-ink mb-10 leading-relaxed max-w-md mx-auto">
            有任何問題或合作邀約，歡迎透過以下方式洽詢。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-10">
            <a
              href={CONTACT_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2"
            >
              <span className="w-12 h-12 border border-line flex items-center justify-center group-hover:border-accent group-hover:bg-surface transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-ink">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="text-xs tracking-widest text-muted-ink group-hover:text-ink transition-colors">
                Instagram
              </span>
            </a>

            <a
              href={CONTACT_EMAIL}
              className="group flex flex-col items-center gap-2"
            >
              <span className="w-12 h-12 border border-line flex items-center justify-center group-hover:border-accent group-hover:bg-surface transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-ink">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m2 7 10 7 10-7" />
                </svg>
              </span>
              <span className="text-xs tracking-widest text-muted-ink group-hover:text-ink transition-colors">
                Email
              </span>
            </a>

            <a
              href={CONTACT_LINE}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2"
            >
              <span className="w-12 h-12 border border-line flex items-center justify-center group-hover:border-accent group-hover:bg-surface transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-ink">
                  <path d="M21 11.5c0 4.14-4.03 7.5-9 7.5a10.7 10.7 0 0 1-3.5-.58L3 20l1.5-3.5A7.18 7.18 0 0 1 3 11.5C3 7.36 7.03 4 12 4s9 3.36 9 7.5Z" />
                </svg>
              </span>
              <span className="text-xs tracking-widest text-muted-ink group-hover:text-ink transition-colors">
                LINE
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
