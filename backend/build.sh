# Render Build Script for Backend
#!/bin/bash

echo "🔧 Starting backend build process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure Root Directory is set to 'backend'"
    exit 1
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

echo "✅ Backend build completed successfully!"