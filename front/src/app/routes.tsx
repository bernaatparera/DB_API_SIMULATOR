import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { FarmList } from './components/FarmList';
import { FarmDashboard } from './components/FarmDashboard';
import { NewPlotForm } from './components/NewPlotForm';
import { PlotDashboard } from './components/PlotDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/farms" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'farms', element: <FarmList /> },
      { path: 'farms/:farmId', element: <FarmDashboard /> },
      { path: 'farms/:farmId/plots/new', element: <NewPlotForm /> },
      { path: 'farms/:farmId/plots/:plotId', element: <PlotDashboard /> },
    ],
  },
]);
