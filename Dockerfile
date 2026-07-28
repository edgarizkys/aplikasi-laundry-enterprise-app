I'll generate a production-ready Dockerfile for the Laundry Enterprise application.

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Build TypeScript if needed
RUN npm run build --if-present

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    tini \
    curl \
    sqlite3

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/.env.example ./

# Create directories for data persistence
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app/data /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Set user
USER nodejs

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/app/data/laundry.db

# Start application
CMD ["node", "dist/index.js"]
```

This Dockerfile includes:
- **Multi-stage build** for optimized image size
- **Alpine Linux** for minimal footprint
- **Security best practices** (non-root user, minimal attack surface)
- **Health checks** for container orchestration
- **Proper signal handling** with tini
- **Data persistence** volumes for SQLite database and logs
- **Production-grade** configuration with environment variables