// Servidor de entrada para Railway - Carga el servidor híbrido
console.log('🚀 Iniciando servidor QueryVault para Railway...');
console.log('📁 Directorio actual:', process.cwd());
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔌 PORT:', process.env.PORT);

// Configurar NODE_ENV si no está definido
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
    console.log('⚙️ NODE_ENV configurado a: production');
}

const fs = require('fs');
const path = require('path');

try {
    console.log('🔍 Cargando servidor híbrido...');
    
    // Mostrar estructura de archivos para diagnóstico
    console.log('📂 Archivos en directorio raíz:', fs.readdirSync('.'));
    
    const backendPath = path.join(__dirname, 'backend');
    console.log('📂 Backend path:', backendPath);
    
    if (fs.existsSync(backendPath)) {
        console.log('📂 Archivos en backend:', fs.readdirSync(backendPath));
    } else {
        console.log('❌ Directorio backend no existe');
    }
    
    // Verificar si server-hybrid.js existe
    const serverHybridPath = path.join(backendPath, 'server-hybrid.js');
    if (fs.existsSync(serverHybridPath)) {
        console.log('✅ server-hybrid.js encontrado');
        
        // Cambiar directorio de trabajo para que las rutas relativas funcionen
        process.chdir(backendPath);
        console.log('📁 Directorio cambiado a:', process.cwd());
        
        // Cargar el servidor híbrido
        console.log('🎯 Cargando servidor híbrido...');
        require('./server-hybrid.js');
        console.log('✅ Servidor híbrido cargado exitosamente');
        
    } else {
        throw new Error('server-hybrid.js no encontrado en ' + serverHybridPath);
    }
    
} catch (error) {
    console.error('❌ Error cargando servidor híbrido:', error.message);
    
    // Fallback: crear servidor de diagnóstico
    const express = require('express');
    const app = express();
    const PORT = process.env.PORT || 3000;
    
    app.use(express.json());
    
    app.get('/api/health', (req, res) => {
        res.status(500).json({
            status: 'ERROR',
            message: 'No se pudo cargar el servidor híbrido',
            error: error.message,
            debug: {
                cwd: process.cwd(),
                nodeEnv: process.env.NODE_ENV,
                port: process.env.PORT,
                railwayService: process.env.RAILWAY_SERVICE_NAME,
                backendExists: fs.existsSync('./backend'),
                serverHybridExists: fs.existsSync('./backend/server-hybrid.js'),
                rootFiles: fs.readdirSync('.'),
                backendFiles: fs.existsSync('./backend') ? fs.readdirSync('./backend') : 'No existe'
            }
        });
    });
    
    app.get('/api/consultas', (req, res) => {
        res.status(500).json({
            error: 'Servidor no disponible',
            message: 'El servidor híbrido no se pudo cargar'
        });
    });
    
    app.get('*', (req, res) => {
        res.status(404).json({
            error: 'Servidor no configurado correctamente',
            message: 'No se pudo cargar server-hybrid.js',
            path: req.path
        });
    });
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`❌ Servidor de diagnóstico iniciado en puerto ${PORT}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🌍 Railway URL: https://${process.env.RAILWAY_SERVICE_NAME || 'app'}.railway.app/api/health`);
    });
}