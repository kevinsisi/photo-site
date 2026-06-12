import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import HomePage from './pages/HomePage';
import WorksPage from './pages/WorksPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/admin/LoginPage';
import PhotosPage from './pages/admin/PhotosPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import PlansPage from './pages/admin/PlansPage';
import SettingsPage from './pages/admin/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public site */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/works" element={<WorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Route>

        {/* Admin auth (outside AdminLayout so there's no guard loop) */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin shell — guards itself; redirects to /admin/login if not authed */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PhotosPage />} />
          <Route path="photos" element={<PhotosPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AuthProvider>
  );
}
