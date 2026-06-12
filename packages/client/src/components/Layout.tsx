import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BRAND_NAME, APP_VERSION, CONTACT_INSTAGRAM, CONTACT_EMAIL, CONTACT_LINE } from '../constants';

const NAV_LINKS = [
  { to: '/', label: '首頁', exact: true },
  { to: '/works', label: '作品集', exact: false },
  { to: '/pricing', label: '價目表', exact: false },
  { to: '/#contact', label: '聯絡', exact: false },
];

function NavItem({
  to,
  label,
  exact,
  onClick,
}: {
  to: string;
  label: string;
  exact: boolean;
  onClick?: () => void;
}) {
  const location = useLocation();
  // For anchor links like /#contact, match by pathname only
  const isHashLink = to.includes('#');
  const isActive = isHashLink
    ? location.pathname === '/'
    : exact
    ? location.pathname === to
    : location.pathname.startsWith(to);

  if (isHashLink) {
    return (
      <a
        href={to}
        onClick={onClick}
        className={`text-sm tracking-widest transition-colors duration-200 ${
          isActive
            ? 'text-sage-700 border-b border-sage-500'
            : 'text-[var(--color-text-secondary)] hover:text-sage-600'
        }`}
      >
        {label}
      </a>
    );
  }

  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive: navActive }) =>
        `text-sm tracking-widest transition-colors duration-200 ${
          navActive
            ? 'text-sage-700 border-b border-sage-500'
            : 'text-[var(--color-text-secondary)] hover:text-sage-600'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-sage-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="text-xs font-semibold tracking-[0.25em] text-sage-800 hover:text-sage-600 transition-colors"
          >
            {BRAND_NAME}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            aria-label={menuOpen ? '關閉選單' : '開啟選單'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center items-center w-11 h-11 gap-1.5 focus:outline-none"
          >
            <span
              className={`block w-6 h-px bg-sage-700 transition-transform duration-200 origin-center ${
                menuOpen ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />
            <span
              className={`block w-6 h-px bg-sage-700 transition-opacity duration-200 ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-px bg-sage-700 transition-transform duration-200 origin-center ${
                menuOpen ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex flex-col border-t border-sage-100 bg-white">
            {NAV_LINKS.map((link) => (
              <NavItem
                key={link.to}
                {...link}
                onClick={() => setMenuOpen(false)}
              />
            ))}
          </nav>
          {/* Spacer to give each item breathing room */}
          <style>{`
            nav a { display: block; padding: 0.875rem 1.5rem; }
          `}</style>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-sage-100 py-10 mt-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs tracking-[0.2em] text-sage-800 font-semibold">
            {BRAND_NAME}
          </p>

          <div className="flex items-center gap-6">
            <a
              href={CONTACT_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-widest text-[var(--color-text-secondary)] hover:text-sage-600 transition-colors"
            >
              Instagram
            </a>
            <a
              href={CONTACT_EMAIL}
              className="text-xs tracking-widest text-[var(--color-text-secondary)] hover:text-sage-600 transition-colors"
            >
              Email
            </a>
            <a
              href={CONTACT_LINE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-widest text-[var(--color-text-secondary)] hover:text-sage-600 transition-colors"
            >
              LINE
            </a>
          </div>

          <p className="text-xs text-sage-300 tabular-nums">v{APP_VERSION}</p>
        </div>
      </footer>
    </div>
  );
}
