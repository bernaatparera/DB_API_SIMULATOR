import React from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Sprout, LogOut, User as UserIcon } from 'lucide-react';

export const Layout = () => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Cargando sesión...</p>
      </div>
    );
  }

  if (!user && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  if (isPublicRoute) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/farms'}>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Sprout className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">AgroPrecision</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                onClick={() => navigate('/perfil')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-gray-500" />
                {user?.nombre} {user?.apellidos}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};
