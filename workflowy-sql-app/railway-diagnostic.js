// Diagnóstico completo para Railway
console.log('🔍 DIAGNÓSTICO RAILWAY - QueryVault');
console.log('=====================================');

// 1. Información del entorno
console.log('\n📊 ENTORNO:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'NO DEFINIDO');
console.log('- PORT:', process.env.PORT || 'NO DEFINIDO');
console.log('- PWD:', process.cwd());
console.log('- __dirname:', __dirname);

// 2. Variables de Railway
console.log('\n🚂 VARIABLES RAILWAY:');
console.log('- RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME || 'NO DEFINIDO');
console.log('- RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'NO DEFINIDO');
console.log('- RAILWAY_PROJECT_NAME:', process.env.RAILWAY_PROJECT_NAME || 'NO DEFINIDO');

// 3. Variables MySQL/DB
console.log('\n💾 VARIABLES BASE DE DATOS:');
const dbVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 
                'MYSQLHOST', 'MYSQLUSER', 'MYSQLPASSWORD', 'MYSQLDATABASE', 'MYSQLPORT',
                'MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE', 'MYSQL_PORT'];
dbVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`- ${varName}:`, value ? '***CONFIGURADO***' : 'NO DEFINIDO');
});

// 4. Estructura de archivos
const fs = require('fs');
const path = require('path');

console.log('\n📂 ESTRUCTURA DE ARCHIVOS:');
console.log('- Directorio actual:', process.cwd());

try {
  const files = fs.readdirSync('.');
  console.log('- Archivos en raíz:', files);
  
  if (files.includes('backend')) {
    console.log('- Backend existe: SÍ');
    const backendFiles = fs.readdirSync('./backend');
    console.log('- Archivos en backend:', backendFiles);
    
    if (backendFiles.includes('server-hybrid.js')) {
      console.log('- server-hybrid.js existe: SÍ');
    } else {
      console.log('- server-hybrid.js existe: NO');
    }
  } else {
    console.log('- Backend existe: NO');
  }
  
  if (files.includes('src')) {
    console.log('- Src existe: SÍ');
    const srcFiles = fs.readdirSync('./src');
    console.log('- Archivos en src:', srcFiles);
  } else {
    console.log('- Src existe: NO');
  }
  
} catch (error) {
  console.log('❌ Error leyendo archivos:', error.message);
}

// 5. Crear servidor de prueba simple
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de diagnóstico
app.get('/api/diagnostic', (req, res) => {
  res.json({
    status: 'DIAGNOSTIC OK',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      cwd: process.cwd(),
      __dirname: __dirname
    },
    railway: {
      service: process.env.RAILWAY_SERVICE_NAME,
      environment: process.env.RAILWAY_ENVIRONMENT,
      project: process.env.RAILWAY_PROJECT_NAME
    },
    database: {
      hasDbVars: !!(process.env.DB_HOST || process.env.MYSQLHOST),
      dbHost: process.env.DB_HOST || process.env.MYSQLHOST || 'NO CONFIGURADO'
    },
    files: {
      backend: fs.existsSync('./backend'),
      serverHybrid: fs.existsSync('./backend/server-hybrid.js'),
      src: fs.existsSync('./src'),
      packageJson: fs.existsSync('./package.json')
    }
  });
});

// Health check básico
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor de diagnóstico funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint que intenta cargar el servidor híbrido
app.get('/api/test-hybrid', (req, res) => {
  try {
    console.log('🔍 Intentando cargar servidor híbrido...');
    
    if (!fs.existsSync('./backend/server-hybrid.js')) {
      return res.status(404).json({
        error: 'server-hybrid.js no encontrado',
        path: path.join(process.cwd(), 'backend', 'server-hybrid.js')
      });
    }
    
    // Intentar require del servidor híbrido
    const hybridPath = path.join(process.cwd(), 'backend', 'server-hybrid.js');
    delete require.cache[hybridPath]; // Limpiar cache
    
    // Solo verificar que se puede cargar, no ejecutar
    const hybridStats = fs.statSync(hybridPath);
    
    res.json({
      status: 'HYBRID TEST OK',
      message: 'server-hybrid.js se puede acceder',
      path: hybridPath,
      size: hybridStats.size,
      modified: hybridStats.mtime
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error accediendo al servidor híbrido',
      message: error.message,
      stack: error.stack
    });
  }
});

// Catch all
app.get('*', (req, res) => {
  res.json({
    message: 'Endpoint de diagnóstico',
    path: req.path,
    availableEndpoints: [
      '/api/diagnostic',
      '/api/health',
      '/api/test-hybrid'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 SERVIDOR DE DIAGNÓSTICO INICIADO');
  console.log('=====================================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Diagnostic: http://localhost:${PORT}/api/diagnostic`);
  console.log(`🧪 Test Hybrid: http://localhost:${PORT}/api/test-hybrid`);
  console.log('=====================================');
});

// Log de errores
process.on('uncaughtException', (err) => {
  console.error('\n❌ EXCEPCIÓN NO CAPTURADA:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ PROMESA RECHAZADA:', reason);
});