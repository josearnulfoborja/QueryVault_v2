const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔄 CONFIGURACIÓN MYSQL CON URL COMPLETA RAILWAY');
console.log('===============================================');

// Función simple para parsear URL MySQL
function parseMySQLUrl(url) {
    // mysql://user:password@host:port/database
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);
    
    if (!match) {
        throw new Error('URL MySQL inválida: ' + url);
    }
    
    return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4]),
        database: match[5]
    };
}

let dbConfig;

console.log('\n📊 DETECTANDO CONFIGURACIÓN MYSQL:');

if (process.env.MYSQL_URL) {
    console.log('✅ MYSQL_URL encontrada');
    console.log('URL (parcial):', process.env.MYSQL_URL.substring(0, 20) + '...');
    
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
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        };
        
        console.log('✅ CONFIGURACIÓN DESDE MYSQL_URL:');
        console.log('Host:', dbConfig.host);
        console.log('User:', dbConfig.user);
        console.log('Database:', dbConfig.database);
        console.log('Port:', dbConfig.port);
        console.log('Password configurada:', !!dbConfig.password);
        
    } catch (error) {
        console.error('❌ Error parseando MYSQL_URL:', error.message);
        process.exit(1);
    }
    
} else {
    console.log('❌ MYSQL_URL no encontrada');
    console.log('Variables disponibles:', Object.keys(process.env).filter(k => k.includes('MYSQL')));
    
    // Fallback a variables individuales
    dbConfig = {
        host: process.env.MYSQLHOST || 'localhost',
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '',
        database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'railway',
        port: parseInt(process.env.MYSQLPORT || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
    };
    
    console.log('⚠️ USANDO VARIABLES INDIVIDUALES:');
    console.log('Host:', dbConfig.host);
    console.log('User:', dbConfig.user);
    console.log('Database:', dbConfig.database);
    console.log('Port:', dbConfig.port);
    console.log('Password configurada:', !!dbConfig.password);
}

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
    try {
        console.log('\n🔄 PROBANDO CONEXIÓN MYSQL...');
        const connection = await pool.getConnection();
        
        console.log('✅ ¡CONEXIÓN EXITOSA A RAILWAY MYSQL!');
        
        // Verificar estado de la base de datos
        const [rows] = await connection.execute(`
            SELECT 
                DATABASE() as current_db, 
                USER() as current_user,
                VERSION() as mysql_version,
                NOW() as timestamp
        `);
        
        console.log('📊 ESTADO DE LA BASE DE DATOS:');
        console.log('Base de datos:', rows[0].current_db);
        console.log('Usuario conectado:', rows[0].current_user);
        console.log('Versión MySQL:', rows[0].mysql_version);
        console.log('Timestamp:', rows[0].timestamp);
        
        connection.release();
        return true;
        
    } catch (error) {
        console.error('\n❌ ERROR DE CONEXIÓN MYSQL:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        console.error('SQL State:', error.sqlState);
        
        console.error('\n🔍 CONFIGURACIÓN USADA:');
        console.error('Host:', dbConfig.host);
        console.error('Port:', dbConfig.port);
        console.error('User:', dbConfig.user);
        console.error('Database:', dbConfig.database);
        console.error('Password length:', dbConfig.password.length);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 SOLUCIÓN:');
            console.error('1. Ve a Railway → MySQL Service → Connect');
            console.error('2. Copia la URL completa de MySQL');
            console.error('3. Agrégala como MYSQL_URL en las variables de tu app');
            console.error('4. Elimina todas las otras variables MYSQL*');
        }
        
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};