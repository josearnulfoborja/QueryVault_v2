#!/usr/bin/env node

// Script de diagnóstico para problemas de MySQL en Railway
console.log('🔍 DIAGNÓSTICO COMPLETO MYSQL RAILWAY');
console.log('====================================');

// Mostrar todas las variables relacionadas con MySQL
console.log('\n📊 TODAS LAS VARIABLES DE ENTORNO:');
const mysqlVars = Object.keys(process.env).filter(key => 
    key.includes('MYSQL') || key.includes('DB_') || key.includes('DATABASE')
).sort((a, b) => a.localeCompare(b));

if (mysqlVars.length === 0) {
    console.log('❌ NO SE ENCONTRARON VARIABLES MYSQL');
} else {
    mysqlVars.forEach(key => {
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('pass')) {
            console.log(`${key}: [OCULTA - ${process.env[key] ? process.env[key].length : 0} caracteres]`);
        } else {
            console.log(`${key}: ${process.env[key] || 'VACÍA'}`);
        }
    });
}

console.log('\n🔍 ANÁLISIS DE MYSQL_URL:');
if (process.env.MYSQL_URL) {
    const url = process.env.MYSQL_URL;
    console.log('✅ MYSQL_URL está configurada');
    console.log('Longitud total:', url.length);
    console.log('Comienza con mysql://:', url.startsWith('mysql://'));
    
    // Parsear sin mostrar contraseña completa
    try {
        const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
        const match = url.match(regex);
        
        if (match) {
            console.log('✅ URL parseada correctamente:');
            console.log('  Usuario:', match[1]);
            console.log('  Password length:', match[2].length);
            console.log('  Host:', match[3]);
            console.log('  Puerto:', match[4]);
            console.log('  Base de datos:', match[5]);
        } else {
            console.log('❌ URL no tiene formato válido');
        }
    } catch (error) {
        console.log('❌ Error parseando URL:', error.message);
    }
} else {
    console.log('❌ MYSQL_URL no está configurada');
}

console.log('\n🔍 VARIABLES INDIVIDUALES:');
const checkVars = [
    'MYSQLHOST', 'MYSQLUSER', 'MYSQLPASSWORD', 'MYSQLDATABASE', 'MYSQLPORT',
    'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'
];

checkVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        if (varName.includes('PASSWORD') || varName.includes('PASS')) {
            console.log(`✅ ${varName}: [CONFIGURADA - ${value.length} caracteres]`);
        } else {
            console.log(`✅ ${varName}: ${value}`);
        }
    } else {
        console.log(`❌ ${varName}: NO CONFIGURADA`);
    }
});

console.log('\n💡 RECOMENDACIÓN:');
if (!process.env.MYSQL_URL) {
    console.log('1. Ve a Railway → MySQL Service → Connect');
    console.log('2. Copia la Connection URL completa');
    console.log('3. Agrégala como variable MYSQL_URL en tu aplicación');
    console.log('4. Elimina todas las otras variables MYSQL* y DB_*');
} else {
    console.log('MYSQL_URL está configurada. Si sigue fallando:');
    console.log('1. Verifica que la URL sea exactamente la del MySQL Service');
    console.log('2. Asegúrate de que el MySQL Service esté activo');
    console.log('3. Prueba regenerar las credenciales en Railway');
}