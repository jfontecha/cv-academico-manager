#!/bin/bash

echo "🔧 Verificando build para Render..."

# Build the application
npm run build

# Check if _redirects was copied
if [ -f "build/_redirects" ]; then
    echo "✅ _redirects encontrado en build/"
    cat build/_redirects
else
    echo "❌ _redirects NO encontrado en build/"
    echo "Copiando manualmente..."
    cp public/_redirects build/
    if [ -f "build/_redirects" ]; then
        echo "✅ _redirects copiado manualmente"
    else
        echo "❌ Error copiando _redirects"
    fi
fi

# List build directory contents
echo "📁 Contenido del directório build:"
ls -la build/

echo "🎯 Verificación completada"