# Configuración de Variables de Entorno para Render

## Backend (Web Service)
URL esperada: https://cv-academico-manager.onrender.com

Variables de entorno requeridas:
```
CORS_ORIGIN=https://cv-manager-frontend-w7vu.onrender.com
MONGODB_URI=mongodb+srv://[usuario]:[password]@[cluster].mongodb.net/cv_academico_prod?retryWrites=true&w=majority
JWT_SECRET=[clave_jwt_segura_minimo_32_caracteres]
NODE_ENV=production
```

## Frontend (Static Site)
URL esperada: https://cv-manager-frontend-w7vu.onrender.com

### Configuración en Render:
```
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: build
```

### Variables de entorno requeridas:
```
REACT_APP_API_URL=https://cv-academico-manager.onrender.com/api
GENERATE_SOURCEMAP=false
```

### Archivos de configuración SPA:
- ✅ _redirects (en public/) - Maneja rutas client-side
- ✅ homepage: "." en package.json
- ✅ BrowserRouter configurado correctamente

## Pasos de Verificación

### 1. Verificar Backend
- URL: https://cv-academico-manager.onrender.com
- Debe responder: {"message": "API del CV Académico funcionando correctamente"}

### 2. Verificar API Endpoints
- https://cv-academico-manager.onrender.com/api/publications
- https://cv-academico-manager.onrender.com/api/users/profile

### 3. Verificar Frontend
- Abrir herramientas de desarrollo (F12)
- Consola debe mostrar: "API_BASE_URL: https://cv-academico-manager.onrender.com/api"
- Network tab debe mostrar requests a la URL correcta

## Problemas Comunes

### Error "Not Found" en rutas del frontend
- ✅ Verificar que existe _redirects en public/
- ✅ Build command debe ser: npm install && npm run build
- ✅ Publish directory debe ser: build
- ✅ homepage: "." en package.json

### Error "Ruta no encontrada" en API
- ✅ Verificar REACT_APP_API_URL en frontend
- ✅ Verificar CORS_ORIGIN en backend
- ✅ Ambos servicios deben estar funcionando

### Error CORS
- ✅ CORS_ORIGIN debe coincidir exactamente con URL del frontend
- ✅ No incluir '/' al final de las URLs

### Error 502 Backend
- ✅ Verificar todas las variables de entorno del backend
- ✅ Verificar conexión a MongoDB Atlas
- ✅ Revisar logs del backend en Render

## URLs de Ejemplo
Si tus servicios se llaman diferente, actualiza estas URLs:

Backend: https://[tu-backend-name].onrender.com
Frontend: https://[tu-frontend-name].onrender.com