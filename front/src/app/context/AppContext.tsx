import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createFarm, getFarms } from '../services/farmService';
import { CreateFarmRequest, Farm } from '../types/farm';

type AppContextType = {
  farms: Farm[];
  addFarm: (farm: CreateFarmRequest) => Promise<Farm>;
  updateFarmInContext: (updatedFarm: Farm) => void;
  removeFarmFromContext: (farmId: number) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [farms, setFarms] = useState<Farm[]>([]);

  // cargar farms desde API
  useEffect(() => {
    const loadFarms = async () => {
      try {
        const data = await getFarms();
        setFarms(data);
      } catch (err) {
        console.error("Error cargando granjas", err);
      }
    };

    loadFarms();
  }, []);

  // crear farm (API + estado)
  const addFarm = async (farmData: CreateFarmRequest): Promise<Farm> => {
    const newFarm = await createFarm(farmData);
    setFarms((prev) => [...prev, newFarm]);
    return newFarm;
  };

  const updateFarmInContext = (updatedFarm: Farm) => {
    setFarms(currentFarms =>
      currentFarms.map(f => (f.id === updatedFarm.id ? updatedFarm : f))
    );
  };

  const removeFarmFromContext = (farmId: number) => {
    setFarms(currentFarms => currentFarms.filter(f => f.id !== farmId));
  };

  return (
    <AppContext.Provider value={{ farms, addFarm, updateFarmInContext, removeFarmFromContext }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};