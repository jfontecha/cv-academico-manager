# Instrucciones para crear el repositorio en GitHub

## Pasos para completar la configuración del repositorio:

### 1. Crear el repositorio en GitHub
1. Ve a https://github.com/jfontecha
2. Haz clic en "New repository" (botón verde)
3. Configura el repositorio:
   - **Repository name**: `cv-academico-manager`
   - **Description**: `Aplicación MERN para gestión de CV académico con generación de PDF`
   - **Visibility**: Puedes elegir Public o Private
   - **NO marques** "Add a README file" (ya tenemos uno)
   - **NO marques** "Add .gitignore" (ya tenemos uno)
   - **NO marques** "Choose a license" (puedes añadirlo después si quieres)

### 2. Conectar el repositorio local con GitHub
Una vez creado el repositorio en GitHub, ejecuta estos comandos en la terminal:

```bash
cd "c:\Users\Alumno\OneDrive - Universidad de Castilla-La Mancha\MY_WEBSITE\manage-jfontecha-website"

# Añadir el repositorio remoto (cambia jfontecha por tu username real si es diferente)
git remote add origin https://github.com/jfontecha/cv-academico-manager.git

# Subir los archivos al repositorio
git push -u origin main
```

### 3. Verificar la subida
- Ve a https://github.com/jfontecha/cv-academico-manager
- Deberías ver todos los archivos del proyecto
- El README.md se mostrará en la página principal

## Estado actual del proyecto:

✅ **Git inicializado**
✅ **Archivos añadidos al repositorio local**
✅ **Primer commit realizado**
✅ **Rama configurada como 'main'**
✅ **.gitignore configurado correctamente** (ignora node_modules, .env, etc.)
✅ **Usuario Git configurado** (Jesús Fontecha <jesus.fontecha@uclm.es>)

## Archivos importantes ignorados por Git:

- `/node_modules/` (en todas las carpetas)
- `.env` (archivos de variables de entorno)
- `/frontend/build/` (archivos de producción)
- Archivos de log (`*.log`)
- Archivos temporales del IDE (`.vscode/`, `.idea/`)
- Archivos del sistema operativo (`.DS_Store`, `Thumbs.db`)

## Variables de entorno para producción:

Cuando despliegues en producción, necesitarás configurar estas variables de entorno:
- `MONGODB_URI`: Tu string de conexión a MongoDB
- `JWT_SECRET`: Una clave secreta para JWT
- `PORT`: Puerto del servidor (opcional, por defecto 5000)
- `CORS_ORIGIN`: URL del frontend en producción

## Próximos pasos recomendados:

1. Crear el repositorio en GitHub siguiendo las instrucciones arriba
2. Considerar añadir una licencia (MIT, GPL, etc.)
3. Configurar GitHub Actions para CI/CD si es necesario
4. Configurar variables de entorno en tu plataforma de despliegue