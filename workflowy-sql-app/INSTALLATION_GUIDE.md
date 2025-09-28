# 📋 Guía de Instalación y Ejecución - QueryVault

## ✅ Paso a Paso - Ejecución Completa

### 🔧 Prerrequisitos
1. **MySQL Server** - Debe estar instalado y ejecutándose
2. **Node.js** - Versión 14 o superior

### 📚 PASO 1: Configurar MySQL

#### 1.1 Asegúrate de que MySQL está ejecutándose
- En Windows: Abre Services (servicios.msc) y verifica que "MySQL" esté en estado "Running"
- O desde línea de comandos: `net start MySQL`

#### 1.2 Crear usuario y base de datos (Opcional - si no quieres usar root)
```sql
-- Conectarse a MySQL como root
mysql -u root -p

-- Crear usuario (opcional)
CREATE USER 'queryvault'@'localhost' IDENTIFIED BY 'password123';

-- Dar permisos
GRANT ALL PRIVILEGES ON *.* TO 'queryvault'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- Salir
EXIT;
```

### 📚 PASO 2: Configurar el Backend

#### 2.1 Navegar al directorio backend
```bash
cd backend
```

#### 2.2 Instalar dependencias (si no se hizo antes)
```bash
npm install
```

#### 2.3 Configurar variables de entorno
Edita el archivo `backend/.env` con tu configuración de MySQL:

**Para usuario root sin contraseña:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=workflowy_sql
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

**Para usuario root con contraseña:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=workflowy_sql
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

**Para usuario personalizado:**
```env
DB_HOST=localhost
DB_USER=queryvault
DB_PASSWORD=password123
DB_NAME=workflowy_sql
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

#### 2.4 Inicializar la base de datos
```bash
npm run init-db
```

**Salida esperada:**
```
🔄 Inicializando base de datos...
✅ Base de datos creada/verificada
✅ Tabla "consultas" creada/verificada
✅ Tabla "etiquetas" creada/verificada
✅ Tabla "consulta_etiqueta" creada/verificada
✅ Tabla "versiones_consulta" creada/verificada
✅ Datos de ejemplo insertados
🎉 Base de datos inicializada correctamente!
```

#### 2.5 Iniciar el servidor backend
```bash
npm run dev
```

**Salida esperada:**
```
✅ Conexión a la base de datos establecida correctamente
🚀 Servidor iniciado correctamente
📍 URL: http://localhost:3000
🏥 Health check: http://localhost:3000/health
📊 API consultas: http://localhost:3000/api/consultas
```

**⚠️ Mantén esta terminal abierta** - El backend debe seguir ejecutándose

### 📚 PASO 3: Configurar y Ejecutar el Frontend

#### 3.1 Abrir una nueva terminal y navegar al directorio raíz
```bash
cd ..  # Salir del directorio backend
```

#### 3.2 Instalar dependencias del frontend (si no se hizo antes)
```bash
npm install
```

#### 3.3 Iniciar el servidor frontend
```bash
npm start
```

**Salida esperada:**
```
Ready for changes
Serving "src" at http://127.0.0.1:XXXX
```

### 📚 PASO 4: Probar la Aplicación

#### 4.1 Abrir el navegador
- Ve a la URL que aparece en la terminal (ej: `http://127.0.0.1:57365`)
- O usa el navegador simple de VS Code si está disponible

#### 4.2 Probar funcionalidades básicas
1. **Ver consultas existentes** - Deberías ver 3 consultas de ejemplo
2. **Buscar** - Escribe en el cuadro de búsqueda para filtrar
3. **Nueva consulta** - Haz clic en "➕ Nueva Consulta"
4. **Completar formulario** con estos datos de prueba:
   ```
   Título: Consulta de Prueba
   Descripción: Esta es una consulta de prueba
   Autor: Tu Nombre
   Código SQL: SELECT * FROM usuarios WHERE activo = 1;
   Etiquetas: prueba, usuarios
   [✓] Marcar como favorito
   ```
5. **Guardar** - Haz clic en "💾 Guardar"
6. **Verificar** - La consulta debería aparecer en la lista

## 🚨 Solución de Problemas Comunes

### Error: "Access denied for user"
**Problema:** MySQL rechaza la conexión
**Solución:**
1. Verifica usuario y contraseña en `backend/.env`
2. Asegúrate de que MySQL esté ejecutándose
3. Prueba la conexión manualmente: `mysql -u root -p`

### Error: "Cannot connect to database"
**Problema:** MySQL no está ejecutándose
**Solución:**
1. Windows: `net start MySQL`
2. Verifica en Services que MySQL esté corriendo
3. Reinicia el servicio si es necesario

### Error: "Port 3000 is already in use"
**Problema:** El puerto del backend está ocupado
**Solución:**
1. Cambia `PORT=3001` en `backend/.env`
2. O termina el proceso que usa el puerto 3000

### Error: "Module not found" 
**Problema:** Dependencias no instaladas
**Solución:**
```bash
# En directorio backend
cd backend
npm install

# En directorio raíz
cd ..
npm install
```

### Frontend no carga datos
**Problema:** El backend no está ejecutándose
**Solución:**
1. Verifica que `http://localhost:3000/health` responda
2. Revisa la consola del navegador para errores de CORS
3. Asegúrate de que ambos servidores estén corriendo

## 🎯 URLs Importantes

- **Frontend:** `http://127.0.0.1:XXXX` (puerto asignado por live-server)
- **Backend:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/health`
- **API Consultas:** `http://localhost:3000/api/consultas`

## 📱 Comandos de Referencia Rápida

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run init-db
npm run dev

# Terminal 2 - Frontend  
cd .. 
npm install
npm start
```

¡Listo! Tu aplicación QueryVault debería estar funcionando perfectamente. 🚀