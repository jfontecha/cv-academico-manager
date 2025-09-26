import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  console.log('🔍 [UserForm] Component loaded with:', {
    id,
    isEdit,
    url: window.location.href
  });



  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      username: '',
      email: '',
      role: '',
      password: ''
    }
  });

  // Query para obtener datos del usuario (solo en modo edición)
  const { data: userData, isLoading, error } = useQuery(
    ['user', id],
    async () => {
      console.log('🔍 [UserForm] Fetching user with ID:', id);
      const response = await userAPI.getById(id);
      console.log('📝 [UserForm] API response:', response);
      return response;
    },
    {
      enabled: isEdit,
      onSuccess: (data) => {
        console.log('✅ [UserForm] User data received:', data);
        console.log('📊 [UserForm] Data structure:', {
          fullResponse: data,
          dataProperty: data.data,
          userObject: data.data
        });
      },
      onError: (error) => {
        console.error('❌ [UserForm] Error fetching user:', error);
        console.error('❌ [UserForm] Error details:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          fullError: error
        });
      }
    }
  );

  // UseEffect para poblar el formulario cuando los datos estén disponibles
  useEffect(() => {
    if (isEdit && userData && userData.data) {
      const user = userData.data;
      console.log('� [UserForm] useEffect triggered - populating form with user:', user);
      
      // Debug detallado del objeto user
      console.log('🔍 [UserForm] User object type:', typeof user);
      console.log('🔍 [UserForm] User object keys:', Object.keys(user));
      console.log('🔍 [UserForm] Full user object:', JSON.stringify(user, null, 2));
      console.log('🔍 [UserForm] User.username:', user.username, 'type:', typeof user.username);
      console.log('🔍 [UserForm] User.email:', user.email, 'type:', typeof user.email);
      console.log('🔍 [UserForm] User.role:', user.role, 'type:', typeof user.role);
      console.log('🔍 [UserForm] User._id:', user._id);
      
      // Explorar posibles estructuras alternativas
      console.log('🔍 [UserForm] Exploring userData.data.data:', userData.data.data);
      console.log('🔍 [UserForm] Exploring userData.data.user:', userData.data.user);
      console.log('🔍 [UserForm] Complete userData structure:', JSON.stringify(userData, null, 2));
      
      // Intentar diferentes formas de acceder a los datos
      let actualUser = null;
      
      // Opción 1: userData.data (actual)
      if (user && user.username) {
        console.log('✅ [UserForm] Using userData.data directly');
        actualUser = user;
      }
      // Opción 2: userData.data.data (doble data)
      else if (userData.data.data && userData.data.data.username) {
        console.log('✅ [UserForm] Using userData.data.data');
        actualUser = userData.data.data;
      }
      // Opción 3: userData.data.user
      else if (userData.data.user && userData.data.user.username) {
        console.log('✅ [UserForm] Using userData.data.user');
        actualUser = userData.data.user;
      }
      // Opción 4: Buscar en todas las propiedades
      else {
        console.log('🔍 [UserForm] Searching for user data in all properties...');
        Object.keys(userData.data).forEach(key => {
          const value = userData.data[key];
          if (value && typeof value === 'object' && value.username) {
            console.log(`✅ [UserForm] Found user data in userData.data.${key}`);
            actualUser = value;
          }
        });
      }
      
      if (!actualUser) {
        console.error('❌ [UserForm] Could not find user data in any expected location');
        return;
      }
      
      console.log('👤 [UserForm] Using actual user object:', actualUser);
      
      // Usar setValue de React Hook Form para poblar los campos
      console.log('📝 [UserForm] Setting values with React Hook Form setValue...');
      setValue('username', actualUser.username || '', { shouldValidate: true, shouldDirty: true });
      setValue('email', actualUser.email || '', { shouldValidate: true, shouldDirty: true });
      setValue('role', actualUser.role || '', { shouldValidate: true, shouldDirty: true });
      setValue('password', '', { shouldValidate: false, shouldDirty: false });
      
      console.log('✅ [UserForm] Form populated with setValue');
      
      // Verificar que los valores se establecieron
      setTimeout(() => {
        const currentValues = {
          username: watch('username'),
          email: watch('email'),
          role: watch('role')
        };
        console.log('🔍 [UserForm] Current form values after setValue:', currentValues);
      }, 100);
      
      console.log('✅ [UserForm] Form values updated in state');
      
      // Verificar que los valores se establecieron
      setTimeout(() => {
        const currentValues = {
          username: watch('username'),
          email: watch('email'),
          role: watch('role')
        };
        console.log('🔍 [UserForm] Form values after setValue:', currentValues);
      }, 100);
    }
  }, [isEdit, userData, setValue, watch]);

  // Log para mostrar los datos del usuario cuando están disponibles para el renderizado
  if (isEdit && userData?.data) {
    console.log('📋 [UserForm] Rendering form with user data:', {
      username: userData.data.username,
      email: userData.data.email,
      role: userData.data.role,
      hasData: !!userData.data
    });
  }

  // Mutation para crear/actualizar usuario
  const mutation = useMutation(
    (data) => isEdit ? userAPI.update(id, data) : userAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success(`Usuario ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
        navigate('/users');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || `Error al ${isEdit ? 'actualizar' : 'crear'} usuario`);
      },
    }
  );



  const onSubmit = (data) => {
    console.log('📤 [UserForm] Form submitted with data:', data);
    
    // Procesar datos del formulario según modelo backend
    const formattedData = {
      username: data.username,
      email: data.email,
      role: data.role,
    };

    // Solo incluir contraseña si se proporciona
    if (data.password) {
      formattedData.password = data.password;
    }

    console.log('📤 [UserForm] Sending formatted data:', formattedData);
    mutation.mutate(formattedData);
  };

  if (isEdit && isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Cargando datos del usuario...</p>
      </div>
    );
  }

  if (isEdit && error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <p className="text-lg font-semibold">Error al cargar usuario</p>
          <p className="text-sm">{error.response?.data?.message || error.message}</p>
        </div>
        <button
          onClick={() => navigate('/users')}
          className="btn-secondary"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a Usuarios
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/users')}
            className="btn-secondary"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEdit ? 'Actualiza la información del usuario' : 'Completa los datos para crear un nuevo usuario'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información personal */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Usuario</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    {...register('username', { 
                      required: 'El nombre de usuario es requerido',
                      minLength: { value: 3, message: 'El nombre de usuario debe tener al menos 3 caracteres' },
                      maxLength: { value: 30, message: 'El nombre de usuario no puede exceder 30 caracteres' }
                    })}
                    className="input-field"
                    placeholder="Ej: juanperez"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'El email es requerido',
                      pattern: {
                        value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                        message: 'Email inválido'
                      }
                    })}
                    className="input-field"
                    placeholder="ejemplo@correo.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="label">
                    Contraseña {isEdit && '(dejar vacío para no cambiar)'}
                  </label>
                  <input
                    type="password"
                    {...register('password', isEdit ? {} : { 
                      required: 'La contraseña es requerida',
                      minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                    })}
                    className="input-field"
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>
            </div>


          </div>

          {/* Configuración de cuenta */}
          <div>
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Cuenta</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    Rol
                  </label>
                  <select
                    {...register('role', { required: 'El rol es requerido' })}
                    className="input-field"
                  >
                    <option value="">Seleccionar rol</option>
                    <option value="user">Usuario</option>
                    <option value="moderator">Moderador</option>
                    <option value="admin">Administrador</option>
                    <option value="guest">Invitado</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>


              </div>

              {/* Botones de acción */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || mutation.isLoading}
                    className="btn-primary flex-1"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {isSubmitting || mutation.isLoading ? 'Guardando...' : isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
