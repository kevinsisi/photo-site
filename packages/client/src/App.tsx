import { Routes, Route } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-white text-[var(--color-text-primary)]">
      <h1 className="text-2xl font-semibold text-sage-700">Photo Site</h1>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
