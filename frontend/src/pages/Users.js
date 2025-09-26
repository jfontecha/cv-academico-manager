import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Users as UsersIcon, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Users = () => {
  const queryClient = useQueryClient();
  const { isAdmin, canEdit, user, token, refreshUserProfile } = useAuth();
  
  // Estado para filtros y ordenación
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('username'); // 'username' | 'lastAccess'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  
  console.log('🔍 [Users] Current filters:', {
    searchTerm,
    roleFilter,
    sortBy,
    sortOrder
  });
  
  // Refresh user profile if createdAt is missing
  useEffect(() => {
    if (user && token && !user.createdAt) {
      console.log('🔄 User missing createdAt, refreshing profile...');
      refreshUserProfile();
    }
  }, [user, token, refreshUserProfile]);

  // Verificar si el usuario tiene permisos para ver usuarios
  const canViewUsers = isAdmin() || canEdit();

  // Query para obtener todos los usuarios - solo si el usuario tiene permisos
  const { data, isLoading, error } = useQuery(
    'allUsers',
    async () => {
      console.log('🔍 Fetching all users without filters');
      console.log('🔐 Current user:', user);
      console.log('🔑 Current token:', !!token);
      console.log('👥 Can view users:', canViewUsers);
      
      const response = await userAPI.getAll({ limit: 1000 }); // Obtener todos los usuarios
      console.log('📝 Full API response:', response);
      return response;
    },
    {
      enabled: !!user && !!token && canViewUsers, // Solo ejecutar si el usuario tiene permisos
      retry: 1,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        console.log('✅ Users loaded successfully:', data);
        console.log('📊 Response data structure:', {
          success: data?.data?.success,
          dataArray: data?.data?.data,
          dataLength: data?.data?.data?.length
        });
      },
      onError: (error) => {
        console.error('❌ Error loading users:', error);
        console.error('❌ Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      }
    }
  );

  // Mutation para eliminar usuario
  const deleteUserMutation = useMutation(userAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('allUsers');
      toast.success('Usuario eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar usuario');
    },
  });

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${name}?`)) {
      deleteUserMutation.mutate(id);
    }
  };

  // Procesamiento de datos con filtros y ordenación
  const processedUsers = useMemo(() => {
    if (!data?.data?.data) return [];
    
    let users = [...data.data.data];
    console.log('🔄 [Users] Processing users, initial count:', users.length);
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      users = users.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 [Users] After search filter:', users.length);
    }
    
    // Aplicar filtro de rol
    if (roleFilter) {
      users = users.filter(user => user.role === roleFilter);
      console.log('👥 [Users] After role filter:', users.length);
    }
    
    // Aplicar ordenación
    users.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'username') {
        aValue = a.username?.toLowerCase() || '';
        bValue = b.username?.toLowerCase() || '';
      } else if (sortBy === 'lastAccess') {
        aValue = a.lastAccess ? new Date(a.lastAccess) : new Date(0);
        bValue = b.lastAccess ? new Date(b.lastAccess) : new Date(0);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    console.log('📊 [Users] Final processed users:', users.length);
    return users;
  }, [data, searchTerm, roleFilter, sortBy, sortOrder]);

  // Funciones de ordenación
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { 
        label: 'Administrador',
        className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
      },
      moderator: { 
        label: 'Moderador',
        className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'
      },
      user: { 
        label: 'Usuario',
        className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
      },
      guest: { 
        label: 'Invitado',
        className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
      }
    };
    
    const config = roleConfig[role] || roleConfig.user;
    
    return (
      <span className={config.className}>
        {config.label}
      </span>
    );
  };

  // Mostrar error detallado si ocurre
  if (error) {
    console.error('🚨 Error en componente Users:', error);
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-medium mb-2">Error al cargar usuarios</h3>
          <p className="text-sm text-gray-600">Detalles: {error.message}</p>
          {error.response?.status && (
            <p className="text-sm text-gray-600">Código de error: {error.response.status}</p>
          )}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Si el usuario no tiene permisos para ver usuarios
  if (!canViewUsers && user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin permisos</h3>
          <p className="text-gray-500">
            No tienes permisos suficientes para ver la lista de usuarios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios CV Manager</h1>
          <p className="mt-2 text-gray-600">
            Gestiona los usuarios del sistema CV Académico
          </p>
        </div>
        {isAdmin() && (
          <Link 
            to="/users/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Nuevo Usuario
          </Link>
        )}
      </div>

      {/* Información del Usuario Actual */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center">
            <UsersIcon className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-semibold text-gray-900">
                {user?.username || 'Usuario'}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.role === 'admin' 
                  ? 'bg-red-100 text-red-800' 
                  : user?.role === 'moderator'
                  ? 'bg-yellow-100 text-yellow-800'
                  : user?.role === 'guest'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user?.role === 'admin' 
                  ? 'Administrador' 
                  : user?.role === 'moderator'
                  ? 'Moderador'
                  : user?.role === 'guest'
                  ? 'Invitado'
                  : 'Usuario'}
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              {user?.email || 'No email disponible'}
            </p>
            <div className="flex items-center space-x-6 mt-2 text-sm text-gray-500">
              <span>
                Último acceso: {user?.lastAccess 
                  ? new Date(user.lastAccess).toLocaleString('es-ES') 
                  : 'Nunca'
                }
              </span>
              <span>
                Usuario creado el: {user?.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString('es-ES')
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Gestión de Usuarios (Solo para Administradores) */}
      {isAdmin() && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Todos los Usuarios del Sistema</h2>
              <p className="mt-1 text-gray-600">
                Lista completa de usuarios registrados en el CV Académico
              </p>
            </div>
          </div>

          {/* Controles de Filtros y Búsqueda */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Campo de búsqueda */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por usuario o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {/* Filtro por rol */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Todos los roles</option>
                  <option value="admin">Administrador</option>
                  <option value="moderator">Moderador</option>
                  <option value="user">Usuario</option>
                  <option value="guest">Invitado</option>
                </select>
              </div>

              {/* Información de resultados */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {processedUsers.length} usuario{processedUsers.length !== 1 ? 's' : ''} 
                  {(searchTerm || roleFilter) && ` (filtrado${processedUsers.length !== 1 ? 's' : ''})`}
                </span>
                {(searchTerm || roleFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de usuarios (Solo para Administradores) */}
      {isAdmin() && (
        <div className="bg-white shadow rounded-lg">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando usuarios...</p>
            </div>
          ) : data?.data?.success && processedUsers.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('username')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Usuario</span>
                        {getSortIcon('username')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('lastAccess')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Último Acceso</span>
                        {getSortIcon('lastAccess')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de registro</th>
                    {canEdit() && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {processedUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <UsersIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">ID: {user._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {user.lastAccess ? new Date(user.lastAccess).toLocaleDateString() : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      {canEdit() && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            {canEdit() && (
                              <Link
                                to={`/users/${user._id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit className="h-5 w-5" />
                              </Link>
                            )}
                            {isAdmin() && (
                              <button
                                onClick={() => handleDelete(user._id, user.username)}
                                className="text-red-600 hover:text-red-900"
                                disabled={deleteUserMutation.isLoading}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Resumen de usuarios */}
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
                <div className="text-sm text-gray-700">
                  <p>
                    Total de usuarios registrados: <span className="font-medium">{data?.data?.data?.length || 0}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios registrados</h3>
              <p className="text-gray-500 mb-6">
                Comienza agregando el primer usuario del sistema CV Académico.
              </p>
              {isAdmin() && (
                <Link 
                  to="/users/new" 
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Crear Usuario
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mensaje para usuarios sin permisos de administrador */}
      {!isAdmin() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <UsersIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
            <p className="text-gray-600">
              Solo los administradores pueden ver y gestionar la lista de usuarios del sistema.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;