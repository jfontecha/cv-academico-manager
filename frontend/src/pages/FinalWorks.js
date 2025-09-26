import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllFinalWorks, deleteFinalWork } from '../services/api';
import SearchFilters, { ResultsList } from '../components/SearchFilters';
import PaginationControls from '../components/PaginationControls';
import { useAuth } from '../contexts/AuthContext';

const FinalWorks = () => {
  const { canCreate, canEdit, canDelete } = useAuth();
  
  // Estados para filtros (no causan re-render de resultados)
  const [filters, setFilters] = useState({
    search: '',
    typeFilter: 'all',
    sortBy: 'defense_date_desc',
    currentPage: 1,
    itemsPerPage: 20
  });

  // Estados para datos (solo se actualizan cuando cambian los datos)
  const [finalWorks, setFinalWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchFinalWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      
      // Map frontend sort keys to backend field names
      const sortMapping = {
        'defense_date': 'defense_date',
        'title': 'title',
        'author': 'author',
        'type': 'type'
      };
      
      const sortParts = filters.sortBy.split('_');
      const sortDirection = sortParts.pop(); // Get last part (asc/desc)
      const sortField = sortParts.join('_'); // Join remaining parts
      const backendSortField = sortMapping[sortField] || sortField;
      
      // Construir parámetros de consulta, omitiendo valores vacíos
      const params = {
        page: filters.currentPage,
        limit: filters.itemsPerPage === 'all' ? 1000 : filters.itemsPerPage,
        sortBy: backendSortField,
        sortOrder: sortDirection || 'desc'
      };

      // Solo agregar parámetros no vacíos
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      
      // Add type filter if not 'all'
      if (filters.typeFilter !== 'all') {
        params.type = filters.typeFilter;
      }
      
      console.log('Fetching final works with params:', params); // Debug log
      
      const response = await getAllFinalWorks(params);
      setFinalWorks(response.data.data);
      setTotalItems(response.data.pagination.total);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching final works:', err);
      setError('Error al cargar los trabajos fin de estudios');
      setFinalWorks([]); // Limpiar trabajos en caso de error
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este trabajo fin de estudios?')) {
      try {
        await deleteFinalWork(id);
        fetchFinalWorks(); // Refetch to update pagination
      } catch (err) {
        setError('Error al eliminar el trabajo fin de estudios');
      }
    }
  }, [fetchFinalWorks]);

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

  const handleTypeFilterChange = useCallback((value) => {
    console.log('Type filter change:', value); // Debug log
    updateFilters({ typeFilter: value, currentPage: 1 });
  }, [updateFilters]);

  const handleSortChange = useCallback((value) => {
    console.log('Sort change:', value); // Debug log
    updateFilters({ sortBy: value, currentPage: 1 });
  }, [updateFilters]);

  useEffect(() => {
    fetchFinalWorks();
  }, [fetchFinalWorks]);

  const getTypeColor = useCallback((type) => {
    switch (type?.toLowerCase()) {
      case 'tfg': return 'bg-blue-100 text-blue-800';
      case 'tfm': return 'bg-green-100 text-green-800';
      case 'thesis': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getTypeLabel = useCallback((type) => {
    const labels = {
      'tfg': 'TFG',
      'tfm': 'TFM', 
      'thesis': 'Tesis',
      'other': 'Otro'
    };
    return labels[type] || type;
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  }, []);

  // Memoizar la función de renderizado para evitar re-creación en cada render
  const renderFinalWork = useCallback((work) => (
    <div key={work._id} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-semibold text-gray-900">{work.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(work.type)}`}>
              {getTypeLabel(work.type)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <span className="font-medium">Autor:</span> {work.author}
            </div>
            
            {work.degree && (
              <div>
                <span className="font-medium">Titulación:</span> {work.degree}
              </div>
            )}

            <div>
              <span className="font-medium">Fecha defensa:</span> {formatDate(work.defense_date)}
            </div>

            {work.grade && (
              <div>
                <span className="font-medium">Calificación:</span> {work.grade}
              </div>
            )}
          </div>
        </div>

        {(canEdit() || canDelete()) && (
          <div className="flex gap-2 ml-4">
            {canEdit() && (
              <Link
                to={`/final-works/${work._id}/edit`}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Editar
              </Link>
            )}
            {canDelete() && (
              <button
                onClick={() => handleDelete(work._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  ), [handleDelete, getTypeColor, getTypeLabel, formatDate]);



  // Memoizar la sección de encabezado para que no se re-renderice
  const headerSection = useMemo(() => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Trabajos Fin de Estudios Dirigidos</h1>
        {canCreate() && (
          <Link
            to="/final-works/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Nuevo Trabajo
          </Link>
        )}
      </div>

      <SearchFilters
        onSearchChange={handleSearchChange}
        sortBy={filters.sortBy}
        onSortChange={handleSortChange}
        searchPlaceholder="Buscar por título, autor..."
        sortOptions={[
          { value: 'defense_date_desc', label: 'Fecha defensa más reciente' },
          { value: 'defense_date_asc', label: 'Fecha defensa más antigua' },
          { value: 'title_asc', label: 'Título A-Z' },
          { value: 'title_desc', label: 'Título Z-A' },
          { value: 'author_asc', label: 'Autor A-Z' },
          { value: 'author_desc', label: 'Autor Z-A' },
          { value: 'type_asc', label: 'Tipo A-Z' },
          { value: 'type_desc', label: 'Tipo Z-A' }
        ]}
        additionalFilters={[
          {
            value: filters.typeFilter,
            onChange: handleTypeFilterChange,
            options: [
              { value: 'all', label: 'Todos los tipos' },
              { value: 'tfg', label: 'TFG' },
              { value: 'tfm', label: 'TFM' },
              { value: 'thesis', label: 'Tesis' },
              { value: 'other', label: 'Otro' }
            ]
          }
        ]}
        itemsPerPage={filters.itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPageOptions={[
          { value: 20, label: '20 por página' },
          { value: 40, label: '40 por página' },
          { value: 'all', label: 'Todos' }
        ]}
      />

      <PaginationControls
        currentItems={finalWorks.length}
        totalItems={totalItems}
        itemType="trabajo(s) fin de estudios"
        itemsPerPage={filters.itemsPerPage}
        showTopControls={true}
      />
    </div>
  ), [
    handleSearchChange, 
    handleSortChange, 
    handleTypeFilterChange,
    handleItemsPerPageChange, 
    filters.sortBy, 
    filters.typeFilter,
    filters.itemsPerPage,
    finalWorks.length,
    totalItems
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sección de encabezado y filtros - Memoizada para evitar re-renders */}
      {headerSection}

      {/* Sección de resultados - SOLO se re-renderiza cuando cambian los datos */}
      <ResultsList
        items={finalWorks}
        loading={loading}
        error={error}
        renderItem={renderFinalWork}
        emptyMessage="No se encontraron trabajos fin de estudios"
        emptyAction={canCreate() ? (
          <Link
            to="/final-works/new"
            className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Crear Primer Trabajo
          </Link>
        ) : null}
      />

      <PaginationControls
        currentItems={finalWorks.length}
        totalItems={totalItems}
        itemType="trabajo(s) fin de estudios"
        itemsPerPage={filters.itemsPerPage}
        currentPage={filters.currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showBottomControls={true}
      />
    </div>
  );
};

export default FinalWorks;
