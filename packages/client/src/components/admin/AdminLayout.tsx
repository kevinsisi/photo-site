import { useEffect } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UploadManagerProvider } from '../../contexts/UploadManagerContext';
import UploadPanel from './UploadPanel';

const NAV_ITEMS = [
  { to: '/admin/photos', label: '作品管理' },
  { to: '/admin/categories', label: '分類管理' },
  { to: '/admin/plans', label: '方案管理' },
  { to: '/admin/settings', label: '網站設定' },
];

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-700 rounded-full animate-spin" />
    </div>
  );
}

export default function AdminLayout() {
  const { loggedIn, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Clear public-site appearance attributes so the admin stays neutral and
  // the settings-page preview is the only element scoping theme/anim CSS.
  useEffect(() => {
    const el = document.documentElement;
    delete el.dataset.theme;
    delete el.dataset.layout;
    delete el.dataset.anim;
  }, []);

  if (loading) return <Spinner />;

  if (!loggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <UploadManagerProvider>
      <div className="min-h-screen flex flex-col bg-zinc-50">
        {/* Top bar */}
        <header className="bg-zinc-900 text-white h-14 flex items-center px-6 gap-6 shrink-0">
          <span className="text-xs font-semibold tracking-[0.2em] text-zinc-400 hidden sm:block">
            後台管理
          </span>

          <nav className="flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
                    isActive
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="ml-auto text-sm text-zinc-400 hover:text-white transition-colors duration-150"
          >
            登出
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Background upload queue — bottom-left, survives route changes */}
        <UploadPanel />
      </div>
    </UploadManagerProvider>
  );
}
