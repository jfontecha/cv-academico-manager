import { useQuery } from 'react-query';
import { statsAPI } from '../services/api';

// Hook para obtener la última actualización
export const useLastUpdate = () => {
  return useQuery(
    'lastUpdate',
    () => statsAPI.getLastUpdate().then(res => res.data),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      onError: (error) => {
        console.error('Error obteniendo última actualización:', error);
      }
    }
  );
};

// Función helper para formatear fechas
export const formatLastUpdate = (date) => {
  if (!date) return 'Sin actualizaciones';
  
  const updateDate = new Date(date);
  const now = new Date();
  const diffInHours = Math.floor((now - updateDate) / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInHours < 1) {
    return 'Hace menos de una hora';
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInDays < 30) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  } else {
    return updateDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

// Función helper para obtener el nombre friendly de la colección
export const getCollectionFriendlyName = (collection) => {
  const names = {
    publications: 'Publicaciones',
    projects: 'Proyectos',
    teachingClasses: 'Clases',
    teachingInnovation: 'Innovación Docente',
    finalWorks: 'Trabajos Fin de Estudios'
  };
  
  return names[collection] || collection;
};