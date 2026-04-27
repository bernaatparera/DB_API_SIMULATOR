import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Save, Maximize, Sprout, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createParcela } from '../services/plotService';

const CROP_TYPES = [
  { id: 'tomate', label: 'Tomate', icon: '🍅' },
  { id: 'lechuga', label: 'Lechuga', icon: '🥬' },
  { id: 'zanahoria', label: 'Zanahoria', icon: '🥕' },
  { id: 'patata', label: 'Patata', icon: '🥔' },
  { id: 'cebolla', label: 'Cebolla', icon: '🧅' },
  { id: 'otro', label: 'Otro...', icon: '🌱' },
];

export const NewPlotForm = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { addPlot } = useAppContext();

  const [name, setName] = useState('');
  const [width, setWidth] = useState<number>(3);
  const [height, setHeight] = useState<number>(3);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [customCropValue, setCustomCropValue] = useState<string>('');

  const estimatedSensors = Math.max(1, Math.floor((width * height) / 4));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!farmId || !name) return;

    const finalCrop = selectedCrop === "Otro..." ? customCropValue.trim() : selectedCrop;

    if (!finalCrop) {
      // Should not happen due to disabled state, but for safety
      return;
    }

    try {
      // TODO: guardar tipo de cultivo cuando backend lo soporte. Y que añada tmb fecha de creación etc..
      await createParcela({
        granja_id: Number(farmId),
        nombre: name,
        tamx: width,
        tamy: height,
        // @ts-ignore
        tipo_cultivo: finalCrop,
      });

      navigate(`/farms/${farmId}`);

    } catch (error) {
      console.error("Error creando parcela", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 cursor-pointer w-fit" onClick={() => navigate(`/farms/${farmId}`)}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a la granja
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 border-b border-gray-200 bg-green-50/50">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <Sprout className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Parcela</h1>
          </div>
          <p className="text-gray-500 mt-2">Configura las dimensiones de tu parcela y selecciona el cultivo.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la parcela
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Huerto Norte"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Dimensiones</h3>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Ancho (X metros)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                <div className="text-gray-400 mt-5">✕</div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Largo (Y metros)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <Maximize className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Asignación automática</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Con un área de {width * height} m², el sistema asignará automáticamente <strong className="font-bold">{estimatedSensors} sensores</strong> para una cobertura óptima.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Tipo de Cultivo</h3>

              <div className="flex flex-wrap gap-3">
                {CROP_TYPES.map((crop) => (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setSelectedCrop(crop.label)}
                    className={twMerge(
                      "flex items-center px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
                      selectedCrop === crop.label
                        ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50/50"
                    )}
                  >
                    <span className="mr-2 text-lg">{crop.icon}</span>
                    {crop.label}
                    {selectedCrop === crop.label && (
                      <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
              {selectedCrop === "Otro..." && (
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Escribe el nombre del cultivo:</label>
                  <input
                    type="text"
                    placeholder="Ej. Pimiento, Berenjena, etc."
                    value={customCropValue}
                    onChange={(e) => setCustomCropValue(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/farms/${farmId}`)}
              className="mr-4 px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedCrop || !name}
              className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Crear Parcela
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
