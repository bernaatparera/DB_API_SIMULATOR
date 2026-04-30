import React from 'react';
import { useNavigate } from 'react-router';
import { Sprout } from 'lucide-react';

export const NuestraHistoriaPage = () => {
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
          <span className="text-white font-bold drop-shadow-md cursor-default">Nuestra Historia</span>
          <span onClick={() => navigate('/servicios')} className="hover:text-white transition-colors drop-shadow-md cursor-pointer">Servicios</span>
        </nav>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-end px-6 md:px-12 lg:px-24 pb-20">
        <div className="max-w-2xl text-right space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-lg leading-tight whitespace-nowrap">
              Nuestra <span className="text-green-400">Historia</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-light drop-shadow-md max-w-xl ml-auto leading-relaxed">
              Nació de una contradicción evidente: la tecnología agrícola avanza, pero el campo real sigue gestionándose con registros dispersos, intuición y recursos limitados.
            </p>
            <p className="text-lg text-gray-300 font-light drop-shadow-md max-w-xl ml-auto leading-relaxed">
              Sensores, plataformas IoT e inteligencia artificial ya existen, pero quedan fuera del alcance de la mayoría de explotaciones por su coste, su complejidad y su dependencia de infraestructuras que no siempre están disponibles en el campo.
            </p>
            <p className="text-lg text-gray-300 font-light drop-shadow-md max-w-xl ml-auto leading-relaxed">
              AgroPrecision propone una respuesta práctica. Empezamos por el cultivo de lechuga —ciclo corto, alta sensibilidad a la humedad y la temperatura— como caso de estudio para demostrar que la monitorización granular es posible y accesible. La simulación de datos de sensores permite construir desde hoy el dataset estructurado que mañana alimentará modelos de inteligencia artificial, sin esperar a tener instalada una infraestructura física completa.
            </p>
            <p className="text-lg text-green-400 font-medium drop-shadow-md max-w-xl ml-auto leading-relaxed">
              El objetivo no es la tecnología en sí. Es que el agricultor tome mejores decisiones, use mejor el agua, anticipe problemas y obtenga más con menos.
            </p>
          </div>

        </div>
      </div>

      <footer className="absolute bottom-6 right-6 md:right-12 lg:right-24 text-white/40 text-sm z-20 text-right">
        <p>© 2026 AgroPrecision. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
