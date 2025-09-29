-- Script de inicialización para base de datos en producción
-- QueryVault Database Setup

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS queryvault_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE queryvault_db;

-- Tabla consultas
CREATE TABLE IF NOT EXISTS consultas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  sql_codigo TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  favorito BOOLEAN DEFAULT FALSE,
  padre_id INT DEFAULT NULL,
  autor VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (padre_id) REFERENCES consultas(id) ON DELETE CASCADE,
  INDEX idx_titulo (titulo),
  INDEX idx_favorito (favorito),
  INDEX idx_fecha_creacion (fecha_creacion),
  INDEX idx_padre_id (padre_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla etiquetas
CREATE TABLE IF NOT EXISTS etiquetas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#007bff',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación consulta-etiqueta (muchos a muchos)
CREATE TABLE IF NOT EXISTS consulta_etiqueta (
  consulta_id INT,
  etiqueta_id INT,
  PRIMARY KEY (consulta_id, etiqueta_id),
  FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
  FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos de ejemplo
INSERT IGNORE INTO consultas (titulo, descripcion, sql_codigo, autor, favorito) VALUES
('Usuarios Activos', 'Consulta para obtener todos los usuarios activos del sistema', 
'SELECT u.id, u.nombre, u.email, u.fecha_registro\nFROM usuarios u\nWHERE u.activo = 1\nORDER BY u.fecha_registro DESC;', 
'Sistema', true),

('Ventas del Mes', 'Reporte de ventas del mes actual con totales', 
'SELECT \n    DATE(v.fecha) as dia,\n    COUNT(*) as total_ventas,\n    SUM(v.monto) as monto_total\nFROM ventas v\nWHERE MONTH(v.fecha) = MONTH(CURRENT_DATE)\nAND YEAR(v.fecha) = YEAR(CURRENT_DATE)\nGROUP BY DATE(v.fecha)\nORDER BY dia;', 
'Sistema', true),

('Productos Más Vendidos', 'Top 10 de productos más vendidos', 
'SELECT \n    p.nombre,\n    p.codigo,\n    COUNT(vd.producto_id) as veces_vendido,\n    SUM(vd.cantidad) as cantidad_total\nFROM productos p\nJOIN venta_detalle vd ON p.id = vd.producto_id\nJOIN ventas v ON vd.venta_id = v.id\nWHERE v.fecha >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)\nGROUP BY p.id, p.nombre, p.codigo\nORDER BY veces_vendido DESC\nLIMIT 10;', 
'Sistema', false);

-- Insertar etiquetas de ejemplo
INSERT IGNORE INTO etiquetas (nombre, color) VALUES
('usuarios', '#007bff'),
('ventas', '#28a745'),
('productos', '#ffc107'),
('reportes', '#6f42c1'),
('activos', '#17a2b8');

-- Relacionar consultas con etiquetas
INSERT IGNORE INTO consulta_etiqueta (consulta_id, etiqueta_id) VALUES
(1, 1), (1, 5), -- Usuarios Activos: usuarios, activos
(2, 2), (2, 4), -- Ventas del Mes: ventas, reportes
(3, 3), (3, 4); -- Productos Más Vendidos: productos, reportes