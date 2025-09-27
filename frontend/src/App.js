import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Publications from './pages/Publications';
import PublicationForm from './pages/PublicationForm';
import TeachingClasses from './pages/TeachingClasses';
import TeachingClassForm from './pages/TeachingClassForm';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import TeachingInnovation from './pages/TeachingInnovation';
import TeachingInnovationForm from './pages/TeachingInnovationForm';
import FinalWorks from './pages/FinalWorks';
import FinalWorkForm from './pages/FinalWorkForm';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import Login from './pages/Login';

// Componente para manejar la redirección desde 404
function RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar si hay una redirección pendiente desde 404.html
    const redirectPath = sessionStorage.getItem('redirect');
    if (redirectPath && location.pathname === '/') {
      sessionStorage.removeItem('redirect');
      console.log('Redirigiendo a:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <RedirectHandler />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  
                  {/* Rutas de Publicaciones */}
                  <Route path="/publications" element={<Publications />} />
                  <Route path="/publications/new" element={<PublicationForm />} />
                  <Route path="/publications/:id/edit" element={<PublicationForm />} />
                  
                  {/* Rutas de Clases */}
                  <Route path="/teaching-classes" element={<TeachingClasses />} />
                  <Route path="/teaching-classes/new" element={<TeachingClassForm />} />
                  <Route path="/teaching-classes/:id/edit" element={<TeachingClassForm />} />
                  
                  {/* Rutas de Proyectos */}
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/new" element={<ProjectForm />} />
                  <Route path="/projects/:id/edit" element={<ProjectForm />} />
                  
                  {/* Rutas de Innovación Docente */}
                  <Route path="/teaching-innovation" element={<TeachingInnovation />} />
                  <Route path="/teaching-innovation/new" element={<TeachingInnovationForm />} />
                  <Route path="/teaching-innovation/:id/edit" element={<TeachingInnovationForm />} />
                  
                  {/* Rutas de Trabajos Fin de Estudios */}
                  <Route path="/final-works" element={<FinalWorks />} />
                  <Route path="/final-works/new" element={<FinalWorkForm />} />
                  <Route path="/final-works/:id/edit" element={<FinalWorkForm />} />
                  
                  {/* Rutas de Usuarios */}
                  <Route path="/users" element={<Users />} />
                  <Route path="/users/new" element={
                    <AdminRoute>
                      <UserForm />
                    </AdminRoute>
                  } />
                  <Route path="/users/:id/edit" element={
                    <AdminRoute>
                      <UserForm />
                    </AdminRoute>
                  } />
                  
                  {/* Ruta 404 */}
                  <Route path="*" element={
                    <div className="text-center py-12">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600">Página no encontrada</p>
                    </div>
                  } />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
