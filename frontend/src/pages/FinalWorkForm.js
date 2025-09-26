import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createFinalWork, getFinalWorkById, updateFinalWork } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const FinalWorkForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { canCreate, canEdit, isGuest } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    type: 'tfg',
    degree: '',
    defense_date: '',
    grade: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect guests away from forms - they don't have permission to create/edit
  useEffect(() => {
    if (isGuest() || (!canCreate() && !isEditing) || (!canEdit() && isEditing)) {
      navigate('/final-works');
    }
  }, [isGuest, canCreate, canEdit, isEditing, navigate]);

  const fetchFinalWork = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getFinalWorkById(id);
      const work = response.data.data;
      setFormData({
        title: work.title || '',
        author: work.author || '',
        type: work.type || 'tfg',
        degree: work.degree || '',
        defense_date: work.defense_date ? work.defense_date.split('T')[0] : '',
        grade: work.grade || ''
      });
    } catch (err) {
      setError('Error al cargar el trabajo fin de estudios: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchFinalWork();
    }
  }, [isEditing, fetchFinalWork]);

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
        author: formData.author.trim(),
        type: formData.type,
        defense_date: formData.defense_date,
        // Para campos opcionales: enviar string vacío o valor trimado
        degree: formData.degree.trim(),
        grade: formData.grade.trim()
      };

      if (isEditing) {
        await updateFinalWork(id, submitData);
      } else {
        // Para creación, limpiar campos vacíos
        const createData = { ...submitData };
        Object.keys(createData).forEach(key => {
          if (key !== 'title' && key !== 'author' && key !== 'type' && 
              key !== 'defense_date' && !createData[key]) {
            createData[key] = undefined;
          }
        });
        await createFinalWork(createData);
      }

      navigate('/final-works');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el trabajo fin de estudios');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          Cargando trabajo fin de estudios (ID: {id})...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Trabajo Fin de Estudios' : 'Nuevo Trabajo Fin de Estudios'}
        </h1>
        <p className="text-gray-600 mt-2">
          Complete la información del trabajo fin de estudios
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
              Título del Trabajo *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Título del trabajo fin de estudios"
            />
          </div>

          {/* Autor */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
              Autor *
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Nombre del autor"
            />
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Trabajo *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="tfg">TFG (Trabajo Fin de Grado)</option>
              <option value="tfm">TFM (Trabajo Fin de Máster)</option>
              <option value="thesis">Tesis Doctoral</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Titulación */}
          <div>
            <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-2">
              Titulación
            </label>
            <input
              type="text"
              id="degree"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Nombre de la titulación"
            />
          </div>

          {/* Fecha de Defensa */}
          <div>
            <label htmlFor="defense_date" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Defensa *
            </label>
            <input
              type="date"
              id="defense_date"
              name="defense_date"
              value={formData.defense_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Calificación */}
          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
              Calificación
            </label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Calificación obtenida"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/final-works')}
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

export default FinalWorkForm;
