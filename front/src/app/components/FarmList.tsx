import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Warehouse, Plus, LayoutGrid, Trash2 } from 'lucide-react';
import { getParcelas } from '../services/plotService';
import { deleteFarm } from '../services/farmService';
import { ConfirmDialog } from './ConfirmDialog';
import { ParcelaRead } from '../types/plot';

export const FarmList = () => {
  const { farms, removeFarmFromContext } = useAppContext();
  const [allPlots, setAllPlots] = useState<ParcelaRead[]>([]);
  const [pendingDeleteFarmId, setPendingDeleteFarmId] = useState<number | null>(null);
  const [isDeletingFarm, setIsDeletingFarm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const plotsData = await getParcelas();
        setAllPlots(plotsData);
      } catch (err) {
        console.error("Error al cargar parcelas en FarmList", err);
      }
    };
    fetchPlots();
  }, []);

  const handleDeleteFarm = async () => {
    if (!pendingDeleteFarmId) return;
    setIsDeletingFarm(true);
    try {
      await deleteFarm(pendingDeleteFarmId);
      removeFarmFromContext(pendingDeleteFarmId);
      setPendingDeleteFarmId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingFarm(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <ConfirmDialog
        open={pendingDeleteFarmId !== null}
        title="Eliminar granja"
        description="¿Seguro que quieres eliminar esta granja? Esta acción no se puede deshacer."
        loading={isDeletingFarm}
        onConfirm={() => void handleDeleteFarm()}
        onCancel={() => setPendingDeleteFarmId(null)}
      />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Granjas</h1>
          <p className="mt-1 text-sm text-gray-500">Bienvenido de nuevo, {user?.email}</p>
        </div>
        <button onClick={() => navigate("/farms/new")} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
          <Plus className="w-5 h-5 mr-2 -ml-1" />
          Nueva Granja
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 rounded-full">
              <Warehouse className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Aún no tienes granjas
          </h2>

          <p className="text-gray-500 mb-6">
            Crea tu primera granja para empezar a gestionar tus cultivos 🌱
          </p>

          <button
            onClick={() => navigate("/farms/new")}
            className="inline-flex items-center px-5 py-3 rounded-lg text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear primera granja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => {
            const farmPlots = allPlots.filter(p => p.granja_id === farm.id);

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
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">{farm.ubicacion_geo}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteFarmId(farm.id); }}
                        disabled={isDeletingFarm}
                        className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Eliminar granja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {farm.nombre}
                  </h3>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <LayoutGrid className="w-4 h-4 mr-1.5 text-gray-400" />
                      <span>{farmPlots.length} parcelas</span>
                    </div>
                    <div className="text-green-600 font-medium group-hover:underline">
                      Ver dashboard →
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
