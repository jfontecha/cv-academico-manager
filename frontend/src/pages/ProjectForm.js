import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProject, getProjectById, updateProject } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProjectForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { canCreate, canEdit, isGuest } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    reference: '',
    funding_agency: '',
    principal_investigator: '',
    start_date: '',
    end_date: '',
    budget: '',
    description: '',
    url: '',
    role: 'Investigador'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect guests away from forms - they don't have permission to create/edit
  useEffect(() => {
    if (isGuest() || (!canCreate() && !isEditing) || (!canEdit() && isEditing)) {
      navigate('/projects');
    }
  }, [isGuest, canCreate, canEdit, isEditing, navigate]);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProjectById(id);
      const project = response.data.data;
      setFormData({
        title: project.title || '',
        reference: project.reference || '',
        funding_agency: project.funding_agency || '',
        principal_investigator: project.principal_investigator || '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        budget: project.budget || '',
        description: project.description || '',
        url: project.url || '',
        role: project.role || 'Investigador'
      });
    } catch (err) {
      setError('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchProject();
    }
  }, [id, isEditing, fetchProject]);

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
      // Procesar datos
      const processedData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      };

      if (isEditing) {
        await updateProject(id, processedData);
      } else {
        await createProject(processedData);
      }

      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando proyecto...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </h1>
        <p className="text-gray-600 mt-2">
          Complete la información del proyecto de investigación
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
              placeholder="Título del proyecto de investigación"
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
              placeholder="Código o referencia del proyecto"
            />
          </div>

          {/* Entidad Financiadora */}
          <div>
            <label htmlFor="funding_agency" className="block text-sm font-medium text-gray-700 mb-2">
              Entidad Financiadora *
            </label>
            <input
              type="text"
              id="funding_agency"
              name="funding_agency"
              value={formData.funding_agency}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: Ministerio de Ciencia, H2020, etc."
            />
          </div>

          {/* Investigador Principal */}
          <div>
            <label htmlFor="principal_investigator" className="block text-sm font-medium text-gray-700 mb-2">
              Investigador Principal *
            </label>
            <input
              type="text"
              id="principal_investigator"
              name="principal_investigator"
              value={formData.principal_investigator}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Investigador Principal"
            />
          </div>

          {/* Rol */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Rol en el Proyecto
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="Investigador">Investigador</option>
              <option value="IP">IP (Investigador Principal)</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Presupuesto */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto (€)
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0.00"
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
              placeholder="Descripción del proyecto..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/projects')}
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

export default ProjectForm;
