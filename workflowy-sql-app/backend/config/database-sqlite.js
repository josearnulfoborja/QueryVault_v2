const Database = require('better-sqlite3');
const path = require('path');

// Crear base de datos SQLite
const dbPath = path.join(__dirname, 'queryvault_local.db');
const db = new Database(dbPath);

console.log('🗄️ Inicializando base de datos SQLite:', dbPath);

// Crear tablas
const createTables = () => {
  console.log('📋 Creando tablas...');

  // Tabla consultas
  db.exec(`
    CREATE TABLE IF NOT EXISTS consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      sql_codigo TEXT NOT NULL,
      autor TEXT,
      padre_id INTEGER,
      favorito BOOLEAN DEFAULT 0,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (padre_id) REFERENCES consultas(id)
    )
  `);

  // Tabla etiquetas
  db.exec(`
    CREATE TABLE IF NOT EXISTS etiquetas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL
    )
  `);

  // Tabla consulta_etiqueta (relación muchos a muchos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS consulta_etiqueta (
      consulta_id INTEGER NOT NULL,
      etiqueta_id INTEGER NOT NULL,
      PRIMARY KEY (consulta_id, etiqueta_id),
      FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
      FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
    )
  `);

  // Tabla versiones_consulta
  db.exec(`
    CREATE TABLE IF NOT EXISTS versiones_consulta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consulta_id INTEGER NOT NULL,
      sql_codigo TEXT NOT NULL,
      fecha_version DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Tablas creadas exitosamente');
};

// Pool simulado para compatibilidad con el código existente
const pool = {
  getConnection: async () => {
    let transactionActive = false;
    
    return {
      execute: async (sql, params = []) => {
        return new Promise((resolve, reject) => {
          try {
            console.log('🔍 SQL:', sql);
            console.log('📋 Params:', params);
            
            if (sql.toLowerCase().trim().startsWith('select')) {
              const stmt = db.prepare(sql);
              const rows = stmt.all(...params);
              console.log('📄 Resultados:', rows.length, 'filas');
              resolve([rows]);
            } else {
              const stmt = db.prepare(sql);
              const result = stmt.run(...params);
              console.log('✅ Ejecutado:', result);
              resolve([{ insertId: result.lastInsertRowid, affectedRows: result.changes }]);
            }
          } catch (error) {
            console.error('❌ Error SQL:', error.message);
            reject(error);
          }
        });
      },
      beginTransaction: async () => {
        return new Promise((resolve, reject) => {
          try {
            if (!transactionActive) {
              console.log('🔄 Iniciando transacción');
              db.exec('BEGIN TRANSACTION');
              transactionActive = true;
            } else {
              console.log('⚠️ Transacción ya activa');
            }
            resolve();
          } catch (error) {
            console.error('❌ Error iniciando transacción:', error);
            reject(error);
          }
        });
      },
      commit: async () => {
        return new Promise((resolve, reject) => {
          try {
            if (transactionActive) {
              console.log('✅ Commit transacción');
              db.exec('COMMIT');
              transactionActive = false;
            } else {
              console.log('⚠️ No hay transacción activa para commit');
            }
            resolve();
          } catch (error) {
            console.error('❌ Error en commit:', error);
            reject(error);
          }
        });
      },
      rollback: async () => {
        return new Promise((resolve, reject) => {
          try {
            if (transactionActive) {
              console.log('🔄 Rollback transacción');
              db.exec('ROLLBACK');
              transactionActive = false;
            } else {
              console.log('⚠️ No hay transacción activa para rollback');
            }
            resolve();
          } catch (error) {
            console.error('❌ Error en rollback:', error);
            // No rechazar aquí, solo resolver para evitar errores en cascada
            resolve();
          }
        });
      },
      release: async () => {
        return new Promise((resolve) => {
          console.log('🔓 Liberando conexión');
          // Si hay transacción activa, hacer rollback silencioso
          if (transactionActive) {
            try {
              console.log('⚠️ Haciendo rollback automático en release');
              db.exec('ROLLBACK');
              transactionActive = false;
            } catch (error) {
              console.log('⚠️ Error en rollback automático (ignorado):', error.message);
            }
          }
          resolve();
        });
      }
    };
  }
};

// Inicializar base de datos
createTables();

module.exports = { pool, db };