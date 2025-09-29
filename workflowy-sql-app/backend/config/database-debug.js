const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔄 CONFIGURACIÓN MYSQL - MODO DEBUG COMPLETO');
console.log('=============================================');

// Debug: Mostrar TODAS las variables de entorno relacionadas con MySQL
console.log('\n📊 VARIABLES DE ENTORNO DISPONIBLES:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Variables Railway MySQL
console.log('\n🔍 VARIABLES MYSQL DE RAILWAY:');
console.log('MYSQLHOST:', process.env.MYSQLHOST || 'NO ENCONTRADA');
console.log('MYSQLUSER:', process.env.MYSQLUSER || 'NO ENCONTRADA');
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '[CONFIGURADA]' : 'NO ENCONTRADA');
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'NO ENCONTRADA');
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE || 'NO ENCONTRADA');
console.log('MYSQLPORT:', process.env.MYSQLPORT || 'NO ENCONTRADA');
console.log('MYSQL_URL:', process.env.MYSQL_URL || 'NO ENCONTRADA');

// Variables DB tradicionales
console.log('\n🔍 VARIABLES DB TRADICIONALES:');
console.log('DB_HOST:', process.env.DB_HOST || 'NO ENCONTRADA');
console.log('DB_USER:', process.env.DB_USER || 'NO ENCONTRADA');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[CONFIGURADA]' : 'NO ENCONTRADA');
console.log('DB_NAME:', process.env.DB_NAME || 'NO ENCONTRADA');
console.log('DB_PORT:', process.env.DB_PORT || 'NO ENCONTRADA');

// Configuración con múltiples fallbacks
let dbConfig = {
    host: process.env.MYSQLHOST || 
          process.env.DB_HOST || 
          'mysql.railway.internal', // Hardcoded como último recurso
    user: process.env.MYSQLUSER || 
          process.env.DB_USER || 
          'root',
    password: process.env.MYSQLPASSWORD || 
              process.env.DB_PASSWORD || 
              'DNOPNMEfCKBJXhIGj1QDRZvqQMqypozy', // Hardcoded como último recurso
    database: process.env.MYSQL_DATABASE || 
              process.env.MYSQLDATABASE || 
              process.env.DB_NAME || 
              'railway',
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

console.log('\n✅ CONFIGURACIÓN FINAL A USAR:');
console.log('Host:', dbConfig.host);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);
console.log('Port:', dbConfig.port);
console.log('Password configurada:', !!dbConfig.password);

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión con detalles
async function testConnection() {
    try {
        console.log('\n🔄 Intentando conexión a MySQL...');
        console.log('Conectando a:', `${dbConfig.host}:${dbConfig.port}`);
        
        const connection = await pool.getConnection();
        
        console.log('✅ CONEXIÓN EXITOSA A MYSQL RAILWAY');
        
        // Verificar base de datos
        const [rows] = await connection.execute('SELECT DATABASE() as current_db, NOW() as timestamp, USER() as current_user');
        console.log('📊 Base de datos actual:', rows[0].current_db);
        console.log('👤 Usuario actual:', rows[0].current_user);
        console.log('⏰ Timestamp servidor:', rows[0].timestamp);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('\n❌ ERROR DE CONEXIÓN MYSQL:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        console.error('Host intentado:', dbConfig.host);
        console.error('Puerto intentado:', dbConfig.port);
        console.error('Usuario intentado:', dbConfig.user);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 SUGERENCIAS:');
            console.error('1. Verificar que el servicio MySQL esté activo en Railway');
            console.error('2. Revisar las variables de entorno en Railway Dashboard');
            console.error('3. Verificar que MYSQLHOST = mysql.railway.internal');
        }
        
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};