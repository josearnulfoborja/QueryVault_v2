const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const consultasRoutes = require('./routes/consultas');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS más específica y dinámica
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como aplicaciones móviles o Postman)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:6207',
      'http://127.0.0.1:6207',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      // Añadir dominio de producción cuando esté disponible
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    // Permitir cualquier puerto localhost/127.0.0.1 para desarrollo
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
      if (localhostPattern.test(origin)) {
        return callback(null, true);
      }
    }
    
    // Verificar si el origen está en la lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middlewares
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../src')));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('origin') || 'No origin'}`);
  next();
});

// Rutas de la API
app.use('/api/consultas', consultasRoutes);

// Ruta principal - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

// Ruta de salud para monitoreo
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'QueryVault Backend'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    message: 'QueryVault API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      consultas: '/api/consultas'
    }
  });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Middleware para rutas no encontradas - SPA fallback
app.use('*', (req, res, next) => {
  // Si es una ruta de API que no existe, devolver 404 JSON
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint no encontrado'
    });
  }
  
  // Para cualquier otra ruta, servir index.html (SPA routing)
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

// Iniciar servidor
async function startServer() {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. Asegúrate de que MySQL esté corriendo y la configuración sea correcta.');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log('🚀 Servidor iniciado correctamente');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API consultas: http://localhost:${PORT}/api/consultas`);
      console.log('📝 Para inicializar la base de datos ejecuta: npm run init-db');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();

// Export app for testing or external use
module.exports = app;