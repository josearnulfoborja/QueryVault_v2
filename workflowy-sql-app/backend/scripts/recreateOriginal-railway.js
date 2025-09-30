#!/usr/bin/env node

// Script para recrear BD con el esquema ORIGINAL que funciona
const mysql = require('mysql2/promise');
require('dotenv').config();

async function recreateWithOriginalSchema() {
  console.log('🔧 RECREANDO BD CON ESQUEMA ORIGINAL');
  console.log('===================================');
  
  let connection;
  
  try {
    // Conectar usando MYSQL_URL
    if (process.env.MYSQL_URL) {
      console.log('✅ Usando MYSQL_URL para conexión');
      
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
        database: match[5],
        ssl: { rejectUnauthorized: false }
      });
    } else {
      throw new Error('MYSQL_URL no está definida');
    }

    console.log('🔌 Conectado a MySQL Railway');

    // Eliminar todas las tablas en orden correcto
    console.log('🗑️ Eliminando tablas existentes...');
    
    const tablesToDrop = [
      'consulta_etiqueta',
      'versiones_consulta', 
      'etiquetas',
      'consultas'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`   ✅ Tabla ${table} eliminada`);
      } catch (error) {
        console.log(`   ⚠️ Error eliminando ${table}: ${error.message}`);
      }
    }

    // Crear tabla principal de consultas (ESQUEMA ORIGINAL)
    console.log('\n📋 Creando tabla consultas (esquema original)...');
    await connection.execute(`
      CREATE TABLE consultas (
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
    console.log('✅ Tabla consultas creada');

    // Crear tabla de etiquetas (ESQUEMA ORIGINAL SIMPLE)
    console.log('📋 Creando tabla etiquetas (esquema original)...');
    await connection.execute(`
      CREATE TABLE etiquetas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL
      )
    `);
    console.log('✅ Tabla etiquetas creada');

    // Crear relación muchos a muchos
    console.log('📋 Creando tabla consulta_etiqueta...');
    await connection.execute(`
      CREATE TABLE consulta_etiqueta (
        consulta_id INT NOT NULL,
        etiqueta_id INT NOT NULL,
        PRIMARY KEY (consulta_id, etiqueta_id),
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
        FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla consulta_etiqueta creada');

    // Crear tabla de versiones
    console.log('📋 Creando tabla versiones_consulta...');
    await connection.execute(`
      CREATE TABLE versiones_consulta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consulta_id INT NOT NULL,
        sql_codigo TEXT NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla versiones_consulta creada');

    // Insertar datos de ejemplo
    console.log('\n📝 Insertando datos de ejemplo...');
    
    // Insertar consultas
    const consultas = [
      ['Usuarios Activos', 'Consulta para obtener todos los usuarios activos', 'SELECT * FROM usuarios WHERE activo = 1;', 'Sistema', true],
      ['Ventas del Mes', 'Reporte de ventas del mes actual', 'SELECT * FROM ventas WHERE MONTH(fecha) = MONTH(NOW());', 'Sistema', false],
      ['Productos Top', 'Top 10 productos más vendidos', 'SELECT p.nombre, COUNT(*) as ventas FROM productos p JOIN ventas v ON p.id = v.producto_id GROUP BY p.id ORDER BY ventas DESC LIMIT 10;', 'Sistema', true]
    ];

    for (const consulta of consultas) {
      await connection.execute(
        'INSERT INTO consultas (titulo, descripcion, sql_codigo, autor, favorito) VALUES (?, ?, ?, ?, ?)',
        consulta
      );
    }
    console.log('✅ Consultas de ejemplo insertadas');

    // Insertar etiquetas simples
    const etiquetas = ['usuarios', 'ventas', 'productos', 'reportes'];
    for (const etiqueta of etiquetas) {
      await connection.execute('INSERT INTO etiquetas (nombre) VALUES (?)', [etiqueta]);
    }
    console.log('✅ Etiquetas de ejemplo insertadas');

    console.log('\n🎉 Base de datos recreada con esquema original exitosamente');
    console.log('📊 Esquema final:');
    console.log('   - consultas: id, titulo, descripcion, sql_codigo, fecha_creacion, favorito, padre_id, autor');
    console.log('   - etiquetas: id, nombre');
    console.log('   - consulta_etiqueta: consulta_id, etiqueta_id');
    console.log('   - versiones_consulta: id, consulta_id, sql_codigo, fecha');

  } catch (error) {
    console.error('❌ Error durante recreación:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  recreateWithOriginalSchema()
    .then(() => {
      console.log('\n✅ Recreación con esquema original completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en recreación:', error);
      process.exit(1);
    });
}

module.exports = { recreateWithOriginalSchema };