# ============================================================
# CleanFlow Frontend — Dockerfile
# Two-stage build:
# Stage 1: Build the React app with Node.js
# Stage 2: Serve the built files with Nginx (tiny, fast)
# ============================================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build argument — allows Coolify to inject the API URL at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the React app
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine

# Copy built React files to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config — handles React Router (client-side routing)
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # All routes return index.html for React Router\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # Cache static assets\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    # Security headers\n\
    add_header X-Frame-Options "SAMEORIGIN";\n\
    add_header X-Content-Type-Options "nosniff";\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check for Coolify
# Use 127.0.0.1, not localhost — Alpine resolves localhost to ::1 (IPv6)
# but nginx only listens on 0.0.0.0 (IPv4), causing connection refused
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
