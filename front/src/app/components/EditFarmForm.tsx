"use client";

import { useState } from "react";
import { Farm } from "../types/farm";
import { updateFarm } from "../services/farmService";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Edit3 } from "lucide-react";

interface EditFarmFormProps {
  farm: Farm;
  onSuccess: (updatedFarm: Farm) => void;
  onCancel: () => void;
}

export default function EditFarmForm({ farm, onSuccess, onCancel }: EditFarmFormProps) {
  const [nombre, setNombre] = useState(farm.nombre);
  const [ubicacionGeo, setUbicacionGeo] = useState(farm.ubicacion_geo || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updatedFarm = await updateFarm(farm.id, {
        nombre,
        ubicacion_geo: ubicacionGeo,
      });
      toast.success("Granja actualizada correctamente");
      onSuccess(updatedFarm);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar la granja");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-md border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-green-600" />
          Editar Granja
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

          <div className="space-y-2">
            <Label htmlFor="ubicacion_geo" className="text-sm font-medium">
              Ubicación Geográfica
            </Label>
            <Input
              id="ubicacion_geo"
              type="text"
              value={ubicacionGeo}
              onChange={(e) => setUbicacionGeo(e.target.value)}
              className="border-gray-300"
            />
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
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
