const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos con debugging
console.log('🔍 Configuración de base de datos:');
console.log('DB_HOST:', process.env.DB_HOST || 'NO CONFIGURADO');
console.log('DB_USER:', process.env.DB_USER || 'NO CONFIGURADO');
console.log('DB_NAME:', process.env.DB_NAME || 'NO CONFIGURADO');
console.log('DB_PORT:', process.env.DB_PORT || 'NO CONFIGURADO');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'queryvault_db',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Log de configuración (sin password)
console.log('📊 Pool config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

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
      console.error('💡 Posibles soluciones:');
      console.error('  1. Verificar que las variables DB_* están configuradas en Railway');
      console.error('  2. Verificar que el servicio MySQL esté corriendo');
      console.error('  3. Verificar que no se esté usando localhost en producción');
    }
    
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};