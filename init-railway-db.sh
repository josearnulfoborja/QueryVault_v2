#!/bin/bash
# Script para inicializar base de datos en Railway

echo "🚀 Inicializando base de datos en Railway..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$DB_HOST" ]; then
    echo "❌ Error: Variables de base de datos no configuradas"
    echo "Configura las variables DB_HOST, DB_USER, etc. en Railway Dashboard"
    exit 1
fi

echo "✅ Variables de entorno detectadas"
echo "Host: $DB_HOST"
echo "User: $DB_USER" 
echo "Database: $DB_NAME"

# Navegar al directorio correcto y ejecutar script
cd workflowy-sql-app
echo "📂 Directorio actual: $(pwd)"

# Ejecutar script de inicialización
echo "🔄 Ejecutando script de inicialización..."
npm run init-db

echo "✅ ¡Base de datos inicializada!"
echo "🌐 Puedes probar tu aplicación en: $CLIENT_URL"