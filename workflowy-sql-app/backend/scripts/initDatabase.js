const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔄 Inicializando base de datos...');

    // Crear la base de datos si no existe
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'queryvaul'}`);
    console.log('✅ Base de datos creada/verificada');

    // Cerrar conexión y crear nueva conexión con la base de datos
    await connection.end();
    
    // Crear nueva conexión usando la base de datos específica
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'queryvaul',
      port: process.env.DB_PORT || 3306
    });

    // Tabla principal de consultas
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS consultas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        sql_codigo TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        favorito BOOLEAN DEFAULT FALSE,
        padre_id INT DEFAULT NULL,
        autor VARCHAR(100),
        FOREIGN KEY (padre_id) REFERENCES consultas(id)
      )
    `);
    console.log('✅ Tabla "consultas" creada/verificada');

    // Tabla de etiquetas
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS etiquetas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL
      )
    `);
    console.log('✅ Tabla "etiquetas" creada/verificada');

    // Relación muchos a muchos entre consultas y etiquetas
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS consulta_etiqueta (
        consulta_id INT NOT NULL,
        etiqueta_id INT NOT NULL,
        PRIMARY KEY (consulta_id, etiqueta_id),
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
        FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla "consulta_etiqueta" creada/verificada');

    // Tabla de versiones de cada consulta
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS versiones_consulta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consulta_id INT NOT NULL,
        sql_codigo TEXT NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla "versiones_consulta" creada/verificada');

    // Insertar datos de ejemplo
    await dbConnection.execute(`
      INSERT IGNORE INTO consultas (titulo, descripcion, sql_codigo, autor) VALUES
      ('Consulta de usuarios', 'Obtener todos los usuarios activos', 'SELECT * FROM users WHERE active = 1;', 'Admin'),
      ('Ventas por mes', 'Reporte de ventas mensuales', 'SELECT MONTH(fecha) as mes, SUM(total) as total_ventas FROM ventas GROUP BY MONTH(fecha);', 'Analista'),
      ('Top productos', 'Productos más vendidos', 'SELECT p.nombre, COUNT(v.id) as vendidos FROM productos p JOIN ventas v ON p.id = v.producto_id GROUP BY p.id ORDER BY vendidos DESC LIMIT 10;', 'Admin')
    `);
    console.log('✅ Datos de ejemplo insertados');

    console.log('🎉 Base de datos inicializada correctamente!');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  } finally {
    // Cerrar conexiones si existen
    if (typeof dbConnection !== 'undefined' && dbConnection) {
      await dbConnection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };