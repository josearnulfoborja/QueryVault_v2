// Servidor de prueba simple para verificar la funcionalidad sin base de datos
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../src')));

// Mock data storage
let mockQueries = [];
let nextId = 1;

// Logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📤 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server running' });
});

// Get all consultas
app.get('/api/consultas', (req, res) => {
  console.log('🔍 Obteniendo todas las consultas');
  res.json({ data: mockQueries });
});

// Create consulta - ENDPOINT PRINCIPAL PARA PROBAR
app.post('/api/consultas', (req, res) => {
  console.log('🆕 CREANDO NUEVA CONSULTA');
  console.log('================================');
  
  const { titulo, descripcion, sql_codigo, autor, etiquetas, favorito } = req.body;
  
  console.log('📋 Datos recibidos:');
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
  
  // Crear nueva consulta
  const newQuery = {
    id: nextId++,
    titulo,
    descripcion,
    sql_codigo,
    autor,
    favorito: Boolean(favorito), // Asegurar que sea boolean
    etiquetas: Array.isArray(etiquetas) ? etiquetas : [],
    fecha_creacion: new Date().toISOString(),
    fecha_modificacion: new Date().toISOString()
  };
  
  console.log('✅ Consulta creada exitosamente:');
  console.log('   ID:', newQuery.id);
  console.log('   Favorito procesado:', newQuery.favorito, `(tipo: ${typeof newQuery.favorito})`);
  console.log('   Etiquetas procesadas:', newQuery.etiquetas, `(length: ${newQuery.etiquetas.length})`);
  
  mockQueries.push(newQuery);
  
  res.status(201).json({
    status: 'success',
    data: newQuery
  });
});

// Test endpoint para depurar datos del formulario
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
  console.log('🚀 SERVIDOR DE PRUEBA INICIADO');
  console.log('===============================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test-form-data`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('📝 Este servidor simula la funcionalidad para probar sin base de datos');
});

module.exports = app;