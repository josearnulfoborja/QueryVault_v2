const express = require('express');
const cors = require('cors');
const path = require('path');

// Usar el modelo SQLite en lugar del MySQL
const ConsultaModel = require('./models/ConsultaModelSQLite');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../src')));

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
    message: 'Servidor local con SQLite funcionando',
    database: 'SQLite',
    timestamp: new Date().toISOString()
  });
});

// Server health check function for frontend
async function checkServerHealth() {
  return { status: 'ok' };
}

// Get all consultas
app.get('/api/consultas', async (req, res) => {
  try {
    console.log('🔍 GET /api/consultas - Obteniendo todas las consultas');
    const search = req.query.search || '';
    const consultas = await ConsultaModel.getAll(search);
    
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
app.get('/api/consultas/:id', async (req, res) => {
  try {
    console.log(`🔍 GET /api/consultas/${req.params.id}`);
    const consulta = await ConsultaModel.getById(req.params.id);
    
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
app.post('/api/consultas', async (req, res) => {
  console.log('🆕 POST /api/consultas - CREANDO NUEVA CONSULTA');
  console.log('================================================');
  
  try {
    const { titulo, descripcion, sql_codigo, autor, etiquetas, favorito } = req.body;
    
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
    
    console.log('🔧 Llamando a ConsultaModel.create...');
    const consultaCreada = await ConsultaModel.create(req.body);
    
    console.log('✅ CONSULTA CREADA EXITOSAMENTE:');
    console.log('   ID:', consultaCreada.id);
    console.log('   Título:', consultaCreada.titulo);
    console.log('   Favorito:', consultaCreada.favorito);
    console.log('   Etiquetas:', consultaCreada.etiquetas);
    console.log('================================================');
    
    res.status(201).json({
      status: 'success',
      data: consultaCreada
    });
  } catch (error) {
    console.error('❌ ERROR CREANDO CONSULTA:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Update consulta
app.put('/api/consultas/:id', async (req, res) => {
  try {
    console.log(`✏️ PUT /api/consultas/${req.params.id}`);
    // Por ahora solo devolver un mensaje
    res.json({
      status: 'info',
      message: 'Update no implementado aún'
    });
  } catch (error) {
    console.error('❌ Error actualizando consulta:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Delete consulta
app.delete('/api/consultas/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/consultas/${req.params.id}`);
    await ConsultaModel.delete(req.params.id);
    
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

// Test endpoints
app.post('/api/test-form-data', (req, res) => {
  console.log('🧪 TEST DE DATOS DE FORMULARIO');
  console.log('==============================');
  
  console.log('📋 Headers:', req.headers);
  console.log('📦 Body completo:', req.body);
  
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
    message: 'Datos de formulario procesados',
    received: {
      titulo,
      descripcion,
      sql_codigo: sql_codigo?.substring(0, 50) + '...',
      autor,
      favorito,
      etiquetas
    },
    types: {
      titulo: typeof titulo,
      descripcion: typeof descripcion,
      sql_codigo: typeof sql_codigo,
      autor: typeof autor,
      favorito: typeof favorito,
      etiquetas: typeof etiquetas,
      etiquetas_isArray: Array.isArray(etiquetas)
    }
  });
});

// Catch all for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

app.listen(PORT, () => {
  console.log('🚀 SERVIDOR LOCAL CON SQLITE INICIADO');
  console.log('====================================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test-form-data`);
  console.log('');
  console.log('💾 Base de datos: SQLite local');
  console.log('🔧 Modelo: ConsultaModelSQLite');
  console.log('✅ Todo configurado para funcionar localmente');
  console.log('====================================');
});

module.exports = app;