const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración alternativa para Railway
console.log('🔄 CONFIGURACIÓN ALTERNATIVA PARA RAILWAY');
console.log('='.repeat(50));

// Mostrar todas las variables disponibles
console.log('Variables MYSQL originales de Railway:');
console.log('MYSQLHOST:', process.env.MYSQLHOST || '❌ NO ENCONTRADA');
console.log('MYSQLUSER:', process.env.MYSQLUSER || '❌ NO ENCONTRADA'); 
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '✅ CONFIGURADA' : '❌ NO ENCONTRADA');
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE || '❌ NO ENCONTRADA');
console.log('MYSQLPORT:', process.env.MYSQLPORT || '❌ NO ENCONTRADA');

console.log('\nVariables mapeadas por la app:');
console.log('DB_HOST:', process.env.DB_HOST || '❌ NO ENCONTRADA');
console.log('DB_USER:', process.env.DB_USER || '❌ NO ENCONTRADA');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ CONFIGURADA' : '❌ NO ENCONTRADA');
console.log('DB_NAME:', process.env.DB_NAME || '❌ NO ENCONTRADA'); 
console.log('DB_PORT:', process.env.DB_PORT || '❌ NO ENCONTRADA');

// Usar variables MYSQL directamente si las mapeadas no existen
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root', 
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'queryvault_db',
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('\n📊 Configuración final que se usará:');
console.log('Host:', dbConfig.host);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);
console.log('Port:', dbConfig.port);
console.log('='.repeat(50));

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    console.log('🔄 Intentando conectar a la base de datos...');
    console.log(`📍 Conectando a: ${dbConfig.host}:${dbConfig.port}`);
    
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    console.log(`📊 Conectado a: ${dbConfig.database} en ${dbConfig.host}`);
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', rows[0]);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error detallado al conectar con la base de datos:');
    console.error('- Código de error:', error.code);
    console.error('- Mensaje:', error.message);
    console.error('- Host intentado:', dbConfig.host);
    console.error('- Puerto intentado:', dbConfig.port);
    console.error('- Usuario intentado:', dbConfig.user);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 El error indica que:');
      if (dbConfig.host === 'localhost') {
        console.error('  - Las variables de Railway NO están configuradas correctamente');
        console.error('  - Se está usando localhost en lugar del host de Railway'); 
        console.error('  - Revisa las variables de entorno en Railway Dashboard');
      } else {
        console.error('  - Las variables están configuradas pero el servidor MySQL no responde');
        console.error('  - Verifica que el servicio MySQL esté corriendo en Railway');
      }
    }
    
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};