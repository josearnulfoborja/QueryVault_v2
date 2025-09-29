# 🚀 Configuración Post-MySQL en Railway

## Variables de Entorno Requeridas

En Railway Dashboard → Tu App → Variables, agrega estas variables:

```bash
# Mapeo de variables MySQL de Railway a tu aplicación
DB_HOST=${{MYSQLHOST}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=${{MYSQLDATABASE}}
DB_PORT=${{MYSQLPORT}}

# Configuración del servidor
NODE_ENV=production
PORT=${{PORT}}

# URL del frontend (reemplaza con tu dominio de Railway)
CLIENT_URL=https://tu-aplicacion-nombre.up.railway.app
```

## Pasos siguientes:

### 1. Configurar Variables
- [ ] Ve a Railway Dashboard → Variables
- [ ] Agrega las variables de arriba
- [ ] Guarda los cambios

### 2. Redeploy la Aplicación
- [ ] Railway debería redeplegar automáticamente
- [ ] Verifica que el health check pase

### 3. Inicializar Base de Datos
Usa uno de estos métodos:

**Opción A: Desde Railway Terminal**
```bash
cd workflowy-sql-app && npm run init-db
```

**Opción B: Conectar directamente a MySQL**
- Usa las credenciales de Railway para conectarte
- Importa el archivo `database_setup.sql`

### 4. Probar la Aplicación
- [ ] Abre tu URL de Railway
- [ ] Verifica que `/health` responda correctamente
- [ ] Prueba crear/ver consultas SQL

## Credenciales MySQL

Railway te proporcionó automáticamente:
- **Host**: Variable `MYSQLHOST`
- **Puerto**: Variable `MYSQLPORT` 
- **Usuario**: Variable `MYSQLUSER`
- **Contraseña**: Variable `MYSQLPASSWORD`
- **Base de datos**: Variable `MYSQLDATABASE`

## URLs Importantes

- **Health Check**: https://tu-app.up.railway.app/health
- **API**: https://tu-app.up.railway.app/api/consultas
- **Frontend**: https://tu-app.up.railway.app/

---
✅ Una vez configurado esto, tu aplicación debería funcionar completamente!