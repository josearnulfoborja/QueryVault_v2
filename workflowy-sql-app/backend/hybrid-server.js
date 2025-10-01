// Servidor híbrido - usa la lógica real pero con almacenamiento en memoria
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../src')));

// Mock storage que simula la base de datos
let mockDatabase = {
  consultas: [],
  etiquetas: [],
  consulta_etiqueta: [],
  nextConsultaId: 1,
  nextEtiquetaId: 1
};

// Simulación del ConsultaModel.create() con la misma lógica
async function createConsultaMock(consultaData) {
  console.log('🔧 ConsultaModel.create (Mock) - Iniciando transacción simulada');
  
  const { titulo, descripcion, sql_codigo, autor, etiquetas = [], padre_id = null, favorito = false } = consultaData;
  
  console.log('🔧 ConsultaModel.create - Datos extraídos:');
  console.log('   titulo:', titulo);
  console.log('   descripcion:', descripcion);
  console.log('   sql_codigo:', sql_codigo?.substring(0, 50) + '...');
  console.log('   autor:', autor);
  console.log('   favorito:', favorito, `(tipo: ${typeof favorito})`);
  console.log('   padre_id:', padre_id);
  console.log('   etiquetas:', etiquetas, `(tipo: ${typeof etiquetas}, array: ${Array.isArray(etiquetas)}, length: ${etiquetas?.length})`);
  
  // Insertar consulta (simular INSERT)
  console.log('🔧 ConsultaModel.create - Ejecutando INSERT simulado...');
  const consultaId = mockDatabase.nextConsultaId++;
  const newConsulta = {
    id: consultaId,
    titulo,
    descripcion,
    sql_codigo,
    autor,
    padre_id,
    favorito,
    fecha_creacion: new Date(),
    fecha_modificacion: new Date()
  };
  
  mockDatabase.consultas.push(newConsulta);
  console.log('🔧 ConsultaModel.create - INSERT exitoso, ID:', consultaId);
  
  // Procesar etiquetas si existen (simular la lógica exacta del modelo real)
  console.log('🔧 ConsultaModel.create - Procesando etiquetas...');
  if (etiquetas && etiquetas.length > 0) {
    console.log(`🔧 ConsultaModel.create - Procesando ${etiquetas.length} etiquetas:`, etiquetas);
    
    for (let i = 0; i < etiquetas.length; i++) {
      const etiqueta = etiquetas[i];
      console.log(`🔧 ConsultaModel.create - Procesando etiqueta ${i + 1}: "${etiqueta}"`);
      
      // Buscar si la etiqueta ya existe
      let etiquetaExistente = mockDatabase.etiquetas.find(e => e.nombre === etiqueta.trim());
      
      if (!etiquetaExistente) {
        // Insertar nueva etiqueta
        etiquetaExistente = {
          id: mockDatabase.nextEtiquetaId++,
          nombre: etiqueta.trim()
        };
        mockDatabase.etiquetas.push(etiquetaExistente);
        console.log(`🔧 ConsultaModel.create - Etiqueta "${etiqueta}" creada con ID: ${etiquetaExistente.id}`);
      } else {
        console.log(`🔧 ConsultaModel.create - Etiqueta "${etiqueta}" ya existe con ID: ${etiquetaExistente.id}`);
      }
      
      // Crear relación consulta-etiqueta
      const relacion = {
        consulta_id: consultaId,
        etiqueta_id: etiquetaExistente.id
      };
      mockDatabase.consulta_etiqueta.push(relacion);
      console.log(`🔧 ConsultaModel.create - Relación creada: consulta ${consultaId} <-> etiqueta ${etiquetaExistente.id}`);
    }
    console.log('🔧 ConsultaModel.create - Todas las etiquetas procesadas');
  } else {
    console.log('🔧 ConsultaModel.create - No hay etiquetas para procesar');
  }
  
  console.log('🔧 ConsultaModel.create - Transacción simulada completada exitosamente');
  
  // Devolver la consulta con etiquetas (como lo haría el modelo real)
  const consultaConEtiquetas = {
    ...newConsulta,
    etiquetas: etiquetas
  };
  
  return consultaConEtiquetas;
}

// Logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📤 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor híbrido - lógica real con almacenamiento mock',
    consultas: mockDatabase.consultas.length,
    etiquetas: mockDatabase.etiquetas.length,
    relaciones: mockDatabase.consulta_etiqueta.length
  });
});

// Get all consultas CON ETIQUETAS
app.get('/api/consultas', (req, res) => {
  console.log('🔍 Obteniendo todas las consultas con etiquetas');
  
  // Simular JOIN con etiquetas
  const consultasConEtiquetas = mockDatabase.consultas.map(consulta => {
    const etiquetasIds = mockDatabase.consulta_etiqueta
      .filter(rel => rel.consulta_id === consulta.id)
      .map(rel => rel.etiqueta_id);
    
    const etiquetasNombres = etiquetasIds.map(id => {
      const etiqueta = mockDatabase.etiquetas.find(e => e.id === id);
      return etiqueta ? etiqueta.nombre : null;
    }).filter(nombre => nombre !== null);
    
    return {
      ...consulta,
      etiquetas: etiquetasNombres
    };
  });
  
  console.log(`📋 Devolviendo ${consultasConEtiquetas.length} consultas`);
  consultasConEtiquetas.forEach(c => {
    console.log(`   - ${c.titulo} (favorito: ${c.favorito}, etiquetas: [${c.etiquetas.join(', ')}])`);
  });
  
  res.json({ data: consultasConEtiquetas });
});

// Create consulta - USANDO LA LÓGICA REAL DEL MODELO
app.post('/api/consultas', async (req, res) => {
  console.log('🆕 CREANDO NUEVA CONSULTA - LÓGICA REAL');
  console.log('==========================================');
  
  try {
    const consultaCreada = await createConsultaMock(req.body);
    
    console.log('✅ CONSULTA CREADA EXITOSAMENTE:');
    console.log('   ID:', consultaCreada.id);
    console.log('   Título:', consultaCreada.titulo);
    console.log('   Favorito:', consultaCreada.favorito);
    console.log('   Etiquetas:', consultaCreada.etiquetas);
    
    res.status(201).json({
      status: 'success',
      data: consultaCreada
    });
  } catch (error) {
    console.error('❌ Error creando consulta:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    database: mockDatabase,
    stats: {
      consultas: mockDatabase.consultas.length,
      etiquetas: mockDatabase.etiquetas.length,
      relaciones: mockDatabase.consulta_etiqueta.length
    }
  });
});

// Catch all for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

app.listen(PORT, () => {
  console.log('🚀 SERVIDOR HÍBRIDO INICIADO');
  console.log('============================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔍 Debug: http://localhost:${PORT}/api/debug`);
  console.log('');
  console.log('🔧 Este servidor usa la lógica EXACTA del ConsultaModel real');
  console.log('💾 Pero guarda los datos en memoria para pruebas');
  console.log('✅ Simula completamente el flujo de etiquetas y favoritos');
});

module.exports = app;