@echo off
echo 🚀 Preparando QueryVault para despliegue...

REM Crear .env.example si no existe
if not exist .env.example (
    echo Creando .env.example...
    (
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_USER=root
        echo DB_PASSWORD=your_password
        echo DB_NAME=queryvault_db
        echo DB_PORT=3306
        echo.
        echo # Server Configuration
        echo PORT=3000
        echo NODE_ENV=development
        echo.
        echo # Frontend URL ^(for CORS^)
        echo CLIENT_URL=http://localhost:3000
    ) > .env.example
)

REM Instalar dependencias
echo 📦 Instalando dependencias...
call npm install

REM Verificar estructura de archivos
echo 🔍 Verificando estructura de archivos...
if exist "src\index.html" (echo ✅ src\index.html) else (echo ❌ src\index.html falta)
if exist "backend\server.js" (echo ✅ backend\server.js) else (echo ❌ backend\server.js falta)
if exist "database_setup.sql" (echo ✅ database_setup.sql) else (echo ❌ database_setup.sql falta)
if exist "package.json" (echo ✅ package.json) else (echo ❌ package.json falta)

echo.
echo 🎯 Próximos pasos para despliegue:
echo.
echo 1. 📋 Copia el contenido de database_setup.sql y ejecútalo en tu base de datos
echo 2. 🌐 Sube el código a GitHub si no lo has hecho:
echo    git add .
echo    git commit -m "Preparar para despliegue"
echo    git push origin main
echo.
echo 3. 🚀 Elige una opción de despliegue:
echo    • Railway ^(recomendado^): https://railway.app
echo    • Render: https://render.com
echo    • Vercel: https://vercel.com
echo.
echo 4. ⚙️ Configura las variables de entorno según DEPLOYMENT.md
echo.
echo 🎉 ¡Tu aplicación estará lista para usar desde cualquier lugar!

pause