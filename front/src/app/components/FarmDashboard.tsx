import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, Legend } from 'recharts';
import { Plus, LayoutGrid, Droplets, Thermometer, ArrowLeft, TrendingUp, Package, MapPin, Calendar, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { getFarmById } from '../services/farmService';
import { getParcelas } from '../services/plotService';
import EditFarmForm from './EditFarmForm';
import { useAppContext } from '../context/AppContext';

const mockData = [
  { name: 'Lun', humedad: 4000, temperatura: 2400 },
  { name: 'Mar', humedad: 3000, temperatura: 1398 },
  { name: 'Mié', humedad: 2000, temperatura: 9800 },
  { name: 'Jue', humedad: 2780, temperatura: 3908 },
  { name: 'Vie', humedad: 1890, temperatura: 4800 },
  { name: 'Sáb', humedad: 2390, temperatura: 3800 },
  { name: 'Dom', humedad: 3490, temperatura: 4300 },
];

const monthlyData = [
  { month: "Ene", produccion: 4200, ventas: 3800 },
  { month: "Feb", produccion: 4750, ventas: 4200 },
  { month: "Mar", produccion: 5200, ventas: 4900 },
  { month: "Abr", produccion: 3800, ventas: 3500 },
  { month: "May", produccion: 5500, ventas: 5200 },
  { month: "Jun", produccion: 6200, ventas: 5800 },
];

const cropDistribution = [
  { name: "Tomates", value: 1250 },
  { name: "Maíz", value: 3500 },
  { name: "Lechugas", value: 850 },
  { name: "Zanahorias", value: 920 },
  { name: "Fresas", value: 650 },
  { name: "Pimientos", value: 780 },
];

export const FarmDashboard = () => {
  const navigate = useNavigate();
  const { farmId } = useParams<{ farmId: string }>();
  const { updateFarmInContext } = useAppContext();

  const [farm, setFarm] = useState<any | null>(null);
  const [plots, setPlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const farmData = await getFarmById(farmId!);
        setFarm(farmData);

        const farmPlots = await getParcelas({ granja_id: Number(farmId) });
        setPlots(farmPlots);
      } catch (error) {
        console.error(error);
        setError("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };

    if (farmId) fetchData();
  }, [farmId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!farm) {
    return <div className="p-8 text-center text-gray-500">Granja no encontrada</div>;
  }

  // TODO obtener info de sensores en el listado de parcelas, fecha de creacion, tipos cultivo

  // Calcular estadísticas agregadas de todas las parcelas
  const totalArea = plots.reduce(
    (sum, plot) => sum + ((plot.tamx ?? 0) * (plot.tamy ?? 0)),
    0
  );

  const totalSensors = plots.reduce(
    (sum, plot) => sum + (plot.sensores_count ?? 0),
    0
  );

  const avgProduction = Math.round(8150 / (plots.length || 1));
  const totalProduction = avgProduction * plots.length;

  const activeHarvests = Math.min(plots.length * 2, 8);
  const completedHarvests = Math.min(plots.length, 5);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <EditFarmForm 
            farm={farm}
            onSuccess={(updatedFarm) => {
              setFarm(updatedFarm);
              updateFarmInContext(updatedFarm);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}

      <div className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 cursor-pointer w-fit" onClick={() => navigate('/farms')}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a mis granjas
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{farm.nombre}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {farm.ubicacion_geo} · {plots.length} parcelas activas
            </p>
          </div>
          <button 
            onClick={() => setIsEditing(true)} 
            className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors"
            title="Editar Granja"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => navigate(`/farms/${farmId}/plots/new`)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2 -ml-1" />
          Añadir Parcela
        </button>
      </div>

      {/* Estadísticas de la Granja */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Producción Total</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalProduction.toLocaleString()} kg</div>
            <p className="text-xs text-gray-500 mt-1">Media de todas las parcelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Cosechas Activas</CardTitle>
            <Package className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{activeHarvests}</div>
            <p className="text-xs text-gray-500 mt-1">En progreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Completadas</CardTitle>
            <Calendar className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{completedHarvests}</div>
            <p className="text-xs text-gray-500 mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Área Total</CardTitle>
            <MapPin className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalArea} m²</div>
            <p className="text-xs text-gray-500 mt-1">{plots.length} parcelas · {totalSensors} sensores</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-blue-500" />
            Media de Humedad Global
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorHumedad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="humedad" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHumedad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-sm border border-green-200 p-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <Thermometer className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-sm font-medium text-green-800 mb-1">Temperatura Media</h3>
          <p className="text-4xl font-bold text-green-900 mb-2">24.5°C</p>
          <div className="text-xs text-green-700 bg-white/60 px-3 py-1.5 rounded-full inline-block mt-2">
            Condiciones óptimas
          </div>
        </div>
      </div>

      {/* Gráficos de Producción Agregada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Producción Mensual (Media)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="produccion" stroke="#16a34a" strokeWidth={2} name="Producción (kg)" />
                <Line type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={2} name="Ventas (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Cultivo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cropDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#16a34a" name="Cantidad (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <LayoutGrid className="w-6 h-6 mr-2 text-gray-400" />
        Mis Parcelas
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plots.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-500">Aún no tienes parcelas en esta granja.</p>
          </div>
        ) : (
          plots.map((plot) => (
            <div
              key={plot.id}
              onClick={() => navigate(`/farms/${farmId}/plots/${plot.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-green-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {plot.tipo_cultivo_nombre ?? 'Sin cultivo'}
                </span>
                <span className="text-xs text-gray-500">{plot.tamx}x{plot.tamy}m</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">{plot.nombre}</h3>
              <p className="text-sm text-gray-500 mb-4">{plot.sensores_count ?? 0} sensores instalados</p>

              <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-3">
                <span className="text-gray-400">Creada {new Date(plot.creado_en).toLocaleDateString()}</span>
                <span className="font-medium text-green-600 group-hover:translate-x-1 transition-transform inline-block">&rarr;</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
