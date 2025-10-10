const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite = require('./backend/sqlite-db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar sqlite
try {
  sqlite.init();
  console.log('SQLite inicializado correctamente');
} catch (e) {
  console.warn('No se pudo inicializar SQLite, continuando con JSON fallback');
}

const staticPath = path.join(__dirname, 'src');
if (fs.existsSync(staticPath)) app.use(express.static(staticPath));

// Simple API usando SQLite
app.get('/api/health', (req, res) => res.json({ status: 'OK', storage: 'sqlite' }));

app.get('/api/consultas', (req, res) => {
  const db = sqlite.getDb();
  db.all('SELECT * FROM consultas ORDER BY id', (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/consultas', (req, res) => {
  const { titulo, descripcion, autor, sql_codigo, favorito, etiquetas } = req.body;
  const db = sqlite.getDb();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO consultas (titulo, descripcion, autor, sql_codigo, favorito, etiquetas, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
    [titulo, descripcion, autor, sql_codigo, favorito ? 1 : 0, Array.isArray(etiquetas) ? etiquetas.join(',') : (etiquetas || ''), now, now],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, titulo });
    }
  );
});

app.put('/api/consultas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, descripcion, autor, sql_codigo, favorito, etiquetas } = req.body;
  const db = sqlite.getDb();
  const now = new Date().toISOString();
  db.run(
    `UPDATE consultas SET titulo=?, descripcion=?, autor=?, sql_codigo=?, favorito=?, etiquetas=?, updated_at=? WHERE id=?`,
    [titulo, descripcion, autor, sql_codigo, favorito ? 1 : 0, Array.isArray(etiquetas) ? etiquetas.join(',') : (etiquetas || ''), now, id],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
      res.json({ id, titulo });
    }
  );
});

app.delete('/api/consultas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = sqlite.getDb();
  db.run('DELETE FROM consultas WHERE id=?', [id], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.json({ id });
  });
});

// Catch-all
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.status(404).send('Not Found');
});

app.listen(PORT, () => console.log(`IIS-friendly server listening on port ${PORT}`));
