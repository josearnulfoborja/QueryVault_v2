# Railway Build Instructions

Railway should now detect this as a Node.js project automatically.

## What we changed:
1. ✅ Simplified `railway.json` to remove build configuration
2. ✅ Updated `Procfile` to use direct node command
3. ✅ Removed conflicting `nixpacks.toml`
4. ✅ Added `.nvmrc` for Node version
5. ✅ Cleaned up project structure

## Next steps:
1. Railway should now automatically detect this as a Node.js app
2. It will run `npm install` during build
3. It will start with `node backend/server.js`

## If it still fails:
Try changing the start command in Railway dashboard to:
- `node backend/server.js`

Or try these environment variables in Railway:
- `NODE_ENV=production`
- `NPM_CONFIG_PRODUCTION=true`