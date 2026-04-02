import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Droplet, Activity, RefreshCw, TrendingUp, Package, MapPin, Calendar, CheckCircle2, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const mockTrendData = [
  { time: '00:00', humedad: 45, temp: 18 },
  { time: '04:00', humedad: 42, temp: 16 },
  { time: '08:00', humedad: 38, temp: 22 },
  { time: '12:00', humedad: 30, temp: 28 },
  { time: '16:00', humedad: 35, temp: 26 },
  { time: '20:00', humedad: 40, temp: 20 },
  { time: '24:00', humedad: 45, temp: 18 },
];

const CROP_ICONS: Record<string, string> = {
  'Tomate': '🍅',
  'Lechuga': '🥬',
  'Zanahoria': '🥕',
  'Patata': '🥔',
  'Cebolla': '🧅',
};

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

export const PlotDashboard = () => {
  const { farmId, plotId } = useParams<{ farmId: string; plotId: string }>();
  const navigate = useNavigate();
  const { plots, updateCellState } = useAppContext();
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [isAddingSensor, setIsAddingSensor] = useState(false);

  const plot = plots.find(p => p.id === plotId);

  if (!plot) return <div className="p-8 text-center text-gray-500">Parcela no encontrada</div>;

  const cropIcon = CROP_ICONS[plot.cropType] || '🌱';
  const totalProduction = 8150;
  const activeHarvests = 2;
  const completedHarvests = 2;

  const handleCellClick = (x: number, y: number) => {
    if (isAddingSensor) {
      // Añadir sensor a la celda
      const cell = plot.cells.find(c => c.x === x && c.y === y);
      if (cell && !cell.hasSensor) {
        // Aquí podrías llamar a una función del contexto para añadir el sensor
        alert(`Sensor añadido en posición (${x}, ${y})`);
      }
      setIsAddingSensor(false);
    } else {
      // Seleccionar celda
      setSelectedCell({ x, y });
    }
  };

  const selectedCellData = selectedCell ? plot.cells.find(c => c.x === selectedCell.x && c.y === selectedCell.y) : null;

  const getStatusBorder = (cell: typeof plot.cells[0], isSelected: boolean) => {
    if (isSelected) return "border-4 border-blue-500 shadow-lg";
    
    switch (cell.state) {
      case "harvest":
        return "border-2 border-green-500 shadow-md";
      case "water":
        return "border-2 border-yellow-500 shadow-sm";
      case "normal":
        return "border border-gray-300";
      default:
        return "border border-gray-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 cursor-pointer w-fit" onClick={() => navigate(`/farms/${farmId}`)}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a la granja
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{plot.name}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <span className="mr-1.5 text-base">{cropIcon}</span> {plot.cropType}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Cuadrícula {plot.width}x{plot.height}m · {plot.sensors.length} Sensores activos
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sincronizar Sensores
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Producción Total</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalProduction.toLocaleString()} kg</div>
            <p className="text-xs text-gray-500 mt-1">Este mes</p>
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
            <CardTitle className="text-sm">Área Cultivada</CardTitle>
            <MapPin className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{plot.width * plot.height} m²</div>
            <p className="text-xs text-gray-500 mt-1">{plot.width}x{plot.height}m</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Mapa del Cultivo</h2>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setIsAddingSensor(!isAddingSensor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isAddingSensor 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                {isAddingSensor ? 'Cancelar' : 'Añadir Sensor'}
              </button>
              <div className="flex gap-4 text-xs border-l pl-3 ml-1 border-gray-300">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-1.5 ring-2 ring-offset-1 ring-blue-200"></span> Regar</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-1.5 ring-2 ring-offset-1 ring-orange-200"></span> Cosechar</span>
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-gradient-to-br from-green-50/50 to-emerald-50/30 flex justify-center">
            {/* Grid del huerto centrado */}
            <div 
              className="grid gap-2 relative"
              style={{ 
                gridTemplateColumns: `repeat(${plot.width}, minmax(0, 1fr))`,
              }}
            >
              {plot.cells.map((cell) => {
                const isSelected = selectedCell?.x === cell.x && selectedCell?.y === cell.y;
                
                // Patrón de tablero de ajedrez
                const isEvenRow = cell.y % 2 === 0;
                const isEvenCol = cell.x % 2 === 0;
                const isLightSquare = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol);
                
                let baseColor = isLightSquare ? "bg-green-50" : "bg-green-100";
                
                // Colores según el estado
                if (cell.state === 'water') {
                  baseColor = isLightSquare ? "bg-blue-50" : "bg-blue-100";
                } else if (cell.state === 'harvest') {
                  baseColor = isLightSquare ? "bg-orange-50" : "bg-orange-100";
                }

                return (
                  <div 
                    key={`${cell.x}-${cell.y}`}
                    onClick={() => handleCellClick(cell.x, cell.y)}
                    className={`
                      aspect-square w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center 
                      cursor-pointer transition-all duration-200 hover:scale-105 rounded-lg relative
                      ${baseColor}
                      ${getStatusBorder(cell, isSelected)}
                      ${isAddingSensor && !cell.hasSensor ? 'ring-2 ring-purple-400 ring-offset-2 animate-pulse' : ''}
                    `}
                    title={`Posición (${cell.x}, ${cell.y})`}
                  >
                    {/* Sensor indicator en la esquina */}
                    {cell.hasSensor && (
                      <div className="absolute top-1 right-1 z-20">
                        <div className="bg-purple-600 p-1 rounded-full shadow-md border-2 border-white">
                          <Cpu className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Icono del cultivo */}
                    <div className="transition-transform duration-300">
                      {cell.state === 'harvest' ? (
                        <span className="text-2xl sm:text-3xl">🧺</span>
                      ) : (
                        <span className="text-2xl sm:text-3xl">{cropIcon}</span>
                      )}
                    </div>
                    
                    {/* Overlay de agua */}
                    {cell.state === 'water' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Droplet className="w-6 h-6 text-blue-500 fill-blue-500/50 drop-shadow animate-pulse" />
                      </div>
                    )}
                    
                    {/* Coordenadas */}
                    <span className="absolute bottom-1 left-1 text-[8px] font-bold text-black/30">
                      {cell.x},{cell.y}
                    </span>

                    {/* Overlay para añadir sensor */}
                    {isAddingSensor && !cell.hasSensor && (
                      <div className="absolute inset-0 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Cpu className="w-6 h-6 text-purple-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel de información de celda seleccionada */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Información de Celda</h3>
          
          {selectedCellData ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Posición:</p>
                <p className="font-medium text-lg">({selectedCell!.x}, {selectedCell!.y})</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Cultivo:</p>
                <p className="font-medium flex items-center gap-2">
                  <span className="text-2xl">{cropIcon}</span> 
                  <span className="text-lg">{plot.cropType}</span>
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Estado:</p>
                <Badge 
                  className={
                    selectedCellData.state === "harvest" 
                      ? "bg-green-100 text-green-800 hover:bg-green-100 text-sm py-1.5 px-3" 
                      : selectedCellData.state === "water"
                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-sm py-1.5 px-3"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-100 text-sm py-1.5 px-3"
                  }
                >
                  {selectedCellData.state === "harvest" && "Lista para cosechar"}
                  {selectedCellData.state === "water" && "Necesita riego"}
                  {selectedCellData.state === "normal" && "Normal"}
                </Badge>
              </div>

              {selectedCellData.hasSensor && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2.5 rounded-lg">
                    <Cpu className="w-4 h-4" />
                    <span className="font-medium">Sensor instalado</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4">
                {selectedCellData.state === "water" && (
                  <button
                    onClick={() => updateCellState(plot.id, selectedCell!.x, selectedCell!.y, 'normal')}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Droplet className="w-5 h-5" />
                    Regar
                  </button>
                )}
                
                {selectedCellData.state === "harvest" && (
                  <button
                    onClick={() => updateCellState(plot.id, selectedCell!.x, selectedCell!.y, 'normal')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Cosechar
                  </button>
                )}

                <button
                  onClick={() => {
                    const next = selectedCellData.state === 'normal' ? 'water' : selectedCellData.state === 'water' ? 'harvest' : 'normal';
                    updateCellState(plot.id, selectedCell!.x, selectedCell!.y, next);
                  }}
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cambiar estado
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {isAddingSensor ? 'Haz clic en una celda para añadir un sensor' : 'Selecciona una celda para ver detalles'}
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold mb-4 text-sm">Estadísticas del Grid</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total celdas:</span>
                <span className="font-bold text-gray-900">{plot.cells.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Listos para cosechar:</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  {plot.cells.filter(c => c.state === 'harvest').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Necesitan riego:</span>
                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                  {plot.cells.filter(c => c.state === 'water').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sensores activos:</span>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  {plot.cells.filter(c => c.hasSensor).length}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tendencia Diaria - Ahora debajo del mapa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tendencia Diaria</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={10} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line yAxisId="left" type="monotone" dataKey="humedad" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center">
                <Droplet className="w-6 h-6 text-blue-500 mr-3" />
                <span className="text-sm font-medium text-blue-900">Humedad Actual</span>
              </div>
              <span className="text-2xl font-bold text-blue-700">45%</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-100">
              <div className="flex items-center">
                <Activity className="w-6 h-6 text-orange-500 mr-3" />
                <span className="text-sm font-medium text-orange-900">Temp. Actual</span>
              </div>
              <span className="text-2xl font-bold text-orange-700">18°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Producción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Producción Mensual</CardTitle>
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
    </div>
  );
};