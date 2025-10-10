const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'data', 'queryvault.sqlite3');

function ensureDbDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getDb() {
  ensureDbDir();
  return new sqlite3.Database(DB_PATH);
}

function init() {
  const db = getDb();
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS consultas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      autor TEXT,
      sql_codigo TEXT NOT NULL,
      favorito INTEGER DEFAULT 0,
      etiquetas TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);
  });
  db.close();
}

module.exports = { getDb, init };
