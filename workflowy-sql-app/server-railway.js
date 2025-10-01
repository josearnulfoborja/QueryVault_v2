// Servidor principal simplificado para Railway
console.log('🚀 Iniciando QueryVault - Railway Edition...');

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar NODE_ENV por defecto
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
    console.log('⚙️ NODE_ENV configurado a: production');
}

console.log('📊 Información del servidor:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${PORT}`);
console.log(`- CWD: ${process.cwd()}`);

// Middleware básico
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
const staticPath = path.join(__dirname, 'src');
console.log(`📁 Sirviendo estáticos desde: ${staticPath}`);

if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    console.log('✅ Archivos estáticos configurados');
} else {
    console.log('❌ Directorio src no encontrado');
}

// Variables globales para datos
let consultasData = [];
const DATA_FILE = path.join(__dirname, 'backend', 'consultas-data.json');

// Funciones auxiliares
function loadConsultas() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            consultasData = JSON.parse(data);
            console.log(`📖 Cargadas ${consultasData.length} consultas`);
        } else {
            consultasData = [];
            console.log('📄 Archivo de datos no existe, usando array vacío');
        }
        return consultasData;
    } catch (error) {
        console.error('❌ Error cargando consultas:', error);
        consultasData = [];
        return consultasData;
    }
}

function saveConsultas() {
    try {
        const backendDir = path.dirname(DATA_FILE);
        if (!fs.existsSync(backendDir)) {
            fs.mkdirSync(backendDir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(consultasData, null, 2));
        console.log('💾 Consultas guardadas');
        return true;
    } catch (error) {
        console.error('❌ Error guardando consultas:', error);
        return false;
    }
}

// API Endpoints
app.get('/api/health', (req, res) => {
    console.log(`📝 Health check - ${new Date().toLocaleTimeString()}`);
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        storage: 'JSON',
        version: '2.0-railway'
    });
});

app.get('/api/consultas', (req, res) => {
    try {
        console.log(`📝 GET /api/consultas - ${new Date().toLocaleTimeString()}`);
        const consultas = loadConsultas();
        console.log(`✅ Enviando ${consultas.length} consultas`);
        res.json(consultas);
    } catch (error) {
        console.error('❌ Error en GET /api/consultas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/consultas/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log(`📝 GET /api/consultas/${id}`);
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        
        const consultas = loadConsultas();
        const consulta = consultas.find(c => c.id === id);
        
        if (!consulta) {
            return res.status(404).json({ error: 'Consulta no encontrada' });
        }
        
        console.log('✅ Consulta encontrada');
        res.json(consulta);
    } catch (error) {
        console.error('❌ Error en GET /api/consultas/:id:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/consultas', (req, res) => {
    try {
        console.log(`📝 POST /api/consultas - ${new Date().toLocaleTimeString()}`);
        console.log('📤 Datos recibidos:', req.body);
        
        const { titulo, descripcion, autor, sql_codigo, favorito, etiquetas } = req.body;
        
        if (!titulo || !sql_codigo) {
            return res.status(400).json({ error: 'Título y código SQL son requeridos' });
        }
        
        const consultas = loadConsultas();
        const maxId = consultas.length > 0 ? Math.max(...consultas.map(c => c.id)) : 0;
        
        const nuevaConsulta = {
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
        
        consultasData.push(nuevaConsulta);
        
        if (saveConsultas()) {
            console.log('✅ Consulta creada:', nuevaConsulta.titulo);
            res.status(201).json(nuevaConsulta);
        } else {
            res.status(500).json({ error: 'Error guardando consulta' });
        }
        
    } catch (error) {
        console.error('❌ Error en POST /api/consultas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/consultas/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log(`📝 PUT /api/consultas/${id}`);
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        
        const consultas = loadConsultas();
        const index = consultas.findIndex(c => c.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Consulta no encontrada' });
        }
        
        const { titulo, descripcion, autor, sql_codigo, favorito, etiquetas } = req.body;
        
        consultasData[index] = {
            ...consultasData[index],
            titulo: titulo || consultasData[index].titulo,
            descripcion: descripcion || consultasData[index].descripcion,
            autor: autor || consultasData[index].autor,
            sql_codigo: sql_codigo || consultasData[index].sql_codigo,
            favorito: favorito !== undefined ? (favorito === true || favorito === 'true') : consultasData[index].favorito,
            etiquetas: etiquetas !== undefined ? (Array.isArray(etiquetas) ? etiquetas : (etiquetas ? [etiquetas] : [])) : consultasData[index].etiquetas,
            updated_at: new Date().toISOString()
        };
        
        if (saveConsultas()) {
            console.log('✅ Consulta actualizada:', consultasData[index].titulo);
            res.json(consultasData[index]);
        } else {
            res.status(500).json({ error: 'Error guardando consulta' });
        }
        
    } catch (error) {
        console.error('❌ Error en PUT /api/consultas/:id:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/api/consultas/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log(`📝 DELETE /api/consultas/${id}`);
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        
        const consultas = loadConsultas();
        const index = consultas.findIndex(c => c.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Consulta no encontrada' });
        }
        
        const consultaEliminada = consultasData.splice(index, 1)[0];
        
        if (saveConsultas()) {
            console.log('✅ Consulta eliminada:', consultaEliminada.titulo);
            res.json({
                message: 'Consulta eliminada exitosamente',
                id: id,
                titulo: consultaEliminada.titulo
            });
        } else {
            res.status(500).json({ error: 'Error guardando cambios' });
        }
        
    } catch (error) {
        console.error('❌ Error en DELETE /api/consultas/:id:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para index.html
app.get('*', (req, res) => {
    console.log(`📝 Serving index.html for: ${req.originalUrl}`);
    const indexPath = path.join(staticPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({
            error: 'Aplicación no encontrada',
            message: 'index.html no existe',
            path: indexPath
        });
    }
});

// Inicializar datos y servidor
console.log('🔄 Cargando datos iniciales...');
loadConsultas();

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 ¡QUERYVAULT RAILWAY EDITION INICIADO!');
    console.log('==========================================');
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/api/health`);
    console.log(`📋 API: http://localhost:${PORT}/api/consultas`);
    console.log(`💾 Almacenamiento: JSON File`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
    console.log('==========================================');
    console.log('🎯 ¡Servidor listo para recibir requests!');
});

// Manejo de errores
process.on('uncaughtException', (err) => {
    console.error('\n❌ EXCEPCIÓN NO CAPTURADA:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ PROMESA RECHAZADA:', reason);
});