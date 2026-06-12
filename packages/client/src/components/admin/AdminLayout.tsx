import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/admin/photos', label: '作品管理' },
  { to: '/admin/categories', label: '分類管理' },
  { to: '/admin/plans', label: '方案管理' },
  { to: '/admin/settings', label: '網站設定' },
];

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-sage-50)]">
      <div className="w-8 h-8 border-2 border-[var(--color-sage-300)] border-t-[var(--color-sage-700)] rounded-full animate-spin" />
    </div>
  );
}

export default function AdminLayout() {
  const { loggedIn, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <Spinner />;

  if (!loggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-sage-50)]">
      {/* Top bar */}
      <header className="bg-[var(--color-sage-900)] text-white h-14 flex items-center px-6 gap-6 shrink-0">
        <span className="text-xs font-semibold tracking-[0.2em] text-[var(--color-sage-200)] hidden sm:block">
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
                    ? 'bg-[var(--color-sage-700)] text-white'
                    : 'text-[var(--color-sage-300)] hover:text-white hover:bg-[var(--color-sage-800)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="ml-auto text-sm text-[var(--color-sage-300)] hover:text-white transition-colors duration-150"
        >
          登出
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
