import React from 'react';
import { useNavigate } from 'react-router';
import { Sprout } from 'lucide-react'; // Using an icon for the logo

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/img/background_image.png')" }}
    >
      {/* Capa de oscurecimiento: degradado que oscurece más la parte derecha donde va el texto */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/40 to-black/80"></div>

      {/* Cabecera superior */}
      <header className="relative z-20 flex items-center justify-between p-6 md:px-12 lg:px-20 pt-8">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-lg">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-wider drop-shadow-md">
            AgroPrecision
          </span>
        </div>
        
        {/* Enlaces futuros */}
        <nav className="hidden md:flex items-center gap-8 text-white/80 text-sm font-medium">
          <a href="#" className="hover:text-white transition-colors drop-shadow-md">Inicio</a>
          <span onClick={() => navigate('/nuestra-historia')} className="hover:text-white transition-colors drop-shadow-md cursor-pointer">Nuestra Historia</span>
          <span onClick={() => navigate('/servicios')} className="hover:text-white transition-colors drop-shadow-md cursor-pointer">Servicios</span>
        </nav>
      </header>

      {/* Contenido principal alineado a la derecha */}
      <div className="relative z-10 flex-1 flex items-center justify-end px-6 md:px-12 lg:px-24 pb-20">
        <div className="max-w-2xl text-right space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-lg leading-tight">
              Tus cultivos,<br/>
              <span className="text-green-400">medidos al detalle.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-light drop-shadow-md max-w-xl ml-auto leading-relaxed">
              Toma el control absoluto de tu granja. Monitoriza humedad, temperatura y salud de cada parcela en tiempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-8">
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-lg border border-white/30 transition-all transform hover:-translate-y-1 shadow-lg"
              onClick={() => navigate('/login')}
            >
              Iniciar Sesión
            </button>
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(22,163,74,0.4)] transition-all transform hover:-translate-y-1"
              onClick={() => navigate('/register')}
            >
              Comenzar Ahora
            </button>
          </div>
          
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="absolute bottom-6 right-6 md:right-12 lg:right-24 text-white/40 text-sm z-20 text-right">
        <p>© 2026 AgroPrecision. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
