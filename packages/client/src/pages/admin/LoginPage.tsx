import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BRAND_NAME } from '../../constants';

export default function LoginPage() {
  const { loggedIn, loading, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && loggedIn) {
      navigate('/admin/photos', { replace: true });
    }
  }, [loggedIn, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/admin/photos', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-sage-50)]">
        <div className="w-8 h-8 border-2 border-[var(--color-sage-300)] border-t-[var(--color-sage-700)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-sage-50)] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <p className="text-center text-xs font-semibold tracking-[0.25em] text-[var(--color-sage-800)] mb-8">
          {BRAND_NAME}
        </p>

        <div className="bg-white border border-[var(--color-sage-200)] rounded-lg p-8 shadow-sm">
          <h1 className="text-lg font-medium text-[var(--color-sage-900)] mb-6 text-center">
            後台登入
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="username"
                className="text-xs font-medium text-[var(--color-sage-700)] tracking-wide"
              >
                帳號
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={submitting}
                className="border border-[var(--color-sage-200)] rounded px-3 py-2 text-sm text-[var(--color-text-primary)] bg-white placeholder-[var(--color-sage-300)] focus:outline-none focus:border-[var(--color-sage-500)] focus:ring-1 focus:ring-[var(--color-sage-300)] transition disabled:opacity-50"
                placeholder="請輸入帳號"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-xs font-medium text-[var(--color-sage-700)] tracking-wide"
              >
                密碼
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                className="border border-[var(--color-sage-200)] rounded px-3 py-2 text-sm text-[var(--color-text-primary)] bg-white placeholder-[var(--color-sage-300)] focus:outline-none focus:border-[var(--color-sage-500)] focus:ring-1 focus:ring-[var(--color-sage-300)] transition disabled:opacity-50"
                placeholder="請輸入密碼"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 bg-[var(--color-sage-700)] hover:bg-[var(--color-sage-800)] text-white text-sm font-medium rounded px-4 py-2.5 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
              )}
              {submitting ? '登入中...' : '登入'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
