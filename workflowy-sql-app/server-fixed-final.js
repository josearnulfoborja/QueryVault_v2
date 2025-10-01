const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 QueryVault Railway FINAL - Iniciando...');

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Logging
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
    next();
});

// Configurar archivos estáticos
app.use(express.static('src'));

// ===========================================
// SISTEMA DE DATOS UNIFICADO
// ===========================================

const DATA_FILE = path.join(__dirname, 'consultas.json');

function getConsultas() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('❌ Error leyendo consultas:', error);
        return [];
    }
}

function saveConsultas(consultas) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(consultas, null, 2));
        console.log('💾 Consultas guardadas correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error guardando consultas:', error);
        return false;
    }
}

// ===========================================
// RUTAS API EN ORDEN ESPECÍFICO
// ===========================================

// 1. HEALTH CHECK - PRIMERO SIEMPRE
app.get('/api/health', (req, res) => {
    console.log('🩺 Health check ejecutado');
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: 'FINAL',
        message: 'QueryVault funcionando perfectamente'
    });
});

// 2. OBTENER TODAS LAS CONSULTAS
app.get('/api/consultas', (req, res) => {
    console.log('📋 Obteniendo todas las consultas');
    try {
        const consultas = getConsultas();
        console.log(`✅ Enviando ${consultas.length} consultas`);
        res.json(consultas);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// 3. CREAR NUEVA CONSULTA
app.post('/api/consultas', (req, res) => {
    console.log('📝 Creando nueva consulta');
    console.log('Datos recibidos:', req.body);
    
    try {
        const consultas = getConsultas();
        const nuevaConsulta = {
            id: Date.now(),
            nombre: req.body.nombre || 'Sin nombre',
            sql: req.body.sql || '',
            descripcion: req.body.descripcion || '',
            etiquetas: req.body.etiquetas || [],
            favorito: req.body.favorito || false,
            fechaCreacion: new Date().toISOString()
        };
        
        consultas.push(nuevaConsulta);
        saveConsultas(consultas);
        
        console.log('✅ Consulta creada con ID:', nuevaConsulta.id);
        res.status(201).json(nuevaConsulta);
    } catch (error) {
        console.error('❌ Error creando consulta:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// 4. ACTUALIZAR CONSULTA
app.put('/api/consultas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    console.log('🔄 Actualizando consulta ID:', id);
    
    try {
        const consultas = getConsultas();
        const index = consultas.findIndex(c => c.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Consulta no encontrada' });
        }
        
        consultas[index] = { ...consultas[index], ...req.body };
        saveConsultas(consultas);
        
        console.log('✅ Consulta actualizada');
        res.json(consultas[index]);
    } catch (error) {
        console.error('❌ Error actualizando:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// 5. ELIMINAR CONSULTA
app.delete('/api/consultas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    console.log('🗑️ Eliminando consulta ID:', id);
    
    try {
        const consultas = getConsultas();
        const filtradas = consultas.filter(c => c.id !== id);
        
        if (filtradas.length === consultas.length) {
            return res.status(404).json({ error: 'Consulta no encontrada' });
        }
        
        saveConsultas(filtradas);
        console.log('✅ Consulta eliminada');
        res.json({ message: 'Consulta eliminada' });
    } catch (error) {
        console.error('❌ Error eliminando:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ===========================================
// CATCH-ALL - ÚLTIMO
// ===========================================

app.get('*', (req, res) => {
    console.log('📄 Sirviendo index.html para:', req.path);
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Inicializar datos de ejemplo si no existen
function initializeData() {
    const consultas = getConsultas();
    if (consultas.length === 0) {
        const ejemplos = [
            {
                id: 1,
                nombre: "Usuarios activos",
                sql: "SELECT * FROM usuarios WHERE activo = 1",
                descripcion: "Consulta para obtener usuarios activos",
                etiquetas: ["usuarios", "activos"],
                favorito: false,
                fechaCreacion: new Date().toISOString()
            },
            {
                id: 2,
                nombre: "Ventas por mes",
                sql: "SELECT MONTH(fecha) as mes, SUM(total) as total FROM ventas GROUP BY MONTH(fecha)",
                descripcion: "Ventas agrupadas por mes",
                etiquetas: ["ventas", "reportes"],
                favorito: true,
                fechaCreacion: new Date().toISOString()
            },
            {
                id: 3,
                nombre: "Productos más vendidos",
                sql: "SELECT producto, COUNT(*) as ventas FROM pedidos GROUP BY producto ORDER BY ventas DESC LIMIT 10",
                descripcion: "Top 10 productos más vendidos",
                etiquetas: ["productos", "ventas"],
                favorito: false,
                fechaCreacion: new Date().toISOString()
            }
        ];
        
        saveConsultas(ejemplos);
        console.log('🎯 Datos de ejemplo inicializados');
    }
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🌟 QueryVault Railway FINAL ejecutándose en puerto ${PORT}`);
    console.log(`🔗 URL: ${process.env.RAILWAY_PUBLIC_URL || `http://localhost:${PORT}`}`);
    initializeData();
});