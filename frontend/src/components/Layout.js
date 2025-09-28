import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  GraduationCap, 
  FolderOpen, 
  Lightbulb, 
  Home, 
  Menu, 
  X, 
  Database,
  Users,
  LogOut,
  Shield,
  Clock,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLastUpdate, formatLastUpdate, getCollectionFriendlyName } from '../hooks/useStats';
import { generateCVPDF, generateCVPDFPublic } from '../services/api';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { data: lastUpdateData, isLoading: isLoadingLastUpdate } = useLastUpdate();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Publicaciones', href: '/publications', icon: BookOpen },
    { name: 'Clases impartidas', href: '/teaching-classes', icon: GraduationCap },
    { name: 'Proyectos Investigación', href: '/projects', icon: FolderOpen },
    { name: 'Proyectos Docentes', href: '/teaching-innovation', icon: Lightbulb },
    { name: 'Trabajos Fin de Estudios', href: '/final-works', icon: GraduationCap },
    { name: 'Usuarios CV Manager', href: '/users', icon: Users },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      console.log('Iniciando generación de PDF...');
      
      // Primero probar con el endpoint autenticado, luego con el público
      let response;
      try {
        response = await generateCVPDF();
        console.log('PDF autenticado generado exitosamente');
      } catch (authError) {
        console.log('Error con PDF autenticado, probando versión pública...', authError);
        response = await generateCVPDFPublic();
        console.log('PDF público generado exitosamente');
      }
      
      console.log('Respuesta recibida:', {
        size: response.data.size,
        type: response.data.type,
        contentType: response.headers['content-type']
      });
      
      // Verificar que tenemos datos válidos
      if (!response.data || response.data.size === 0) {
        throw new Error('El PDF generado está vacío');
      }
      
      // Crear blob asegurándonos de que sea PDF
      const blob = new Blob([response.data], { 
        type: 'application/pdf' 
      });
      
      console.log('Blob creado:', {
        size: blob.size,
        type: blob.type
      });
      
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'curriculum_jesus_fontecha.pdf';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Limpieza después de un breve delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
      console.log('✅ PDF descargado exitosamente');
      
    } catch (error) {
      console.error('❌ Error detallado al generar PDF:', error);
      
      // Extraer mensaje de error más específico si está disponible
      let errorMessage = 'Error desconocido';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mostrar información más detallada en caso de error 500
      if (error.response?.status === 500) {
        errorMessage = `Error del servidor (500): ${errorMessage}. Esto puede deberse a un problema con Puppeteer en producción.`;
      }
      
      alert(`Error al generar el PDF: ${errorMessage}. Por favor, intenta de nuevo.`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 px-4">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-indigo-600" />
                  <span className="ml-2 text-sm font-bold text-gray-900">CV Académico Manager</span>
                </div>
                <div className="mt-1 text-xs text-gray-500 text-center">
                  Web platform crafted by <a href="https://www.esi.uclm.es/jesusfontecha.personal/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">Jesús Fontecha</a> with the help of Copilot AI
                </div>
              </div>
              
              {/* Separador */}
              <div className="mt-4 px-4">
                <hr className="border-gray-300" />
              </div>
              
              {/* Imagen de perfil */}
              <div className="mt-4 px-4 flex justify-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-indigo-200 shadow-lg relative bg-indigo-100">
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center text-indigo-600 font-bold text-xl z-10">
                    JF
                  </div>
                  <img 
                    src="/images/profile-photo.jpg"
                    alt="Jesús Fontecha" 
                    className="w-full h-full object-cover absolute inset-0 z-20"
                    onLoad={(e) => e.target.style.display = 'block'}
                    onError={(e) => e.target.style.display = 'none'}
                    style={{display: 'none'}}
                  />
                </div>
              </div>
              
              {/* Nombre del usuario */}
              <div className="mt-3 px-4">
                <p className="text-lg font-semibold text-gray-700 text-center">Jesús Fontecha</p>
              </div>
              
              {/* Última actualización */}
              <div className="mt-2 px-4">
                <div className="text-center text-xs text-gray-500">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Última actualización:</span>
                  </div>
                  <div>
                    {isLoadingLastUpdate 
                      ? 'Cargando...' 
                      : lastUpdateData?.success && lastUpdateData?.data?.lastUpdate
                        ? `${formatLastUpdate(lastUpdateData.data.lastUpdate)} en ${getCollectionFriendlyName(lastUpdateData.data.lastUpdateCollection)}`
                        : 'Sin actualizaciones'
                    }
                  </div>
                </div>
              </div>
              
              {/* Separador */}
              <div className="mt-3 px-4">
                <hr className="border-gray-300" />
              </div>
              
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                ))}
                
                {/* Botón para generar PDF */}
                <div className="mt-3 px-2">
                  <hr className="border-gray-300 mb-3" />
                  <button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                    className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="mr-4 h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-4 h-6 w-6" />
                        Generar CV en PDF
                      </>
                    )}
                  </button>

                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 px-4">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-sm font-bold text-gray-900">CV Académico Manager</span>
              </div>
              <div className="mt-1 text-xs text-gray-500 text-center">
                Web platform crafted by <a href="https://www.esi.uclm.es/jesusfontecha.personal/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">Jesús Fontecha</a> with the help of Copilot AI
              </div>
            </div>
            
            {/* Separador */}
            <div className="mt-4 px-4">
              <hr className="border-gray-300" />
            </div>
            
            {/* Imagen de perfil */}
            <div className="mt-4 px-4 flex justify-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-200 shadow-lg hover:shadow-xl transition-shadow duration-300 relative bg-indigo-100">
                <div className="absolute inset-0 w-full h-full flex items-center justify-center text-indigo-600 font-bold text-2xl z-10">
                  JF
                </div>
                <img 
                  src="/images/profile-photo.jpg"
                  alt="Jesús Fontecha Diezma" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 absolute inset-0 z-20"
                  onLoad={(e) => e.target.style.display = 'block'}
                  onError={(e) => e.target.style.display = 'none'}
                  style={{display: 'none'}}
                />
              </div>
            </div>
            
            {/* Nombre del usuario */}
            <div className="mt-3 px-4">
              <p className="text-lg font-semibold text-gray-700 text-center"><i>Jesús Fontecha Diezma</i></p>
            </div>
            
            {/* Última actualización */}
            <div className="mt-2 px-4">
              <div className="text-center text-xs text-gray-500">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Última actualización:</span>
                </div>
                <div>
                  {isLoadingLastUpdate 
                    ? 'Cargando...' 
                    : lastUpdateData?.success && lastUpdateData?.data?.lastUpdate
                      ? `${formatLastUpdate(lastUpdateData.data.lastUpdate)} en ${getCollectionFriendlyName(lastUpdateData.data.lastUpdateCollection)}`
                      : 'Sin actualizaciones'
                  }
                </div>
              </div>
            </div>
            
            {/* Separador */}
            <div className="mt-3 px-4">
              <hr className="border-gray-300" />
            </div>
            
            <nav className="mt-6 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              
              {/* Botón para generar PDF */}
              <div className="mt-4 px-2">
                <hr className="border-gray-300 mb-3" />
                <button
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-3 h-5 w-5" />
                      Generar CV en PDF
                    </>
                  )}
                </button>

              </div>
            </nav>
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Shield className={`h-5 w-5 ${isAdmin() ? 'text-red-500' : 'text-blue-500'}`} />
                <span className="ml-2 text-sm text-gray-600">{user?.username}</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user?.role === 'admin' 
                  ? 'bg-red-100 text-red-800' 
                  : user?.role === 'moderator'
                  ? 'bg-yellow-100 text-yellow-800'
                  : user?.role === 'guest'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user?.role === 'admin' 
                  ? 'Admin' 
                  : user?.role === 'moderator'
                  ? 'Moderador'
                  : user?.role === 'guest'
                  ? 'Invitado'
                  : 'Usuario'}
              </span>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido de la página */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
