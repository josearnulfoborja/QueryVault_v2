# QueryVault - Sistema Híbrido de Almacenamiento

## 🔄 Modos de Funcionamiento

QueryVault ahora funciona con un sistema híbrido que automáticamente detecta el entorno y usa el almacenamiento apropiado:

### 📁 Desarrollo Local (JSON)
- **Cuándo**: `NODE_ENV=development` o `NODE_ENV` no está configurado
- **Almacenamiento**: Archivo JSON (`consultas-data.json`)
- **Ventajas**: Sin configuración de base de datos, desarrollo rápido

### 🗄️ Producción (MySQL)
- **Cuándo**: `NODE_ENV=production`
- **Almacenamiento**: Base de datos MySQL
- **Ventajas**: Escalabilidad, persistencia robusta

## 🚀 Comandos Disponibles

```bash
# Desarrollo local (JSON) - Por defecto
npm run dev

# Desarrollo con MySQL (forzado)
npm run dev:mysql

# Producción (MySQL automático)
npm start

# Comandos legacy (servidor original)
npm run legacy:start
npm run legacy:dev
```

## ⚙️ Configuración

### Variables de Entorno

```bash
# Configuración del entorno
NODE_ENV=development          # development = JSON, production = MySQL

# Configuración del servidor
PORT=3000

# Configuración de MySQL (requerido para producción)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=queryvault_db
DB_PORT=3306

# Forzar MySQL en desarrollo (opcional)
USE_MYSQL=true               # Fuerza MySQL incluso en development
```

### Archivo .env

1. Copia `.env.example` a `.env`
2. Configura las variables según tu entorno
3. Para Railway/producción, configura `NODE_ENV=production`

## 🔧 Funcionamiento Técnico

### Detección Automática
```javascript
const USE_MYSQL = process.env.NODE_ENV === 'production' || process.env.USE_MYSQL === 'true';
```

### Funciones de Persistencia
- **JSON**: `loadConsultasFromJSON()`, `saveConsultasToJSON()`
- **MySQL**: `loadConsultasFromMySQL()`, `saveConsultaToMySQL()`, etc.

### Endpoints API
Todos los endpoints funcionan idénticamente sin importar el almacenamiento:
- `GET /api/consultas` - Listar todas
- `GET /api/consultas/:id` - Obtener una específica
- `POST /api/consultas` - Crear nueva
- `PUT /api/consultas/:id` - Actualizar existente
- `DELETE /api/consultas/:id` - Eliminar

## 🌐 Despliegue

### Railway.app
1. Configura las variables de entorno en Railway:
   ```
   NODE_ENV=production
   DB_HOST=your_mysql_host
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=queryvault_db
   ```

2. El sistema automáticamente usará MySQL en producción

### Desarrollo Local
1. No necesitas configurar base de datos
2. Los datos se guardan en `consultas-data.json`
3. Simplemente ejecuta `npm run dev`

## 🔍 Health Check

El endpoint `/api/health` reporta el estado del sistema:

```json
{
  "status": "OK",
  "storage": "MySQL",      // o "JSON"
  "database": "Connected"  // solo para MySQL
}
```

## 📋 Migración de Datos

### De JSON a MySQL
1. Ejecuta en modo JSON para obtener datos
2. Cambia a MySQL (`NODE_ENV=production`)
3. Importa los datos manualmente o crea script de migración

### De MySQL a JSON
1. Exporta datos de MySQL
2. Cambia a JSON (`NODE_ENV=development`)
3. Los datos se guardarán en JSON automáticamente

## 🛠️ Troubleshooting

### Problema: Servidor no inicia
- Verifica que el puerto no esté ocupado
- Revisa las variables de entorno
- En modo MySQL, verifica la conexión a la base de datos

### Problema: Datos no se guardan
- En modo JSON: Verifica permisos de escritura en el directorio
- En modo MySQL: Verifica conexión y credenciales de base de datos

### Problema: CORS errors
- Verifica que `CLIENT_URL` esté configurado correctamente
- En desarrollo, debería ser `http://localhost:3000`

## 📝 Notas Importantes

1. **Compatibilidad**: El frontend funciona idénticamente con ambos sistemas
2. **Performance**: MySQL es mejor para múltiples usuarios concurrentes
3. **Simplicidad**: JSON es perfecto para desarrollo y demos
4. **Migración**: Cambiar entre sistemas solo requiere cambiar variables de entorno