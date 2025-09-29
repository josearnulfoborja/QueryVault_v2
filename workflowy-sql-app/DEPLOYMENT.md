# 🚀 QueryVault - Despliegue en Producción

QueryVault es una aplicación web para gestionar y organizar consultas SQL con syntax highlighting y funcionalidades avanzadas de búsqueda.

## 🌐 Opciones de Despliegue

### Opción 1: Railway (Recomendada) ⭐

Railway ofrece hosting gratuito con MySQL incluido.

1. **Preparar el repositorio:**
   ```bash
   git add .
   git commit -m "Preparar para despliegue en Railway"
   git push origin main
   ```

2. **Desplegar en Railway:**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu cuenta de GitHub
   - Selecciona "Deploy from GitHub repo"
   - Elige el repositorio QueryVault_v2
   - Railway detectará automáticamente que es un proyecto Node.js

3. **Configurar variables de entorno en Railway:**
   ```
   NODE_ENV=production
   DB_HOST=[Railway te dará este valor]
   DB_USER=root
   DB_PASSWORD=[Railway te dará este valor]
   DB_NAME=railway
   DB_PORT=3306
   CLIENT_URL=https://tu-app.railway.app
   ```

4. **Inicializar la base de datos:**
   - Usa el archivo `database_setup.sql` en la consola de MySQL de Railway

### Opción 2: Render + PlanetScale

1. **Crear base de datos en PlanetScale:**
   - Ve a [planetscale.com](https://planetscale.com) (gratis)
   - Crea una nueva database
   - Obtén la URL de conexión

2. **Desplegar en Render:**
   - Ve a [render.com](https://render.com)
   - Conecta GitHub y selecciona el repo
   - Configura las variables de entorno con los datos de PlanetScale

### Opción 3: Vercel + Supabase

1. **Base de datos en Supabase:**
   - Ve a [supabase.com](https://supabase.com) (gratis)
   - Crea un proyecto nuevo
   - Usa el SQL Editor para ejecutar `database_setup.sql`

2. **Desplegar en Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa el proyecto desde GitHub

## 🔧 Variables de Entorno Requeridas

```env
NODE_ENV=production
DB_HOST=tu_host_de_base_de_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_de_tu_base_de_datos
DB_PORT=3306
CLIENT_URL=https://tu-dominio.com
```

## 📱 Características de la Aplicación

- ✅ **Gestión de consultas SQL** con títulos, descripciones y etiquetas
- ✅ **Syntax highlighting** avanzado para código SQL
- ✅ **Búsqueda completa** por título, descripción, código SQL, autor y etiquetas
- ✅ **Botones de copiar** en cada consulta
- ✅ **Preview en tiempo real** en el editor
- ✅ **Responsive design** para móviles y escritorio
- ✅ **API RESTful** para integración con otras herramientas

## 🛠 Desarrollo Local

1. Clonar repositorio:
   ```bash
   git clone https://github.com/josearnulfoborja/QueryVault_v2.git
   cd QueryVault_v2/workflowy-sql-app
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar base de datos:
   ```bash
   # Crear archivo .env con tu configuración local
   cp .env.example .env
   
   # Inicializar base de datos
   npm run init-db
   ```

4. Iniciar desarrollo:
   ```bash
   npm run dev
   ```

## 📞 Soporte

Si tienes problemas con el despliegue, puedes:
- Revisar los logs de la plataforma de hosting
- Verificar que todas las variables de entorno estén configuradas
- Probar la conectividad de la base de datos usando la ruta `/health`

¡Una vez desplegado, podrás acceder a QueryVault desde cualquier lugar con internet! 🌍