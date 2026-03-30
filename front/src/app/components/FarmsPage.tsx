import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, Sprout, Calendar, LogOut, Plus } from "lucide-react";
import { Badge } from "./ui/badge";

interface Farm {
  id: number;
  name: string;
  location: string;
  size: string;
  crops: number;
  lastActivity: string;
  image: string;
  status: "active" | "inactive";
}

interface FarmsPageProps {
  onSelectFarm: (farmId: number) => void;
  onAddFarm: () => void;
  onLogout: () => void;
}

const farmsData: Farm[] = [
  {
    id: 1,
    name: "Granja El Roble",
    location: "Córdoba, España",
    size: "2.5 hectáreas",
    crops: 8,
    lastActivity: "Hoy",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    status: "active"
  },
  {
    id: 2,
    name: "Huerto Los Girasoles",
    location: "Sevilla, España",
    size: "1.8 hectáreas",
    crops: 6,
    lastActivity: "Hace 2 días",
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop",
    status: "active"
  },
  {
    id: 3,
    name: "Finca Valle Verde",
    location: "Granada, España",
    size: "3.2 hectáreas",
    crops: 10,
    lastActivity: "Hace 1 semana",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop",
    status: "active"
  },
  {
    id: 4,
    name: "Granja Experimental",
    location: "Málaga, España",
    size: "0.8 hectáreas",
    crops: 4,
    lastActivity: "Hace 3 días",
    image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&h=400&fit=crop",
    status: "inactive"
  }
];

export function FarmsPage({ onSelectFarm, onAddFarm, onLogout }: FarmsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl">Sistema de Cosechas</h1>
                <p className="text-sm text-gray-500">Mis Granjas</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Título y botón de nueva granja */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl mb-2">Mis Granjas</h2>
            <p className="text-gray-600">Selecciona una granja para gestionar sus cosechas</p>
          </div>
          <Button onClick={onAddFarm} className="bg-green-600 hover:bg-green-700 gap-2">
            <Plus className="w-4 h-4" />
            Nueva Granja
          </Button>
        </div>

        {/* Grid de granjas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmsData.map((farm) => (
            <Card 
              key={farm.id} 
              className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => onSelectFarm(farm.id)}
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={farm.image}
                  alt={farm.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Badge 
                    className={
                      farm.status === "active" 
                        ? "bg-green-500 hover:bg-green-500 text-white" 
                        : "bg-gray-500 hover:bg-gray-500 text-white"
                    }
                  >
                    {farm.status === "active" ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{farm.name}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {farm.location}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Tamaño</p>
                    <p className="font-medium">{farm.size}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cultivos</p>
                    <p className="font-medium">{farm.crops} tipos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                  <Calendar className="w-4 h-4" />
                  <span>Última actividad: {farm.lastActivity}</span>
                </div>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFarm(farm.id);
                  }}
                >
                  Ver Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Estadísticas generales */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Total Granjas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{farmsData.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Granjas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-green-600">
                {farmsData.filter(f => f.status === "active").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Total Cultivos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {farmsData.reduce((sum, f) => sum + f.crops, 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Área Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">8.3 ha</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}