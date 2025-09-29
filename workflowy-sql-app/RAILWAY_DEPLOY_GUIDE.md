# 🚀 Guía de Despliegue en Railway.app

## Paso 1: Preparar el Proyecto

### 1.1 Asegúrate de que tienes estos archivos:
- ✅ `railway.json` - Configuración de Railway
- ✅ `Procfile` - Comando de inicio
- ✅ `.env.example` - Variables de entorno de ejemplo
- ✅ `database_setup.sql` - Script de base de datos

## Paso 2: Configurar Railway

### 2.1 Crear cuenta y nuevo proyecto
1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Clic en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Conecta tu repositorio `QueryVault_v2`

### 2.2 Agregar Base de Datos MySQL
1. En tu proyecto de Railway, clic en "New"
2. Selecciona "Database" → "MySQL"
3. Railway creará automáticamente:
   - Una instancia de MySQL
   - Variables de entorno automáticas

## Paso 3: Configurar Variables de Entorno

Railway generará automáticamente estas variables para MySQL:
- `MYSQLHOST` - Host de la base de datos
- `MYSQLUSER` - Usuario de la base de datos  
- `MYSQLPASSWORD` - Contraseña de la base de datos
- `MYSQLDATABASE` - Nombre de la base de datos
- `MYSQLPORT` - Puerto de la base de datos
- `MYSQL_URL` - URL completa de conexión

### Variables adicionales que debes agregar manualmente:

Desde el panel de Railway, ve a tu aplicación → Variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (mapear desde las variables MySQL)
DB_HOST=${{MYSQLHOST}}
DB_USER=${{MYSQLUSER}}  
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=${{MYSQLDATABASE}}
DB_PORT=${{MYSQLPORT}}

# Frontend URL (ajustar con tu dominio de Railway)
CLIENT_URL=https://tu-app-nombre.up.railway.app
```

## Paso 4: Inicializar Base de Datos

### Opción A: Ejecutar script desde Railway
1. Ve a tu proyecto en Railway
2. Abre la terminal del servicio
3. Ejecuta: `npm run init-db`

### Opción B: Importar SQL directamente
1. Conéctate a tu base de datos MySQL usando:
   - Host, usuario, contraseña de las variables de entorno
2. Importa el archivo `database_setup.sql`

## Paso 5: Verificar Despliegue

### 5.1 Comprobar logs
1. En Railway, ve a la pestaña "Deployments"
2. Revisa los logs de construcción y despliegue
3. Busca mensajes como:
   - "✅ Conexión a la base de datos establecida"
   - "🚀 Servidor iniciado en puerto 3000"

### 5.2 Probar la aplicación
1. Railway te dará una URL pública
2. Abre la URL en el navegador
3. Prueba las funcionalidades principales

## Paso 6: Configuración de Dominio (Opcional)

1. En Railway, ve a Settings → Domains
2. Puedes usar el subdominio gratuito `.up.railway.app`
3. O conectar tu propio dominio personalizado

## 📋 Checklist de Despliegue

- [ ] Repositorio conectado a Railway
- [ ] Base de datos MySQL agregada
- [ ] Variables de entorno configuradas
- [ ] Primera implementación exitosa
- [ ] Base de datos inicializada
- [ ] Aplicación funcionando en la URL pública
- [ ] Logs sin errores críticos

## 🔧 Solución de Problemas

### Error de conexión a base de datos:
- Verifica que las variables DB_* estén mapeadas correctamente
- Asegúrate de que el servicio MySQL esté ejecutándose

### Error de puerto:
- Railway asigna automáticamente el puerto via $PORT
- No hardcodees el puerto 3000 en producción

### Error de CORS:
- Actualiza CLIENT_URL con tu dominio de Railway
- Verifica la configuración CORS en server.js

## 🌐 URLs Importantes

- **Panel de Railway**: https://railway.app/dashboard
- **Documentación**: https://docs.railway.app
- **Soporte**: https://help.railway.app

---
✨ ¡Tu aplicación QueryVault estará lista para usar en Railway!