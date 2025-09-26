import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTeachingInnovation, getTeachingInnovationById, updateTeachingInnovation } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TeachingInnovationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { canCreate, canEdit, isGuest } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    call: '',
    principal_researcher: '',
    start_date: '',
    end_date: '',
    reference: '',
    description: '',
    url: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect guests away from forms - they don't have permission to create/edit
  useEffect(() => {
    if (isGuest() || (!canCreate() && !isEditing) || (!canEdit() && isEditing)) {
      navigate('/teaching-innovation');
    }
  }, [isGuest, canCreate, canEdit, isEditing, navigate]);

  const fetchInnovation = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getTeachingInnovationById(id);
      const innovation = response.data.data;
      setFormData({
        title: innovation.title || '',
        call: innovation.call || '',
        principal_researcher: innovation.principal_researcher || '',
        start_date: innovation.start_date ? innovation.start_date.split('T')[0] : '',
        end_date: innovation.end_date ? innovation.end_date.split('T')[0] : '',
        reference: innovation.reference || '',
        description: innovation.description || '',
        url: innovation.url || ''
      });
    } catch (err) {
      setError('Error al cargar el proyecto de innovación: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchInnovation();
    }
  }, [isEditing, fetchInnovation]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Preparar datos completos para envío
      const submitData = {
        title: formData.title.trim(),
        call: formData.call.trim(),
        principal_researcher: formData.principal_researcher.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        // Para campos opcionales: enviar string vacío o valor trimado
        reference: formData.reference.trim(),
        description: formData.description.trim(),
        url: formData.url.trim()
      };

      if (isEditing) {
        await updateTeachingInnovation(id, submitData);
      } else {
        // Para creación, limpiar campos vacíos
        const createData = { ...submitData };
        Object.keys(createData).forEach(key => {
          if (key !== 'title' && key !== 'call' && key !== 'principal_researcher' && 
              key !== 'start_date' && key !== 'end_date' && !createData[key]) {
            createData[key] = undefined;
          }
        });
        await createTeachingInnovation(createData);
      }

      navigate('/teaching-innovation');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el proyecto de innovación');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          Cargando proyecto de innovación (ID: {id})...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Proyecto de Innovación' : 'Nuevo Proyecto de Innovación'}
        </h1>
        <p className="text-gray-600 mt-2">
          Complete la información del proyecto de innovación docente
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Título */}
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título del Proyecto *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Título del proyecto de innovación docente"
            />
          </div>

          {/* Convocatoria */}
          <div>
            <label htmlFor="call" className="block text-sm font-medium text-gray-700 mb-2">
              Convocatoria *
            </label>
            <input
              type="text"
              id="call"
              name="call"
              value={formData.call}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Convocatoria del proyecto"
            />
          </div>

          {/* Investigador Principal */}
          <div>
            <label htmlFor="principal_researcher" className="block text-sm font-medium text-gray-700 mb-2">
              Investigador Principal *
            </label>
            <input
              type="text"
              id="principal_researcher"
              name="principal_researcher"
              value={formData.principal_researcher}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Investigador principal del proyecto"
            />
          </div>

          {/* Fecha de Inicio */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Fecha de Fin */}
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Fin *
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Referencia */}
          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
              Referencia
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Referencia del proyecto"
            />
          </div>

          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Sitio Web
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Descripción del proyecto de innovación..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/teaching-innovation')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeachingInnovationForm;
