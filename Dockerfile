I'll generate a production-ready Dockerfile for the Laundry Enterprise application. Let me create a comprehensive multi-stage Docker configuration.

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application source
COPY . .

# Build application (if needed)
RUN npm run build --if-present

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    tini \
    sqlite \
    ca-certificates

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy node_modules and built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app . .

# Create directories for data persistence
RUN mkdir -p /app/data /app/logs && \
    chown -R nodejs:nodejs /app/data /app/logs

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Expose port
EXPOSE ${PORT:-3000}

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "index.js"]
```

This Dockerfile provides:

**Multi-stage build**: Separates build dependencies from runtime, reducing final image size
**Security**: Non-root user (nodejs), minimal base image (alpine)
**Health checks**: Automated container health monitoring
**Signals handling**: Tini init system for proper process management
**Data persistence**: Volumes for SQLite database and logs
**Production ready**: Optimized for Express.js applications

Use with docker-compose or Kubernetes for full deployment.