import React from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Warehouse, Plus, LayoutGrid } from 'lucide-react';

export const FarmList = () => {
  const { farms, plots } = useAppContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Granjas</h1>
          <p className="mt-1 text-sm text-gray-500">Bienvenido de nuevo, {user?.email}</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
          <Plus className="w-5 h-5 mr-2 -ml-1" />
          Nueva Granja
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => {
          const farmPlots = plots.filter(p => p.farmId === farm.id);
          return (
            <div 
              key={farm.id} 
              onClick={() => navigate(`/farms/${farm.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {farm.width}m x {farm.height}m
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{farm.name}</h3>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <LayoutGrid className="w-4 h-4 mr-1.5 text-gray-400" />
                    <span>{farmPlots.length} parcelas</span>
                  </div>
                  <div className="text-green-600 font-medium group-hover:underline">
                    Ver dashboard &rarr;
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
