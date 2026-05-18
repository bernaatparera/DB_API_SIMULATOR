import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { InstallPWABanner } from './components/InstallPWABanner';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <RouterProvider router={router} />
        <InstallPWABanner />
      </AppProvider>
    </AuthProvider>
  );
}
