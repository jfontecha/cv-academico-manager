import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPublication, getPublicationById, updatePublication } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PublicationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { canCreate, canEdit, isGuest } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    type: 'journal',
    publication: '',
    info_publication: '',
    year_publication: '',
    if: '',
    quartile: '',
    doi: '',
    url: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect guests away from forms - they don't have permission to create/edit
  useEffect(() => {
    if (isGuest() || (!canCreate() && !isEditing) || (!canEdit() && isEditing)) {
      navigate('/publications');
    }
  }, [isGuest, canCreate, canEdit, isEditing, navigate]);

  const fetchPublication = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPublicationById(id);
      const publication = response.data.data;
      setFormData({
        title: publication.title || '',
        authors: publication.authors || '',
        type: publication.type || 'journal',
        publication: publication.publication || '',
        info_publication: publication.info_publication || '',
        year_publication: publication.year_publication || '',
        if: publication.if || '',
        quartile: publication.quartile || '',
        doi: publication.doi || '',
        url: publication.url || ''
      });
    } catch (err) {
      setError('Error al cargar la publicación');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchPublication();
    }
  }, [isEditing, fetchPublication]);

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
      // Procesar datos para el backend
      const processedData = {
        ...formData,
        year_publication: formData.year_publication ? parseInt(formData.year_publication) : undefined,
        if: formData.if ? parseFloat(formData.if) : null
      };
      
      // Remover campos vacíos opcionales
      if (!processedData.if) delete processedData.if;
      if (!processedData.quartile) delete processedData.quartile;
      if (!processedData.info_publication) delete processedData.info_publication;
      if (!processedData.doi) delete processedData.doi;
      if (!processedData.url) delete processedData.url;

      if (isEditing) {
        await updatePublication(id, processedData);
      } else {
        await createPublication(processedData);
      }

      navigate('/publications');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la publicación');
    } finally {
      setLoading(false);
    }
  };

  const publicationTypes = [
    { value: 'journal', label: 'Artículo de Revista' },
    { value: 'conference', label: 'Conferencia' },
    { value: 'keynote', label: 'Keynote' },
    { value: 'book', label: 'Libro' },
    { value: 'chapter', label: 'Capítulo de Libro' },
    { value: 'other', label: 'Otro' }
  ];

  const quartileOptions = [
    { value: '', label: 'Sin especificar' },
    { value: 'Q1', label: 'Q1' },
    { value: 'Q2', label: 'Q2' },
    { value: 'Q3', label: 'Q3' },
    { value: 'Q4', label: 'Q4' }
  ];

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando publicación...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Publicación' : 'Nueva Publicación'}
        </h1>
        <p className="text-gray-600 mt-2">
          Complete la información de la publicación académica
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
              Título *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength="500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Título de la publicación"
            />
          </div>

          {/* Autores */}
          <div className="md:col-span-2">
            <label htmlFor="authors" className="block text-sm font-medium text-gray-700 mb-2">
              Autores *
            </label>
            <input
              type="text"
              id="authors"
              name="authors"
              value={formData.authors}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: Fontecha, J., García, A., López, M."
            />
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Publicación *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {publicationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div>
            <label htmlFor="year_publication" className="block text-sm font-medium text-gray-700 mb-2">
              Año de Publicación *
            </label>
            <input
              type="number"
              id="year_publication"
              name="year_publication"
              value={formData.year_publication}
              onChange={handleChange}
              required
              min="1900"
              max={new Date().getFullYear() + 5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="2024"
            />
          </div>

          {/* Publicación (Revista/Conferencia) */}
          <div className="md:col-span-2">
            <label htmlFor="publication" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Publicación *
            </label>
            <input
              type="text"
              id="publication"
              name="publication"
              value={formData.publication}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Nombre de la revista, conferencia o editorial"
            />
          </div>

          {/* Información adicional de la publicación */}
          <div className="md:col-span-2">
            <label htmlFor="info_publication" className="block text-sm font-medium text-gray-700 mb-2">
              Información Adicional de la Publicación
            </label>
            <input
              type="text"
              id="info_publication"
              name="info_publication"
              value={formData.info_publication}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: Vol. 15, No. 3, pp. 123-145"
            />
          </div>

          {/* Factor de Impacto */}
          <div>
            <label htmlFor="if" className="block text-sm font-medium text-gray-700 mb-2">
              Factor de Impacto (IF)
            </label>
            <input
              type="number"
              id="if"
              name="if"
              value={formData.if}
              onChange={handleChange}
              min="0"
              step="0.001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: 2.456"
            />
          </div>

          {/* Cuartil */}
          <div>
            <label htmlFor="quartile" className="block text-sm font-medium text-gray-700 mb-2">
              Cuartil
            </label>
            <select
              id="quartile"
              name="quartile"
              value={formData.quartile}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {quartileOptions.map(quartile => (
                <option key={quartile.value} value={quartile.value}>{quartile.label}</option>
              ))}
            </select>
          </div>

          {/* DOI */}
          <div>
            <label htmlFor="doi" className="block text-sm font-medium text-gray-700 mb-2">
              DOI
            </label>
            <input
              type="text"
              id="doi"
              name="doi"
              value={formData.doi}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: 10.1000/182"
            />
          </div>

          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              URL
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
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/publications')}
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

export default PublicationForm;
