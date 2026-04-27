"use client";

import { useState } from "react";
import { ParcelaRead } from "../types/plot";
import { updateParcela } from "../services/plotService";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Edit3, CheckCircle2 } from "lucide-react";
import { twMerge } from "tailwind-merge";

const CROP_TYPES = [
  { id: 'tomate', label: 'Tomate', icon: '🍅' },
  { id: 'lechuga', label: 'Lechuga', icon: '🥬' },
  { id: 'zanahoria', label: 'Zanahoria', icon: '🥕' },
  { id: 'patata', label: 'Patata', icon: '🥔' },
  { id: 'cebolla', label: 'Cebolla', icon: '🧅' },
  { id: 'otro', label: 'Otro...', icon: '🌱' },
];

interface EditPlotFormProps {
  plot: ParcelaRead;
  onSuccess: (updatedPlot: ParcelaRead) => void;
  onCancel: () => void;
}

export default function EditPlotForm({ plot, onSuccess, onCancel }: EditPlotFormProps) {
  const [nombre, setNombre] = useState(plot.nombre);
  const [tamx, setTamx] = useState(plot.tamx);
  const [tamy, setTamy] = useState(plot.tamy);
  
  const initialCrop = plot.tipo_cultivo_nombre || plot.tipo_cultivo || "";
  const isPredefined = CROP_TYPES.some(c => c.label === initialCrop || c.id === initialCrop.toLowerCase());
  
  const [selectedCrop, setSelectedCrop] = useState<string>(
    initialCrop ? (isPredefined ? initialCrop : "Otro...") : ""
  );
  const [customCropValue, setCustomCropValue] = useState<string>(
    initialCrop && !isPredefined ? initialCrop : ""
  );
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tamx <= 0 || tamy <= 0) {
      toast.error("Las dimensiones deben ser mayores a 0");
      return;
    }

    const finalCrop = selectedCrop === "Otro..." ? customCropValue.trim() : selectedCrop;

    if (!finalCrop) {
      toast.error("Debes indicar un tipo de cultivo");
      return;
    }

    setLoading(true);
    
    try {
      const updatedPlot = await updateParcela(plot.id, {
        nombre,
        tamx,
        tamy,
        tipo_cultivo: finalCrop,
      });
      // Si el backend no devuelve el nombre actualizado temporalmente, lo añadimos nosotros para la UI
      if (!updatedPlot.tipo_cultivo_nombre) {
         updatedPlot.tipo_cultivo_nombre = finalCrop;
      }
      toast.success("Parcela actualizada correctamente");
      onSuccess(updatedPlot);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar la parcela");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-md border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-green-600" />
          Editar Parcela
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-medium">
              Nombre
            </Label>
            <Input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border-gray-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tamx" className="text-sm font-medium">
                Ancho (X)
              </Label>
              <Input
                id="tamx"
                type="number"
                min="1"
                value={tamx}
                onChange={(e) => setTamx(Number(e.target.value))}
                className="border-gray-300"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tamy" className="text-sm font-medium">
                Alto (Y)
              </Label>
              <Input
                id="tamy"
                type="number"
                min="1"
                value={tamy}
                onChange={(e) => setTamy(Number(e.target.value))}
                className="border-gray-300"
                required
              />
            </div>
          </div>
          <div className="text-xs text-amber-600 mt-2">
            Aviso: Cambiar las dimensiones de la parcela puede afectar a la visualización de los sensores actuales.
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Label className="text-sm font-medium">Tipo de Cultivo (Hortaliza)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CROP_TYPES.map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => setSelectedCrop(crop.label)}
                  className={twMerge(
                    "flex items-center px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 focus:outline-none",
                    selectedCrop === crop.label || selectedCrop.toLowerCase() === crop.id
                      ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
                      : "bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50/50"
                  )}
                >
                  <span className="mr-1.5 text-sm">{crop.icon}</span>
                  {crop.label}
                  {(selectedCrop === crop.label || selectedCrop.toLowerCase() === crop.id) && (
                    <CheckCircle2 className="w-3 h-3 ml-1.5 text-green-500" />
                  )}
                </button>
              ))}
            </div>
            {selectedCrop === "Otro..." && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="customCrop" className="text-xs font-medium text-gray-600">Escribe el nombre del cultivo:</Label>
                <Input
                  id="customCrop"
                  type="text"
                  placeholder="Ej. Pimiento, Berenjena, etc."
                  value={customCropValue}
                  onChange={(e) => setCustomCropValue(e.target.value)}
                  className="mt-1 border-gray-300 h-9"
                  autoFocus
                />
              </div>
            )}
          </div>

        </CardContent>
        <CardFooter className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCrop || (selectedCrop === "Otro..." && !customCropValue.trim())}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
