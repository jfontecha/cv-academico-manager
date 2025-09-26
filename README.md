# CV Académico - Gestor MERN

Una aplicación completa con la pila MERN (MongoDB, Express.js, React, Node.js) para gestionar el CV académico personal con autenticación de usuarios.

## Estructura del Proyecto

```
manage-jfontecha-website/
├── backend/          # Servidor Express.js
├── frontend/         # Aplicación React
├── package.json      # Scripts del proyecto principal
└── README.md
```

## Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crear archivo `.env` en la carpeta `backend/` con:
```
MONGODB_URI=tu_connection_string_de_mongodb_cloud
PORT=5000
JWT_SECRET=tu_jwt_secret_muy_seguro
```

### 3. Ejecutar en modo desarrollo
```bash
npm run dev
```

Este comando ejecutará tanto el backend (puerto 5000) como el frontend (puerto 3000) simultáneamente.

## Características

- ✅ Backend RESTful API con Express.js
- ✅ Frontend moderno con React
- ✅ Conexión a MongoDB Cloud
- ✅ Sistema de autenticación con JWT
- ✅ Gestión de CV académico completo
- ✅ Interfaz de usuario moderna y responsive
- ✅ CRUD completo para todas las colecciones
- ✅ Manejo de errores y validación
- ✅ Encriptación de contraseñas

## Colecciones Gestionadas

### Publicaciones (publications)
Estructura basada en datos reales:
- title: Título de la publicación
- authors: Autores
- type: Tipo (journal, conference, keynote, etc.)
- publication: Nombre de la revista/conferencia
- info_publication: Información adicional
- year_publication: Año de publicación
- if: Factor de impacto
- quartile: Cuartil (Q1, Q2, Q3, Q4)
- doi: DOI
- url: URL de la publicación

### Clases de Enseñanza (teaching_classes)
Estructura basada en datos reales:
- academic_year: Año académico
- subject: Asignatura
- course: Curso (1-6)
- type: Tipo de clase (theory, practice, etc.)
- degree: Grado/titulación

### Proyectos (projects)
- title: Título del proyecto
- description: Descripción
- coordinator: Coordinador/IP
- fundingAgency: Entidad financiadora
- startDate, endDate: Fechas
- status: Estado del proyecto
- participants: Lista de participantes
- objectives: Objetivos

### Innovación Docente (teaching_innovation)
- title: Título del proyecto
- description: Descripción
- coordinator: Coordinador
- academicYear: Año académico
- methodology: Metodología
- status: Estado
- objectives: Objetivos
- results: Resultados

### Usuarios (users)
Sistema de autenticación:
- username: Nombre de usuario único
- email: Email único
- password: Contraseña encriptada con bcrypt
- lastAccess: Timestamp del último acceso

## API Endpoints

### Autenticación
- `POST /api/users/register` - Registrar nuevo usuario
- `POST /api/users/login` - Iniciar sesión
- `GET /api/users/profile` - Obtener perfil del usuario (requiere token)
- `PUT /api/users/profile` - Actualizar perfil (requiere token)
- `PUT /api/users/change-password` - Cambiar contraseña (requiere token)

### Publicaciones
- `GET /api/publications` - Obtener todas las publicaciones
- `POST /api/publications` - Crear nueva publicación
- `GET /api/publications/:id` - Obtener publicación por ID
- `PUT /api/publications/:id` - Actualizar publicación
- `DELETE /api/publications/:id` - Eliminar publicación

### Clases de Enseñanza
- `GET /api/teaching-classes` - Obtener todas las clases
- `POST /api/teaching-classes` - Crear nueva clase
- `GET /api/teaching-classes/:id` - Obtener clase por ID
- `PUT /api/teaching-classes/:id` - Actualizar clase
- `DELETE /api/teaching-classes/:id` - Eliminar clase

### Proyectos
- `GET /api/projects` - Obtener todos los proyectos
- `POST /api/projects` - Crear nuevo proyecto
- `GET /api/projects/:id` - Obtener proyecto por ID
- `PUT /api/projects/:id` - Actualizar proyecto
- `DELETE /api/projects/:id` - Eliminar proyecto

### Innovación Docente
- `GET /api/teaching-innovation` - Obtener todos los proyectos de innovación
- `POST /api/teaching-innovation` - Crear nuevo proyecto de innovación
- `GET /api/teaching-innovation/:id` - Obtener proyecto por ID
- `PUT /api/teaching-innovation/:id` - Actualizar proyecto
- `DELETE /api/teaching-innovation/:id` - Eliminar proyecto

## Autenticación

La aplicación utiliza JWT (JSON Web Tokens) para la autenticación. Para acceder a rutas protegidas, incluya el token en el header:
```
Authorization: Bearer <token>
```

## Estructura de Datos

Los modelos mantienen exactamente los nombres de atributos de las colecciones originales de MongoDB para asegurar compatibilidad con datos existentes.

## Acerca de

Puedes encontrar más información de este proyecto y del autor en su web personal de [Jesús Fontecha](https://www.esi.uclm.es/jesusfontecha.personal/)