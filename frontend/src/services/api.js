import axios from 'axios';

// Configurar la URL base de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Debug logging para producción
console.log('🔧 API Configuration:');
console.log('   - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('   - API_BASE_URL:', API_BASE_URL);
console.log('   - Environment:', process.env.NODE_ENV);

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url, 'Token:', !!token);
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============== PUBLICACIONES ==============
export const publicationAPI = {
  getAll: (params = {}) => api.get('/publications', { params }),
  getById: (id) => api.get(`/publications/${id}`),
  getStats: () => api.get('/publications/stats'),
  create: (data) => api.post('/publications', data),
  update: (id, data) => api.put(`/publications/${id}`, data),
  delete: (id) => api.delete(`/publications/${id}`),
};

// ============== CLASES DE ENSEÑANZA ==============
export const teachingClassAPI = {
  getAll: (params = {}) => api.get('/teaching-classes', { params }),
  getById: (id) => api.get(`/teaching-classes/${id}`),
  getStats: () => api.get('/teaching-classes/stats'),
  create: (data) => api.post('/teaching-classes', data),
  update: (id, data) => api.put(`/teaching-classes/${id}`, data),
  delete: (id) => api.delete(`/teaching-classes/${id}`),
};

// ============== PROYECTOS ==============
export const projectAPI = {
  getAll: (params = {}) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  getStats: () => api.get('/projects/stats'),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// ============== INNOVACIÓN DOCENTE ==============
export const teachingInnovationAPI = {
  getAll: (params = {}) => api.get('/teaching-innovation', { params }),
  getById: (id) => api.get(`/teaching-innovation/${id}`),
  getStats: () => api.get('/teaching-innovation/stats'),
  create: (data) => api.post('/teaching-innovation', data),
  update: (id, data) => api.put(`/teaching-innovation/${id}`, data),
  delete: (id) => api.delete(`/teaching-innovation/${id}`),
};

// ============== TRABAJOS FIN DE ESTUDIOS ==============
export const finalWorksAPI = {
  getAll: (params = {}) => api.get('/final-works', { params }),
  getById: (id) => api.get(`/final-works/${id}`),
  getStats: () => api.get('/final-works/stats'),
  create: (data) => api.post('/final-works', data),
  update: (id, data) => api.put(`/final-works/${id}`, data),
  delete: (id) => api.delete(`/final-works/${id}`),
};

// ============== USUARIOS Y AUTENTICACIÓN ==============
export const userAPI = {
  // Autenticación
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  
  // CRUD para gestión de usuarios (admin)
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// ============== ESTADÍSTICAS GENERALES ==============
export const statsAPI = {
  getLastUpdate: () => api.get('/stats/last-update'),
};

// ============== PDF ==============
export const pdfAPI = {
  generateCV: () => api.get('/pdf/generate', { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  }),
  // Versión pública temporal del PDF completo
  generateCVPublic: () => api.get('/pdf/public', { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  }),
  // Verificar salud de Puppeteer
  checkHealth: () => api.get('/pdf/health'),
  // Generación alternativa con html-pdf
  generateCVAlt: () => api.get('/pdf/generate-alt', { 
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  }),
};

export default api;

// ============== FUNCIONES DE CONVENIENCIA ==============
// Autenticación
export const registerUser = (data) => userAPI.register(data);
export const loginUser = (data) => userAPI.login(data);
export const getUserProfile = () => userAPI.getProfile();
export const updateUserProfile = (data) => userAPI.updateProfile(data);
export const changeUserPassword = (data) => userAPI.changePassword(data);

// Publicaciones
export const getAllPublications = (params) => publicationAPI.getAll(params);
export const getPublicationById = (id) => publicationAPI.getById(id);
export const createPublication = (data) => publicationAPI.create(data);
export const updatePublication = (id, data) => publicationAPI.update(id, data);
export const deletePublication = (id) => publicationAPI.delete(id);

// Clases de Enseñanza
export const getAllTeachingClasses = (params) => teachingClassAPI.getAll(params);
export const getTeachingClassById = (id) => teachingClassAPI.getById(id);
export const createTeachingClass = (data) => teachingClassAPI.create(data);
export const updateTeachingClass = (id, data) => teachingClassAPI.update(id, data);
export const deleteTeachingClass = (id) => teachingClassAPI.delete(id);

// Proyectos
export const getAllProjects = (params) => projectAPI.getAll(params);
export const getProjectById = (id) => projectAPI.getById(id);
export const createProject = (data) => projectAPI.create(data);
export const updateProject = (id, data) => projectAPI.update(id, data);
export const deleteProject = (id) => projectAPI.delete(id);

// Innovación Docente
export const getAllTeachingInnovation = (params) => teachingInnovationAPI.getAll(params);
export const getTeachingInnovationById = (id) => teachingInnovationAPI.getById(id);
export const createTeachingInnovation = (data) => teachingInnovationAPI.create(data);
export const updateTeachingInnovation = (id, data) => teachingInnovationAPI.update(id, data);
export const deleteTeachingInnovation = (id) => teachingInnovationAPI.delete(id);

// Trabajos Fin de Estudios
export const getAllFinalWorks = (params) => finalWorksAPI.getAll(params);
export const getFinalWorkById = (id) => finalWorksAPI.getById(id);
export const createFinalWork = (data) => finalWorksAPI.create(data);
export const updateFinalWork = (id, data) => finalWorksAPI.update(id, data);
export const deleteFinalWork = (id) => finalWorksAPI.delete(id);

// Estadísticas
export const getLastUpdate = () => statsAPI.getLastUpdate();

// PDF
export const generateCVPDF = () => pdfAPI.generateCV();
export const generateCVPDFPublic = () => pdfAPI.generateCVPublic();
export const generateCVPDFAlt = () => pdfAPI.generateCVAlt();
export const checkPDFHealth = () => pdfAPI.checkHealth();
