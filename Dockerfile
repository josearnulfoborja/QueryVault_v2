# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY workflowy-sql-app/package*.json ./workflowy-sql-app/

# Install root dependencies
RUN npm ci --omit=dev

# Install app dependencies
WORKDIR /app/workflowy-sql-app
RUN npm ci --omit=dev

# Copy app source
WORKDIR /app
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "workflowy-sql-app/backend/server.js"]