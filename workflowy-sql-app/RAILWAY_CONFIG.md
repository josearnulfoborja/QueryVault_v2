# 🚀 CONFIGURACIÓN PARA RAILWAY - QueryVault

## ⚠️ VARIABLE CRÍTICA (CONFIGURAR MANUALMENTE)

En Railway Dashboard → Tu Proyecto → Variables, agrega:

```
NODE_ENV=production
```

**Esta es la ÚNICA variable que necesitas configurar manualmente.**

## ✅ Variables Automáticas (Railway las configura cuando agregues MySQL)

Railway automáticamente configurará estas variables cuando agregues MySQL service:
- MYSQLHOST
- MYSQLUSER  
- MYSQLPASSWORD
- MYSQLDATABASE
- MYSQLPORT

## 🔧 Pasos en Railway:

1. **Agregar MySQL Service:**
   - Dashboard → Add Service → Database → MySQL

2. **Configurar Variables:**
   - Dashboard → Variables → Add Variable
   - Name: `NODE_ENV`
   - Value: `production`

3. **Deploy:**
   - El deploy se hará automáticamente

## ✅ Verificación Post-Deploy:

Visita: `https://tu-app.railway.app/api/health`

Debería responder:
```json
{
  "status": "OK",
  "storage": "MySQL", 
  "database": "Connected"
}
```

## 🎯 Estado de Archivos Configurados:

✅ railway.json - Comando de inicio actualizado  
✅ Procfile - Configurado para servidor híbrido  
✅ database.js - Compatible con variables de Railway  
✅ server-hybrid.js - Sistema híbrido funcionando  
✅ package.json - Scripts de producción listos  

## ⚡ ¡LISTO! 

Solo configura `NODE_ENV=production` en Railway y la app funcionará con MySQL automáticamente.