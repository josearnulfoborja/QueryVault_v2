const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database-url-final');
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
      consultas: '/api/consultas',
      'reinit-db': '/api/reinit-db (POST)'
    }
  });
});

// Endpoint para reinicializar BD (solo en desarrollo o con token especial)
app.post('/api/reinit-db', async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // En producción, requerir token especial
    if (isProduction) {
      const authToken = req.headers['x-reinit-token'] || req.body.token;
      if (authToken !== process.env.REINIT_TOKEN) {
        return res.status(401).json({
          success: false,
          message: 'Token de autorización requerido'
        });
      }
    }
    
    console.log('🔄 Iniciando reinicialización manual de BD...');
    
    const { spawn } = require('child_process');
    
    // Ejecutar reinicialización
    await new Promise((resolve, reject) => {
      const initProcess = spawn('node', ['scripts/initDatabase-railway.js'], {
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      initProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(message);
        output += message;
      });
      
      initProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(message);
        errorOutput += message;
      });
      
      initProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Reinicialización completada');
          resolve();
        } else {
          console.error('❌ Error en reinicialización');
          reject(new Error(`Reinicialización falló: ${errorOutput}`));
        }
      });
    });
    
    res.json({
      success: true,
      message: 'Base de datos reinicializada correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en reinicialización:', error);
    res.status(500).json({
      success: false,
      message: 'Error durante la reinicialización',
      error: error.message
    });
  }
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
    
    console.log('🔄 Verificando conexión a base de datos...');
    
    try {
      const dbConnected = await testConnection();
      if (dbConnected) {
        console.log('✅ Conexión a base de datos establecida');
        
        // Auto-inicializar BD si estamos en Railway y no hay tablas
        if (process.env.MYSQL_URL) {
          console.log('🔄 Verificando si necesita inicialización de BD...');
          try {
            const { pool } = require('./config/database-url-final');
            const [tables] = await pool.execute("SHOW TABLES LIKE 'consultas'");
            
            if (tables.length === 0) {
              console.log('📊 Tabla consultas no existe, inicializando automáticamente...');
              console.log('⏳ Esperando inicialización completa antes de continuar...');
              
              // Importar y ejecutar la inicialización directamente (síncrono)
              try {
                const { spawn } = require('child_process');
                
                // Crear promise para esperar a que termine la inicialización
                await new Promise((resolve, reject) => {
                  const initProcess = spawn('node', ['scripts/initDatabase-railway.js'], {
                    cwd: __dirname,
                    stdio: 'inherit'
                  });
                  
                  initProcess.on('close', (code) => {
                    if (code === 0) {
                      console.log('✅ Base de datos inicializada automáticamente');
                      resolve();
                    } else {
                      console.error('❌ Error en inicialización automática de BD');
                      reject(new Error(`Inicialización falló con código ${code}`));
                    }
                  });
                  
                  initProcess.on('error', (error) => {
                    console.error('❌ Error ejecutando inicialización:', error);
                    reject(error);
                  });
                });
                
                // Verificar que todas las tablas se crearon correctamente
                console.log('🔍 Verificando que todas las tablas fueron creadas...');
                const tablasEsperadas = ['consultas', 'etiquetas', 'consulta_etiqueta', 'versiones_consulta'];
                
                for (const tabla of tablasEsperadas) {
                  const [result] = await pool.execute(`SHOW TABLES LIKE '${tabla}'`);
                  if (result.length === 0) {
                    throw new Error(`Tabla ${tabla} no fue creada correctamente`);
                  }
                  console.log(`✅ Tabla ${tabla} verificada`);
                }
                
                console.log('🎉 Todas las tablas están listas y verificadas');
                
              } catch (initError) {
                console.error('❌ Error durante inicialización:', initError.message);
                if (!isProduction) {
                  process.exit(1);
                }
              }
              
            } else {
              console.log('✅ Tabla consultas ya existe, BD lista');
              
              // Verificar que todas las tablas existen
              const tablasEsperadas = ['etiquetas', 'consulta_etiqueta', 'versiones_consulta'];
              for (const tabla of tablasEsperadas) {
                const [result] = await pool.execute(`SHOW TABLES LIKE '${tabla}'`);
                if (result.length === 0) {
                  console.warn(`⚠️ Tabla ${tabla} no existe, puede necesitar reinicialización`);
                } else {
                  console.log(`✅ Tabla ${tabla} existe`);
                }
              }
            }
          } catch (initError) {
            console.warn('⚠️ Error verificando/inicializando BD:', initError.message);
          }
        }
        
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