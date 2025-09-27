import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllTeachingClasses, deleteTeachingClass } from '../services/api';
import SearchFilters, { ResultsList } from '../components/SearchFilters';
import PaginationControls from '../components/PaginationControls';
import { useAuth } from '../contexts/AuthContext';

const TeachingClasses = () => {
  const { canCreate, canEdit, canDelete } = useAuth();
  
  // Estados para filtros (no causan re-render de resultados)
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'academic_year_desc',
    currentPage: 1,
    itemsPerPage: 20
  });

  // Estados para datos (solo se actualizan cuando cambian los datos)
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTeachingClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      
      // Parse sortBy parameter
      const [sortField, sortDirection] = filters.sortBy.split('_');
      
      // Construir parámetros de consulta, omitiendo valores vacíos
      const params = {
        page: filters.currentPage,
        limit: filters.itemsPerPage === 'all' ? 1000 : filters.itemsPerPage,
        sortBy: sortField,
        sortOrder: sortDirection || 'desc'
      };

      // Solo agregar parámetros no vacíos
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      
      console.log('Fetching teaching classes with params:', params); // Debug log
      
      const response = await getAllTeachingClasses(params);
      setTeachingClasses(response.data.data);
      setTotalItems(response.data.pagination.total);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching teaching classes:', err);
      setError('Error al cargar las clases');
      setTeachingClasses([]); // Limpiar clases en caso de error
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTeachingClasses();
  }, [fetchTeachingClasses]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
      try {
        await deleteTeachingClass(id);
        fetchTeachingClasses(); // Refetch to update pagination
      } catch (err) {
        setError('Error al eliminar la clase');
      }
    }
  }, [fetchTeachingClasses]);

  // Función optimizada para actualizar filtros sin causar re-renders innecesarios
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handlePageChange = useCallback((page) => {
    updateFilters({ currentPage: page });
  }, [updateFilters]);

  const handleItemsPerPageChange = useCallback((value) => {
    updateFilters({ itemsPerPage: value, currentPage: 1 });
  }, [updateFilters]);

  const handleSearchChange = useCallback((value) => {
    console.log('Search change:', value); // Debug log
    updateFilters({ search: value, currentPage: 1 });
  }, [updateFilters]);

  const handleSortChange = useCallback((value) => {
    console.log('Sort change:', value); // Debug log
    updateFilters({ sortBy: value, currentPage: 1 });
  }, [updateFilters]);

  useEffect(() => {
    fetchTeachingClasses();
  }, [fetchTeachingClasses]);

  const getClassTypeColor = useCallback((type) => {
    switch (type?.toLowerCase()) {
      case 'theory': return 'bg-blue-100 text-blue-800';
      case 'practice': return 'bg-green-100 text-green-800';
      case 'seminar': return 'bg-yellow-100 text-yellow-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getTypeLabel = useCallback((type) => {
    const labels = {
      'theory': 'Teoría',
      'practice': 'Práctica',
      'seminar': 'Seminario',
      'other': 'Otro'
    };
    return labels[type] || type;
  }, []);

  const getSemesterLabel = useCallback((semester) => {
    const labels = {
      '1': 'Primer Semestre',
      '2': 'Segundo Semestre',
      'anual': 'Anual'
    };
    return labels[semester] || semester;
  }, []);

  // Memoizar la función de renderizado para evitar re-creación en cada render
  const renderTeachingClass = useCallback((teachingClass) => (
    <div key={teachingClass._id} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-semibold text-gray-900">{teachingClass.subject}</h3>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getClassTypeColor(teachingClass.type)}`}>
              {getTypeLabel(teachingClass.type)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
            {teachingClass.degree && (
              <div>
                <span className="font-medium">Grado:</span> {teachingClass.degree}
              </div>
            )}
            
            {teachingClass.academic_year && (
              <div>
                <span className="font-medium">Año Académico:</span> {teachingClass.academic_year}
              </div>
            )}
            
            {teachingClass.semester && (
              <div>
                <span className="font-medium">Semestre:</span> {getSemesterLabel(teachingClass.semester)}
              </div>
            )}

            {teachingClass.credits && (
              <div>
                <span className="font-medium">Créditos:</span> {teachingClass.credits}
              </div>
            )}

            {teachingClass.hours && (
              <div>
                <span className="font-medium">Horas:</span> {teachingClass.hours}
              </div>
            )}
          </div>

          {teachingClass.description && (
            <p className="text-gray-700 mt-4">{teachingClass.description}</p>
          )}
        </div>

        {(canEdit() || canDelete()) && (
          <div className="flex gap-2 ml-4">
            {canEdit() && (
              <Link
                to={`/teaching-classes/${teachingClass._id}/edit`}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Editar
              </Link>
            )}
            {canDelete() && (
              <button
                onClick={() => handleDelete(teachingClass._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  ), [handleDelete, getClassTypeColor, getTypeLabel, getSemesterLabel, canEdit, canDelete]);

  // Memoizar la sección de encabezado para que no se re-renderice
  const headerSection = useMemo(() => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clases de Enseñanza</h1>
        {canCreate() && (
          <Link
            to="/teaching-classes/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Nueva Clase
          </Link>
        )}
      </div>

      <SearchFilters
        onSearchChange={handleSearchChange}
        sortBy={filters.sortBy}
        onSortChange={handleSortChange}
        searchPlaceholder="Buscar por asignatura, grado o tipo..."
        sortOptions={[
          { value: 'academic_year_desc', label: 'Año más reciente' },
          { value: 'academic_year_asc', label: 'Año más antiguo' },
          { value: 'subject_asc', label: 'Asignatura A-Z' },
          { value: 'subject_desc', label: 'Asignatura Z-A' }
        ]}
        itemsPerPage={filters.itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPageOptions={[
          { value: 20, label: '20 por página' },
          { value: 40, label: '40 por página' },
          { value: 'all', label: 'Todas' }
        ]}
      />

      <PaginationControls
        currentItems={teachingClasses.length}
        totalItems={totalItems}
        itemType="clase(s)"
        itemsPerPage={filters.itemsPerPage}
        showTopControls={true}
      />
    </div>
  ), [
    canCreate,
    handleSearchChange, 
    handleSortChange, 
    handleItemsPerPageChange, 
    filters.sortBy, 
    filters.itemsPerPage,
    teachingClasses.length,
    totalItems
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sección de encabezado y filtros - Memoizada para evitar re-renders */}
      {headerSection}

      {/* Sección de resultados - SOLO se re-renderiza cuando cambian los datos */}
      <ResultsList
        items={teachingClasses}
        loading={loading}
        error={error}
        renderItem={renderTeachingClass}
        emptyMessage="No se encontraron clases"
        emptyAction={
          <Link
            to="/teaching-classes/new"
            className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Crear Primera Clase
          </Link>
        }
      />

      <PaginationControls
        currentItems={teachingClasses.length}
        totalItems={totalItems}
        itemType="clase(s)"
        itemsPerPage={filters.itemsPerPage}
        currentPage={filters.currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showBottomControls={true}
      />
    </div>
  );
};

export default TeachingClasses;
