import React, { memo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationControls = memo(({
  currentItems = 0,
  totalItems = 0,
  itemType = 'elemento(s)',
  itemsPerPage = 20,
  onItemsPerPageChange,
  itemsPerPageOptions = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showTopControls = false,
  showBottomControls = false
}) => {
  
  const handleItemsPerPageChange = useCallback((value) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(value === 'all' ? 'all' : parseInt(value));
    }
  }, [onItemsPerPageChange]);

  // Componente para mostrar información superior
  const TopControls = memo(() => (
    <div className="flex justify-between items-center mb-4">
      <div className="text-sm text-gray-600">
        {itemsPerPage === 'all' 
          ? `${totalItems} ${itemType} total(es)`
          : `Mostrando ${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-${Math.min(currentPage * itemsPerPage, totalItems)} de ${totalItems} ${itemType}`
        }
      </div>
      {itemsPerPageOptions.length > 0 && (
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Mostrar:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">por página</span>
        </div>
      )}
    </div>
  ));

  TopControls.displayName = 'TopControls';

  // Componente para la paginación inferior
  const BottomPagination = memo(() => {
    if (itemsPerPage === 'all' || totalPages <= 1) return null;

    return (
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="text-sm text-gray-600">
          Página {currentPage} de {totalPages}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </button>
          
          <div className="flex space-x-1">
            {[...Array(Math.min(totalPages, 7))].map((_, index) => {
              let page;
              if (totalPages <= 7) {
                page = index + 1;
              } else if (currentPage <= 4) {
                page = index + 1;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + index;
              } else {
                page = currentPage - 3 + index;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => onPageChange?.(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  });

  BottomPagination.displayName = 'BottomPagination';

  return (
    <>
      {showTopControls && <TopControls />}
      {showBottomControls && <BottomPagination />}
    </>
  );
});

PaginationControls.displayName = 'PaginationControls';

export default PaginationControls;
