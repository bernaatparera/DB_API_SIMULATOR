import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { X, Warehouse, MapPin } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "sonner";
import { createFarm } from "../services/farmService";

export function NewFarmForm() {
  const navigate = useNavigate();
  const { addFarm } = useAppContext();

  const [formData, setFormData] = useState({
    name: "",
    ubicacion: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la granja es requerido";
    }
    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = "La ubicación de la granja es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await addFarm({
        nombre: formData.name,
        ubicacion_geo: formData.ubicacion,
      });

      toast.success(`Granja "${formData.name}" creada`);
      navigate("/farms");

    } catch (err: any) {
      toast.error(err.message);
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
              onClick={() => navigate('/farms')}
              className="rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
              Nueva Granja
            </h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-32 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección 1: Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-green-600" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nombre de la granja
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej. Granja El Olivo o Finca Santa María"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`border-gray-300 ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Este será el nombre principal de tu granja en AgroPrecision
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ubicacion" className="text-sm font-medium">
                    Ubicación
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
                    onClick={() => {
                      if ("geolocation" in navigator) {
                        toast.info("Obteniendo ubicación...");
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const { latitude, longitude } = position.coords;
                            try {
                              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                              const data = await response.json();
                              const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
                              const state = data.address?.state || "";
                              
                              let locationStr = "";
                              if (city || state) {
                                locationStr = `${[city, state].filter(Boolean).join(", ")} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                              } else {
                                locationStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                              }
                              
                              handleChange("ubicacion", locationStr);
                              toast.success("Ubicación obtenida correctamente");
                            } catch (e) {
                              // Fallback si falla la API
                              handleChange("ubicacion", `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                              toast.success("Coordenadas obtenidas (sin nombre de ciudad)");
                            }
                          },
                          (error) => {
                            console.error(error);
                            toast.error("Error al obtener ubicación. Comprueba los permisos.");
                          },
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                      } else {
                        toast.error("Geolocalización no soportada en este navegador");
                      }
                    }}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    Usar mi ubicación actual
                  </Button>
                </div>
                <Input
                  id="ubicacion"
                  type="text"
                  placeholder="Ej. 39.5696, 2.6502 o Calle Mayor 12"
                  value={formData.ubicacion}
                  onChange={(e) => handleChange("ubicacion", e.target.value)}
                  className={`border-gray-300 ${errors.ubicacion ? "border-red-500" : ""}`}
                />
                {errors.ubicacion && (
                  <p className="text-sm text-red-500">{errors.ubicacion}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sección 2: Dimensiones del Terreno */}

          {/* Información adicional */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">ℹ️</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Próximo paso
                  </p>
                  <p className="text-sm text-blue-700">
                    Una vez creada la granja, podrás dividirla en parcelas individuales y asignar sensores y tipos de cultivo a cada una.
                  </p>
                </div>
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
            Crear Granja
          </Button>
        </div>
      </div>
    </div>
  );
}
