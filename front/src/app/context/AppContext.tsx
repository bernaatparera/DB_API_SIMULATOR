import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createFarm, getFarms } from '../services/farmService';
import { CreateFarmRequest, Farm } from '../types/farm';

export type Sensor = { id: string; x: number; y: number };
export type CellState = 'normal' | 'water' | 'harvest';
export type Cell = { x: number; y: number; state: CellState; hasSensor: boolean };

export type Plot = {
  id: string;
  farmId: string;
  name: string;
  width: number;
  height: number;
  cropType: string;
  sensors: Sensor[];
  cells: Cell[];
  createdAt: string;
};

type AppContextType = {
  farms: Farm[];
  plots: Plot[];
  addFarm: (farm: CreateFarmRequest) => Promise<Farm>;
  updateFarmInContext: (updatedFarm: Farm) => void;
  addPlot: (plot: Omit<Plot, 'id' | 'cells' | 'sensors' | 'createdAt'>) => void;
  updateCellState: (plotId: string, x: number, y: number, state: CellState) => void;
};

const generateInitialCells = (width: number, height: number, sensors: Sensor[]): Cell[] => {
  const cells: Cell[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isSensor = sensors.some(s => s.x === x && s.y === y);
      const rand = Math.random();
      let state: CellState = 'normal';
      if (rand > 0.8) state = 'water';
      else if (rand > 0.9) state = 'harvest';

      cells.push({ x, y, state, hasSensor: isSensor });
    }
  }
  return cells;
};

const defaultPlots: Plot[] = [
  {
    id: 'p1',
    farmId: 'f1',
    name: 'Tomates Norte',
    width: 4,
    height: 4,
    cropType: 'Tomate',
    sensors: [{ id: 's1', x: 1, y: 1 }, { id: 's2', x: 2, y: 3 }],
    cells: generateInitialCells(4, 4, [{ id: 's1', x: 1, y: 1 }, { id: 's2', x: 2, y: 3 }]),
    createdAt: new Date().toISOString(),
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>(defaultPlots);

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

  // plots (de momento fake, luego se conectan a API)
  const addPlot = (plotData: Omit<Plot, 'id' | 'cells' | 'sensors' | 'createdAt'>) => {
    const area = plotData.width * plotData.height;
    const numSensors = Math.max(1, Math.floor(area / 4));

    const sensors: Sensor[] = [];
    const usedPositions = new Set<string>();

    for (let i = 0; i < numSensors; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * plotData.width);
        y = Math.floor(Math.random() * plotData.height);
      } while (usedPositions.has(`${x},${y}`));
      usedPositions.add(`${x},${y}`);
      sensors.push({ id: `s${Date.now()}_${i}`, x, y });
    }

    const cells = generateInitialCells(plotData.width, plotData.height, sensors);

    const newPlot: Plot = {
      ...plotData,
      id: `p${Date.now()}`,
      sensors,
      cells,
      createdAt: new Date().toISOString(),
    };

    setPlots((prev) => [...prev, newPlot]);
  };

  const updateCellState = (plotId: string, x: number, y: number, state: CellState) => {
    setPlots(currentPlots =>
      currentPlots.map(p => {
        if (p.id !== plotId) return p;
        return {
          ...p,
          cells: p.cells.map(c =>
            c.x === x && c.y === y ? { ...c, state } : c
          )
        };
      })
    );
  };

  return (
    <AppContext.Provider value={{ farms, plots, addFarm, updateFarmInContext, addPlot, updateCellState }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};