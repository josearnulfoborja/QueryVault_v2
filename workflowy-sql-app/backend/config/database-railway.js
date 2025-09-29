const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔄 CONFIGURACIÓN MYSQL - SOLO VARIABLES RAILWAY');
console.log('===============================================');

// Debug: Mostrar variables de Railway disponibles
console.log('\n📊 VARIABLES DE RAILWAY DETECTADAS:');
Object.keys(process.env)
  .filter(key => key.includes('MYSQL') || key.includes('DATABASE'))
  .forEach(key => {
    if (key.includes('PASSWORD') || key.includes('PASS')) {
      console.log(`${key}: [CONFIGURADA - ${process.env[key] ? process.env[key].length : 0} caracteres]`);
    } else {
      console.log(`${key}: ${process.env[key] || 'NO ENCONTRADA'}`);
    }
  });

// Usar SOLO variables de Railway, sin hardcoding
const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME,
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

console.log('\n✅ CONFIGURACIÓN FINAL (SIN HARDCODING):');
console.log('Host:', dbConfig.host || 'NO CONFIGURADO');
console.log('User:', dbConfig.user || 'NO CONFIGURADO');
console.log('Database:', dbConfig.database || 'NO CONFIGURADO');
console.log('Port:', dbConfig.port);
console.log('Password configurada:', !!dbConfig.password);

if (!dbConfig.host || !dbConfig.user || !dbConfig.password) {
    console.error('\n❌ FALTAN VARIABLES CRÍTICAS DE MYSQL');
    console.error('Verifica que Railway tenga configuradas:');
    console.error('- MYSQLHOST');
    console.error('- MYSQLUSER'); 
    console.error('- MYSQLPASSWORD');
    console.error('- MYSQL_DATABASE o MYSQLDATABASE');
}

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
    try {
        console.log('\n🔄 Intentando conexión a MySQL...');
        console.log('Host:', dbConfig.host);
        console.log('User:', dbConfig.user);
        console.log('Database:', dbConfig.database);
        console.log('Port:', dbConfig.port);
        
        const connection = await pool.getConnection();
        
        console.log('✅ CONEXIÓN EXITOSA A MYSQL RAILWAY');
        
        // Verificar base de datos
        const [rows] = await connection.execute('SELECT DATABASE() as current_db, NOW() as timestamp, USER() as current_user');
        console.log('📊 Base de datos actual:', rows[0].current_db);
        console.log('👤 Usuario conectado:', rows[0].current_user);
        console.log('⏰ Timestamp servidor:', rows[0].timestamp);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('\n❌ ERROR DE CONEXIÓN MYSQL:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        console.error('SQL State:', error.sqlState || 'N/A');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 ERROR DE AUTENTICACIÓN:');
            console.error('1. Verificar MYSQLUSER en Railway Dashboard');
            console.error('2. Verificar MYSQLPASSWORD en Railway Dashboard');
            console.error('3. Verificar que el MySQL service esté activo');
            console.error('4. Revisar la URL de conexión en Railway MySQL service');
        }
        
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};