# Publicado Local de QueryVault (Windows)

Guía rápida para ejecutar la app en tu PC y (opcional) publicarla en tu red local o detrás de IIS.

## 1) Requisitos
- Node.js LTS
- (Opcional) MySQL si usarás almacenamiento en BD
- (Opcional) IIS + URL Rewrite + ARR si quieres publicar detrás de IIS

## 2) Backend: instalación
```powershell
cd C:\GitHub\QueryVault_v2\workflowy-sql-app\backend
npm install
```

## 3) Modos de almacenamiento
- **JSON (rápido):** no requiere MySQL; guarda en `backend/consultas-data.json`.
- **MySQL:** requiere servicio MySQL y variables de entorno válidas.

## 4) Arranque rápido (JSON)
```powershell
cd C:\GitHub\QueryVault_v2\workflowy-sql-app\backend
Remove-Item Env:USE_MYSQL -ErrorAction Ignore
$env:NODE_ENV="development"
npm run dev
```
- UI: http://localhost:3000/
- API: http://localhost:3000/api/consultas
- Health: http://localhost:3000/api/health
- Swagger: http://localhost:3000/api-docs

## 5) Arranque con MySQL
```powershell
cd C:\GitHub\QueryVault_v2\workflowy-sql-app\backend
$env:USE_MYSQL="true"
$env:NODE_ENV="development"
$env:DB_HOST="localhost"
$env:DB_USER="tu_usuario"
$env:DB_PASSWORD="tu_password"
$env:DB_NAME="queryvault_db"
$env:DB_PORT="3306"
npm run init-db   # crea tablas y datos de ejemplo
npm run dev:mysql
```
> Si usaste `MYSQL_URL` antes y da "Access denied", límpiala:
```powershell
Remove-Item Env:MYSQL_URL -ErrorAction Ignore
```

## 6) Abrir acceso LAN (opcional)
El server escucha en `0.0.0.0`. Encuentra tu IP con `ipconfig` y accede desde otra máquina a `http://TU_IP:3000/`.
Para permitir conexiones externas:
```powershell
New-NetFirewallRule -DisplayName "QueryVault 3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
```

## 7) Publicar detrás de IIS (reverse proxy)
- Usa `deploy/iis/web.config` y sigue `deploy/iis/README.md`.
- IIS recibirá HTTP/HTTPS y reenviará a `http://localhost:3000/`.

## 8) Ejecutar como servicio
- **PM2** (simple):
```powershell
npm install -g pm2
cd C:\GitHub\QueryVault_v2\workflowy-sql-app\backend
$env:PORT="3000"
$env:NODE_ENV="production"
pm2 start server-hybrid.js --name queryvault
pm2 save
pm2 startup windows
```
- **NSSM**: crea servicio apuntando a `node server-hybrid.js` con `CWD` en `backend`.

## 9) Solución de problemas
- Puerto ocupado: cambia `PORT` (`$env:PORT="3001"`).
- Swagger no carga: asegúrate de `backend/docs/openapi.yaml` y dependencias (`npm install`).
- MySQL falla: verifica credenciales y que el servicio esté activo.

## 10) Estructura relevante
- Backend: `workflowy-sql-app/backend/server-hybrid.js` (sirve estáticos de `src`, expone `/api`, monta `/api-docs`).
- Frontend: `workflowy-sql-app/src`.
- Config DB: `workflowy-sql-app/backend/config/database.js`.
- Datos JSON: `workflowy-sql-app/backend/consultas-data.json`.

¡Listo! Con esto tienes la app corriendo local y, si quieres, publicada vía IIS.