const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  console.log('🚀 INICIALIZANDO BASE DE DATOS RAILWAY');
  console.log('=====================================');
  
  let connection;
  
  try {
    // Usar MYSQL_URL si está disponible (configuración Railway)
    if (process.env.MYSQL_URL) {
      console.log('✅ Usando MYSQL_URL para inicialización');
      
      // Parsear MYSQL_URL
      const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
      const match = process.env.MYSQL_URL.match(regex);
      
      if (!match) {
        throw new Error('MYSQL_URL tiene formato inválido');
      }
      
      connection = await mysql.createConnection({
        host: match[3],
        user: match[1], 
        password: match[2],
        port: parseInt(match[4]),
        database: match[5]
      });
      
      console.log('📊 Conectando a:', match[3]);
      console.log('📊 Base de datos:', match[5]);
      
    } else {
      console.log('⚠️ MYSQL_URL no disponible, usando variables individuales');
      
      connection = await mysql.createConnection({
        host: process.env.MYSQLHOST || 'localhost',
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '',
        port: parseInt(process.env.MYSQLPORT || '3306'),
        database: process.env.MYSQL_DATABASE || 'railway'
      });
    }

    console.log('\n🔄 Verificando conexión...');
    const [dbRows] = await connection.execute('SELECT DATABASE() as current_db');
    console.log('✅ Conectado a base de datos:', dbRows[0].current_db);
    
    // Verificar timestamp en consulta separada
    const [timeRows] = await connection.execute('SELECT NOW() as timestamp');
    console.log('⏰ Timestamp:', timeRows[0].timestamp);

    console.log('\n🔄 Creando tabla consultas...');
    
    // Crear tabla consultas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS consultas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        sql_query LONGTEXT NOT NULL,
        categoria VARCHAR(100) DEFAULT 'General',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        orden_visualizacion INT DEFAULT 0,
        INDEX idx_categoria (categoria),
        INDEX idx_fecha_creacion (fecha_creacion),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabla consultas creada/verificada');

    console.log('\n🔄 Insertando datos de ejemplo...');
    
    // Verificar si ya hay datos
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM consultas');
    const existingCount = countResult[0].count;
    
    if (existingCount === 0) {
      // Insertar consultas de ejemplo
      const consultasEjemplo = [
        {
          titulo: 'Usuarios activos',
          descripcion: 'Consulta para obtener todos los usuarios activos del sistema',
          sql_query: 'SELECT id, nombre, email, fecha_registro FROM usuarios WHERE activo = 1 ORDER BY fecha_registro DESC;',
          categoria: 'Usuarios'
        },
        {
          titulo: 'Ventas por mes',
          descripcion: 'Resumen de ventas agrupadas por mes del año actual',
          sql_query: 'SELECT MONTH(fecha_venta) as mes, COUNT(*) as total_ventas, SUM(monto) as total_monto FROM ventas WHERE YEAR(fecha_venta) = YEAR(CURDATE()) GROUP BY MONTH(fecha_venta) ORDER BY mes;',
          categoria: 'Ventas'
        },
        {
          titulo: 'Productos más vendidos',
          descripcion: 'Top 10 de productos con más ventas',
          sql_query: 'SELECT p.nombre, COUNT(v.producto_id) as cantidad_vendida, SUM(v.monto) as total_ingresos FROM productos p INNER JOIN ventas v ON p.id = v.producto_id GROUP BY p.id, p.nombre ORDER BY cantidad_vendida DESC LIMIT 10;',
          categoria: 'Productos'
        }
      ];
      
      for (const consulta of consultasEjemplo) {
        await connection.execute(
          'INSERT INTO consultas (titulo, descripcion, sql_query, categoria) VALUES (?, ?, ?, ?)',
          [consulta.titulo, consulta.descripcion, consulta.sql_query, consulta.categoria]
        );
      }
      
      console.log(`✅ Insertadas ${consultasEjemplo.length} consultas de ejemplo`);
    } else {
      console.log(`ℹ️ Ya existen ${existingCount} consultas en la base de datos`);
    }

    // Verificar la estructura final
    console.log('\n🔍 Verificando estructura de la tabla...');
    const [columns] = await connection.execute('DESCRIBE consultas');
    console.log('📊 Columnas de la tabla consultas:');
    columns.forEach(col => {
      const nullInfo = col.Null === 'NO' ? 'NOT NULL' : '';
      const keyInfo = col.Key ? `(${col.Key})` : '';
      console.log(`  - ${col.Field}: ${col.Type} ${nullInfo} ${keyInfo}`);
    });

    console.log('\n🎉 ¡INICIALIZACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('La aplicación QueryVault está lista para usarse.');
    
    await connection.end();
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA INICIALIZACIÓN:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('SQL State:', error.sqlState);
    
    if (connection) {
      await connection.end();
    }
    
    process.exit(1);
  }
}

// Ejecutar inicialización
console.log('🚀 Iniciando proceso de inicialización de base de datos...');
initializeDatabase()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error inesperado:', error);
    process.exit(1);
  });