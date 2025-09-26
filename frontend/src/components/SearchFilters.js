import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Componente separado para mostrar resultados que no se re-renderiza con los filtros
const ResultsList = React.memo(({ 
  items, 
  loading, 
  error, 
  renderItem, 
  emptyMessage = "No se encontraron elementos",
  emptyAction = null 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => renderItem(item))}
    </div>
  );
});

ResultsList.displayName = 'ResultsList';

// Hook personalizado para manejar búsqueda con debounce optimizado
const useSearchDebounce = (onSearchChange, delay = 500) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debounceRef = useRef(null);
  const onSearchChangeRef = useRef(onSearchChange);

  // Actualizar la referencia sin causar re-renders
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    
    // Limpiar timeout anterior si existe
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onSearchChangeRef.current(value.trim());
    }, delay);
  }, [delay]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return [searchTerm, handleSearchChange, setSearchTerm];
};

// Versión completamente aislada de SearchFilters
const IsolatedSearchFilters = React.memo(({ 
  onSearchChange, 
  sortBy = '',
  onSortChange, 
  searchPlaceholder = "Buscar...", 
  sortOptions = [],
  additionalFilters = [],
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = []
}) => {
  // Estados internos para evitar re-renders del componente padre
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [internalSortBy, setInternalSortBy] = useState(sortBy);
  const [internalItemsPerPage, setInternalItemsPerPage] = useState(itemsPerPage);

  // Referencias para callbacks que no cambian
  const searchChangeRef = useRef(onSearchChange);
  const sortChangeRef = useRef(onSortChange);
  const itemsPerPageChangeRef = useRef(onItemsPerPageChange);
  const debounceRef = useRef(null);

  // Actualizar referencias sin causar re-renders
  useEffect(() => {
    searchChangeRef.current = onSearchChange;
    sortChangeRef.current = onSortChange;
    itemsPerPageChangeRef.current = onItemsPerPageChange;
  }, [onSearchChange, onSortChange, onItemsPerPageChange]);

  // Sincronizar props externas solo cuando cambian realmente
  useEffect(() => {
    if (sortBy !== internalSortBy) {
      setInternalSortBy(sortBy);
    }
  }, [sortBy, internalSortBy]);

  useEffect(() => {
    if (itemsPerPage !== internalItemsPerPage) {
      setInternalItemsPerPage(itemsPerPage);
    }
  }, [itemsPerPage, internalItemsPerPage]);

  // Manejar búsqueda con debounce
  const handleSearchInputChange = useCallback((e) => {
    const value = e.target.value;
    setInternalSearchValue(value);

    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Crear nuevo timeout
    debounceRef.current = setTimeout(() => {
      searchChangeRef.current(value.trim());
    }, 500);
  }, []);

  // Manejar cambios en ordenamiento
  const handleSortChange = useCallback((e) => {
    const value = e.target.value;
    setInternalSortBy(value);
    sortChangeRef.current(value);
  }, []);

  // Manejar cambios en elementos por página
  const handleItemsPerPageChange = useCallback((e) => {
    const value = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
    setInternalItemsPerPage(value);
    itemsPerPageChangeRef.current(value);
  }, []);

  // Cleanup del debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Calcular número de columnas del grid
  const gridCols = useMemo(() => {
    const baseColumns = 2; // búsqueda + ordenamiento
    const additionalColumns = additionalFilters.length;
    const itemsPerPageColumn = itemsPerPageOptions.length > 0 ? 1 : 0;
    const totalColumns = baseColumns + additionalColumns + itemsPerPageColumn;
    
    if (totalColumns <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalColumns <= 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  }, [additionalFilters.length, itemsPerPageOptions.length]);

  return (
    <div className={`grid ${gridCols} gap-4 mb-6`}>
      {/* Campo de búsqueda */}
      <div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={internalSearchValue}
          onChange={handleSearchInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Filtros adicionales */}
      {additionalFilters.map((filter, index) => (
        <div key={index}>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {filter.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Ordenamiento */}
      <div>
        <select
          value={internalSortBy}
          onChange={handleSortChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Elementos por página (si se proporciona) */}
      {itemsPerPageOptions.length > 0 && (
        <div>
          <select
            value={internalItemsPerPage}
            onChange={handleItemsPerPageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});

IsolatedSearchFilters.displayName = 'IsolatedSearchFilters';

// Mantener compatibilidad con el componente anterior
const SearchFilters = IsolatedSearchFilters;
SearchFilters.displayName = 'SearchFilters';

export { ResultsList, useSearchDebounce, IsolatedSearchFilters };
export default SearchFilters;
