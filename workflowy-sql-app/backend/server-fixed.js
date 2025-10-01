const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 Iniciando servidor QueryVault...');

// CORS más permisivo para desarrollo
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging detallado
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n📝 ${timestamp} - ${req.method} ${req.originalUrl}`);
  if (req.headers.origin) {
    console.log(`🌐 Origin: ${req.headers.origin}`);
  }
  if (Object.keys(req.body).length > 0) {
    console.log('📤 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Servir archivos estáticos del frontend
const staticPath = path.join(__dirname, '../src');
console.log('📁 Sirviendo archivos estáticos desde:', staticPath);
app.use(express.static(staticPath));

// Archivo de datos JSON
const dataFile = path.join(__dirname, 'consultas-data.json');
console.log('💾 Archivo de datos:', dataFile);

// Funciones de almacenamiento
function loadConsultas() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      const parsed = JSON.parse(data);
      console.log(`📖 Cargadas ${parsed.length || 0} consultas del archivo`);
      return parsed;
    }
  } catch (error) {
    console.error('❌ Error cargando consultas:', error.message);
  }
  console.log('📄 Creando archivo nuevo de consultas');
  return [];
}

function saveConsultas(consultas) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(consultas, null, 2));
    console.log(`💾 Guardadas ${consultas.length} consultas en archivo`);
    return true;
  } catch (error) {
    console.error('❌ Error guardando consultas:', error.message);
    return false;
  }
}

// ===== ENDPOINTS API =====

// Health check
app.get('/api/health', (req, res) => {
  console.log('✅ Health check OK');
  res.json({ 
    status: 'ok', 
    message: 'QueryVault Server funcionando',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// GET todas las consultas
app.get('/api/consultas', (req, res) => {
  try {
    console.log('📋 Solicitando todas las consultas');
    const consultas = loadConsultas();
    const search = req.query.search;
    
    let result = consultas;
    if (search) {
      const searchLower = search.toLowerCase();
      result = consultas.filter(c => 
        (c.titulo && c.titulo.toLowerCase().includes(searchLower)) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(searchLower)) ||
        (c.sql_codigo && c.sql_codigo.toLowerCase().includes(searchLower)) ||
        (c.etiquetas && c.etiquetas.some(e => e.toLowerCase().includes(searchLower)))
      );
      console.log(`🔍 Búsqueda "${search}" encontró ${result.length} resultados`);
    }
    
    console.log(`✅ Enviando ${result.length} consultas al frontend`);
    res.json(result);
  } catch (error) {
    console.error('❌ Error en GET /api/consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST nueva consulta
app.post('/api/consultas', (req, res) => {
  try {
    console.log('📝 Creando nueva consulta');
    console.log('📥 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { titulo, descripcion, sql_codigo, favorito, etiquetas } = req.body;
    
    const consultas = loadConsultas();
    const newId = consultas.length > 0 ? Math.max(...consultas.map(c => c.id || 0)) + 1 : 1;
    
    const nuevaConsulta = {
      id: newId,
      titulo: titulo || '',
      descripcion: descripcion || '',
      sql_codigo: sql_codigo || '',
      favorito: favorito === true || favorito === 'true',
      etiquetas: Array.isArray(etiquetas) ? etiquetas : (etiquetas ? [etiquetas] : []),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    consultas.push(nuevaConsulta);
    
    if (saveConsultas(consultas)) {
      console.log('✅ Consulta creada exitosamente:', nuevaConsulta);
      res.status(201).json(nuevaConsulta);
    } else {
      console.error('❌ Error guardando consulta');
      res.status(500).json({ error: 'Error guardando consulta' });
    }
  } catch (error) {
    console.error('❌ Error en POST /api/consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET consulta específica
app.get('/api/consultas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🔍 Buscando consulta ID: ${id}`);
    
    const consultas = loadConsultas();
    const consulta = consultas.find(c => c.id === id);
    
    if (consulta) {
      console.log('✅ Consulta encontrada');
      res.json(consulta);
    } else {
      console.log('❌ Consulta no encontrada');
      res.status(404).json({ error: 'Consulta no encontrada' });
    }
  } catch (error) {
    console.error('❌ Error en GET /api/consultas/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT actualizar consulta específica
app.put('/api/consultas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`✏️ Actualizando consulta ID: ${id}`);
    console.log('📥 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { titulo, descripcion, sql_codigo, favorito, etiquetas } = req.body;
    
    const consultas = loadConsultas();
    const index = consultas.findIndex(c => c.id === id);
    
    if (index === -1) {
      console.log('❌ Consulta no encontrada para actualizar');
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }
    
    // Actualizar la consulta
    consultas[index] = {
      ...consultas[index],
      titulo: titulo || '',
      descripcion: descripcion || '',
      sql_codigo: sql_codigo || '',
      favorito: favorito === true || favorito === 'true',
      etiquetas: Array.isArray(etiquetas) ? etiquetas : (etiquetas ? [etiquetas] : []),
      updated_at: new Date().toISOString()
    };
    
    if (saveConsultas(consultas)) {
      console.log('✅ Consulta actualizada exitosamente:', consultas[index]);
      res.json(consultas[index]);
    } else {
      console.error('❌ Error guardando consulta actualizada');
      res.status(500).json({ error: 'Error guardando consulta actualizada' });
    }
  } catch (error) {
    console.error('❌ Error en PUT /api/consultas/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar consulta
app.delete('/api/consultas/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`🗑️ Eliminando consulta ID: ${id}`);
    console.log(`🌐 Origin: ${req.headers.origin}`);
    
    if (!id || isNaN(id)) {
      console.log('❌ ID inválido para eliminar');
      return res.status(400).json({ error: 'ID de consulta inválido' });
    }
    
    const consultas = loadConsultas();
    const index = consultas.findIndex(c => c.id === id);
    
    if (index === -1) {
      console.log('❌ Consulta no encontrada para eliminar');
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }
    
    // Guardar la consulta eliminada para logging
    const consultaEliminada = consultas[index];
    
    // Eliminar la consulta
    consultas.splice(index, 1);
    
    if (saveConsultas(consultas)) {
      console.log('✅ Consulta eliminada exitosamente:', consultaEliminada.titulo);
      res.json({ 
        message: 'Consulta eliminada exitosamente',
        id: id,
        titulo: consultaEliminada.titulo
      });
    } else {
      console.error('❌ Error guardando consultas después de eliminar');
      res.status(500).json({ error: 'Error guardando cambios después de eliminar' });
    }
  } catch (error) {
    console.error('❌ Error en DELETE /api/consultas/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Catch-all para el frontend (SPA)
app.get('*', (req, res) => {
  console.log(`📄 Sirviendo index.html para: ${req.originalUrl}`);
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Iniciar servidor
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log('\n🚀 ¡QUERYVAULT SERVER INICIADO EXITOSAMENTE!');
  console.log('==============================================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL Frontend: http://localhost:${PORT}`);
  console.log(`🔗 URL API: http://localhost:${PORT}/api`);
  console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Consultas API: http://localhost:${PORT}/api/consultas`);
  console.log('==============================================');
  console.log('🎯 ¡Servidor listo para recibir requests!');
  console.log('');
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('\n❌ ERROR DEL SERVIDOR:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} está ocupado. Prueba:`);
    console.error(`   $env:PORT="3001"; node server-fixed.js`);
  }
  process.exit(1);
});

// Manejo de errores globales
process.on('uncaughtException', (err) => {
  console.error('\n❌ EXCEPCIÓN NO CAPTURADA:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ PROMESA RECHAZADA:', reason);
  process.exit(1);
});

console.log('🔧 Servidor configurado, esperando conexiones...');