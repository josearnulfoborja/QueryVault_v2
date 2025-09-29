#!/usr/bin/env node

// Script para FORZAR la recreación completa de todas las tablas en Railway
const mysql = require('mysql2/promise');
require('dotenv').config();

async function forceRecreateDatabase() {
  console.log('🚨 RECREACIÓN FORZADA DE BASE DE DATOS RAILWAY');
  console.log('===============================================');
  console.log('⚠️ ESTO ELIMINARÁ TODOS LOS DATOS EXISTENTES');
  console.log('===============================================');
  
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
        database: match[5]
      });
      
      console.log('📊 Conectando a:', match[3]);
      console.log('📊 Base de datos:', match[5]);
    } else {
      throw new Error('MYSQL_URL no está configurada');
    }

    console.log('\n🔄 Verificando conexión...');
    const [dbRows] = await connection.execute('SELECT DATABASE() as current_db');
    console.log('✅ Conectado a base de datos:', dbRows[0].current_db);

    console.log('\n🗑️ ELIMINANDO TODAS LAS TABLAS...');
    
    // Desactivar verificación de claves foráneas temporalmente
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Eliminar todas las tablas en cualquier orden
    const tablasAEliminar = ['consulta_etiqueta', 'versiones_consulta', 'consultas', 'etiquetas'];
    
    for (const tabla of tablasAEliminar) {
      try {
        const [exists] = await connection.execute(`SHOW TABLES LIKE '${tabla}'`);
        if (exists.length > 0) {
          await connection.execute(`DROP TABLE ${tabla}`);
          console.log(`✅ Tabla ${tabla} eliminada`);
        } else {
          console.log(`ℹ️ Tabla ${tabla} no existía`);
        }
      } catch (error) {
        console.log(`⚠️ Error eliminando ${tabla}:`, error.message);
      }
    }
    
    // Reactivar verificación de claves foráneas
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Todas las tablas eliminadas correctamente');

    console.log('\n🔄 CREANDO TABLAS CON ESQUEMA CORRECTO...');
    
    // Crear tabla consultas
    await connection.execute(`
      CREATE TABLE consultas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        sql_codigo LONGTEXT NOT NULL,
        categoria VARCHAR(100) DEFAULT 'General',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        orden_visualizacion INT DEFAULT 0,
        favorito BOOLEAN DEFAULT FALSE,
        padre_id INT DEFAULT NULL,
        autor VARCHAR(100) DEFAULT 'Anónimo',
        INDEX idx_categoria (categoria),
        INDEX idx_fecha_creacion (fecha_creacion),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla consultas creada');

    // Crear tabla etiquetas
    await connection.execute(`
      CREATE TABLE etiquetas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#007bff',
        descripcion TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE,
        INDEX idx_nombre (nombre),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla etiquetas creada');

    // Crear tabla consulta_etiqueta
    await connection.execute(`
      CREATE TABLE consulta_etiqueta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consulta_id INT NOT NULL,
        etiqueta_id INT NOT NULL,
        fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
        FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE,
        UNIQUE KEY unique_consulta_etiqueta (consulta_id, etiqueta_id),
        INDEX idx_consulta_id (consulta_id),
        INDEX idx_etiqueta_id (etiqueta_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla consulta_etiqueta creada');

    // Crear tabla versiones_consulta
    await connection.execute(`
      CREATE TABLE versiones_consulta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consulta_id INT NOT NULL,
        version_numero INT NOT NULL DEFAULT 1,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        sql_codigo LONGTEXT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        creado_por VARCHAR(100) DEFAULT 'system',
        comentarios TEXT,
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
        UNIQUE KEY unique_consulta_version (consulta_id, version_numero),
        INDEX idx_consulta_id (consulta_id),
        INDEX idx_version_numero (version_numero),
        INDEX idx_fecha_creacion (fecha_creacion)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla versiones_consulta creada');

    console.log('\n🔄 Insertando datos de ejemplo...');
    
    // Insertar consultas de ejemplo
    const consultasEjemplo = [
      {
        titulo: 'Usuarios activos',
        descripcion: 'Consulta para obtener todos los usuarios activos del sistema',
        sql_codigo: 'SELECT id, nombre, email, fecha_registro FROM usuarios WHERE activo = 1 ORDER BY fecha_registro DESC;',
        categoria: 'Usuarios',
        autor: 'Sistema'
      },
      {
        titulo: 'Ventas por mes',
        descripcion: 'Resumen de ventas agrupadas por mes del año actual',
        sql_codigo: 'SELECT MONTH(fecha_venta) as mes, COUNT(*) as total_ventas, SUM(monto) as total_monto FROM ventas WHERE YEAR(fecha_venta) = YEAR(CURDATE()) GROUP BY MONTH(fecha_venta) ORDER BY mes;',
        categoria: 'Ventas',
        autor: 'Sistema'
      },
      {
        titulo: 'Productos más vendidos',
        descripcion: 'Top 10 de productos con más ventas',
        sql_codigo: 'SELECT p.nombre, COUNT(v.producto_id) as cantidad_vendida, SUM(v.monto) as total_ingresos FROM productos p INNER JOIN ventas v ON p.id = v.producto_id GROUP BY p.id, p.nombre ORDER BY cantidad_vendida DESC LIMIT 10;',
        categoria: 'Productos',
        autor: 'Sistema'
      }
    ];
    
    for (const consulta of consultasEjemplo) {
      await connection.execute(
        'INSERT INTO consultas (titulo, descripcion, sql_codigo, categoria, autor) VALUES (?, ?, ?, ?, ?)',
        [consulta.titulo, consulta.descripcion, consulta.sql_codigo, consulta.categoria, consulta.autor]
      );
    }
    console.log(`✅ Insertadas ${consultasEjemplo.length} consultas de ejemplo`);

    // Insertar etiquetas de ejemplo
    const etiquetasEjemplo = [
      { nombre: 'SQL Básico', color: '#28a745', descripcion: 'Consultas SQL básicas y fundamentales' },
      { nombre: 'Reportes', color: '#007bff', descripcion: 'Consultas para generar reportes' },
      { nombre: 'Usuarios', color: '#ffc107', descripcion: 'Consultas relacionadas con usuarios' },
      { nombre: 'Ventas', color: '#dc3545', descripcion: 'Consultas de ventas y comerciales' },
      { nombre: 'Productos', color: '#6f42c1', descripcion: 'Consultas de productos e inventario' },
      { nombre: 'Análisis', color: '#20c997', descripcion: 'Consultas de análisis de datos' }
    ];
    
    for (const etiqueta of etiquetasEjemplo) {
      await connection.execute(
        'INSERT INTO etiquetas (nombre, color, descripcion) VALUES (?, ?, ?)',
        [etiqueta.nombre, etiqueta.color, etiqueta.descripcion]
      );
    }
    console.log(`✅ Insertadas ${etiquetasEjemplo.length} etiquetas de ejemplo`);

    // Asignar etiquetas a consultas
    const asignacionesEjemplo = [
      { consulta_id: 1, etiqueta_id: 3 }, // Usuarios activos -> Usuarios
      { consulta_id: 1, etiqueta_id: 1 }, // Usuarios activos -> SQL Básico
      { consulta_id: 2, etiqueta_id: 4 }, // Ventas por mes -> Ventas
      { consulta_id: 2, etiqueta_id: 2 }, // Ventas por mes -> Reportes
      { consulta_id: 3, etiqueta_id: 5 }, // Productos más vendidos -> Productos
      { consulta_id: 3, etiqueta_id: 6 }  // Productos más vendidos -> Análisis
    ];
    
    for (const asignacion of asignacionesEjemplo) {
      await connection.execute(
        'INSERT INTO consulta_etiqueta (consulta_id, etiqueta_id) VALUES (?, ?)',
        [asignacion.consulta_id, asignacion.etiqueta_id]
      );
    }
    console.log(`✅ Creadas ${asignacionesEjemplo.length} asignaciones de etiquetas`);

    // Crear versiones iniciales
    const [consultasCreadas] = await connection.execute('SELECT id, titulo, descripcion, sql_codigo FROM consultas');
    
    for (const consulta of consultasCreadas) {
      await connection.execute(
        'INSERT INTO versiones_consulta (consulta_id, version_numero, titulo, descripcion, sql_codigo, comentarios) VALUES (?, ?, ?, ?, ?, ?)',
        [consulta.id, 1, consulta.titulo, consulta.descripcion, consulta.sql_codigo, 'Versión inicial de la consulta']
      );
    }
    console.log(`✅ Creadas ${consultasCreadas.length} versiones iniciales`);

    console.log('\n🎉 ¡RECREACIÓN FORZADA COMPLETADA EXITOSAMENTE!');
    console.log('Todas las tablas fueron eliminadas y recreadas con el esquema correcto');
    console.log('La aplicación QueryVault está lista para usarse');
    
    await connection.end();
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA RECREACIÓN:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    
    if (connection) {
      await connection.end();
    }
    
    process.exit(1);
  }
}

// Ejecutar recreación forzada
console.log('🚀 Iniciando recreación forzada de base de datos...');
forceRecreateDatabase()
  .then(() => {
    console.log('\n✅ Recreación completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error inesperado:', error);
    process.exit(1);
  });