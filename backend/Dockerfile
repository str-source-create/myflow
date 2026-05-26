# ============================================================
# CleanFlow Backend — Dockerfile
# Used by Coolify to build and run the Node.js API server
# ============================================================

# Use Node.js 20 on Alpine Linux (small, fast image)
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Install dependencies first (cached layer — faster rebuilds)
# Copy package files before source code
COPY package*.json ./

# Install only production dependencies (no dev tools)
RUN npm ci --only=production

# Copy the rest of the backend source code
COPY . .

# Expose the port the API runs on
EXPOSE 3000

# Health check — Coolify uses this to verify the app is running
# Checks every 30s, waits 30s before first check, 10s timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "src/server.js"]
