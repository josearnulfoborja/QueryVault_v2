const axios = require('axios');

const BASE_URL = 'https://queryvault-production.up.railway.app';

async function testFormData() {
  console.log('🧪 PRUEBA DE DATOS DE FORMULARIO');
  console.log('================================');
  
  const formData = {
    titulo: 'Consulta de prueba',
    descripcion: 'Descripción de prueba',
    sql_codigo: 'SELECT * FROM usuarios WHERE activo = 1',
    autor: 'Usuario Prueba',
    etiquetas: ['usuarios', 'filtros', 'activos'],
    favorito: true
  };
  
  console.log('📤 Enviando datos:', formData);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/test-form-data`, formData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.log('❌ Error en la petición:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

async function testCreateConsulta() {
  console.log('\n🧪 PRUEBA DE CREACIÓN DIRECTA');
  console.log('=============================');
  
  const consultaData = {
    titulo: 'Consulta directa',
    descripcion: 'Prueba de creación directa',
    sql_codigo: 'SELECT COUNT(*) FROM productos',
    autor: 'Test User',
    etiquetas: ['productos', 'conteo'],
    favorito: false
  };
  
  console.log('📤 Enviando datos:', consultaData);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/consultas`, consultaData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.log('❌ Error en la petición:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

async function testFullFlow() {
  console.log('\n🧪 PRUEBA DE FLUJO COMPLETO');
  console.log('===========================');
  
  const testData = {
    titulo: 'Flujo completo test',
    descripcion: 'Prueba del flujo completo de consulta',
    sql_codigo: 'SELECT * FROM clientes ORDER BY fecha_registro DESC LIMIT 10',
    autor: 'Tester',
    etiquetas: ['clientes', 'orden', 'recientes'],
    favorito: true
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/test-full-flow`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.log('❌ Error en la petición:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

async function runAllTests() {
  console.log('🚀 INICIANDO PRUEBAS DE DEPURACIÓN');
  console.log('==================================\n');
  
  await testFormData();
  await testCreateConsulta();
  await testFullFlow();
  
  console.log('\n✅ PRUEBAS COMPLETADAS');
}

// Ejecutar las pruebas
runAllTests();