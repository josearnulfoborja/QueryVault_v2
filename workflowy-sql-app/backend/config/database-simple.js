const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔄 CONFIGURACIÓN MYSQL SIMPLE Y DIRECTA');

// Usar variables directas de Railway (las que vimos en la imagen)
// Configuración robusta con validación de puertos
let mysqlPort = 3306; // Puerto por defecto de MySQL
if (process.env.MYSQLPORT) {
    const envPort = parseInt(process.env.MYSQLPORT, 10);
    if (envPort > 0 && envPort <= 65535) {
        mysqlPort = envPort;
    } else {
        console.warn('⚠️ MYSQLPORT inválido:', process.env.MYSQLPORT);
        console.log('🔄 Usando puerto MySQL por defecto:', mysqlPort);
    }
}

const dbConfig = {
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root', 
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'railway',
    port: mysqlPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log('📊 Configuración MySQL Railway:');
console.log('Host:', dbConfig.host);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);
console.log('Port:', dbConfig.port);

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
    try {
        console.log('🔄 Probando conexión a MySQL...');
        const connection = await pool.getConnection();
        
        console.log('✅ Conexión exitosa a MySQL Railway');
        
        // Verificar base de datos
        const [rows] = await connection.execute('SELECT DATABASE() as current_db, NOW() as timestamp');
        console.log('📊 Base de datos actual:', rows[0].current_db);
        console.log('⏰ Timestamp servidor:', rows[0].timestamp);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error de conexión MySQL:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};