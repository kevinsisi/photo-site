import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import WorksPage from './pages/WorksPage';
import PricingPage from './pages/PricingPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/works" element={<WorksPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        {/* Catch-all: redirect unknown routes back to home */}
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
