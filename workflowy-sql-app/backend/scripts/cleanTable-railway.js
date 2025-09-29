#!/usr/bin/env node

// Script para limpiar campos innecesarios de la tabla consultas
const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanConsultasTable() {
  console.log('🧹 LIMPIANDO CAMPOS INNECESARIOS DE TABLA CONSULTAS');
  console.log('==================================================');
  
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

    // Verificar estructura actual
    console.log('🔍 Verificando estructura actual de tabla consultas...');
    const [columns] = await connection.execute('DESCRIBE consultas');
    console.log('Columnas existentes:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Lista de campos que queremos mantener (según database_setup.sql)
    const camposNecesarios = [
      'id', 
      'titulo', 
      'descripcion', 
      'sql_codigo', 
      'fecha_creacion',
      'favorito',
      'padre_id', 
      'autor'
    ];
    
    // Lista de campos a eliminar
    const camposAEliminar = [];
    columns.forEach(col => {
      if (!camposNecesarios.includes(col.Field)) {
        camposAEliminar.push(col.Field);
      }
    });

    console.log('\n📋 Campos a mantener:', camposNecesarios.join(', '));
    console.log('🗑️ Campos a eliminar:', camposAEliminar.join(', '));

    // Eliminar campos innecesarios
    for (const campo of camposAEliminar) {
      try {
        console.log(`🗑️ Eliminando campo: ${campo}`);
        await connection.execute(`ALTER TABLE consultas DROP COLUMN ${campo}`);
        console.log(`✅ Campo ${campo} eliminado exitosamente`);
      } catch (error) {
        console.log(`⚠️ Error eliminando campo ${campo}: ${error.message}`);
      }
    }

    // Verificar estructura final
    console.log('\n🔍 Verificando estructura final...');
    const [finalColumns] = await connection.execute('DESCRIBE consultas');
    console.log('Estructura final:');
    finalColumns.forEach(col => {
      console.log(`  ✅ ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
    });

    console.log('\n✅ Tabla consultas limpiada correctamente');

  } catch (error) {
    console.error('❌ Error durante limpieza:', error.message);
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
  cleanConsultasTable()
    .then(() => {
      console.log('\n🎉 Limpieza completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en limpieza:', error);
      process.exit(1);
    });
}

module.exports = { cleanConsultasTable };