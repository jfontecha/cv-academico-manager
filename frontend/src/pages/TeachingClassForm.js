import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTeachingClass, getTeachingClassById, updateTeachingClass } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TeachingClassForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { canCreate, canEdit, isGuest } = useAuth();

  const [formData, setFormData] = useState({
    subject: '',
    degree: '',
    academic_year: '',
    course: '1',
    semester: '',
    type: 'theory',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect guests away from forms - they don't have permission to create/edit
  useEffect(() => {
    if (isGuest() || (!canCreate() && !isEditing) || (!canEdit() && isEditing)) {
      navigate('/teaching-classes');
    }
  }, [isGuest, canCreate, canEdit, isEditing, navigate]);

  const fetchTeachingClass = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTeachingClassById(id);
      const teachingClass = response.data.data;
      setFormData({
        subject: teachingClass.subject || '',
        degree: teachingClass.degree || '',
        academic_year: teachingClass.academic_year || '',
        course: teachingClass.course || '1',
        semester: teachingClass.semester || '',
        type: teachingClass.type || 'theory',
        description: teachingClass.description || ''
      });
    } catch (err) {
      setError('Error al cargar la clase');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchTeachingClass();
    }
  }, [isEditing, fetchTeachingClass]);

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
        ...formData
      };

      if (isEditing) {
        await updateTeachingClass(id, processedData);
      } else {
        await createTeachingClass(processedData);
      }

      navigate('/teaching-classes');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la clase');
    } finally {
      setLoading(false);
    }
  };

  const classTypes = [
    { value: 'theory', label: 'Teoría' },
    { value: 'practice', label: 'Práctica' },
    { value: 'seminar', label: 'Seminario' },
    { value: 'other', label: 'Otro' }
  ];

  const semesters = [
    { value: '1', label: 'Primer Semestre' },
    { value: '2', label: 'Segundo Semestre' },
    { value: 'anual', label: 'Anual' }
  ];

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando clase...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Clase' : 'Nueva Clase'}
        </h1>
        <p className="text-gray-600 mt-2">
          Complete la información de la clase de enseñanza
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asignatura */}
          <div className="md:col-span-2">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Asignatura *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Nombre de la asignatura"
            />
          </div>

          {/* Grado */}
          <div>
            <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-2">
              Grado/Titulación *
            </label>
            <input
              type="text"
              id="degree"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: Grado en Ingeniería Informática"
            />
          </div>

          {/* Año Académico */}
          <div>
            <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 mb-2">
              Año Académico *
            </label>
            <input
              type="text"
              id="academic_year"
              name="academic_year"
              value={formData.academic_year}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: 2023-2024"
            />
          </div>

          {/* Curso */}
          <div>
            <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
              Curso *
            </label>
            <select
              id="course"
              name="course"
              value={formData.course}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="1">1º Curso</option>
              <option value="2">2º Curso</option>
              <option value="3">3º Curso</option>
              <option value="4">4º Curso</option>
              <option value="posgrado">Posgrado</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          {/* Semestre */}
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
              Semestre
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Seleccionar semestre</option>
              {semesters.map(semester => (
                <option key={semester.value} value={semester.value}>{semester.label}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Clase */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Clase *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {classTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
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
              placeholder="Descripción de la asignatura..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/teaching-classes')}
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

export default TeachingClassForm;
