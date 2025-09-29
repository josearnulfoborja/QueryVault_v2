# 🚀 Railway Deployment Guide for QueryVault_v2

## Project Structure
```
QueryVault_v2/
├── package.json          # Root package.json for Railway
├── railway.json          # Railway configuration
├── Procfile             # Process file for deployment
├── .nvmrc               # Node version specification
└── workflowy-sql-app/   # Main application directory
    ├── backend/         # Express server
    ├── src/            # Frontend files
    └── package.json    # App-specific dependencies
```

## Railway Configuration

### 1. Root Directory Detection
Railway will now detect the project from the root directory and:
- Install dependencies from root `package.json`
- Run the app using the start command: `node workflowy-sql-app/backend/server.js`

### 2. Database Setup
1. In Railway dashboard, add a new service: **MySQL Database**
2. Railway will auto-generate these environment variables:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

### 3. Environment Variables to Add
In Railway dashboard → Your App → Variables:
```bash
# Map Railway's MySQL variables to your app
DB_HOST=${{MYSQLHOST}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=${{MYSQLDATABASE}}
DB_PORT=${{MYSQLPORT}}

# Server config
NODE_ENV=production
PORT=${{PORT}}

# CORS (replace with your Railway domain)
CLIENT_URL=https://your-app-name.up.railway.app
```

### 4. Build Process
Railway will:
1. ✅ Detect Node.js project from root `package.json`
2. ✅ Run `npm install` in root (which installs main dependencies)
3. ✅ Dependencies for the app are included in root package.json
4. ✅ Start with `node workflowy-sql-app/backend/server.js`

### 5. Health Check
The app includes a health check endpoint at `/health` that Railway will use to verify deployment.

## Troubleshooting

### If deployment still fails:
1. Check Railway logs for specific errors
2. Verify all environment variables are set correctly
3. Make sure MySQL service is running
4. Check that the start command paths are correct

### Manual Commands in Railway Terminal:
```bash
# Test the app locally in Railway
node workflowy-sql-app/backend/server.js

# Initialize database if needed
cd workflowy-sql-app && npm run init-db
```

---
🎯 This configuration should resolve the "Railpack could not determine how to build the app" error!