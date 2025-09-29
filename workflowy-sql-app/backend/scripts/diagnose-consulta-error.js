#!/usr/bin/env node

// Script para diagnosticar errores específicos al crear consultas
const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnoseConsultaError() {
  console.log('🔍 DIAGNÓSTICO DE ERROR EN CONSULTAS');
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

    // 1. Verificar estructura de tabla consultas
    console.log('\n1️⃣ Verificando estructura de tabla consultas...');
    const [columns] = await connection.execute('DESCRIBE consultas');
    console.log('Columnas en tabla consultas:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key}`);
    });

    // 2. Verificar si existe la columna sql_codigo
    const sqlCodigoExists = columns.find(col => col.Field === 'sql_codigo');
    const sqlQueryExists = columns.find(col => col.Field === 'sql_query');
    
    console.log(`\n📊 Análisis de columnas:`);
    console.log(`  - sql_codigo existe: ${sqlCodigoExists ? '✅ SÍ' : '❌ NO'}`);
    console.log(`  - sql_query existe: ${sqlQueryExists ? '⚠️ SÍ (INCORRECTO)' : '✅ NO'}`);

    // 3. Probar inserción de datos
    console.log('\n2️⃣ Probando inserción de consulta de prueba...');
    
    const testConsulta = {
      titulo: 'CONSULTA DE PRUEBA DIAGNÓSTICO',
      descripcion: 'Esta es una consulta de prueba para diagnóstico',
      sql_codigo: 'SELECT * FROM usuarios WHERE activo = 1;',
      autor: 'Sistema'
    };

    try {
      const [insertResult] = await connection.execute(
        'INSERT INTO consultas (titulo, descripcion, sql_codigo, autor) VALUES (?, ?, ?, ?)',
        [testConsulta.titulo, testConsulta.descripcion, testConsulta.sql_codigo, testConsulta.autor]
      );
      
      console.log('✅ Inserción exitosa con ID:', insertResult.insertId);
      
      // Limpiar consulta de prueba
      await connection.execute('DELETE FROM consultas WHERE id = ?', [insertResult.insertId]);
      console.log('🧹 Consulta de prueba eliminada');
      
    } catch (insertError) {
      console.error('❌ Error al insertar consulta de prueba:');
      console.error('   Mensaje:', insertError.message);
      console.error('   Código:', insertError.code);
      console.error('   SQL State:', insertError.sqlState);
    }

    // 4. Verificar otras tablas relacionadas
    console.log('\n3️⃣ Verificando tablas relacionadas...');
    
    const tablas = ['etiquetas', 'consulta_etiqueta', 'versiones_consulta'];
    
    for (const tabla of tablas) {
      try {
        const [exists] = await connection.execute(`SHOW TABLES LIKE '${tabla}'`);
        if (exists.length > 0) {
          const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tabla}`);
          console.log(`  ✅ ${tabla}: ${count[0].count} registros`);
        } else {
          console.log(`  ❌ ${tabla}: NO EXISTE`);
        }
      } catch (error) {
        console.log(`  ⚠️ ${tabla}: ERROR - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  diagnoseConsultaError()
    .then(() => {
      console.log('\n✅ Diagnóstico completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en diagnóstico:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseConsultaError };