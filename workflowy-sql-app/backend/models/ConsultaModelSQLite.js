const { pool } = require('../config/database-sqlite');

class ConsultaModelSQLite {
  static async getAll(search = '') {
    const connection = await pool.getConnection();
    
    try {
      let query = `
        SELECT c.* 
        FROM consultas c
      `;
      
      let params = [];
      
      if (search) {
        query += ` WHERE c.titulo LIKE ? OR c.descripcion LIKE ? OR c.sql_codigo LIKE ?`;
        const searchTerm = `%${search}%`;
        params = [searchTerm, searchTerm, searchTerm];
      }
      
      query += ` ORDER BY c.fecha_modificacion DESC`;
      
      const [rows] = await connection.execute(query, params);
      
      // Obtener etiquetas para cada consulta por separado
      const consultas = [];
      for (const row of rows) {
        const [etiquetaRows] = await connection.execute(`
          SELECT e.nombre 
          FROM etiquetas e 
          JOIN consulta_etiqueta ce ON e.id = ce.etiqueta_id 
          WHERE ce.consulta_id = ?
        `, [row.id]);
        
        const consulta = {
          ...row,
          favorito: Boolean(row.favorito),
          etiquetas: Array.isArray(etiquetaRows) ? etiquetaRows.map(e => e.nombre) : []
        };
        
        consultas.push(consulta);
      }
      
      return consultas;
    } finally {
      connection.release();
    }
  }

  static async getById(id) {
    const connection = await pool.getConnection();
    
    try {
      const [consultaRows] = await connection.execute(
        'SELECT * FROM consultas WHERE id = ?',
        [id]
      );
      
      if (consultaRows.length === 0) {
        return null;
      }
      
      const consulta = consultaRows[0];
      
      // Obtener etiquetas
      const [etiquetaRows] = await connection.execute(`
        SELECT e.nombre 
        FROM etiquetas e 
        JOIN consulta_etiqueta ce ON e.id = ce.etiqueta_id 
        WHERE ce.consulta_id = ?
      `, [id]);
      
      consulta.etiquetas = etiquetaRows.map(row => row.nombre);
      consulta.favorito = Boolean(consulta.favorito);
      
      return consulta;
    } finally {
      connection.release();
    }
  }

  static async create(consultaData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { titulo, descripcion, sql_codigo, autor, etiquetas = [], padre_id = null, favorito = false } = consultaData;
      
      console.log('🔧 ConsultaModelSQLite.create - Datos extraídos:');
      console.log('   titulo:', titulo);
      console.log('   descripcion:', descripcion);
      console.log('   sql_codigo:', sql_codigo?.substring(0, 50) + '...');
      console.log('   autor:', autor);
      console.log('   favorito:', favorito, `(tipo: ${typeof favorito})`);
      console.log('   padre_id:', padre_id);
      console.log('   etiquetas:', etiquetas, `(tipo: ${typeof etiquetas}, array: ${Array.isArray(etiquetas)}, length: ${etiquetas?.length})`);
      
      // Insertar consulta
      console.log('🔧 ConsultaModelSQLite.create - Ejecutando INSERT...');
      const [result] = await connection.execute(
        'INSERT INTO consultas (titulo, descripcion, sql_codigo, autor, padre_id, favorito) VALUES (?, ?, ?, ?, ?, ?)',
        [titulo, descripcion, sql_codigo, autor, padre_id, favorito ? 1 : 0]
      );
      
      const consultaId = result.insertId;
      console.log('🔧 ConsultaModelSQLite.create - INSERT exitoso, ID:', consultaId);
      
      // Guardar primera versión
      console.log('🔧 ConsultaModelSQLite.create - Guardando versión...');
      await connection.execute(
        'INSERT INTO versiones_consulta (consulta_id, sql_codigo) VALUES (?, ?)',
        [consultaId, sql_codigo]
      );
      console.log('🔧 ConsultaModelSQLite.create - Versión guardada');
      
      // Procesar etiquetas si existen
      console.log('🔧 ConsultaModelSQLite.create - Procesando etiquetas...');
      if (etiquetas && etiquetas.length > 0) {
        console.log(`🔧 ConsultaModelSQLite.create - Procesando ${etiquetas.length} etiquetas:`, etiquetas);
        
        for (let i = 0; i < etiquetas.length; i++) {
          const etiqueta = etiquetas[i];
          console.log(`🔧 ConsultaModelSQLite.create - Procesando etiqueta ${i + 1}: "${etiqueta}"`);
          
          // Insertar etiqueta si no existe
          await connection.execute(
            'INSERT OR IGNORE INTO etiquetas (nombre) VALUES (?)',
            [etiqueta.trim()]
          );
          console.log(`🔧 ConsultaModelSQLite.create - Etiqueta "${etiqueta}" insertada/verificada`);
          
          // Obtener ID de la etiqueta
          const [etiquetaRows] = await connection.execute(
            'SELECT id FROM etiquetas WHERE nombre = ?',
            [etiqueta.trim()]
          );
          
          console.log(`🔧 ConsultaModelSQLite.create - ID de etiqueta "${etiqueta}":`, etiquetaRows);
          
          if (etiquetaRows.length > 0) {
            // Relacionar consulta con etiqueta
            await connection.execute(
              'INSERT INTO consulta_etiqueta (consulta_id, etiqueta_id) VALUES (?, ?)',
              [consultaId, etiquetaRows[0].id]
            );
            console.log(`🔧 ConsultaModelSQLite.create - Relación creada: consulta ${consultaId} <-> etiqueta ${etiquetaRows[0].id}`);
          } else {
            console.log(`🔧 ConsultaModelSQLite.create - ⚠️ No se encontró ID para etiqueta "${etiqueta}"`);
          }
        }
        console.log('🔧 ConsultaModelSQLite.create - Todas las etiquetas procesadas');
      } else {
        console.log('🔧 ConsultaModelSQLite.create - No hay etiquetas para procesar');
      }
      
      await connection.commit();
      
      // Devolver la consulta creada usando la misma conexión
      // En lugar de crear una nueva conexión con getById
      const [consultaRows] = await connection.execute(
        'SELECT * FROM consultas WHERE id = ?',
        [consultaId]
      );
      
      if (consultaRows.length > 0) {
        const consulta = consultaRows[0];
        
        // Obtener etiquetas usando la misma conexión
        const [etiquetaRows] = await connection.execute(`
          SELECT e.nombre 
          FROM etiquetas e 
          JOIN consulta_etiqueta ce ON e.id = ce.etiqueta_id 
          WHERE ce.consulta_id = ?
        `, [consultaId]);
        
        console.log('🔧 etiquetaRows recibidas:', etiquetaRows, 'Tipo:', typeof etiquetaRows, 'Array:', Array.isArray(etiquetaRows));
        
        if (Array.isArray(etiquetaRows)) {
          consulta.etiquetas = etiquetaRows.map(row => row.nombre);
        } else {
          console.log('⚠️ etiquetaRows no es array, asignando array vacío');
          consulta.etiquetas = [];
        }
        consulta.favorito = Boolean(consulta.favorito);
        
        return consulta;
      }
      
      return null;
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error en ConsultaModelSQLite.create:', error);
      throw new Error(`Error al crear consulta: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  static async update(id, consultaData) {
    // Implementación similar al modelo original pero adaptada para SQLite
    // Por ahora solo implementamos create para las pruebas
    throw new Error('Update no implementado aún');
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.execute('DELETE FROM consultas WHERE id = ?', [id]);
      return true;
    } finally {
      connection.release();
    }
  }
}

module.exports = ConsultaModelSQLite;