import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, FolderOpen, Lightbulb, FileText, BarChart3, PieChart, TrendingUp, Calendar, Users } from 'lucide-react';
import { getAllPublications, getAllTeachingClasses, getAllProjects, getAllTeachingInnovation, getAllFinalWorks } from '../services/api';

// Componente para elementos recientes
const RecentItem = ({ title, subtitle, badge, link }) => (
  <Link to={link} className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="font-medium text-gray-900 line-clamp-1">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      {badge && (
        <div className="ml-4">
          {badge}
        </div>
      )}
    </div>
  </Link>
);

// Componente para barras de progreso simples
const ProgressBar = ({ label, value, max, color = "bg-blue-500" }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

const Home = () => {
  const [stats, setStats] = useState({
    publications: 0,
    classes: 0,
    projects: 0,
    innovations: 0,
    finalWorks: 0,
    totalBudget: 0
  });
  
  const [recentData, setRecentData] = useState({
    publications: [],
    finalWorks: [],
    classes: [],
    latestProject: null,
    latestInnovation: null
  });
  
  const [chartData, setChartData] = useState({
    publicationsByType: {},
    projectsByYear: {},
    classesDistribution: {},
    finalWorksByType: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Obtener estadísticas totales
        const [pubResponse, classResponse, projResponse, innovResponse, finalWorksResponse] = await Promise.all([
          getAllPublications({ limit: 1 }),
          getAllTeachingClasses({ limit: 1 }),
          getAllProjects({ limit: 1 }),
          getAllTeachingInnovation({ limit: 1 }),
          getAllFinalWorks({ limit: 1 })
        ]);
        
        setStats({
          publications: pubResponse.data.pagination.total,
          classes: classResponse.data.pagination.total,
          projects: projResponse.data.pagination.total,
          innovations: innovResponse.data.pagination.total,
          finalWorks: finalWorksResponse.data.pagination.total
        });
        
        // 2. Obtener datos recientes
        const [
          recentPubs,
          recentFinalWorks,
          recentClasses,
          latestProject,
          latestInnovation,
          allPubs,
          allProjects,
          allClasses,
          allFinalWorks
        ] = await Promise.all([
          getAllPublications({ limit: 3, sortBy: 'year_publication', sortOrder: 'desc' }),
          getAllFinalWorks({ limit: 3, sortBy: 'defense_date', sortOrder: 'desc' }),
          getAllTeachingClasses({ limit: 50, sortBy: 'academic_year', sortOrder: 'desc' }),
          getAllProjects({ limit: 1, sortBy: 'end_date', sortOrder: 'desc' }),
          getAllTeachingInnovation({ limit: 1, sortBy: 'end_date', sortOrder: 'desc' }),
          getAllPublications({ limit: 100 }),
          getAllProjects({ limit: 100 }),
          getAllTeachingClasses({ limit: 100 }),
          getAllFinalWorks({ limit: 100 })
        ]);
        
        // Obtener clases del último año académico
        const latestAcademicYear = recentClasses.data.data[0]?.academic_year;
        const classesFromLatestYear = recentClasses.data.data.filter(
          c => c.academic_year === latestAcademicYear
        );
        
        setRecentData({
          publications: recentPubs.data.data,
          finalWorks: recentFinalWorks.data.data,
          classes: classesFromLatestYear.slice(0, 3),
          latestProject: latestProject.data.data[0] || null,
          latestInnovation: latestInnovation.data.data[0] || null
        });
        
        // 3. Procesar datos para gráficas
        const publicationsByType = {};
        allPubs.data.data.forEach(pub => {
          publicationsByType[pub.type] = (publicationsByType[pub.type] || 0) + 1;
        });
        
        const projectsByYear = {};
        allProjects.data.data.forEach(proj => {
          if (proj.end_date) {
            const year = new Date(proj.end_date).getFullYear();
            projectsByYear[year] = (projectsByYear[year] || 0) + 1;
          }
        });
        
        const classesDistribution = {};
        allClasses.data.data.forEach(cls => {
          const year = cls.academic_year;
          classesDistribution[year] = (classesDistribution[year] || 0) + 1;
        });
        
        const finalWorksByType = {};
        allFinalWorks.data.data.forEach(work => {
          finalWorksByType[work.type] = (finalWorksByType[work.type] || 0) + 1;
        });
        
        // Calcular suma total de presupuestos
        const totalBudget = allProjects.data.data.reduce((sum, project) => {
          return sum + (project.budget || 0);
        }, 0);
        
        setStats(prev => ({
          ...prev,
          totalBudget
        }));
        
        setChartData({
          publicationsByType,
          projectsByYear,
          classesDistribution,
          finalWorksByType
        });
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };
  
  const getTypeLabel = (type) => {
    const typeLabels = {
      // Publications
      journal: 'Revista',
      conference: 'Conferencia', 
      keynote: 'Keynote',
      book: 'Libro',
      chapter: 'Capítulo',
      other: 'Otro',
      // Final Works
      tfg: 'TFG',
      tfm: 'TFM',
      thesis: 'Tesis'
    };
    return typeLabels[type] || type;
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      journal: 'bg-blue-100 text-blue-800',
      conference: 'bg-green-100 text-green-800',
      keynote: 'bg-purple-100 text-purple-800',
      book: 'bg-red-100 text-red-800',
      chapter: 'bg-yellow-100 text-yellow-800',
      tfg: 'bg-blue-100 text-blue-800',
      tfm: 'bg-green-100 text-green-800',
      thesis: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type] || typeColors.other}`}>
        {getTypeLabel(type)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard - CV Académico</h1>
        <p className="mt-2 text-gray-600">
          Resumen completo de la actividad académica y de investigación
        </p>
      </div>

      {/* RESUMEN GLOBAL DE ACTIVIDAD ACADÉMICA - MOVIDO ARRIBA */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Resumen Global de Actividad Académica</h2>
          <Users className="h-6 w-6" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.publications + stats.classes + stats.projects + stats.innovations + stats.finalWorks}</p>
            <p className="text-sm opacity-90">Total Items</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.publications}</p>
            <p className="text-sm opacity-90">Publicaciones</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.classes}</p>
            <p className="text-sm opacity-90">Clases impartidas</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.projects + stats.innovations}</p>
            <p className="text-sm opacity-90">Proyectos Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.finalWorks}</p>
            <p className="text-sm opacity-90">TFE Dirigidos</p>
          </div>
        </div>
      </div>

      {/* Total de financiación conseguida */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Total de financiación conseguida</h2>
            <p className="text-3xl font-bold">
              {stats.totalBudget > 0 ? `€${stats.totalBudget.toLocaleString()}` : '€0'}
            </p>
            <p className="text-sm opacity-90 mt-1">Suma de todos los presupuestos de los proyectos de investigación en los que se ha participado y/o se ha dirigido</p>
          </div>
          <FolderOpen className="h-8 w-8" />
        </div>
      </div>

      {/* 2. ÁREA DE ELEMENTOS RECIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publicaciones Recientes */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Últimas 3 Publicaciones</h2>
            <BookOpen className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {recentData.publications.length > 0 ? (
              recentData.publications.map((pub) => (
                <RecentItem
                  key={pub._id}
                  title={pub.title}
                  subtitle={`${pub.authors} • ${pub.year_publication}`}
                  badge={getTypeBadge(pub.type)}
                  link={`/publications`}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay publicaciones recientes</p>
            )}
          </div>
        </div>

        {/* Trabajos Fin de Estudios Recientes */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Últimos 3 TFE dirigidos</h2>
            <FileText className="h-5 w-5 text-red-500" />
          </div>
          <div className="space-y-3">
            {recentData.finalWorks.length > 0 ? (
              recentData.finalWorks.map((work) => (
                <RecentItem
                  key={work._id}
                  title={work.title}
                  subtitle={`${work.author} • ${formatDate(work.defense_date)}`}
                  badge={getTypeBadge(work.type)}
                  link={`/final-works`}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay trabajos recientes</p>
            )}
          </div>
        </div>

      </div>

      {/* Clases impartidas en el último curso - Ancho completo */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Clases impartidas en el último curso</h2>
          <GraduationCap className="h-5 w-5 text-green-500" />
        </div>
        <div className="space-y-3">
          {recentData.classes.length > 0 ? (
            recentData.classes.map((cls) => (
              <RecentItem
                key={cls._id}
                title={cls.subject}
                subtitle={`${cls.degree} • ${cls.academic_year}`}
                badge={
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {cls.credits ? `${cls.credits} ECTS` : 'N/A'}
                  </span>
                }
                link={`/teaching-classes`}
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm">No hay clases recientes</p>
          )}
        </div>
      </div>

      {/* Proyecto e Innovación más recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Último Proyecto */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Último proyecto de investigación</h2>
            <FolderOpen className="h-5 w-5 text-purple-500" />
          </div>
          {recentData.latestProject ? (
            <RecentItem
              title={recentData.latestProject.title}
              subtitle={`${formatDate(recentData.latestProject.start_date)} - ${formatDate(recentData.latestProject.end_date)}`}
              badge={
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {recentData.latestProject.budget ? `€${recentData.latestProject.budget.toLocaleString()}` : 'Sin presupuesto'}
                </span>
              }
              link={`/projects`}
            />
          ) : (
            <p className="text-gray-500 text-sm">No hay proyectos</p>
          )}
        </div>

        {/* Última Innovación Docente */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Último proyecto innovación docente</h2>
            <Lightbulb className="h-5 w-5 text-orange-500" />
          </div>
          {recentData.latestInnovation ? (
            <RecentItem
              title={recentData.latestInnovation.title}
              subtitle={`${formatDate(recentData.latestInnovation.start_date)} - ${formatDate(recentData.latestInnovation.end_date)}`}
              badge={
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {recentData.latestInnovation.reference || 'Sin ref.'}
                </span>
              }
              link={`/teaching-innovation`}
            />
          ) : (
            <p className="text-gray-500 text-sm">No hay proyectos de innovación</p>
          )}
        </div>
      </div>

      {/* 3. ÁREA DE GRÁFICAS ESTADÍSTICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Publicaciones por Tipo */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Publicaciones por Tipo</h2>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(chartData.publicationsByType).map(([type, count]) => {
              const max = Math.max(...Object.values(chartData.publicationsByType));
              return (
                <ProgressBar
                  key={type}
                  label={getTypeLabel(type)}
                  value={count}
                  max={max}
                  color="bg-blue-500"
                />
              );
            })}
          </div>
        </div>

        {/* Gráfica de Proyectos por Año - INTERCAMBIADA Y RENOMBRADA */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Proyectos investigación por año de finalización</h2>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(chartData.projectsByYear)
              .sort(([a], [b]) => b - a)
              .slice(0, 6)
              .map(([year, count]) => {
                const max = Math.max(...Object.values(chartData.projectsByYear));
                return (
                  <ProgressBar
                    key={year}
                    label={year}
                    value={count}
                    max={max}
                    color="bg-purple-500"
                  />
                );
              })}
          </div>
        </div>

        {/* Gráfica de Trabajos Fin de Estudios por Tipo - INTERCAMBIADA */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">TFE por Tipo</h2>
            <PieChart className="h-5 w-5 text-red-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(chartData.finalWorksByType).map(([type, count]) => {
              const max = Math.max(...Object.values(chartData.finalWorksByType));
              return (
                <ProgressBar
                  key={type}
                  label={getTypeLabel(type)}
                  value={count}
                  max={max}
                  color="bg-red-500"
                />
              );
            })}
          </div>
        </div>

        {/* Gráfica de Clases por Año Académico */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Clases por Año Académico</h2>
            <Calendar className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3">
            {Object.entries(chartData.classesDistribution)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([year, count]) => {
                const max = Math.max(...Object.values(chartData.classesDistribution));
                return (
                  <ProgressBar
                    key={year}
                    label={year}
                    value={count}
                    max={max}
                    color="bg-green-500"
                  />
                );
              })}
          </div>
        </div>
      </div>


    </div>
  );
};

export default Home;
