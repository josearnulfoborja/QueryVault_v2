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
      'db-status': '/api/db-status (GET) - Ver estado de tablas',
      'reinit-db': '/api/reinit-db (GET/POST) - Reinicializar BD',
      'force-recreate-db': '/api/force-recreate-db (GET/POST) - Eliminar y recrear tablas',
      'emergency-recreate': '/api/emergency-recreate (GET) - Recreación de emergencia sin token',
      'diagnose-error': '/api/diagnose-error (GET) - Diagnosticar errores de consultas',
      'clean-table': '/api/clean-table (GET) - Limpiar campos innecesarios',
      'test-post': '/api/test-post (POST) - Probar recepción de datos',
      'recreate-original': '/api/recreate-original (GET) - Recrear con esquema original',
      'test-insert': '/api/test-insert (GET) - Probar inserción directa',
      'test-full-flow': '/api/test-full-flow (GET) - Probar flujo completo como frontend'
    },
    status: 'Railway deployment ready',
    database: 'MySQL on Railway'
  });
});

// Endpoint para reinicializar BD (solo en desarrollo o con token especial)
app.post('/api/reinit-db', async (req, res) => {
  await handleReinitDB(req, res);
});

// Endpoint GET para reinicialización (más fácil para acceso manual)
app.get('/api/reinit-db', async (req, res) => {
  await handleReinitDB(req, res);
});

// Endpoint para eliminar y recrear todas las tablas con esquema correcto
app.post('/api/force-recreate-db', async (req, res) => {
  await handleForceRecreateDB(req, res);
});

// Endpoint GET para eliminación y recreación (más fácil para acceso manual)
app.get('/api/force-recreate-db', async (req, res) => {
  await handleForceRecreateDB(req, res);
});

// Endpoint temporal para recreación sin token (SOLO PARA EMERGENCIA)
app.get('/api/emergency-recreate', async (req, res) => {
  try {
    console.log('🆘 EMERGENCIA: Recreación de BD sin token...');
    
    const { spawn } = require('child_process');
    
    // Ejecutar recreación forzada
    await new Promise((resolve, reject) => {
      const recreateProcess = spawn('node', ['scripts/forceRecreateDB-railway.js'], {
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      recreateProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(message);
        output += message;
      });
      
      recreateProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(message);
        errorOutput += message;
      });
      
      recreateProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Recreación de emergencia completada');
          resolve();
        } else {
          console.error('❌ Error en recreación de emergencia');
          reject(new Error(`Recreación de emergencia falló: ${errorOutput}`));
        }
      });
    });
    
    res.json({
      success: true,
      message: 'EMERGENCIA: Base de datos recreada correctamente',
      timestamp: new Date().toISOString(),
      note: 'Todas las tablas fueron eliminadas y recreadas con sql_codigo'
    });
    
  } catch (error) {
    console.error('❌ Error en recreación de emergencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error durante la recreación de emergencia',
      error: error.message
    });
  }
});

// Endpoint para diagnosticar errores de consultas
app.get('/api/diagnose-error', async (req, res) => {
  try {
    console.log('🔍 Ejecutando diagnóstico de errores...');
    
    const { spawn } = require('child_process');
    
    // Ejecutar diagnóstico
    await new Promise((resolve, reject) => {
      const diagnoseProcess = spawn('node', ['scripts/diagnose-consulta-error.js'], {
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      diagnoseProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(message);
        output += message;
      });
      
      diagnoseProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(message);
        errorOutput += message;
      });
      
      diagnoseProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Diagnóstico completado');
          resolve(output);
        } else {
          console.error('❌ Error en diagnóstico');
          reject(new Error(`Diagnóstico falló: ${errorOutput}`));
        }
      });
    });
    
    res.json({
      success: true,
      message: 'Diagnóstico de errores completado - revisar logs del servidor',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error ejecutando diagnóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Error durante el diagnóstico',
      error: error.message
    });
  }
});

// Endpoint para probar flujo completo como frontend
app.get('/api/test-full-flow', async (req, res) => {
  try {
    console.log('🔄 TEST FULL FLOW - Simulando flujo completo del frontend...');
    
    const ConsultaModel = require('./models/ConsultaModel');
    
    // Datos que simula el frontend
    const consultaData = {
      titulo: 'Test Flujo Completo ' + Date.now(),
      descripcion: 'Esta consulta simula el flujo completo del frontend',
      sql_codigo: 'SELECT COUNT(*) as total FROM usuarios WHERE activo = 1;',
      autor: 'Usuario Test',
      favorito: false,
      etiquetas: ['test', 'simulacion']
    };
    
    console.log('🔄 TEST FULL FLOW - Datos simulados:', consultaData);
    
    // Validación como en la ruta
    if (!consultaData.titulo || !consultaData.sql_codigo) {
      throw new Error('Validación falló: título o sql_codigo vacío');
    }
    
    console.log('🔄 TEST FULL FLOW - Validación pasada, llamando ConsultaModel.create...');
    
    // Usar el modelo exactamente como la ruta real
    const nuevaConsulta = await ConsultaModel.create(consultaData);
    
    console.log('🔄 TEST FULL FLOW - Consulta creada exitosamente:', nuevaConsulta);
    
    res.json({
      success: true,
      message: 'Flujo completo exitoso - simulación del frontend',
      data: nuevaConsulta,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR en test-full-flow:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error en flujo completo',
      error: error.message,
      stack: error.stack
    });
  }
});

// Endpoint para probar inserción directa simple
app.get('/api/test-insert', async (req, res) => {
  try {
    console.log('🧪 TEST INSERT - Probando inserción directa...');
    
    const { pool } = require('./config/database-url-final');
    
    // Datos de prueba simples
    const testData = {
      titulo: 'Test Consulta ' + Date.now(),
      descripcion: 'Esta es una consulta de prueba',
      sql_codigo: 'SELECT 1 as test;',
      autor: 'Test Usuario'
    };
    
    console.log('🧪 TEST INSERT - Datos a insertar:', testData);
    
    // Intentar inserción directa
    const [result] = await pool.execute(
      'INSERT INTO consultas (titulo, descripcion, sql_codigo, autor) VALUES (?, ?, ?, ?)',
      [testData.titulo, testData.descripcion, testData.sql_codigo, testData.autor]
    );
    
    console.log('🧪 TEST INSERT - Resultado:', result);
    
    // Verificar que se insertó
    const [consulta] = await pool.execute(
      'SELECT * FROM consultas WHERE id = ?',
      [result.insertId]
    );
    
    console.log('🧪 TEST INSERT - Consulta insertada:', consulta[0]);
    
    res.json({
      success: true,
      message: 'Inserción directa exitosa',
      insertId: result.insertId,
      consultaCreada: consulta[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR en test-insert:', error);
    res.status(500).json({
      success: false,
      message: 'Error en inserción directa',
      error: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
  }
});

// Endpoint para recrear BD con esquema original
app.get('/api/recreate-original', async (req, res) => {
  try {
    console.log('🔧 Ejecutando recreación con esquema original...');
    
    const { spawn } = require('child_process');
    
    // Ejecutar recreación original
    await new Promise((resolve, reject) => {
      const recreateProcess = spawn('node', ['scripts/recreateOriginal-railway.js'], {
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      recreateProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(message);
        output += message;
      });
      
      recreateProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(message);
        errorOutput += message;
      });
      
      recreateProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Recreación original completada');
          resolve(output);
        } else {
          console.error('❌ Error en recreación original');
          reject(new Error(`Recreación original falló: ${errorOutput}`));
        }
      });
    });
    
    res.json({
      success: true,
      message: 'Base de datos recreada con esquema original exitosamente',
      timestamp: new Date().toISOString(),
      note: 'Esquema simple sin campos extra que causan conflictos'
    });
    
  } catch (error) {
    console.error('❌ Error ejecutando recreación original:', error);
    res.status(500).json({
      success: false,
      message: 'Error durante la recreación original',
      error: error.message
    });
  }
});

// Endpoint de prueba para verificar recepción de datos POST
app.post('/api/test-post', async (req, res) => {
  try {
    console.log('🧪 TEST POST - Headers:', req.headers);
    console.log('🧪 TEST POST - Body:', JSON.stringify(req.body, null, 2));
    console.log('🧪 TEST POST - Content-Type:', req.headers['content-type']);
    
    res.json({
      success: true,
      message: 'Datos recibidos correctamente',
      receivedData: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en test-post:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test-post',
      error: error.message
    });
  }
});

// Endpoint para limpiar campos innecesarios de la tabla
app.get('/api/clean-table', async (req, res) => {
  try {
    console.log('🧹 Ejecutando limpieza de campos innecesarios...');
    
    const { spawn } = require('child_process');
    
    // Ejecutar limpieza
    await new Promise((resolve, reject) => {
      const cleanProcess = spawn('node', ['scripts/cleanTable-railway.js'], {
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      cleanProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(message);
        output += message;
      });
      
      cleanProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(message);
        errorOutput += message;
      });
      
      cleanProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Limpieza de tabla completada');
          resolve(output);
        } else {
          console.error('❌ Error en limpieza de tabla');
          reject(new Error(`Limpieza falló: ${errorOutput}`));
        }
      });
    });
    
    res.json({
      success: true,
      message: 'Limpieza de tabla completada - campos innecesarios eliminados',
      timestamp: new Date().toISOString(),
      note: 'Campos mantenidos: id, titulo, descripcion, sql_codigo, fecha_creacion, favorito, padre_id, autor'
    });
    
  } catch (error) {
    console.error('❌ Error ejecutando limpieza:', error);
    res.status(500).json({
      success: false,
      message: 'Error durante la limpieza de tabla',
      error: error.message
    });
  }
});

// Endpoint para verificar estado de tablas
app.get('/api/db-status', async (req, res) => {
  try {
    const { pool } = require('./config/database-url-final');
    
    const tablasEsperadas = ['consultas', 'etiquetas', 'consulta_etiqueta', 'versiones_consulta'];
    const estadoTablas = {};
    
    for (const tabla of tablasEsperadas) {
      try {
        const [exists] = await pool.execute(`SHOW TABLES LIKE '${tabla}'`);
        const [count] = await pool.execute(`SELECT COUNT(*) as count FROM ${tabla}`);
        
        estadoTablas[tabla] = {
          exists: exists.length > 0,
          records: exists.length > 0 ? count[0].count : 0
        };
      } catch (error) {
        estadoTablas[tabla] = {
          exists: false,
          error: error.message,
          records: 0
        };
      }
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: 'railway',
      tables: estadoTablas,
      summary: {
        allTablesExist: Object.values(estadoTablas).every(t => t.exists),
        totalTables: Object.keys(estadoTablas).length,
        existingTables: Object.values(estadoTablas).filter(t => t.exists).length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verificando estado de BD',
      error: error.message
    });
  }
});

// Función común para manejar la reinicialización
async function handleReinitDB(req, res) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // En producción, requerir token especial
    if (isProduction) {
      const authToken = req.headers['x-reinit-token'] || 
                        req.body?.token || 
                        req.query?.token;
      if (authToken !== process.env.REINIT_TOKEN) {
        return res.status(401).json({
          success: false,
          message: 'Token de autorización requerido para reinicialización en producción',
          hint: 'Agrega ?token=TU_TOKEN a la URL o usa header x-reinit-token'
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
      timestamp: new Date().toISOString(),
      note: 'Todas las tablas fueron recreadas con datos de ejemplo'
    });
    
  } catch (error) {
    console.error('❌ Error en reinicialización:', error);
    res.status(500).json({
      success: false,
      message: 'Error durante la reinicialización',
      error: error.message
    });
  }
}

// Función para manejar la recreación forzada de tablas
async function handleForceRecreateDB(req, res) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // En producción, requerir token especial
    if (isProduction) {
      const authToken = req.headers['x-reinit-token'] || 
                        req.body?.token || 
                        req.query?.token;
      if (authToken !== process.env.REINIT_TOKEN) {
        return res.status(401).json({
          success: false,
          message: 'Token de autorización requerido para recreación forzada en producción',
          hint: 'Agrega ?token=TU_TOKEN a la URL o usa header x-reinit-token'
        });
      }
    }
    
    console.log('🔥 Iniciando recreación forzada de BD (eliminar y recrear)...');
    
    const { spawn } = require('child_process');
    
    // Ejecutar recreación forzada
    await new Promise((resolve, reject) => {
      const recreateProcess = spawn('node', ['scripts/forceRecreateDB-railway.js'], {
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      recreateProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(message);
        output += message;
      });
      
      recreateProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(message);
        errorOutput += message;
      });
      
      recreateProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Recreación forzada completada');
          resolve();
        } else {
          console.error('❌ Error en recreación forzada');
          reject(new Error(`Recreación forzada falló: ${errorOutput}`));
        }
      });
    });
    
    res.json({
      success: true,
      message: 'Base de datos eliminada y recreada correctamente con esquema corregido',
      timestamp: new Date().toISOString(),
      note: 'Todas las tablas fueron eliminadas y recreadas con sql_codigo (no sql_query)'
    });
    
  } catch (error) {
    console.error('❌ Error en recreación forzada:', error);
    res.status(500).json({
      success: false,
      message: 'Error durante la recreación forzada',
      error: error.message
    });
  }
}

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