const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yaml');
const swaggerSpecPath = path.join(__dirname, 'docs', 'openapi.yaml');
let swaggerDocument = null;
try {
  if (fs.existsSync(swaggerSpecPath)) {
    const file = fs.readFileSync(swaggerSpecPath, 'utf8');
    swaggerDocument = yaml.parse(file);
  }
} catch (e) {
  console.log('⚠️ No se pudo cargar OpenAPI spec:', e.message);
}

// Importar configuración de base de datos
const database = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Determinar si usar MySQL o JSON basado en el entorno
const USE_MYSQL = process.env.NODE_ENV === 'production' || process.env.USE_MYSQL === 'true';
const DATA_FILE = path.join(__dirname, 'consultas-data.json');

console.log('🔧 Iniciando servidor QueryVault...');
console.log(`💾 Modo de almacenamiento: ${USE_MYSQL ? 'MySQL' : 'JSON File'}`);

// Configurar CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
let staticPath = path.join(__dirname, '../src');

// Verificar que existe el directorio src
if (!fs.existsSync(staticPath)) {
    console.log(`❌ Directorio src no encontrado en: ${staticPath}`);
    // Intentar desde la raíz del proyecto
    staticPath = path.join(process.cwd(), 'src');
    if (!fs.existsSync(staticPath)) {
        console.log(`❌ Directorio src tampoco encontrado en: ${staticPath}`);
        // Crear un directorio temporal si no existe
        staticPath = __dirname;
    }
}

console.log(`📁 Sirviendo archivos estáticos desde: ${staticPath}`);
if (fs.existsSync(staticPath)) {
    console.log(`📂 Archivos disponibles:`, fs.readdirSync(staticPath));
} else {
    console.log('❌ Directorio estático no existe');
}

app.use(express.static(staticPath));

// ==================== SWAGGER UI ====================
if (swaggerDocument) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('📚 Swagger UI disponible en /api-docs');
} else {
  console.log('⚠️ Swagger no configurado: falta docs/openapi.yaml');
}

// ==================== FUNCIONES DE PERSISTENCIA ====================

// Funciones para JSON (desarrollo local)
function loadConsultasFromJSON() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.log('📄 Creando archivo nuevo de consultas');
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const consultas = JSON.parse(data);
    console.log(`📖 Cargadas ${consultas.length} consultas del archivo`);
    return consultas;
  } catch (error) {
    console.error('❌ Error cargando consultas del archivo:', error);
    return [];
  }
}

function saveConsultasToJSON(consultas) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(consultas, null, 2));
    console.log(`💾 Guardadas ${consultas.length} consultas en archivo`);
    return true;
  } catch (error) {
    console.error('❌ Error guardando consultas en archivo:', error);
    return false;
  }
}

// Funciones para MySQL (producción)
async function loadConsultasFromMySQL() {
  try {
    const pool = await database.getPool();
    const [rows] = await pool.execute(`
      SELECT 
        id, titulo, descripcion, autor, sql_codigo, favorito, etiquetas,
        created_at, updated_at 
      FROM consultas 
      ORDER BY created_at DESC
    `);
    
    // Procesar etiquetas (convertir de string a array)
    const consultas = rows.map(row => ({
      ...row,
      favorito: Boolean(row.favorito),
      etiquetas: row.etiquetas ? row.etiquetas.split(',').map(tag => tag.trim()) : []
    }));
    
    console.log(`📖 Cargadas ${consultas.length} consultas de MySQL`);
    return consultas;
  } catch (error) {
    console.error('❌ Error cargando consultas de MySQL:', error);
    return [];
  }
}

async function saveConsultaToMySQL(consultaData) {
  try {
    const pool = await database.getPool();
    const { titulo, descripcion, autor, sql_codigo, favorito, etiquetas } = consultaData;
    
    const etiquetasString = Array.isArray(etiquetas) ? etiquetas.join(', ') : '';
    
    const [result] = await pool.execute(`
      INSERT INTO consultas (titulo, descripcion, autor, sql_codigo, favorito, etiquetas)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [titulo, descripcion, autor, sql_codigo, favorito ? 1 : 0, etiquetasString]);
    
    // Obtener la consulta recién creada
    const [rows] = await pool.execute(`
      SELECT id, titulo, descripcion, autor, sql_codigo, favorito, etiquetas,
             created_at, updated_at
      FROM consultas WHERE id = ?
    `, [result.insertId]);
    
    if (rows.length > 0) {
      const consulta = {
        ...rows[0],
        favorito: Boolean(rows[0].favorito),
        etiquetas: rows[0].etiquetas ? rows[0].etiquetas.split(',').map(tag => tag.trim()) : []
      };
      console.log('✅ Consulta guardada en MySQL:', consulta.titulo);
      return consulta;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error guardando consulta en MySQL:', error);
    throw error;
  }
}

async function updateConsultaInMySQL(id, consultaData) {
  try {
    const pool = await database.getPool();
    const { titulo, descripcion, autor, sql_codigo, favorito, etiquetas } = consultaData;
    
    const etiquetasString = Array.isArray(etiquetas) ? etiquetas.join(', ') : '';
    
    const [result] = await pool.execute(`
      UPDATE consultas 
      SET titulo = ?, descripcion = ?, autor = ?, sql_codigo = ?, favorito = ?, etiquetas = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [titulo, descripcion, autor, sql_codigo, favorito ? 1 : 0, etiquetasString, id]);
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    // Obtener la consulta actualizada
    const [rows] = await pool.execute(`
      SELECT id, titulo, descripcion, autor, sql_codigo, favorito, etiquetas,
             created_at, updated_at
      FROM consultas WHERE id = ?
    `, [id]);
    
    if (rows.length > 0) {
      const consulta = {
        ...rows[0],
        favorito: Boolean(rows[0].favorito),
        etiquetas: rows[0].etiquetas ? rows[0].etiquetas.split(',').map(tag => tag.trim()) : []
      };
      console.log('✅ Consulta actualizada en MySQL:', consulta.titulo);
      return consulta;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error actualizando consulta en MySQL:', error);
    throw error;
  }
}

async function deleteConsultaFromMySQL(id) {
  try {
    const pool = await database.getPool();
    
    // Primero obtener la consulta para logging
    const [rows] = await pool.execute('SELECT titulo FROM consultas WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const titulo = rows[0].titulo;
    
    // Eliminar la consulta
    const [result] = await pool.execute('DELETE FROM consultas WHERE id = ?', [id]);
    
    if (result.affectedRows > 0) {
      console.log('✅ Consulta eliminada de MySQL:', titulo);
      return { id, titulo };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error eliminando consulta de MySQL:', error);
    throw error;
  }
}

async function getConsultaFromMySQL(id) {
  try {
    const pool = await database.getPool();
    const [rows] = await pool.execute(`
      SELECT id, titulo, descripcion, autor, sql_codigo, favorito, etiquetas,
             created_at, updated_at
      FROM consultas WHERE id = ?
    `, [id]);
    
    if (rows.length > 0) {
      const consulta = {
        ...rows[0],
        favorito: Boolean(rows[0].favorito),
        etiquetas: rows[0].etiquetas ? rows[0].etiquetas.split(',').map(tag => tag.trim()) : []
      };
      console.log('✅ Consulta encontrada en MySQL');
      return consulta;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo consulta de MySQL:', error);
    throw error;
  }
}

// ==================== ENDPOINTS API ====================

// Health check
app.get('/api/health', async (req, res) => {
  console.log(`📝 ${new Date().toLocaleTimeString()} - GET /api/health`);
  
  let status = { status: 'OK', storage: USE_MYSQL ? 'MySQL' : 'JSON' };
  
  if (USE_MYSQL) {
    try {
      await database.testConnection();
      status.database = 'Connected';
    } catch (error) {
      status.database = 'Error';
      status.error = error.message;
    }
  }
  
  console.log('✅ Health check OK');
  res.json(status);
});

// GET - Obtener todas las consultas
app.get('/api/consultas', async (req, res) => {
  try {
    console.log(`📝 ${new Date().toLocaleTimeString()} - GET /api/consultas`);
    console.log('📋 Solicitando todas las consultas');
    
    let consultas;
    if (USE_MYSQL) {
      consultas = await loadConsultasFromMySQL();
    } else {
      consultas = loadConsultasFromJSON();
    }
    
    console.log(`✅ Enviando ${consultas.length} consultas al frontend`);
    res.json(consultas);
  } catch (error) {
    console.error('❌ Error en GET /api/consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener una consulta específica
app.get('/api/consultas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`📝 ${new Date().toLocaleTimeString()} - GET /api/consultas/${id}`);
    console.log(`🔍 Buscando consulta ID: ${id}`);
    
    if (!id || isNaN(id)) {
      console.log('❌ ID inválido');
      return res.status(400).json({ error: 'ID de consulta inválido' });
    }
    
    let consulta;
    if (USE_MYSQL) {
      consulta = await getConsultaFromMySQL(id);
    } else {
      const consultas = loadConsultasFromJSON();
      consulta = consultas.find(c => c.id === id);
    }
    
    if (!consulta) {
      console.log('❌ Consulta no encontrada');
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }
    
    console.log('✅ Consulta encontrada');
    res.json(consulta);
  } catch (error) {
    console.error('❌ Error en GET /api/consultas/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear nueva consulta
app.post('/api/consultas', async (req, res) => {
  try {
    console.log(`📝 ${new Date().toLocaleTimeString()} - POST /api/consultas`);
    console.log(`🌐 Origin: ${req.headers.origin}`);
    console.log('📤 Body:', req.body);
    
    const { titulo, descripcion, autor, sql_codigo, favorito, etiquetas } = req.body;
    
    console.log('📝 Creando nueva consulta');
    console.log('📥 Datos recibidos:', req.body);
    
    if (!titulo || !sql_codigo) {
      console.log('❌ Datos requeridos faltantes');
      return res.status(400).json({ error: 'Título y código SQL son requeridos' });
    }
    
    let nuevaConsulta;
    
    if (USE_MYSQL) {
      nuevaConsulta = await saveConsultaToMySQL({
        titulo: titulo || '',
        descripcion: descripcion || '',
        autor: autor || '',
        sql_codigo: sql_codigo || '',
        favorito: favorito === true || favorito === 'true',
        etiquetas: Array.isArray(etiquetas) ? etiquetas : (etiquetas ? [etiquetas] : [])
      });
    } else {
      const consultas = loadConsultasFromJSON();
      const maxId = consultas.length > 0 ? Math.max(...consultas.map(c => c.id)) : 0;
      
      nuevaConsulta = {
        id: maxId + 1,
        titulo: titulo || '',
        descripcion: descripcion || '',
        autor: autor || '',
        sql_codigo: sql_codigo || '',
        favorito: favorito === true || favorito === 'true',
        etiquetas: Array.isArray(etiquetas) ? etiquetas : (etiquetas ? [etiquetas] : []),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      consultas.push(nuevaConsulta);
      
      if (!saveConsultasToJSON(consultas)) {
        return res.status(500).json({ error: 'Error guardando consulta' });
      }
    }
    
    if (!nuevaConsulta) {
      return res.status(500).json({ error: 'Error creando consulta' });
    }
    
    console.log('✅ Consulta creada exitosamente:', nuevaConsulta);
    res.status(201).json(nuevaConsulta);
  } catch (error) {
    console.error('❌ Error en POST /api/consultas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Actualizar consulta
app.put('/api/consultas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`📝 ${new Date().toLocaleTimeString()} - PUT /api/consultas/${id}`);
    console.log(`🌐 Origin: ${req.headers.origin}`);
    console.log('📤 Body:', req.body);
    console.log(`✏️ Actualizando consulta ID: ${id}`);
    
    const { titulo, descripcion, autor, sql_codigo, favorito, etiquetas } = req.body;
    console.log('📥 Datos recibidos:', req.body);
    
    if (!id || isNaN(id)) {
      console.log('❌ ID inválido para actualizar');
      return res.status(400).json({ error: 'ID de consulta inválido' });
    }
    
    let consultaActualizada;
    
    if (USE_MYSQL) {
      consultaActualizada = await updateConsultaInMySQL(id, {
        titulo: titulo || '',
        descripcion: descripcion || '',
        autor: autor || '',
        sql_codigo: sql_codigo || '',
        favorito: favorito === true || favorito === 'true',
        etiquetas: Array.isArray(etiquetas) ? etiquetas : (etiquetas ? [etiquetas] : [])
      });
    } else {
      const consultas = loadConsultasFromJSON();
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
        autor: autor || '',
        sql_codigo: sql_codigo || '',
        favorito: favorito === true || favorito === 'true',
        etiquetas: Array.isArray(etiquetas) ? etiquetas : (etiquetas ? [etiquetas] : []),
        updated_at: new Date().toISOString()
      };
      
      if (!saveConsultasToJSON(consultas)) {
        console.error('❌ Error guardando consulta actualizada');
        return res.status(500).json({ error: 'Error guardando consulta actualizada' });
      }
      
      consultaActualizada = consultas[index];
    }
    
    if (!consultaActualizada) {
      console.log('❌ Consulta no encontrada para actualizar');
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }
    
    console.log('✅ Consulta actualizada exitosamente:', consultaActualizada);
    res.json(consultaActualizada);
  } catch (error) {
    console.error('❌ Error en PUT /api/consultas/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar consulta
app.delete('/api/consultas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`📝 ${new Date().toLocaleTimeString()} - DELETE /api/consultas/${id}`);
    console.log(`🌐 Origin: ${req.headers.origin}`);
    console.log(`🗑️ Eliminando consulta ID: ${id}`);
    
    if (!id || isNaN(id)) {
      console.log('❌ ID inválido para eliminar');
      return res.status(400).json({ error: 'ID de consulta inválido' });
    }
    
    let resultado;
    
    if (USE_MYSQL) {
      resultado = await deleteConsultaFromMySQL(id);
    } else {
      const consultas = loadConsultasFromJSON();
      const index = consultas.findIndex(c => c.id === id);
      
      if (index === -1) {
        console.log('❌ Consulta no encontrada para eliminar');
        return res.status(404).json({ error: 'Consulta no encontrada' });
      }
      
      // Guardar la consulta eliminada para logging
      const consultaEliminada = consultas[index];
      
      // Eliminar la consulta
      consultas.splice(index, 1);
      
      if (!saveConsultasToJSON(consultas)) {
        console.error('❌ Error guardando consultas después de eliminar');
        return res.status(500).json({ error: 'Error guardando cambios después de eliminar' });
      }
      
      resultado = { id, titulo: consultaEliminada.titulo };
    }
    
    if (!resultado) {
      console.log('❌ Consulta no encontrada para eliminar');
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }
    
    console.log('✅ Consulta eliminada exitosamente:', resultado.titulo);
    res.json({ 
      message: 'Consulta eliminada exitosamente',
      id: id,
      titulo: resultado.titulo
    });
  } catch (error) {
    console.error('❌ Error en DELETE /api/consultas/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Catch-all para el frontend (SPA)
app.get('*', (req, res) => {
  console.log(`📝 ${new Date().toLocaleTimeString()} - GET ${req.originalUrl}`);
  console.log(`📄 Sirviendo index.html para: ${req.originalUrl}`);
  res.sendFile(path.join(staticPath, 'index.html'));
});

// ==================== INICIALIZACIÓN ====================

async function initializeServer() {
  try {
    if (USE_MYSQL) {
      console.log('🔄 Inicializando conexión a MySQL...');
      await database.testConnection();
      await database.initializeDatabase();
      console.log('✅ MySQL inicializado correctamente');
    } else {
      console.log(`💾 Archivo de datos: ${DATA_FILE}`);
    }
    
    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 ¡QUERYVAULT SERVER INICIADO EXITOSAMENTE!');
      console.log('==============================================');
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`🌐 URL Frontend: http://localhost:${PORT}`);
      console.log(`🔗 URL API: http://localhost:${PORT}/api`);
      console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📋 Consultas API: http://localhost:${PORT}/api/consultas`);
      console.log(`💾 Almacenamiento: ${USE_MYSQL ? 'MySQL' : 'JSON File'}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
      console.log(`🔌 Escuchando en: 0.0.0.0:${PORT}`);
      console.log('==============================================');
      console.log('🎯 ¡Servidor listo para recibir requests!');
      console.log('');
    });

    // Manejo de errores del servidor
    server.on('error', (err) => {
      console.error('\n❌ ERROR DEL SERVIDOR:', err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} está ocupado. Prueba:`);
        console.error(`   $env:PORT="3001"; node server-hybrid.js`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error inicializando servidor:', error);
    process.exit(1);
  }
}

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

// Inicializar servidor
initializeServer();