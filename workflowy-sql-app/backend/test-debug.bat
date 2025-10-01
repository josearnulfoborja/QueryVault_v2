@echo off
echo 🧪 PRUEBA DE DATOS DE FORMULARIO
echo ================================

echo 📤 Enviando datos de prueba...

curl -X POST "https://queryvault-production.up.railway.app/api/test-form-data" ^
  -H "Content-Type: application/json" ^
  -d "{ \"titulo\": \"Consulta de prueba\", \"descripcion\": \"Descripción de prueba\", \"sql_codigo\": \"SELECT * FROM usuarios WHERE activo = 1\", \"autor\": \"Usuario Prueba\", \"etiquetas\": [\"usuarios\", \"filtros\", \"activos\"], \"favorito\": true }"

echo.
echo.
echo 🧪 PRUEBA DE CREACIÓN DIRECTA
echo =============================

echo 📤 Enviando datos directos...

curl -X POST "https://queryvault-production.up.railway.app/api/consultas" ^
  -H "Content-Type: application/json" ^
  -d "{ \"titulo\": \"Consulta directa\", \"descripcion\": \"Prueba de creación directa\", \"sql_codigo\": \"SELECT COUNT(*) FROM productos\", \"autor\": \"Test User\", \"etiquetas\": [\"productos\", \"conteo\"], \"favorito\": false }"

echo.
echo.
echo ✅ PRUEBAS COMPLETADAS