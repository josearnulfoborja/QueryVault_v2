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
    
    console.log('✅ Tabla consultas creada/verificada');

    console.log('\n🔄 Creando tabla etiquetas...');
    
    // Crear tabla etiquetas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS etiquetas (
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
    
    console.log('✅ Tabla etiquetas creada/verificada');

    console.log('\n🔄 Creando tabla consulta_etiqueta...');
    
    // Crear tabla de relación consulta_etiqueta
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS consulta_etiqueta (
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
    
    console.log('✅ Tabla consulta_etiqueta creada/verificada');

    console.log('\n🔄 Creando tabla versiones_consulta...');
    
    // Crear tabla versiones_consulta
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS versiones_consulta (
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
    
    console.log('✅ Tabla versiones_consulta creada/verificada');

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
      console.log('\n🔄 Insertando etiquetas de ejemplo...');
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
      
      // Asignar etiquetas a consultas de ejemplo
      console.log('\n🔄 Asignando etiquetas a consultas...');
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
      
      // Crear versiones iniciales para las consultas
      console.log('\n🔄 Creando versiones iniciales de consultas...');
      const [consultasCreadas] = await connection.execute('SELECT id, titulo, descripcion, sql_codigo FROM consultas');
      
      for (const consulta of consultasCreadas) {
        await connection.execute(
          'INSERT INTO versiones_consulta (consulta_id, version_numero, titulo, descripcion, sql_codigo, comentarios) VALUES (?, ?, ?, ?, ?, ?)',
          [consulta.id, 1, consulta.titulo, consulta.descripcion, consulta.sql_codigo, 'Versión inicial de la consulta']
        );
      }
      
      console.log(`✅ Creadas ${consultasCreadas.length} versiones iniciales`);
      
    } else {
      console.log(`ℹ️ Ya existen ${existingCount} consultas en la base de datos`);
      
      // Verificar si las otras tablas tienen datos
      const [etiquetasCount] = await connection.execute('SELECT COUNT(*) as count FROM etiquetas');
      const [versionesCount] = await connection.execute('SELECT COUNT(*) as count FROM versiones_consulta');
      
      console.log(`ℹ️ Etiquetas existentes: ${etiquetasCount[0].count}`);
      console.log(`ℹ️ Versiones existentes: ${versionesCount[0].count}`);
    }

    // Verificar la estructura final de todas las tablas
    console.log('\n🔍 Verificando estructura de las tablas...');
    
    const tablas = ['consultas', 'etiquetas', 'consulta_etiqueta', 'versiones_consulta'];
    
    for (const tabla of tablas) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${tabla}`);
        console.log(`\n📊 Tabla ${tabla}:`);
        columns.forEach(col => {
          const nullInfo = col.Null === 'NO' ? 'NOT NULL' : '';
          const keyInfo = col.Key ? `(${col.Key})` : '';
          console.log(`  - ${col.Field}: ${col.Type} ${nullInfo} ${keyInfo}`);
        });
        
        // Contar registros
        const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tabla}`);
        console.log(`  📈 Registros: ${countResult[0].count}`);
      } catch (error) {
        console.error(`❌ Error verificando tabla ${tabla}:`, error.message);
      }
    }

    console.log('\n🎉 ¡INICIALIZACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('La aplicación QueryVault está lista para usarse con todas sus tablas:');
    console.log('  ✅ consultas - Tabla principal de consultas SQL');
    console.log('  ✅ etiquetas - Sistema de etiquetado');
    console.log('  ✅ consulta_etiqueta - Relación consultas-etiquetas');
    console.log('  ✅ versiones_consulta - Control de versiones');
    
    
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