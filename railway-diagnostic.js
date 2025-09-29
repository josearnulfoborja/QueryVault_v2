// Script de diagnóstico para Railway
require('dotenv').config();

console.log('🔍 DIAGNÓSTICO DE CONFIGURACIÓN RAILWAY\n');

console.log('=== VARIABLES DE ENTORNO ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('\n=== VARIABLES RAILWAY MYSQL ORIGINALES ===');
console.log('MYSQLHOST:', process.env.MYSQLHOST || '❌ NO ENCONTRADA');
console.log('MYSQLUSER:', process.env.MYSQLUSER || '❌ NO ENCONTRADA');
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '✅ CONFIGURADA' : '❌ NO ENCONTRADA');
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE || '❌ NO ENCONTRADA');
console.log('MYSQLPORT:', process.env.MYSQLPORT || '❌ NO ENCONTRADA');

console.log('\n=== VARIABLES MAPEADAS PARA LA APP ===');
console.log('DB_HOST:', process.env.DB_HOST || '❌ NO ENCONTRADA');
console.log('DB_USER:', process.env.DB_USER || '❌ NO ENCONTRADA');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ CONFIGURADA' : '❌ NO ENCONTRADA');
console.log('DB_NAME:', process.env.DB_NAME || '❌ NO ENCONTRADA');
console.log('DB_PORT:', process.env.DB_PORT || '❌ NO ENCONTRADA');

console.log('\n=== DIAGNÓSTICO ===');
const hasRailwayVars = process.env.MYSQLHOST && process.env.MYSQLUSER;
const hasMappedVars = process.env.DB_HOST && process.env.DB_USER;

if (hasRailwayVars && !hasMappedVars) {
    console.log('⚠️ PROBLEMA DETECTADO:');
    console.log('Las variables de Railway existen pero no están mapeadas.');
    console.log('\n💡 SOLUCIÓN:');
    console.log('En Railway Dashboard → Variables, agrega:');
    console.log('DB_HOST=${{MYSQLHOST}}');
    console.log('DB_USER=${{MYSQLUSER}}');
    console.log('DB_PASSWORD=${{MYSQLPASSWORD}}');
    console.log('DB_NAME=${{MYSQLDATABASE}}');
    console.log('DB_PORT=${{MYSQLPORT}}');
} else if (!hasRailwayVars) {
    console.log('❌ ERROR CRÍTICO:');
    console.log('Las variables de MySQL de Railway no existen.');
    console.log('Verifica que agregaste un servicio MySQL en Railway.');
} else if (hasMappedVars) {
    console.log('✅ Variables configuradas correctamente!');
} else {
    console.log('❓ Estado desconocido de configuración.');
}

console.log('\n=== PRUEBA DE CONEXIÓN ===');
if (hasMappedVars) {
    const { testConnection } = require('./workflowy-sql-app/backend/config/database');
    testConnection().then(result => {
        if (result) {
            console.log('✅ Conexión a base de datos: EXITOSA');
        } else {
            console.log('❌ Conexión a base de datos: FALLIDA');
        }
        process.exit(result ? 0 : 1);
    }).catch(error => {
        console.error('💥 Error durante prueba:', error.message);
        process.exit(1);
    });
} else {
    console.log('⏭️ Saltando prueba de conexión (variables no configuradas)');
}