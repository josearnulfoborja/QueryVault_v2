#!/usr/bin/env node

// Test directo de conexión MySQL para debug
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testMySQLConnection() {
    console.log('🧪 TEST DIRECTO DE CONEXIÓN MYSQL');
    console.log('=================================');
    
    // Probar con MYSQL_URL si existe
    if (process.env.MYSQL_URL) {
        console.log('\n1️⃣ PROBANDO CON MYSQL_URL...');
        console.log('URL presente:', !!process.env.MYSQL_URL);
        console.log('URL length:', process.env.MYSQL_URL.length);
        
        try {
            // Parsear URL
            const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
            const match = process.env.MYSQL_URL.match(regex);
            
            if (!match) {
                console.log('❌ URL format inválido');
                return;
            }
            
            const config = {
                host: match[3],
                user: match[1],
                password: match[2],
                database: match[5],
                port: parseInt(match[4]),
                connectTimeout: 30000,
                acquireTimeout: 30000
            };
            
            console.log('📊 Configuración extraída:');
            console.log('Host:', config.host);
            console.log('User:', config.user);
            console.log('Password length:', config.password.length);
            console.log('Database:', config.database);
            console.log('Port:', config.port);
            
            console.log('\n🔄 Intentando conexión...');
            const connection = await mysql.createConnection(config);
            
            console.log('✅ CONEXIÓN EXITOSA con MYSQL_URL!');
            
            // Probar consulta
            const [rows] = await connection.execute('SELECT DATABASE() as db, USER() as user, VERSION() as version');
            console.log('✅ Query exitosa:');
            console.log('Database:', rows[0].db);
            console.log('User:', rows[0].user);
            console.log('Version:', rows[0].version);
            
            await connection.end();
            return true;
            
        } catch (error) {
            console.error('❌ ERROR con MYSQL_URL:');
            console.error('Code:', error.code);
            console.error('Message:', error.message);
            console.error('SQL State:', error.sqlState);
            
            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error('\n💡 El error indica credenciales incorrectas');
                console.error('Verifica que la MYSQL_URL sea exactamente la del Railway MySQL Service');
            }
        }
    }
    
    // Probar con variables individuales
    console.log('\n2️⃣ PROBANDO CON VARIABLES INDIVIDUALES...');
    
    const config2 = {
        host: process.env.MYSQLHOST || 'localhost',
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '',
        database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'railway',
        port: parseInt(process.env.MYSQLPORT || '3306'),
        connectTimeout: 30000,
        acquireTimeout: 30000
    };
    
    console.log('📊 Configuración individual:');
    console.log('Host:', config2.host);
    console.log('User:', config2.user);
    console.log('Password length:', config2.password.length);
    console.log('Database:', config2.database);
    console.log('Port:', config2.port);
    
    try {
        console.log('\n🔄 Intentando conexión con variables individuales...');
        const connection2 = await mysql.createConnection(config2);
        
        console.log('✅ CONEXIÓN EXITOSA con variables individuales!');
        
        const [rows] = await connection2.execute('SELECT DATABASE() as db, USER() as user');
        console.log('✅ Query exitosa:');
        console.log('Database:', rows[0].db);
        console.log('User:', rows[0].user);
        
        await connection2.end();
        return true;
        
    } catch (error) {
        console.error('❌ ERROR con variables individuales:');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('SQL State:', error.sqlState);
    }
    
    console.log('\n💡 NINGUNA CONFIGURACIÓN FUNCIONÓ');
    console.log('Revisa las credenciales en Railway Dashboard');
    return false;
}

// Ejecutar test
testMySQLConnection()
    .then(success => {
        if (success) {
            console.log('\n🎉 TEST COMPLETADO - CONEXIÓN OK');
            process.exit(0);
        } else {
            console.log('\n❌ TEST COMPLETADO - CONEXIÓN FALLÓ');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 ERROR INESPERADO:', error);
        process.exit(1);
    });