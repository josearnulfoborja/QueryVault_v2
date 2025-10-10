const db = require('./sqlite-db');

console.log('Inicializando base de datos SQLite...');
db.init();
console.log('Base de datos SQLite inicializada en backend/data/queryvault.sqlite3');
