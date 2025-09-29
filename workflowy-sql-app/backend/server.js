const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database-debug');
const consultasRoutes = require('./routes/consultas');

const app = express();

// Configuración robusta del puerto
let PORT = 3000; // Puerto por defecto
if (process.env.PORT) {
    const envPort = parseInt(process.env.PORT, 10);
    if (envPort > 0 && envPort <= 65535) {
        PORT = envPort;
    } else {
        console.warn('⚠️ PORT inválido en variables de entorno:', process.env.PORT);
        console.log('🔄 Usando puerto por defecto:', PORT);
    }
}
console.log('🚀 Servidor configurado para puerto:', PORT);

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

// Ruta de salud para monitoreo - Railway compatible
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a base de datos si está configurada
    let dbStatus = 'not configured';
    if (process.env.DB_HOST) {
      try {
        const { testConnection } = require('./config/database');
        const dbConnected = await testConnection();
        dbStatus = dbConnected ? 'connected' : 'disconnected';
      } catch (dbError) {
        console.warn('Database health check failed:', dbError.message);
        dbStatus = 'error';
      }
    }

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'QueryVault Backend',
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Endpoint de readiness para Railway
app.get('/ready', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint simple para verificar que el servidor responde
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
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
    // En producción, no fallar si no hay base de datos configurada
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (process.env.DB_HOST) {
      try {
        const dbConnected = await testConnection();
        if (dbConnected) {
          console.log('✅ Conexión a base de datos establecida');
        } else {
          console.warn('⚠️ No se pudo conectar a la base de datos');
          if (!isProduction) {
            console.error('❌ Deteniendo servidor en desarrollo por falta de DB');
            process.exit(1);
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Error al conectar con la base de datos:', dbError.message);
        if (!isProduction) {
          console.error('❌ Deteniendo servidor en desarrollo por error de DB');
          process.exit(1);
        }
      }
    } else {
      console.log('ℹ️ Base de datos no configurada - funcionando sin persistencia');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Servidor iniciado correctamente');
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`🏥 Health check: /health, /ready, /ping`);
      console.log(`📊 API consultas: /api/consultas`);
      console.log('✅ Servidor listo para recibir conexiones');
      
      // Log adicional para Railway
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database configured: ${process.env.DB_HOST ? 'Yes' : 'No'}`);
    });
  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();

// Export app for testing or external use
module.exports = app;