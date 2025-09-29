# 🎯 Guía Rápida de Despliegue - QueryVault

## 🚀 Opción Más Fácil: Railway (Recomendada)

**Railway** es la opción más simple porque incluye base de datos MySQL gratuita.

### Paso 1: Preparar GitHub
```bash
git add .
git commit -m "Preparar aplicación para producción"
git push origin main
```

### Paso 2: Desplegar en Railway
1. Ve a [railway.app](https://railway.app) y haz clic en "Start a New Project"
2. Selecciona "Deploy from GitHub repo"
3. Autoriza Railway para acceder a tu GitHub
4. Selecciona el repositorio `QueryVault_v2`
5. Railway detectará automáticamente que es un proyecto Node.js

### Paso 3: Agregar Base de Datos MySQL
1. En el dashboard de Railway, haz clic en "+ New"
2. Selecciona "Database" → "Add MySQL"
3. Railway creará automáticamente una base de datos MySQL

### Paso 4: Configurar Variables de Entorno
En Railway, ve a tu aplicación → Variables y agrega:

```
NODE_ENV=production
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_PORT=${{MySQL.MYSQL_PORT}}
```

### Paso 5: Configurar Base de Datos
1. Ve a MySQL en Railway → "Connect"
2. Abre el Query Editor
3. Copia y pega todo el contenido del archivo `database_setup.sql`
4. Ejecuta el script

### Paso 6: ¡Listo!
Railway generará una URL como: `https://tu-app-nombre.railway.app`

---

## 🌐 URLs Importantes Después del Despliegue

- **Aplicación:** `https://tu-app.railway.app`
- **API Health Check:** `https://tu-app.railway.app/health`
- **API de Consultas:** `https://tu-app.railway.app/api/consultas`

---

## 🔧 Solución de Problemas

### Si la aplicación no carga:
1. Revisa los logs en Railway Dashboard
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el script de base de datos se ejecutó correctamente

### Si hay errores de conexión a la base de datos:
1. Ve a `/health` para verificar el estado
2. Confirma que las variables de entorno usen las referencias de Railway: `${{MySQL.MYSQL_HOST}}`

### Para ver los logs:
En Railway Dashboard → Tu App → Deployments → Ver logs del último despliegue

---

## 💡 Ventajas de Railway

- ✅ **Gratis** hasta 500 horas/mes (suficiente para uso personal)
- ✅ **MySQL incluido** sin configuración adicional
- ✅ **Despliegue automático** desde GitHub
- ✅ **SSL/HTTPS** automático
- ✅ **Logs en tiempo real**
- ✅ **Variables de entorno** fáciles de configurar

---

¡Una vez desplegado, podrás acceder a QueryVault desde tu trabajo o cualquier lugar con internet! 🌍

**Tiempo estimado de despliegue: 5-10 minutos**