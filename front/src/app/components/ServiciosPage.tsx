import React from 'react';
import { useNavigate } from 'react-router';
import { Sprout, LayoutGrid, Thermometer, WifiOff, BarChart3 } from 'lucide-react';

const services = [
  {
    icon: LayoutGrid,
    title: 'Gestión metro a metro',
    description: 'Divide tu parcela en celdas independientes y registra el estado de cada zona con precisión absoluta. Sin estimaciones, sin promedios.',
  },
  {
    icon: Thermometer,
    title: 'Monitorización ambiental',
    description: 'Consulta humedad y temperatura en tiempo real. Cada celda recibe automáticamente los datos del sensor más cercano.',
  },
  {
    icon: WifiOff,
    title: 'Funciona sin conexión',
    description: 'Registra en campo aunque no tengas cobertura. Al recuperar conexión, todo se sincroniza sin perder ningún dato.',
  },
  {
    icon: BarChart3,
    title: 'Panel de KPIs del cultivo',
    description: 'Visualiza tendencias, históricos por parcela y métricas clave para tomar decisiones fundamentadas, no basadas en intuición.',
  },
];

export const ServiciosPage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen w-full flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/img/background_image.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/40 to-black/80"></div>

      <header className="relative z-20 flex items-center justify-between p-6 md:px-12 lg:px-20 pt-8">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-green-600 p-2 rounded-lg">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-wider drop-shadow-md">
            AgroPrecision
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-white/80 text-sm font-medium">
          <span onClick={() => navigate('/')} className="hover:text-white transition-colors drop-shadow-md cursor-pointer">Inicio</span>
          <span onClick={() => navigate('/nuestra-historia')} className="hover:text-white transition-colors drop-shadow-md cursor-pointer">Nuestra Historia</span>
          <span className="text-white font-bold drop-shadow-md cursor-default">Servicios</span>
        </nav>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-end px-6 md:px-12 lg:px-24 pb-20">
        <div className="max-w-xl w-full space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-lg leading-tight text-right whitespace-nowrap">
            Nuestros <span className="text-green-400">Servicios</span>
          </h1>
          <div className="space-y-3">
            {services.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <div className="bg-green-600/80 p-2 rounded-lg shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold drop-shadow-md">{title}</h3>
                  <p className="text-gray-300 text-sm font-light leading-relaxed mt-1">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 right-6 md:right-12 lg:right-24 text-white/40 text-sm z-20 text-right">
        <p>© 2026 AgroPrecision. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
