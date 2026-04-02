import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { GardenGrid } from "./GardenGrid";
import { Button } from "./ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Package, MapPin, Calendar, LogOut, ArrowLeft } from "lucide-react";

interface DashboardProps {
  onLogout: () => void;
  onBackToFarms: () => void;
  farmId: number;
}

const harvestsData = [
  {
    id: 1,
    crop: "Tomates",
    location: "Campo Norte",
    date: "15 Feb 2026",
    quantity: 1250,
    status: "completed" as const,
    image: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    crop: "Maíz",
    location: "Campo Sur",
    date: "20 Feb 2026",
    quantity: 3500,
    status: "completed" as const,
    image: "https://images.unsplash.com/photo-1603504026354-e682b7f02e94?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    crop: "Lechugas",
    location: "Invernadero 1",
    date: "28 Feb 2026",
    quantity: 850,
    status: "in-progress" as const,
    image: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop"
  },
  {
    id: 4,
    crop: "Zanahorias",
    location: "Campo Este",
    date: "5 Mar 2026",
    quantity: 920,
    status: "in-progress" as const,
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop"
  },
  {
    id: 5,
    crop: "Fresas",
    location: "Invernadero 2",
    date: "10 Mar 2026",
    quantity: 650,
    status: "planned" as const,
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop"
  },
  {
    id: 6,
    crop: "Pimientos",
    location: "Campo Oeste",
    date: "15 Mar 2026",
    quantity: 780,
    status: "planned" as const,
    image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=300&fit=crop"
  }
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

const farmNames: { [key: number]: string } = {
  1: "Granja El Roble",
  2: "Huerto Los Girasoles",
  3: "Finca Valle Verde",
  4: "Granja Experimental",
};

export function Dashboard({ onLogout, onBackToFarms, farmId }: DashboardProps) {
  const totalProduction = harvestsData.reduce((sum, h) => sum + h.quantity, 0);
  const activeHarvests = harvestsData.filter(h => h.status === "in-progress").length;
  const completedHarvests = harvestsData.filter(h => h.status === "completed").length;
  const farmName = farmNames[farmId] || "Mi Granja";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onBackToFarms}
                className="mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl">{farmName}</h1>
                <p className="text-sm text-gray-500">Dashboard de Gestión</p>
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
              <CardTitle className="text-sm">Ubicaciones</CardTitle>
              <MapPin className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">5</div>
              <p className="text-xs text-gray-500 mt-1">Campos activos</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                  <Tooltip />
                  <Legend />
                  <Line key="produccion" type="monotone" dataKey="produccion" stroke="#16a34a" strokeWidth={2} name="Producción (kg)" />
                  <Line key="ventas" type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={2} name="Ventas (kg)" />
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
                  <Tooltip />
                  <Bar key="value" dataKey="value" fill="#16a34a" name="Cantidad (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Huerto */}
        <GardenGrid />
      </main>
    </div>
  );
}