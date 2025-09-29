#!/bin/bash

echo "🚀 Preparando QueryVault para despliegue..."

# Crear .env.example si no existe
if [ ! -f .env.example ]; then
    echo "Creando .env.example..."
    cat > .env.example << EOF
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=queryvault_db
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
EOF
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar estructura de archivos
echo "🔍 Verificando estructura de archivos..."
files_needed=("src/index.html" "backend/server.js" "database_setup.sql" "package.json")
for file in "${files_needed[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file falta"
    fi
done

echo ""
echo "🎯 Próximos pasos para despliegue:"
echo ""
echo "1. 📋 Copia el contenido de database_setup.sql y ejecútalo en tu base de datos"
echo "2. 🌐 Sube el código a GitHub si no lo has hecho:"
echo "   git add ."
echo "   git commit -m 'Preparar para despliegue'"
echo "   git push origin main"
echo ""
echo "3. 🚀 Elige una opción de despliegue:"
echo "   • Railway (recomendado): https://railway.app"
echo "   • Render: https://render.com" 
echo "   • Vercel: https://vercel.com"
echo ""
echo "4. ⚙️ Configura las variables de entorno según DEPLOYMENT.md"
echo ""
echo "🎉 ¡Tu aplicación estará lista para usar desde cualquier lugar!"