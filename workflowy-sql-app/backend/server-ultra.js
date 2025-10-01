const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🔧 Configurando middleware...');

// Middleware básico
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../src')));

console.log('📁 Archivos estáticos configurados desde:', path.join(__dirname, '../src'));

// Almacenamiento JSON
const dataFile = path.join(__dirname, 'queries.json');

function readQueries() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('❌ Error leyendo archivo:', error.message);
  }
  return [];
}

function saveQueries(queries) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(queries, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Error guardando archivo:', error.message);
    return false;
  }
}

// Logging
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  next();
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// GET consultas
app.get('/api/consultas', (req, res) => {
  try {
    const queries = readQueries();
    const search = req.query.search;
    
    let filteredQueries = queries;
    if (search) {
      filteredQueries = queries.filter(q => 
        q.titulo?.toLowerCase().includes(search.toLowerCase()) ||
        q.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
        q.sql_codigo?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    console.log(`✅ Devolviendo ${filteredQueries.length} consultas`);
    res.json(filteredQueries);
  } catch (error) {
    console.error('❌ Error en GET /api/consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST nueva consulta
app.post('/api/consultas', (req, res) => {
  try {
    console.log('📤 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { titulo, descripcion, sql_codigo, favorito, etiquetas } = req.body;
    
    const queries = readQueries();
    const newId = queries.length > 0 ? Math.max(...queries.map(q => q.id)) + 1 : 1;
    
    const newQuery = {
      id: newId,
      titulo: titulo || '',
      descripcion: descripcion || '',
      sql_codigo: sql_codigo || '',
      favorito: favorito === true || favorito === 'true',
      etiquetas: Array.isArray(etiquetas) ? etiquetas : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    queries.push(newQuery);
    
    if (saveQueries(queries)) {
      console.log('✅ Consulta guardada:', newQuery);
      res.status(201).json(newQuery);
    } else {
      res.status(500).json({ error: 'Error guardando consulta' });
    }
  } catch (error) {
    console.error('❌ Error en POST /api/consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Catch all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

// Iniciar servidor con manejo de errores
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('🚀 ¡SERVIDOR ULTRA SIMPLE INICIADO!');
  console.log('====================================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
  console.log('====================================');
  console.log('');
});

server.on('error', (err) => {
  console.error('❌ Error del servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Puerto ${PORT} ocupado. Usa: $env:PORT="otro_puerto"; node server-ultra.js`);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada:', reason);
  process.exit(1);
});