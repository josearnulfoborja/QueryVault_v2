const { pool } = require('../config/database-railway');

class ConsultaModel {
  // Obtener todas las consultas con filtro opcional
  static async getAll(filtro = '') {
    try {
      let query = `
        SELECT 
          c.id,
          c.titulo,
          c.descripcion,
          c.sql_codigo,
          c.fecha_creacion,
          c.favorito,
          c.padre_id,
          c.autor,
          GROUP_CONCAT(e.nombre) as etiquetas
        FROM consultas c
        LEFT JOIN consulta_etiqueta ce ON c.id = ce.consulta_id
        LEFT JOIN etiquetas e ON ce.etiqueta_id = e.id
      `;
      
      const params = [];
      
      if (filtro) {
        query += ` WHERE c.titulo LIKE ? OR c.descripcion LIKE ? OR c.sql_codigo LIKE ? OR c.autor LIKE ? OR e.nombre LIKE ?`;
        const filtroParam = `%${filtro}%`;
        params.push(filtroParam, filtroParam, filtroParam, filtroParam, filtroParam);
      }
      
      query += ` GROUP BY c.id ORDER BY c.fecha_creacion DESC`;
      
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener consultas: ${error.message}`);
    }
  }

  // Obtener consulta por ID
  static async getById(id) {
    try {
      const query = `
        SELECT 
          c.id,
          c.titulo,
          c.descripcion,
          c.sql_codigo,
          c.fecha_creacion,
          c.favorito,
          c.padre_id,
          c.autor,
          GROUP_CONCAT(e.nombre) as etiquetas
        FROM consultas c
        LEFT JOIN consulta_etiqueta ce ON c.id = ce.consulta_id
        LEFT JOIN etiquetas e ON ce.etiqueta_id = e.id
        WHERE c.id = ?
        GROUP BY c.id
      `;
      
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener consulta por ID: ${error.message}`);
    }
  }

  // Crear nueva consulta
  static async create(consultaData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { titulo, descripcion, sql_codigo, autor, etiquetas = [], padre_id = null, favorito = false } = consultaData;
      
      // Insertar consulta
      const [result] = await connection.execute(
        'INSERT INTO consultas (titulo, descripcion, sql_codigo, autor, padre_id, favorito) VALUES (?, ?, ?, ?, ?, ?)',
        [titulo, descripcion, sql_codigo, autor, padre_id, favorito]
      );
      
      const consultaId = result.insertId;
      
      // Guardar primera versión
      await connection.execute(
        'INSERT INTO versiones_consulta (consulta_id, sql_codigo) VALUES (?, ?)',
        [consultaId, sql_codigo]
      );
      
      // Procesar etiquetas si existen
      if (etiquetas.length > 0) {
        for (const etiqueta of etiquetas) {
          // Insertar etiqueta si no existe
          await connection.execute(
            'INSERT IGNORE INTO etiquetas (nombre) VALUES (?)',
            [etiqueta.trim()]
          );
          
          // Obtener ID de la etiqueta
          const [etiquetaRows] = await connection.execute(
            'SELECT id FROM etiquetas WHERE nombre = ?',
            [etiqueta.trim()]
          );
          
          if (etiquetaRows.length > 0) {
            // Relacionar consulta con etiqueta
            await connection.execute(
              'INSERT INTO consulta_etiqueta (consulta_id, etiqueta_id) VALUES (?, ?)',
              [consultaId, etiquetaRows[0].id]
            );
          }
        }
      }
      
      await connection.commit();
      
      // Devolver la consulta creada
      return await this.getById(consultaId);
      
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al crear consulta: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Actualizar consulta
  static async update(id, consultaData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { titulo, descripcion, sql_codigo, autor, etiquetas = [], favorito } = consultaData;
      
      // Actualizar consulta
      await connection.execute(
        'UPDATE consultas SET titulo = ?, descripcion = ?, sql_codigo = ?, autor = ?, favorito = ? WHERE id = ?',
        [titulo, descripcion, sql_codigo, autor, favorito, id]
      );
      
      // Guardar nueva versión si el código SQL cambió
      const [consultaActual] = await connection.execute(
        'SELECT sql_codigo FROM consultas WHERE id = ?',
        [id]
      );
      
      if (consultaActual[0] && consultaActual[0].sql_codigo !== sql_codigo) {
        await connection.execute(
          'INSERT INTO versiones_consulta (consulta_id, sql_codigo) VALUES (?, ?)',
          [id, sql_codigo]
        );
      }
      
      // Limpiar etiquetas existentes
      await connection.execute('DELETE FROM consulta_etiqueta WHERE consulta_id = ?', [id]);
      
      // Procesar nuevas etiquetas
      if (etiquetas.length > 0) {
        for (const etiqueta of etiquetas) {
          await connection.execute(
            'INSERT IGNORE INTO etiquetas (nombre) VALUES (?)',
            [etiqueta.trim()]
          );
          
          const [etiquetaRows] = await connection.execute(
            'SELECT id FROM etiquetas WHERE nombre = ?',
            [etiqueta.trim()]
          );
          
          if (etiquetaRows.length > 0) {
            await connection.execute(
              'INSERT INTO consulta_etiqueta (consulta_id, etiqueta_id) VALUES (?, ?)',
              [id, etiquetaRows[0].id]
            );
          }
        }
      }
      
      await connection.commit();
      
      return await this.getById(id);
      
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al actualizar consulta: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Eliminar consulta
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM consultas WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar consulta: ${error.message}`);
    }
  }

  // Obtener versiones de una consulta
  static async getVersions(consultaId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM versiones_consulta WHERE consulta_id = ? ORDER BY fecha DESC',
        [consultaId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener versiones: ${error.message}`);
    }
  }
}

module.exports = ConsultaModel;