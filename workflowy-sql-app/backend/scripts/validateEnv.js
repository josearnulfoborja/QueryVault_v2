#!/usr/bin/env node

// Script para validar variables de entorno antes del despliegue
console.log('🔍 VALIDACIÓN DE VARIABLES DE ENTORNO');
console.log('=====================================');

// Validar PORT
console.log('\n📍 PORT:');
if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (port > 0 && port <= 65535) {
        console.log('✅ PORT válido:', port);
    } else {
        console.error('❌ PORT inválido:', process.env.PORT);
        process.exit(1);
    }
} else {
    console.log('⚠️ PORT no definido, usará 3000 por defecto');
}

// Validar MYSQLPORT  
console.log('\n📍 MYSQLPORT:');
if (process.env.MYSQLPORT) {
    const mysqlPort = parseInt(process.env.MYSQLPORT, 10);
    if (mysqlPort > 0 && mysqlPort <= 65535) {
        console.log('✅ MYSQLPORT válido:', mysqlPort);
    } else {
        console.error('❌ MYSQLPORT inválido:', process.env.MYSQLPORT);
        process.exit(1);
    }
} else {
    console.log('⚠️ MYSQLPORT no definido, usará 3306 por defecto');
}

// Validar otras variables importantes
console.log('\n📍 Variables MySQL:');
console.log('MYSQLHOST:', process.env.MYSQLHOST || 'NO DEFINIDO');
console.log('MYSQLUSER:', process.env.MYSQLUSER || 'NO DEFINIDO');
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'NO DEFINIDO');
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '[CONFIGURADO]' : 'NO DEFINIDO');

console.log('\n✅ Validación completada');