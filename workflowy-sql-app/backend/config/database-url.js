const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔄 CONFIGURACIÓN MYSQL CON URL COMPLETA');

// Función para parsear URL MySQL manualmente
function parseMySQLUrl(url) {
    // mysql://user:password@host:port/database
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
        throw new Error('Formato de URL MySQL inválido');
    }
    
    return {
        host: match[3],
        user: match[1],
        password: match[2],
        port: parseInt(match[4]),
        database: match[5]
    };
}

// Usar MYSQL_URL directamente si está disponible
let dbConfig;

if (process.env.MYSQL_URL) {
    console.log('✅ Usando MYSQL_URL de Railway');
    
    try {
        const parsed = parseMySQLUrl(process.env.MYSQL_URL);
        
        dbConfig = {
            host: parsed.host,
            user: parsed.user,
            password: parsed.password,
            database: parsed.database,
            port: parsed.port,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
        
        console.log('📊 Configuración desde MYSQL_URL:');
        console.log('Host:', dbConfig.host);
        console.log('User:', dbConfig.user);
        console.log('Database:', dbConfig.database);
        console.log('Port:', dbConfig.port);
        
    } catch (error) {
        console.log('⚠️ Error parseando MYSQL_URL, usando variables individuales');
        console.error('Error:', error.message);
        
        // Fallback a variables individuales
        dbConfig = {
            host: process.env.MYSQLHOST || 'localhost',
            user: process.env.MYSQLUSER || 'root',
            password: process.env.MYSQLPASSWORD || '',
            database: process.env.MYSQLDATABASE || 'railway',
            port: parseInt(process.env.MYSQLPORT) || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
    }
    
} else {
    console.log('⚠️ MYSQL_URL no disponible, usando variables individuales');
    
    dbConfig = {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway',
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
    
    console.log('📊 Configuración desde variables individuales:');
    console.log('Host:', dbConfig.host);
    console.log('User:', dbConfig.user);
    console.log('Database:', dbConfig.database);
    console.log('Port:', dbConfig.port);
}

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
        console.error('SQL State:', error.sqlState);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};