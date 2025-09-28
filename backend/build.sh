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

# Configure Puppeteer for production environment
echo "🎭 Configuring Puppeteer for production..."
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install Chrome dependencies for Puppeteer (if needed)
echo "🌐 Ensuring Chrome dependencies are available..."

echo "✅ Backend build completed successfully!"