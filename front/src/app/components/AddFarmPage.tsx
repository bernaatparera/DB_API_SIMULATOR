import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { X, Ruler } from "lucide-react";

interface AddFarmPageProps {
  onClose: () => void;
  onCreateFarm: (farmData: FarmData) => void;
}

export interface FarmData {
  name: string;
  length: number;
  width: number;
  cropType: string;
}

const cropTypes = [
  { id: "romana", label: "Romana" },
  { id: "iceberg", label: "Iceberg" },
  { id: "hoja-roble", label: "Hoja de Roble" },
];

export function AddFarmPage({ onClose, onCreateFarm }: AddFarmPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    length: "",
    width: "",
    cropType: "romana", // Por defecto seleccionado
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCropTypeSelect = (cropId: string) => {
    setFormData(prev => ({ ...prev, cropType: cropId }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la parcela es requerido";
    }

    if (!formData.length) {
      newErrors.length = "El largo es requerido";
    } else if (isNaN(Number(formData.length)) || Number(formData.length) <= 0) {
      newErrors.length = "Debe ser un número válido mayor a 0";
    }

    if (!formData.width) {
      newErrors.width = "El ancho es requerido";
    } else if (isNaN(Number(formData.width)) || Number(formData.width) <= 0) {
      newErrors.width = "Debe ser un número válido mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const farmData: FarmData = {
        name: formData.name,
        length: Number(formData.length),
        width: Number(formData.width),
        cropType: formData.cropType,
      };
      onCreateFarm(farmData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
              Nueva Parcela
            </h1>
            <div className="w-10"></div> {/* Spacer para centrar el título */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-32 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección 1: Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nombre de la parcela
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej. Huerto Sur o Parcela Norte"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`border-gray-300 ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sección 2: Dimensiones del Terreno */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dimensiones del Terreno</CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Introduce las medidas reales para generar tu mapa interactivo metro a metro.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Largo */}
                <div className="space-y-2">
                  <Label htmlFor="length" className="text-sm font-medium flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gray-500" />
                    Largo (metros)
                  </Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder="Ej. 20"
                    value={formData.length}
                    onChange={(e) => handleChange("length", e.target.value)}
                    className={`border-gray-300 ${errors.length ? "border-red-500" : ""}`}
                    min="1"
                    step="0.1"
                  />
                  {errors.length && (
                    <p className="text-sm text-red-500">{errors.length}</p>
                  )}
                </div>

                {/* Ancho */}
                <div className="space-y-2">
                  <Label htmlFor="width" className="text-sm font-medium flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gray-500" />
                    Ancho (metros)
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="Ej. 10"
                    value={formData.width}
                    onChange={(e) => handleChange("width", e.target.value)}
                    className={`border-gray-300 ${errors.width ? "border-red-500" : ""}`}
                    min="1"
                    step="0.1"
                  />
                  {errors.width && (
                    <p className="text-sm text-red-500">{errors.width}</p>
                  )}
                </div>
              </div>

              {/* Visualización de área */}
              {formData.length && formData.width && !errors.length && !errors.width && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Área total:</span>{" "}
                    {(Number(formData.length) * Number(formData.width)).toFixed(2)} m²
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección 3: Tipo de Cultivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cultivo Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {cropTypes.map((crop) => (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => handleCropTypeSelect(crop.id)}
                    className={`
                      px-6 py-3 rounded-full border-2 font-medium transition-all duration-200
                      ${
                        formData.cropType === crop.id
                          ? "bg-green-50 text-green-700 border-green-500 shadow-sm"
                          : "bg-gray-50 text-gray-600 border-gray-300 hover:border-gray-400"
                      }
                    `}
                  >
                    {crop.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </form>
      </main>

      {/* Botón fijo en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto max-w-2xl">
          <Button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg"
          >
            Crear Parcela
          </Button>
        </div>
      </div>
    </div>
  );
}
