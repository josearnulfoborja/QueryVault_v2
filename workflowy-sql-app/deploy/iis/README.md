# Despliegue con IIS (Reverse Proxy)

Este enfoque usa IIS como reverse proxy: IIS recibe HTTP/HTTPS y reenvía las solicitudes al backend Node que corre en `localhost:3000`.

## Requisitos
- IIS instalado (Windows Features)
- Módulos: URL Rewrite y Application Request Routing (ARR)
- Node.js instalado

## Pasos
1. Arranca el backend como servicio o proceso independiente:
   ```powershell
   cd C:\GitHub\QueryVault_v2\workflowy-sql-app\backend
   $env:PORT="3000"
   $env:NODE_ENV="production"
   # JSON local:
   npm run dev
   # o con MySQL:
   $env:USE_MYSQL="true"; npm run dev:mysql
   ```

2. Crea un sitio en IIS
   - Carpeta física: por ejemplo `C:\inetpub\queryvault`
   - Copia `deploy/iis/web.config` a esa carpeta
   - Configura Bindings (host, HTTP/HTTPS) según tu dominio

3. Habilita URL Rewrite y ARR
   - En IIS Manager, verifica que URL Rewrite esté activo
   - Activa ARR para permitir proxy en Server Proxy Settings

4. Prueba
   - Navega al dominio o IP del sitio IIS, debe servir la UI y rutas `/api` desde Node

## Firewall (si acceso externo)
```powershell
New-NetFirewallRule -DisplayName "QueryVault 3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
```

## Notas
- Este repo ya expone Swagger en `/api-docs`
- El servidor Node escucha `0.0.0.0` en el puerto configurado (ver `backend/server-hybrid.js`)
- Para servicio persistente, considera PM2 o NSSM