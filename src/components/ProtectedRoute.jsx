import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ role, children }) {
  const { loading, isAuthenticated, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbfaf6]">
        <div className="rounded-2xl border border-emerald-900/10 bg-white px-6 py-5 text-center shadow-card">
          <p className="font-display text-lg font-bold text-emerald-900">Memuat WASATIFY...</p>
          <p className="mt-1 text-sm text-slate-500">Mengecek sesi dan role akun.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && !profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbfaf6] px-4">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-card">
          <p className="font-display text-lg font-bold text-red-700">Profil akun belum siap</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Silakan logout lalu login kembali. Jika masih terjadi, pastikan schema Supabase terbaru sudah dijalankan.</p>
        </div>
      </div>
    );
  }

  if (role && profile?.role && profile.role !== role) {
    return <Navigate to={profile.role === 'teacher' ? '/guru' : '/siswa'} replace />;
  }

  return children;
}
