const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../src')));

// Almacenamiento en archivo JSON para persistencia
const dataFile = path.join(__dirname, 'data.json');

// Función para leer datos
function readData() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Error leyendo datos:', error.message);
  }
  return { consultas: [], nextId: 1 };
}

// Función para guardar datos
function saveData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.log('Error guardando datos:', error.message);
    return false;
  }
}

// Logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📤 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor simple con archivo JSON',
    timestamp: new Date().toISOString()
  });
});

// Get all consultas
app.get('/api/consultas', (req, res) => {
  try {
    console.log('🔍 GET /api/consultas - Obteniendo todas las consultas');
    const data = readData();
    const search = req.query.search || '';
    
    let consultas = data.consultas;
    
    if (search) {
      consultas = consultas.filter(c => 
        c.titulo.toLowerCase().includes(search.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(search.toLowerCase()) ||
        c.sql_codigo.toLowerCase().includes(search.toLowerCase()) ||
        c.etiquetas.some(e => e.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    console.log(`✅ Devolviendo ${consultas.length} consultas`);
    consultas.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.titulo} (favorito: ${c.favorito}, etiquetas: [${c.etiquetas?.join(', ') || 'ninguna'}])`);
    });
    
    res.json({ data: consultas });
  } catch (error) {
    console.error('❌ Error obteniendo consultas:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get consulta by ID
app.get('/api/consultas/:id', (req, res) => {
  try {
    console.log(`🔍 GET /api/consultas/${req.params.id}`);
    const data = readData();
    const consulta = data.consultas.find(c => c.id == req.params.id);
    
    if (!consulta) {
      return res.status(404).json({
        status: 'error',
        message: 'Consulta no encontrada'
      });
    }
    
    console.log(`✅ Consulta encontrada: ${consulta.titulo}`);
    res.json({ data: consulta });
  } catch (error) {
    console.error('❌ Error obteniendo consulta:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Create consulta - ENDPOINT PRINCIPAL
app.post('/api/consultas', (req, res) => {
  console.log('🆕 POST /api/consultas - CREANDO NUEVA CONSULTA');
  console.log('================================================');
  
  try {
    const { titulo, descripcion, sql_codigo, autor, etiquetas = [], favorito = false } = req.body;
    
    console.log('📋 Datos recibidos del frontend:');
    console.log('   titulo:', titulo);
    console.log('   descripcion:', descripcion);
    console.log('   sql_codigo:', sql_codigo?.substring(0, 50) + '...');
    console.log('   autor:', autor);
    console.log('   favorito:', favorito, `(tipo: ${typeof favorito})`);
    console.log('   etiquetas:', etiquetas, `(tipo: ${typeof etiquetas}, array: ${Array.isArray(etiquetas)}, length: ${etiquetas?.length})`);
    
    // Validación básica
    if (!titulo || !sql_codigo) {
      console.log('❌ Validación fallida: título o sql_codigo faltante');
      return res.status(400).json({
        status: 'error',
        message: 'Título y código SQL son requeridos'
      });
    }
    
    const data = readData();
    
    const nuevaConsulta = {
      id: data.nextId++,
      titulo,
      descripcion,
      sql_codigo,
      autor,
      etiquetas: Array.isArray(etiquetas) ? etiquetas : [],
      favorito: Boolean(favorito),
      fecha_creacion: new Date().toISOString(),
      fecha_modificacion: new Date().toISOString()
    };
    
    data.consultas.unshift(nuevaConsulta); // Agregar al principio
    
    if (saveData(data)) {
      console.log('✅ CONSULTA CREADA EXITOSAMENTE:');
      console.log('   ID:', nuevaConsulta.id);
      console.log('   Título:', nuevaConsulta.titulo);
      console.log('   Favorito:', nuevaConsulta.favorito);
      console.log('   Etiquetas:', nuevaConsulta.etiquetas);
      console.log('================================================');
      
      res.status(201).json({
        status: 'success',
        data: nuevaConsulta
      });
    } else {
      throw new Error('No se pudo guardar la consulta');
    }
  } catch (error) {
    console.error('❌ ERROR CREANDO CONSULTA:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Delete consulta
app.delete('/api/consultas/:id', (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/consultas/${req.params.id}`);
    const data = readData();
    const index = data.consultas.findIndex(c => c.id == req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Consulta no encontrada'
      });
    }
    
    data.consultas.splice(index, 1);
    saveData(data);
    
    res.json({
      status: 'success',
      message: 'Consulta eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando consulta:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Test endpoint
app.post('/api/test-form-data', (req, res) => {
  console.log('🧪 TEST DE DATOS DE FORMULARIO');
  console.log('==============================');
  
  console.log('📤 Body completo:', req.body);
  
  const { titulo, descripcion, sql_codigo, autor, etiquetas, favorito } = req.body;
  
  console.log('🔍 Campos individuales:');
  console.log('   titulo:', `"${titulo}"`, `(tipo: ${typeof titulo})`);
  console.log('   descripcion:', `"${descripcion}"`, `(tipo: ${typeof descripcion})`);
  console.log('   sql_codigo:', `"${sql_codigo?.substring(0, 30)}..."`, `(tipo: ${typeof sql_codigo})`);
  console.log('   autor:', `"${autor}"`, `(tipo: ${typeof autor})`);
  console.log('   favorito:', favorito, `(tipo: ${typeof favorito})`);
  console.log('   etiquetas:', etiquetas, `(tipo: ${typeof etiquetas}, array: ${Array.isArray(etiquetas)})`);
  
  res.json({
    status: 'success',
    message: 'Datos de formulario procesados correctamente',
    received: {
      titulo,
      descripcion,
      sql_codigo: sql_codigo?.substring(0, 50) + '...',
      autor,
      favorito,
      etiquetas
    }
  });
});

// Catch all for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log('🚀 SERVIDOR SIMPLE CON ARCHIVO JSON INICIADO');
  console.log('============================================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test-form-data`);
  console.log('');
  console.log('💾 Almacenamiento: Archivo JSON');
  console.log('🔧 Sin base de datos, persistencia en archivo');
  console.log('✅ Solución simple y estable');
  console.log('============================================');
}).on('error', (err) => {
  console.error('❌ Error del servidor:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ya está en uso. Prueba con otro puerto.`);
  }
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

module.exports = app;