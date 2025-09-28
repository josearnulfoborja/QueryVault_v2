# Workflowy SQL Backend

Backend API para la aplicación Workflowy SQL, construido con Node.js, Express y MySQL.

## Configuración

### Requisitos
- Node.js (v14 o superior)
- MySQL (v5.7 o superior)

### Variables de Entorno
Copia `.env` y configura las variables según tu entorno:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=workflowy_sql
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

### Instalación
```bash
npm install
```

### Inicialización de la Base de Datos
```bash
npm run init-db
```

### Ejecución
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## API Endpoints

### Consultas

- `GET /api/consultas` - Obtener todas las consultas
- `GET /api/consultas?filtro=texto` - Buscar consultas
- `GET /api/consultas/:id` - Obtener consulta por ID
- `POST /api/consultas` - Crear nueva consulta
- `PUT /api/consultas/:id` - Actualizar consulta
- `DELETE /api/consultas/:id` - Eliminar consulta
- `GET /api/consultas/:id/versiones` - Obtener versiones de una consulta

### Estructura de Datos

#### Consulta
```json
{
  "titulo": "string",
  "descripcion": "string",
  "sql_codigo": "string",
  "autor": "string",
  "favorito": boolean,
  "padre_id": number,
  "etiquetas": ["string"]
}
```

## Base de Datos

### Tablas
- `consultas`: Consultas principales
- `etiquetas`: Etiquetas para categorizar
- `consulta_etiqueta`: Relación muchos a muchos
- `versiones_consulta`: Historial de versiones