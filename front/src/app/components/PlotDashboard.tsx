import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Droplet, Activity, RefreshCw, MapPin, Calendar, Cpu, Database, Layers, Plus, Edit3, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { getMeasurementsByPlot, getParcelaById } from '../services/plotService';
import { getCasillas, createCasilla } from '../services/cellService';
import { createSensor, deleteSensor, getSensores } from '../services/sensorService';
import { MeasurementsByPlotResponse } from '../types/measurement';
import { CasillaRead } from '../types/cell';
import { SensorRead } from '../types/sensor';
import { ParcelaRead } from '../types/plot';
import EditPlotForm from './EditPlotForm';

const defaultSensorForm = {
  numref: '',
  fabricante: '',
  tipo: 'humedad',
};

const normalizeVariableName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const isHumidityVariable = (variable: string) => {
  const normalized = normalizeVariableName(variable);
  return normalized.includes("humedad") || normalized.includes("humidity") || normalized.includes("moisture");
};

const isTemperatureVariable = (variable: string) => {
  const normalized = normalizeVariableName(variable);
  return normalized.includes("temperatura") || normalized === "temp" || normalized.includes("temperature");
};

const getTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatMeasurementDate = (
  value: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('es-ES', options);
};

const averageValues = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
};

const formatNumericValue = (value: number) => {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2);
};

export const PlotDashboard = () => {
  const { farmId, plotId } = useParams<{ farmId: string; plotId: string }>();
  const navigate = useNavigate();

  // Objetos de estado
  const [plot, setPlot] = useState<ParcelaRead | null>(null);
  const [measurementsResponse, setMeasurementsResponse] = useState<MeasurementsByPlotResponse | null>(null);
  const [cells, setCells] = useState<CasillaRead[]>([]);
  const [sensors, setSensors] = useState<SensorRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [isAddingSensor, setIsAddingSensor] = useState(false);
  const [isSensorDialogOpen, setIsSensorDialogOpen] = useState(false);
  const [isSubmittingSensor, setIsSubmittingSensor] = useState(false);
  const [sensorForm, setSensorForm] = useState(defaultSensorForm);
  const [sensorFormError, setSensorFormError] = useState<string | null>(null);
  const [sensorActionMessage, setSensorActionMessage] = useState<string | null>(null);
  const [isEditingPlot, setIsEditingPlot] = useState(false);
  const [isDeleteSensorDialogOpen, setIsDeleteSensorDialogOpen] = useState(false);
  const [isDeletingSensorId, setIsDeletingSensorId] = useState<number | null>(null);

  const plotIdAsNumber = Number(plotId);

  const loadPlotDashboard = async (showRefreshingState = false) => {
    if (!plotId || Number.isNaN(plotIdAsNumber)) {
      setError("El id de la parcela no es valido");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);

      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [plotData, measurementsData, cellsData] = await Promise.all([
        getParcelaById(plotIdAsNumber),
        getMeasurementsByPlot(plotIdAsNumber),
        getCasillas({ parcela_id: plotIdAsNumber, limit: 1000 }),
      ]);

      const sensorResponses = cellsData.length > 0
        ? await Promise.all(cellsData.map((cell) => getSensores({ casilla_id: cell.id, limit: 1000 })))
        : [];

      setPlot(plotData);
      setMeasurementsResponse(measurementsData);
      setCells(cellsData);
      setSensors(sensorResponses.flat());
      setSelectedCell(null);
      setIsAddingSensor(false);
      setIsSensorDialogOpen(false);
      setSensorFormError(null);
    } catch (requestError) {
      console.error(requestError);
      setError("Error cargando la parcela");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPlotDashboard();
  }, [plotId]);

  const measurements = measurementsResponse?.items ?? [];

  const cellsByCoordinate = useMemo(() => {
    return new Map(cells.map((cell) => [`${cell.posx},${cell.posy}`, cell] as const));
  }, [cells]);

  const sensorsByCellId = useMemo(() => {
    const grouped = new Map<number, SensorRead[]>();

    sensors.forEach((sensor) => {
      const current = grouped.get(sensor.casilla_id) ?? [];
      current.push(sensor);
      grouped.set(sensor.casilla_id, current);
    });

    return grouped;
  }, [sensors]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando parcela...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!plot) {
    return <div className="p-8 text-center text-gray-500">Parcela no encontrada</div>;
  }

  const totalMeasurements = measurementsResponse?.total ?? measurements.length;
  const totalArea = plot.tamx * plot.tamy;
  const installedSensors = sensors.length;
  const sensorsWithMeasurements = new Set(measurements.map((measurement) => measurement.sensor_id)).size;
  const measuredCells = new Set(measurements.map((measurement) => measurement.casilla_id)).size;
  const variables = Array.from(new Set(measurements.map((measurement) => measurement.variable))).sort((left, right) =>
    left.localeCompare(right)
  );

  const measurementsByNewest = [...measurements].sort(
    (left, right) => getTimestamp(right.dia_hora) - getTimestamp(left.dia_hora)
  );
  const lastMeasurement = measurementsByNewest[0];
  const latestHumidity = measurementsByNewest.find((measurement) => isHumidityVariable(measurement.variable));
  const latestTemperature = measurementsByNewest.find((measurement) => isTemperatureVariable(measurement.variable));

  const trendBuckets = new Map<
    string,
    { sortKey: number; label: string; humidityValues: number[]; temperatureValues: number[] }
  >();

  [...measurements]
    .sort((left, right) => getTimestamp(left.dia_hora) - getTimestamp(right.dia_hora))
    .forEach((measurement) => {
      const measurementDate = new Date(measurement.dia_hora);
      const sortKey = getTimestamp(measurement.dia_hora);
      const bucketKey = Number.isNaN(measurementDate.getTime())
        ? measurement.dia_hora
        : measurementDate.toISOString().slice(0, 16);
      const currentBucket = trendBuckets.get(bucketKey) ?? {
        sortKey,
        label: formatMeasurementDate(measurement.dia_hora),
        humidityValues: [],
        temperatureValues: [],
      };

      if (isHumidityVariable(measurement.variable)) {
        currentBucket.humidityValues.push(measurement.valor);
      }

      if (isTemperatureVariable(measurement.variable)) {
        currentBucket.temperatureValues.push(measurement.valor);
      }

      trendBuckets.set(bucketKey, currentBucket);
    });

  const trendData = Array.from(trendBuckets.values())
    .sort((left, right) => left.sortKey - right.sortKey)
    .slice(-12)
    .map((bucket) => ({
      time: bucket.label,
      humedad: bucket.humidityValues.length > 0 ? averageValues(bucket.humidityValues) : undefined,
      temperatura: bucket.temperatureValues.length > 0 ? averageValues(bucket.temperatureValues) : undefined,
    }));

  const variableStatsMap = new Map<string, { name: string; values: number[] }>();

  measurements.forEach((measurement) => {
    const key = normalizeVariableName(measurement.variable) || measurement.variable;
    const entry = variableStatsMap.get(key) ?? { name: measurement.variable, values: [] };
    entry.values.push(measurement.valor);
    variableStatsMap.set(key, entry);
  });

  const variableAverageData = Array.from(variableStatsMap.values())
    .map((entry) => ({
      name: entry.name,
      promedio: averageValues(entry.values),
    }))
    .sort((left, right) => right.promedio - left.promedio);

  const gridCells = Array.from({ length: totalArea }, (_, index) => {
    const x = index % plot.tamx;
    const y = Math.floor(index / plot.tamx);
    const backendCell = cellsByCoordinate.get(`${x},${y}`) ?? null;
    const cellSensors = backendCell ? sensorsByCellId.get(backendCell.id) ?? [] : [];

    return {
      x,
      y,
      backendCell,
      sensors: cellSensors,
    };
  });

  const selectedCellBackend = selectedCell ? cellsByCoordinate.get(`${selectedCell.x},${selectedCell.y}`) ?? null : null;
  const selectedCellSensors = selectedCellBackend ? sensorsByCellId.get(selectedCellBackend.id) ?? [] : [];

  const handleBack = () => {
    if (farmId) {
      navigate(`/farms/${farmId}`);
      return;
    }

    navigate(`/farms/${plot.granja_id}`);
  };

  const openSensorDialogForSelectedCell = () => {
    if (!selectedCell) {
      return;
    }

    setSensorActionMessage(null);
    setSensorFormError(null);
    setSensorForm(defaultSensorForm);
    setIsAddingSensor(false);
    setIsSensorDialogOpen(true);
  };

  const handleCellClick = (x: number, y: number) => {
    setSelectedCell({ x, y });

    if (isAddingSensor) {
      setSensorActionMessage(null);
      setSensorFormError(null);
      setSensorForm(defaultSensorForm);
      setIsSensorDialogOpen(true);
      setIsAddingSensor(false);
    }
  };

  const handleSensorInputChange = (field: keyof typeof defaultSensorForm, value: string) => {
    setSensorForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateSensor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCell) {
      setSensorFormError("Selecciona una celda antes de crear el sensor.");
      return;
    }

    const trimmedNumref = sensorForm.numref.trim();
    const trimmedTipo = sensorForm.tipo.trim();
    const trimmedFabricante = sensorForm.fabricante.trim();

    if (!trimmedNumref || !trimmedTipo) {
      setSensorFormError("Los campos referencia y tipo son obligatorios.");
      return;
    }

    setIsSubmittingSensor(true);
    setSensorFormError(null);

    try {
      let backendCell = cellsByCoordinate.get(`${selectedCell.x},${selectedCell.y}`) ?? null;

      if (!backendCell) {
        backendCell = await createCasilla({
          parcela_id: plot.id,
          posx: selectedCell.x,
          posy: selectedCell.y,
        });

        setCells((current) => [...current, backendCell as CasillaRead]);
      }

      const createdSensor = await createSensor({
        casilla_id: backendCell.id,
        numref: trimmedNumref,
        fabricante: trimmedFabricante || null,
        tipo: trimmedTipo,
      });

      setSensors((current) => [...current, createdSensor]);
      setSensorActionMessage(`Sensor ${createdSensor.numref} creado en la celda (${selectedCell.x}, ${selectedCell.y}).`);
      setIsSensorDialogOpen(false);
      setSensorForm(defaultSensorForm);
    } catch (requestError) {
      console.error(requestError);
      setSensorFormError(requestError instanceof Error ? requestError.message : "No se pudo crear el sensor.");
    } finally {
      setIsSubmittingSensor(false);
    }
  };

  const handleDeleteSensor = async (sensorId: number) => {
    setIsDeletingSensorId(sensorId);
    try {
      await deleteSensor(sensorId);
      setSensors((current) => current.filter((s) => s.id !== sensorId));
      setSensorActionMessage(`Sensor eliminado correctamente.`);
      setIsDeleteSensorDialogOpen(false);
    } catch (requestError) {
      console.error(requestError);
      setSensorActionMessage('Error al eliminar el sensor.');
    } finally {
      setIsDeletingSensorId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {isEditingPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <EditPlotForm 
            plot={plot}
            onSuccess={(updatedPlot) => {
              setPlot(updatedPlot);
              setIsEditingPlot(false);
            }}
            onCancel={() => setIsEditingPlot(false)}
          />
        </div>
      )}

      <div className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 cursor-pointer w-fit" onClick={handleBack}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a la granja
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{plot.nombre}</h1>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Parcela #{plot.id}
            </Badge>
            <button 
              onClick={() => setIsEditingPlot(true)} 
              className="p-1.5 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors"
              title="Editar Parcela"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Cuadricula {plot.tamx}x{plot.tamy} | Granja {plot.granja_id} | {installedSensors} sensores instalados
          </p>
        </div>
        <button
          onClick={() => void loadPlotDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Sincronizando...' : 'Sincronizar datos'}
        </button>
      </div>

      {sensorActionMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {sensorActionMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Mediciones</CardTitle>
            <Database className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalMeasurements}</div>
            <p className="text-xs text-gray-500 mt-1">{measurements.length} cargadas en esta vista</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Sensores Instalados</CardTitle>
            <Cpu className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{installedSensors}</div>
            <p className="text-xs text-gray-500 mt-1">{sensorsWithMeasurements} con mediciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Variables</CardTitle>
            <Layers className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{variables.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {variables.length > 0 ? variables.join(', ') : 'Sin variables todavia'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Area Cultivada</CardTitle>
            <MapPin className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalArea} m2</div>
            <p className="text-xs text-gray-500 mt-1">{plot.tamx}x{plot.tamy}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mapa de la Parcela</h2>
              <p className="text-xs text-gray-500 mt-1">
                {cells.length} casillas registradas | {measuredCells} casillas con mediciones
              </p>
            </div>
            <button
              onClick={() => {
                setSensorActionMessage(null);
                setSensorFormError(null);
                setIsAddingSensor((current) => !current);
              }}
              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isAddingSensor
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAddingSensor ? 'Cancelar' : 'Anadir sensor'}
            </button>
          </div>

          <div className="p-8 bg-gradient-to-br from-green-50/50 to-emerald-50/30 flex justify-center overflow-auto">
            <div
              className="grid gap-2 relative"
              style={{
                gridTemplateColumns: `repeat(${plot.tamx}, minmax(0, 1fr))`,
              }}
            >
              {gridCells.map((cell) => {
                const isSelected = selectedCell?.x === cell.x && selectedCell?.y === cell.y;
                const isLightSquare = (cell.y + cell.x) % 2 === 0;
                const sensorCount = cell.sensors.length;

                return (
                  <div
                    key={`${cell.x}-${cell.y}`}
                    onClick={() => handleCellClick(cell.x, cell.y)}
                    className={`
                      aspect-square w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center
                      cursor-pointer transition-all duration-200 hover:scale-105 rounded-lg relative
                      ${isLightSquare ? 'bg-green-50' : 'bg-green-100'}
                      ${isSelected ? 'border-4 border-blue-500 shadow-lg' : 'border border-green-200'}
                      ${isAddingSensor ? 'ring-2 ring-purple-300 ring-offset-2' : ''}
                    `}
                    title={`Posicion (${cell.x}, ${cell.y})`}
                  >
                    {sensorCount > 0 && (
                      <div className="absolute top-1 right-1 z-10 flex items-center gap-1 rounded-full bg-purple-600 px-1.5 py-1 text-white shadow-md">
                        <Cpu className="w-2.5 h-2.5" />
                        {sensorCount > 1 && <span className="text-[9px] font-bold">{sensorCount}</span>}
                      </div>
                    )}

                    <div className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                      <MapPin className={`w-4 h-4 ${sensorCount > 0 ? 'text-purple-700' : 'text-green-700'}`} />
                    </div>
                    <span className="absolute bottom-1 left-1 text-[8px] font-bold text-black/30">
                      {cell.x},{cell.y}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen de la Parcela</h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nombre:</p>
              <p className="font-medium text-lg">{plot.nombre}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Ids relacionados:</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                  Parcela {plot.id}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                  Granja {plot.granja_id}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Dimensiones:</p>
              <p className="font-medium">{plot.tamx} x {plot.tamy}</p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center">
                  <Droplet className="w-6 h-6 text-blue-500 mr-3" />
                  <span className="text-sm font-medium text-blue-900">Humedad mas reciente</span>
                </div>
                <span className="text-xl font-bold text-blue-700">
                  {latestHumidity ? `${formatNumericValue(latestHumidity.valor)}%` : 'Sin dato'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-100 mt-3">
                <div className="flex items-center">
                  <Activity className="w-6 h-6 text-orange-500 mr-3" />
                  <span className="text-sm font-medium text-orange-900">Temperatura mas reciente</span>
                </div>
                <span className="text-xl font-bold text-orange-700">
                  {latestTemperature ? `${formatNumericValue(latestTemperature.valor)} C` : 'Sin dato'}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              La relacion visual sigue siendo aproximada: esta vista usa las coordenadas del grid y crea o reutiliza una casilla del backend para enlazar el sensor con la posicion elegida.
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold mb-4 text-sm">Celda seleccionada</h4>

            {selectedCell ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Posicion:</span>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    ({selectedCell.x}, {selectedCell.y})
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Casilla backend:</span>
                  <Badge className={selectedCellBackend ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>
                    {selectedCellBackend ? `#${selectedCellBackend.id}` : 'Se creara al guardar'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Sensores en la celda:</span>
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                    {selectedCellSensors.length}
                  </Badge>
                </div>

                {selectedCellSensors.length > 0 && (
                  <div className="space-y-2">
                    {selectedCellSensors.map((sensor) => (
                      <div key={sensor.id} className="rounded-lg border border-gray-200 px-3 py-2">
                        <p className="text-sm font-medium text-gray-900">{sensor.numref}</p>
                        <p className="text-xs text-gray-500">
                          {sensor.tipo}{sensor.fabricante ? ` | ${sensor.fabricante}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={openSensorDialogForSelectedCell}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700"
                >
                  <Cpu className="w-4 h-4 mr-2" />
                  {selectedCellSensors.length > 0 ? 'Anadir otro sensor' : 'Anadir sensor en esta celda'}
                </button>

                {selectedCellSensors.length > 0 && (
                  <button
                    onClick={() => setIsDeleteSensorDialogOpen(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-red-50 text-red-700 font-medium hover:bg-red-100 border border-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar sensor
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500 text-center">
                Selecciona una celda para ver sus sensores o crear uno nuevo.
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold mb-4 text-sm">Estado actual</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Casillas registradas:</span>
                <span className="font-bold text-gray-900">{cells.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ultima lectura:</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  {lastMeasurement ? formatMeasurementDate(lastMeasurement.dia_hora) : 'Sin datos'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pagina recibida:</span>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {measurementsResponse ? measurementsResponse.page : 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Modo alta sensor:</span>
                <Badge className={isAddingSensor ? "bg-purple-100 text-purple-700 hover:bg-purple-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>
                  {isAddingSensor ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tendencia de Mediciones</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={10} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="humedad" stroke="#3b82f6" strokeWidth={3} dot={false} name="Humedad" />
                  <Line yAxisId="right" type="monotone" dataKey="temperatura" stroke="#f97316" strokeWidth={3} dot={false} name="Temperatura" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
                Aun no hay mediciones suficientes para pintar la tendencia.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center">
                <Droplet className="w-6 h-6 text-blue-500 mr-3" />
                <span className="text-sm font-medium text-blue-900">Humedad actual</span>
              </div>
              <span className="text-2xl font-bold text-blue-700">
                {latestHumidity ? `${formatNumericValue(latestHumidity.valor)}%` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-100">
              <div className="flex items-center">
                <Activity className="w-6 h-6 text-orange-500 mr-3" />
                <span className="text-sm font-medium text-orange-900">Temp. actual</span>
              </div>
              <span className="text-2xl font-bold text-orange-700">
                {latestTemperature ? `${formatNumericValue(latestTemperature.valor)} C` : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-slate-500 mr-3" />
                <span className="text-sm font-medium text-slate-900">Ultima actualizacion</span>
              </div>
              <span className="text-sm font-semibold text-slate-700 text-right">
                {lastMeasurement
                  ? formatMeasurementDate(lastMeasurement.dia_hora, {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Sin datos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Promedio por Variable</CardTitle>
          </CardHeader>
          <CardContent>
            {variableAverageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={variableAverageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="promedio" fill="#16a34a" name="Valor medio" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
                No hay suficientes datos para calcular promedios.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimas Mediciones</CardTitle>
          </CardHeader>
          <CardContent>
            {measurementsByNewest.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
                {measurementsByNewest.slice(0, 8).map((measurement) => (
                  <div
                    key={measurement.id}
                    className="rounded-lg border border-gray-200 p-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{measurement.variable}</p>
                      <p className="text-sm text-gray-500">
                        Sensor {measurement.sensor_id} | Casilla {measurement.casilla_id}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{formatMeasurementDate(measurement.dia_hora)}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {formatNumericValue(measurement.valor)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
                Aun no hay mediciones registradas para esta parcela.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isDeleteSensorDialogOpen}
        onOpenChange={(open) => setIsDeleteSensorDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar sensor</DialogTitle>
            <DialogDescription>
              {selectedCell
                ? `Selecciona el sensor que quieres eliminar de la celda (${selectedCell.x}, ${selectedCell.y}).`
                : 'Selecciona un sensor para eliminar.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {selectedCellSensors.map((sensor) => (
              <div key={sensor.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{sensor.numref}</p>
                  <p className="text-xs text-gray-500">
                    {sensor.tipo}{sensor.fabricante ? ` | ${sensor.fabricante}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => void handleDeleteSensor(sensor.id)}
                  disabled={isDeletingSensorId === sensor.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeletingSensorId === sensor.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsDeleteSensorDialogOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSensorDialogOpen}
        onOpenChange={(open) => {
          setIsSensorDialogOpen(open);
          if (!open) {
            setSensorFormError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anadir sensor</DialogTitle>
            <DialogDescription>
              {selectedCell
                ? `Se creara un sensor para la celda visual (${selectedCell.x}, ${selectedCell.y}). Si la casilla no existe todavia en el backend, se creara antes del sensor.`
                : 'Selecciona una celda para asociar el sensor.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSensor} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="sensor-numref">
                Referencia
              </label>
              <Input
                id="sensor-numref"
                value={sensorForm.numref}
                onChange={(event) => handleSensorInputChange('numref', event.target.value)}
                placeholder="SENSOR-001"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="sensor-fabricante">
                Fabricante
              </label>
              <Input
                id="sensor-fabricante"
                value={sensorForm.fabricante}
                onChange={(event) => handleSensorInputChange('fabricante', event.target.value)}
                placeholder="Opcional"
                maxLength={150}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="sensor-tipo">
                Tipo
              </label>
              <Input
                id="sensor-tipo"
                value={sensorForm.tipo}
                onChange={(event) => handleSensorInputChange('tipo', event.target.value)}
                placeholder="humedad"
                required
                maxLength={50}
              />
            </div>

            {selectedCell && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p>Posicion elegida: ({selectedCell.x}, {selectedCell.y})</p>
                <p>
                  Casilla backend: {selectedCellBackend ? `#${selectedCellBackend.id}` : 'se creara automaticamente'}
                </p>
                <p>Sensores ya instalados aqui: {selectedCellSensors.length}</p>
              </div>
            )}

            {sensorFormError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {sensorFormError}
              </div>
            )}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsSensorDialogOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingSensor}
                className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingSensor ? 'Guardando...' : 'Guardar sensor'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
