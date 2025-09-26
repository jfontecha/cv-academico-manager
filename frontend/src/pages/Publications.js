import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllPublications, deletePublication } from '../services/api';
import SearchFilters, { ResultsList } from '../components/SearchFilters';
import PaginationControls from '../components/PaginationControls';
import { useAuth } from '../contexts/AuthContext';

const Publications = () => {
  const { canCreate, canEdit, canDelete } = useAuth();
  
  // Estados para filtros (no causan re-render de resultados)
  const [filters, setFilters] = useState({
    search: '',
    typeFilter: '',
    sortBy: 'year_desc',
    currentPage: 1,
    itemsPerPage: 20
  });

  // Estados para datos (solo se actualizan cuando cambian los datos)
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      
      // Map frontend sort keys to backend field names
      const sortMapping = {
        'year': 'year_publication',
        'title': 'title'
      };
      
      const [sortField, sortDirection] = filters.sortBy.split('_');
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
      
      if (filters.typeFilter && filters.typeFilter.trim()) {
        params.type = filters.typeFilter.trim();
      }
      
      console.log('Fetching publications with params:', params); // Debug log
      
      const response = await getAllPublications(params);
      setPublications(response.data.data);
      setTotalItems(response.data.pagination.total);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching publications:', err);
      setError('Error al cargar las publicaciones');
      setPublications([]); // Limpiar publicaciones en caso de error
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      try {
        await deletePublication(id);
        fetchPublications(); // Refetch to update pagination
      } catch (err) {
        setError('Error al eliminar la publicación');
      }
    }
  }, [fetchPublications]);

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
    fetchPublications();
  }, [fetchPublications]);

  const getTypeColor = useCallback((type) => {
    switch (type) {
      case 'journal': return 'bg-blue-100 text-blue-800';
      case 'conference': return 'bg-green-100 text-green-800';
      case 'keynote': return 'bg-purple-100 text-purple-800';
      case 'book': return 'bg-orange-100 text-orange-800';
      case 'chapter': return 'bg-yellow-100 text-yellow-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getTypeLabel = useCallback((type) => {
    switch (type) {
      case 'journal': return 'Revista';
      case 'conference': return 'Conferencia';
      case 'keynote': return 'Keynote';
      case 'book': return 'Libro';
      case 'chapter': return 'Capítulo';
      case 'other': return 'Otro';
      default: return type;
    }
  }, []);

  // Memoizar la función de renderizado para evitar re-creación en cada render
  const renderPublication = useCallback((publication) => (
    <div key={publication._id} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{publication.title}</h3>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(publication.type)}`}>
              {getTypeLabel(publication.type)}
            </span>
          </div>
          
          {publication.authors && (
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Autores:</span> {publication.authors}
            </p>
          )}
          
          {publication.publication && (
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Publicación:</span> {publication.publication}
            </p>
          )}

          {publication.info_publication && (
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Info. Adicional:</span> {publication.info_publication}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {publication.year_publication && (
              <span><span className="font-medium">Año:</span> {publication.year_publication}</span>
            )}
            {publication.quartile && (
              <span><span className="font-medium">Cuartil:</span> {publication.quartile}</span>
            )}
            {publication.if && (
              <span><span className="font-medium">Factor Impacto:</span> {publication.if}</span>
            )}
          </div>

          {publication.doi && (
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">DOI:</span> {publication.doi}
            </p>
          )}

          {publication.url && (
            <p className="mt-2">
              <a
                href={publication.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                Ver publicación →
              </a>
            </p>
          )}
        </div>

        {(canEdit() || canDelete()) && (
          <div className="flex gap-2 ml-4">
            {canEdit() && (
              <Link
                to={`/publications/${publication._id}/edit`}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Editar
              </Link>
            )}
            {canDelete() && (
              <button
                onClick={() => handleDelete(publication._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  ), [handleDelete, getTypeColor, getTypeLabel]);

  // Memoizar la sección de encabezado para que no se re-renderice
  const headerSection = useMemo(() => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Publicaciones</h1>
        {canCreate() && (
          <Link
            to="/publications/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Nueva Publicación
          </Link>
        )}
      </div>

      <SearchFilters
        onSearchChange={handleSearchChange}
        sortBy={filters.sortBy}
        onSortChange={handleSortChange}
        searchPlaceholder="Buscar por título, autores..."
        sortOptions={[
          { value: 'year_desc', label: 'Más recientes primero' },
          { value: 'year_asc', label: 'Más antiguos primero' },
          { value: 'title_asc', label: 'Título A-Z' },
          { value: 'title_desc', label: 'Título Z-A' }
        ]}
        additionalFilters={[
          {
            value: filters.typeFilter,
            onChange: handleTypeFilterChange,
            options: [
              { value: '', label: 'Todos los tipos' },
              { value: 'journal', label: 'Revista' },
              { value: 'conference', label: 'Conferencia' },
              { value: 'keynote', label: 'Keynote' },
              { value: 'book', label: 'Libro' },
              { value: 'chapter', label: 'Capítulo' },
              { value: 'other', label: 'Otro' }
            ]
          }
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
        currentItems={publications.length}
        totalItems={totalItems}
        itemType="publicación(es)"
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
    publications.length,
    totalItems
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sección de encabezado y filtros - Memoizada para evitar re-renders */}
      {headerSection}

      {/* Sección de resultados - SOLO se re-renderiza cuando cambian los datos */}
      <ResultsList
        items={publications}
        loading={loading}
        error={error}
        renderItem={renderPublication}
        emptyMessage="No se encontraron publicaciones"
        emptyAction={canCreate() ? (
          <Link
            to="/publications/new"
            className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Crear Primera Publicación
          </Link>
        ) : null}
      />

      <PaginationControls
        currentItems={publications.length}
        totalItems={totalItems}
        itemType="publicación(es)"
        itemsPerPage={filters.itemsPerPage}
        currentPage={filters.currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showBottomControls={true}
      />
    </div>
  );
};

export default Publications;
