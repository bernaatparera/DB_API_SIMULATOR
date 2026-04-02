import { useState } from "react";
import { Card } from "./ui/card";
import { 
  Apple, 
  Carrot, 
  Leaf, 
  Wheat, 
  Cherry, 
  Flame, 
  Sprout,
  Salad,
  Banana,
  Cookie,
  Droplets,
  CheckCircle2
} from "lucide-react";
import { Badge } from "./ui/badge";

interface GardenCell {
  row: number;
  col: number;
  vegetable: string | null;
  status?: "healthy" | "needs-water" | "ready";
}

const vegetableIcons = {
  "Tomate": Apple,
  "Maíz": Wheat,
  "Lechuga": Salad,
  "Zanahoria": Carrot,
  "Fresa": Cherry,
  "Pimiento": Flame,
  "Calabaza": Cookie,
  "Pepino": Sprout,
  "Cebolla": Banana,
  "Espinaca": Leaf,
};

const vegetableColors = {
  "Tomate": "text-red-600 bg-red-50",
  "Maíz": "text-yellow-600 bg-yellow-50",
  "Lechuga": "text-green-600 bg-green-50",
  "Zanahoria": "text-orange-600 bg-orange-50",
  "Fresa": "text-red-500 bg-red-50",
  "Pimiento": "text-red-700 bg-red-100",
  "Calabaza": "text-orange-500 bg-orange-50",
  "Pepino": "text-green-500 bg-green-50",
  "Cebolla": "text-purple-600 bg-purple-50",
  "Espinaca": "text-green-700 bg-green-100",
};

// Datos iniciales del huerto - 8x8 grid
const initialGardenData: GardenCell[] = [
  // Fila 1
  { row: 0, col: 0, vegetable: "Tomate", status: "healthy" },
  { row: 0, col: 1, vegetable: "Tomate", status: "healthy" },
  { row: 0, col: 2, vegetable: "Tomate", status: "ready" },
  { row: 0, col: 3, vegetable: null },
  { row: 0, col: 4, vegetable: "Lechuga", status: "healthy" },
  { row: 0, col: 5, vegetable: "Lechuga", status: "healthy" },
  { row: 0, col: 6, vegetable: "Lechuga", status: "needs-water" },
  { row: 0, col: 7, vegetable: null },
  
  // Fila 2
  { row: 1, col: 0, vegetable: "Tomate", status: "healthy" },
  { row: 1, col: 1, vegetable: "Tomate", status: "ready" },
  { row: 1, col: 2, vegetable: "Tomate", status: "healthy" },
  { row: 1, col: 3, vegetable: null },
  { row: 1, col: 4, vegetable: "Lechuga", status: "ready" },
  { row: 1, col: 5, vegetable: "Lechuga", status: "healthy" },
  { row: 1, col: 6, vegetable: "Lechuga", status: "healthy" },
  { row: 1, col: 7, vegetable: null },
  
  // Fila 3
  { row: 2, col: 0, vegetable: "Zanahoria", status: "healthy" },
  { row: 2, col: 1, vegetable: "Zanahoria", status: "healthy" },
  { row: 2, col: 2, vegetable: null },
  { row: 2, col: 3, vegetable: "Maíz", status: "healthy" },
  { row: 2, col: 4, vegetable: "Maíz", status: "healthy" },
  { row: 2, col: 5, vegetable: null },
  { row: 2, col: 6, vegetable: "Espinaca", status: "healthy" },
  { row: 2, col: 7, vegetable: "Espinaca", status: "ready" },
  
  // Fila 4
  { row: 3, col: 0, vegetable: "Zanahoria", status: "needs-water" },
  { row: 3, col: 1, vegetable: "Zanahoria", status: "healthy" },
  { row: 3, col: 2, vegetable: null },
  { row: 3, col: 3, vegetable: "Maíz", status: "healthy" },
  { row: 3, col: 4, vegetable: "Maíz", status: "healthy" },
  { row: 3, col: 5, vegetable: null },
  { row: 3, col: 6, vegetable: "Espinaca", status: "healthy" },
  { row: 3, col: 7, vegetable: "Espinaca", status: "healthy" },
  
  // Fila 5
  { row: 4, col: 0, vegetable: "Pimiento", status: "healthy" },
  { row: 4, col: 1, vegetable: "Pimiento", status: "healthy" },
  { row: 4, col: 2, vegetable: "Pimiento", status: "ready" },
  { row: 4, col: 3, vegetable: null },
  { row: 4, col: 4, vegetable: "Fresa", status: "healthy" },
  { row: 4, col: 5, vegetable: "Fresa", status: "ready" },
  { row: 4, col: 6, vegetable: "Fresa", status: "ready" },
  { row: 4, col: 7, vegetable: null },
  
  // Fila 6
  { row: 5, col: 0, vegetable: "Pimiento", status: "healthy" },
  { row: 5, col: 1, vegetable: "Pimiento", status: "needs-water" },
  { row: 5, col: 2, vegetable: "Pimiento", status: "healthy" },
  { row: 5, col: 3, vegetable: null },
  { row: 5, col: 4, vegetable: "Fresa", status: "healthy" },
  { row: 5, col: 5, vegetable: "Fresa", status: "healthy" },
  { row: 5, col: 6, vegetable: "Fresa", status: "healthy" },
  { row: 5, col: 7, vegetable: null },
  
  // Fila 7
  { row: 6, col: 0, vegetable: "Calabaza", status: "healthy" },
  { row: 6, col: 1, vegetable: null },
  { row: 6, col: 2, vegetable: "Pepino", status: "healthy" },
  { row: 6, col: 3, vegetable: "Pepino", status: "healthy" },
  { row: 6, col: 4, vegetable: null },
  { row: 6, col: 5, vegetable: "Cebolla", status: "healthy" },
  { row: 6, col: 6, vegetable: "Cebolla", status: "ready" },
  { row: 6, col: 7, vegetable: null },
  
  // Fila 8
  { row: 7, col: 0, vegetable: "Calabaza", status: "healthy" },
  { row: 7, col: 1, vegetable: null },
  { row: 7, col: 2, vegetable: "Pepino", status: "needs-water" },
  { row: 7, col: 3, vegetable: "Pepino", status: "healthy" },
  { row: 7, col: 4, vegetable: null },
  { row: 7, col: 5, vegetable: "Cebolla", status: "healthy" },
  { row: 7, col: 6, vegetable: "Cebolla", status: "healthy" },
  { row: 7, col: 7, vegetable: null },
];

export function GardenGrid() {
  const [gardenData, setGardenData] = useState<GardenCell[]>(initialGardenData);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const rows = 8;
  const cols = 8;

  const getCellData = (row: number, col: number): GardenCell => {
    return gardenData.find(cell => cell.row === row && cell.col === col) || { row, col, vegetable: null };
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const handleWaterPlant = () => {
    if (!selectedCell) return;
    
    setGardenData(prevData => 
      prevData.map(cell => 
        cell.row === selectedCell.row && cell.col === selectedCell.col && cell.status === "needs-water"
          ? { ...cell, status: "healthy" as const }
          : cell
      )
    );
  };

  const handleHarvest = () => {
    if (!selectedCell) return;
    
    setGardenData(prevData => 
      prevData.map(cell => 
        cell.row === selectedCell.row && cell.col === selectedCell.col && cell.status === "ready"
          ? { ...cell, vegetable: null, status: undefined }
          : cell
      )
    );
    setSelectedCell(null);
  };

  const getStatusBorder = (status?: string, isSelected?: boolean) => {
    if (isSelected) return "border-4 border-blue-500 shadow-lg";
    
    switch (status) {
      case "ready":
        return "border-2 border-green-500 shadow-md";
      case "needs-water":
        return "border-2 border-yellow-500 shadow-sm";
      case "healthy":
        return "border border-gray-300";
      default:
        return "border border-gray-200";
    }
  };

  const selectedCellData = selectedCell ? getCellData(selectedCell.row, selectedCell.col) : null;

  // Calcular estadísticas
  const stats = {
    total: gardenData.filter(cell => cell.vegetable).length,
    ready: gardenData.filter(cell => cell.status === "ready").length,
    needsWater: gardenData.filter(cell => cell.status === "needs-water").length,
    healthy: gardenData.filter(cell => cell.status === "healthy").length,
  };

  return (
    <div className="w-full">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl">Mi Huerto</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {stats.ready} listas
              </Badge>
              <Badge variant="outline" className="bg-yellow-50">
                <Droplets className="w-3 h-3 mr-1" />
                {stats.needsWater} necesitan riego
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-500 rounded"></div>
              <span>Listo para cosechar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-yellow-500 rounded"></div>
              <span>Necesita riego</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-gray-300 rounded bg-gray-50"></div>
              <span>Vacío</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grid del huerto */}
          <div className="lg:col-span-2">
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {Array.from({ length: rows }).map((_, rowIndex) =>
                Array.from({ length: cols }).map((_, colIndex) => {
                  const cellData = getCellData(rowIndex, colIndex);
                  const vegetable = cellData.vegetable;
                  const VegetableIcon = vegetable ? vegetableIcons[vegetable as keyof typeof vegetableIcons] : null;
                  const colorClass = vegetable ? vegetableColors[vegetable as keyof typeof vegetableColors] : "bg-gray-50";
                  
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  
                  // Patrón de tablero de ajedrez
                  const isEvenRow = rowIndex % 2 === 0;
                  const isEvenCol = colIndex % 2 === 0;
                  const isLightSquare = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol);
                  const baseColor = vegetable 
                    ? colorClass 
                    : (isLightSquare ? "bg-green-50" : "bg-green-100");

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg
                        transition-all duration-200 hover:scale-105 cursor-pointer
                        ${baseColor}
                        ${getStatusBorder(cellData.status, isSelected)}
                      `}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      title={vegetable ? `${vegetable} - ${cellData.status}` : "Parcela vacía"}
                    >
                      {VegetableIcon && (
                        <VegetableIcon 
                          className={`w-1/2 h-1/2 ${vegetable ? vegetableColors[vegetable as keyof typeof vegetableColors].split(' ')[0] : ''}`}
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel de información */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold mb-3">Información de Parcela</h3>
              
              {selectedCellData ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Posición:</p>
                    <p className="font-medium">Fila {selectedCell!.row + 1}, Columna {selectedCell!.col + 1}</p>
                  </div>
                  
                  {selectedCellData.vegetable ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Cultivo:</p>
                        <p className="font-medium">{selectedCellData.vegetable}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Estado:</p>
                        <Badge 
                          className={
                            selectedCellData.status === "ready" 
                              ? "bg-green-100 text-green-800 hover:bg-green-100" 
                              : selectedCellData.status === "needs-water"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          }
                        >
                          {selectedCellData.status === "ready" && "Lista para cosechar"}
                          {selectedCellData.status === "needs-water" && "Necesita riego"}
                          {selectedCellData.status === "healthy" && "Saludable"}
                        </Badge>
                      </div>

                      <div className="space-y-2 pt-2">
                        {selectedCellData.status === "needs-water" && (
                          <button
                            onClick={handleWaterPlant}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Droplets className="w-4 h-4" />
                            Regar planta
                          </button>
                        )}
                        
                        {selectedCellData.status === "ready" && (
                          <button
                            onClick={handleHarvest}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Cosechar
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Parcela vacía</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Selecciona una parcela para ver detalles</p>
              )}
            </Card>

            <Card className="p-4 mt-4">
              <h3 className="font-semibold mb-3">Estadísticas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Parcelas cultivadas:</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listas para cosechar:</span>
                  <span className="font-medium text-green-600">{stats.ready}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Necesitan riego:</span>
                  <span className="font-medium text-yellow-600">{stats.needsWater}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saludables:</span>
                  <span className="font-medium text-blue-600">{stats.healthy}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(vegetableIcons).map(([name, Icon]) => (
            <div key={name} className="flex items-center gap-2 text-sm">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${vegetableColors[name as keyof typeof vegetableColors]}`}>
                <Icon className={`w-5 h-5 ${vegetableColors[name as keyof typeof vegetableColors].split(' ')[0]}`} strokeWidth={1.5} />
              </div>
              <span className="text-gray-700">{name}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}