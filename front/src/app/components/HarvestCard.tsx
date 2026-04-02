import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, MapPin, Package } from "lucide-react";

interface HarvestCardProps {
  id: number;
  crop: string;
  location: string;
  date: string;
  quantity: number;
  status: "completed" | "in-progress" | "planned";
  image: string;
}

export function HarvestCard({ crop, location, date, quantity, status, image }: HarvestCardProps) {
  const statusConfig = {
    completed: { label: "Completada", className: "bg-green-100 text-green-800 hover:bg-green-100" },
    "in-progress": { label: "En Progreso", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    planned: { label: "Planificada", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-40 overflow-hidden">
        <img
          src={image}
          alt={crop}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{crop}</CardTitle>
          <Badge className={statusConfig[status].className}>
            {statusConfig[status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>{quantity} kg</span>
        </div>
      </CardContent>
    </Card>
  );
}
