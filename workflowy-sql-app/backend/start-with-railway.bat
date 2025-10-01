@echo off
echo 🚀 CONFIGURANDO SERVIDOR CON RAILWAY
echo =====================================

REM Configura aquí tu MYSQL_URL de Railway
REM Ve a Railway → MySQL Service → Connect y copia la URL completa

set MYSQL_URL=mysql://root:password@host:port/railway
set PORT=3000

echo ⚠️  IMPORTANTE: Debes configurar tu MYSQL_URL real de Railway
echo 📋 Actual: %MYSQL_URL%
echo.
echo 💡 Para obtener tu URL:
echo    1. Ve a tu proyecto Railway
echo    2. Click en MySQL Service
echo    3. Pestaña Connect
echo    4. Copia la URL completa
echo.

REM Descomentar cuando tengas la URL real:
REM node server.js

pause