import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { FarmList } from './components/FarmList';
import { FarmDashboard } from './components/FarmDashboard';
import { NewPlotForm } from './components/NewPlotForm';
import { PlotDashboard } from './components/PlotDashboard';
import { RegisterPage } from './components/RegisterPage';
import { NewFarmForm } from './components/NewFarmForm';
import { LandingPage } from './components/LandingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <Layout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/farms', element: <FarmList /> },
      { path: '/farms/new', element: <NewFarmForm /> },
      { path: '/farms/:farmId', element: <FarmDashboard /> },
      { path: '/farms/:farmId/plots/new', element: <NewPlotForm /> },
      { path: '/farms/:farmId/plots/:plotId', element: <PlotDashboard /> },
    ],
  },
]);
