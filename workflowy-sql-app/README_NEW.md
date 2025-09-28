# QueryVault - Gestor de Consultas SQL

QueryVault es una aplicación web que combina la simplicidad de Workflowy con un potente sistema de gestión de consultas SQL. Permite organizar, buscar y gestionar consultas SQL de manera intuitiva.

## 🚀 Características

- **📝 Gestión Completa**: Crear, editar y eliminar consultas SQL
- **🔍 Búsqueda Avanzada**: Filtrado en tiempo real como Workflowy
- **💾 Persistencia**: Base de datos MySQL para almacenamiento
- **🏷️ Etiquetas**: Sistema de etiquetas para categorización
- **⭐ Favoritos**: Marca consultas importantes
- **📱 Responsive**: Interfaz adaptable a dispositivos móviles
- **🎨 Syntax Highlighting**: Resaltado de sintaxis SQL con Prism.js
- **📚 Versionado**: Historial de versiones de cada consulta

## 📋 Prerrequisitos

- **Node.js** (v14 o superior)
- **MySQL** (v5.7 o superior)
- **npm** o **yarn**

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd workflowy-sql-app
```

### 2. Configurar el Backend

#### 2.1 Instalar dependencias del backend
```bash
cd backend
npm install
```

#### 2.2 Configurar la base de datos
1. Asegúrate de que MySQL esté ejecutándose
2. Edita el archivo `backend/.env` con tu configuración:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=workflowy_sql
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

#### 2.3 Inicializar la base de datos
```bash
npm run init-db
```

#### 2.4 Iniciar el servidor backend
```bash
npm run dev
```

El backend estará corriendo en `http://localhost:3000`

### 3. Configurar el Frontend

#### 3.1 Instalar dependencias del frontend
```bash
cd ../  # Volver al directorio raíz
npm install
```

#### 3.2 Iniciar el servidor frontend
```bash
npm start
```

El frontend estará corriendo en `http://127.0.0.1:57365` (o el puerto que se asigne)

## 📖 Uso de la Aplicación

### Funcionalidades Principales

1. **➕ Nueva Consulta**: Haz clic en "Nueva Consulta" para abrir el modal
2. **🔍 Búsqueda**: Usa el cuadro de búsqueda para filtrar consultas en tiempo real
3. **✏️ Editar**: Haz clic en el icono de lápiz para editar una consulta
4. **🗑️ Eliminar**: Haz clic en el icono de basura para eliminar una consulta
5. **⭐ Favoritos**: Marca consultas importantes con la estrella

### Atajos de Teclado

- `Ctrl + N` / `Cmd + N`: Nueva consulta
- `Escape`: Cerrar modal

### Modal de Nueva/Editar Consulta

El modal incluye los siguientes campos:
- **Título** (*requerido*): Nombre descriptivo de la consulta
- **Descripción**: Explicación opcional de qué hace la consulta
- **Autor**: Nombre del creador de la consulta
- **Código SQL** (*requerido*): La consulta SQL
- **Etiquetas**: Etiquetas separadas por comas para categorización
- **Favorito**: Checkbox para marcar como favorito

## 📁 Estructura del Proyecto

```
workflowy-sql-app/
├── backend/                 # Servidor Node.js
│   ├── config/             # Configuración de base de datos
│   ├── models/             # Modelos de datos
│   ├── routes/             # Rutas de la API
│   ├── scripts/            # Scripts de inicialización
│   ├── .env               # Variables de entorno
│   ├── package.json       # Dependencias del backend
│   └── server.js          # Punto de entrada del servidor
│
├── src/                    # Frontend
│   ├── assets/            # Recursos estáticos
│   ├── js/               # JavaScript
│   ├── styles/           # Hojas de estilo
│   └── index.html        # Página principal
│
├── package.json           # Dependencias del frontend
└── README.md             # Este archivo
```

## 🔗 API Endpoints

### Consultas

- `GET /api/consultas` - Obtener todas las consultas
- `GET /api/consultas?filtro=texto` - Buscar consultas
- `GET /api/consultas/:id` - Obtener consulta por ID
- `POST /api/consultas` - Crear nueva consulta
- `PUT /api/consultas/:id` - Actualizar consulta
- `DELETE /api/consultas/:id` - Eliminar consulta
- `GET /api/consultas/:id/versiones` - Obtener versiones de una consulta

### Estructura de Datos - Consulta

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

## 🗄️ Base de Datos

### Tablas

1. **consultas**: Tabla principal con las consultas SQL
2. **etiquetas**: Catálogo de etiquetas
3. **consulta_etiqueta**: Relación muchos a muchos entre consultas y etiquetas
4. **versiones_consulta**: Historial de versiones de cada consulta

## 🚨 Solución de Problemas

### Error de conexión a la base de datos
1. Verifica que MySQL esté ejecutándose
2. Revisa las credenciales en `backend/.env`
3. Asegúrate de que el usuario tenga permisos para crear bases de datos

### Error de CORS
- El backend ya está configurado para permitir CORS desde cualquier origen durante desarrollo

### Puerto en uso
- Si el puerto 3000 está en uso, cambia `PORT` en `backend/.env`
- Si el puerto del frontend está en uso, `live-server` automáticamente asignará otro puerto

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda, por favor abre un issue en el repositorio.

---

**¡Disfruta organizando tus consultas SQL con QueryVault!** 🚀