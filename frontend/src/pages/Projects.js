import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllProjects, deleteProject } from '../services/api';
import SearchFilters, { ResultsList } from '../components/SearchFilters';
import PaginationControls from '../components/PaginationControls';
import { useAuth } from '../contexts/AuthContext';

// Projects listing component
const Projects = () => {
  const { canCreate, canEdit, canDelete } = useAuth();
  
  // Estados para filtros (no causan re-render de resultados)
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    sortBy: 'start_date_desc',
    currentPage: 1,
    itemsPerPage: 20
  });

  // Estados para datos (solo se actualizan cuando cambian los datos)
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      
      // Map frontend sort keys to backend field names
      const sortMapping = {
        'start_date': 'start_date',
        'end_date': 'end_date', 
        'title': 'title'
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

      if (filters.role && filters.role.trim()) {
        params.role = filters.role.trim();
      }
      
      console.log('Fetching projects with params:', params); // Debug log
      
      const response = await getAllProjects(params);
      setProjects(response.data.data);
      setTotalItems(response.data.pagination.total);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Error al cargar los proyectos');
      setProjects([]); // Limpiar proyectos en caso de error
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      try {
        await deleteProject(id);
        fetchProjects(); // Refetch to update pagination
      } catch (err) {
        setError('Error al eliminar el proyecto');
      }
    }
  }, [fetchProjects]);

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

  const handleRoleChange = useCallback((value) => {
    console.log('Role change:', value); // Debug log
    updateFilters({ role: value, currentPage: 1 });
  }, [updateFilters]);

  const handleSortChange = useCallback((value) => {
    console.log('Sort change:', value); // Debug log
    updateFilters({ sortBy: value, currentPage: 1 });
  }, [updateFilters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  }, []);

  const formatCurrency = useCallback((amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  }, []);

  // Memoizar la función de renderizado para evitar re-creación en cada render
  const renderProject = useCallback((project) => (
    <div key={project._id} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
          </div>
          
          {project.description && (
            <p className="text-gray-700 mb-4">{project.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
            {project.reference && (
              <div>
                <span className="font-medium">Referencia:</span> {project.reference}
              </div>
            )}
            
            {project.principal_investigator && (
              <div>
                <span className="font-medium">Investigador Principal:</span> {project.principal_investigator}
              </div>
            )}
            
            {project.funding_agency && (
              <div>
                <span className="font-medium">Entidad Financiadora:</span> {project.funding_agency}
              </div>
            )}

            {project.role && (
              <div>
                <span className="font-medium">Rol:</span> {project.role}
              </div>
            )}

            {project.budget && (
              <div>
                <span className="font-medium">Presupuesto:</span> {formatCurrency(project.budget)}
              </div>
            )}

            {project.start_date && (
              <div>
                <span className="font-medium">Inicio:</span> {formatDate(project.start_date)}
              </div>
            )}

            {project.end_date && (
              <div>
                <span className="font-medium">Fin:</span> {formatDate(project.end_date)}
              </div>
            )}
          </div>

          {project.url && (
            <div className="mt-4">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                Ver proyecto →
              </a>
            </div>
          )}
        </div>

        {(canEdit() || canDelete()) && (
          <div className="flex gap-2 ml-4">
            {canEdit() && (
              <Link
                to={`/projects/${project._id}/edit`}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Editar
              </Link>
            )}
            {canDelete() && (
              <button
                onClick={() => handleDelete(project._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  ), [handleDelete, formatDate, formatCurrency, canEdit, canDelete]);

  // Memoizar la sección de encabezado para que no se re-renderice
  const headerSection = useMemo(() => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Proyectos de Investigación</h1>
        {canCreate() && (
          <Link
            to="/projects/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Nuevo Proyecto
          </Link>
        )}
      </div>

      <SearchFilters
        onSearchChange={handleSearchChange}
        sortBy={filters.sortBy}
        onSortChange={handleSortChange}
        searchPlaceholder="Buscar por título, descripción..."
        additionalFilters={[
          {
            value: filters.role,
            onChange: handleRoleChange,
            options: [
              { value: '', label: 'Todos los roles' },
              { value: 'IP', label: 'IP (Investigador Principal)' },
              { value: 'Investigador', label: 'Investigador' },
              { value: 'Otro', label: 'Otro' }
            ]
          }
        ]}
        sortOptions={[
          { value: 'start_date_desc', label: 'Inicio más reciente' },
          { value: 'start_date_asc', label: 'Inicio más antiguo' },
          { value: 'end_date_desc', label: 'Fin más reciente' },
          { value: 'end_date_asc', label: 'Fin más antiguo' },
          { value: 'title_asc', label: 'Título A-Z' },
          { value: 'title_desc', label: 'Título Z-A' }
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
        currentItems={projects.length}
        totalItems={totalItems}
        itemType="proyecto(s)"
        itemsPerPage={filters.itemsPerPage}
        showTopControls={true}
      />
    </div>
  ), [
    canCreate,
    handleSearchChange, 
    handleSortChange, 
    handleItemsPerPageChange,
    handleRoleChange,
    filters.sortBy, 
    filters.itemsPerPage,
    filters.role,
    projects.length,
    totalItems
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sección de encabezado y filtros - Memoizada para evitar re-renders */}
      {headerSection}

      {/* Sección de resultados - SOLO se re-renderiza cuando cambian los datos */}
      <ResultsList
        items={projects}
        loading={loading}
        error={error}
        renderItem={renderProject}
        emptyMessage="No se encontraron proyectos"
        emptyAction={
          <Link
            to="/projects/new"
            className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Crear Primer Proyecto
          </Link>
        }
      />

      <PaginationControls
        currentItems={projects.length}
        totalItems={totalItems}
        itemType="proyecto(s)"
        itemsPerPage={filters.itemsPerPage}
        currentPage={filters.currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showBottomControls={true}
      />
    </div>
  );
};

export default Projects;
