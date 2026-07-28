I'll generate a production-ready Dockerfile for the Laundry Enterprise application. Let me create a multi-stage Docker configuration optimized for both development and production environments.

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript if applicable
RUN if [ -f "tsconfig.json" ]; then npm run build; fi

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    tini \
    curl \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/views ./views

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Expose port
EXPOSE 3000 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Switch to non-root user
USER nodejs

# Start application
CMD ["node", "dist/server.js"]
```

```dockerfile
# Dockerfile.dev - Development with hot reload
FROM node:20-alpine

WORKDIR /app

# Install dependencies for development
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install all dependencies including dev
RUN npm ci

# Copy application source
COPY . .

# Create data directory for SQLite
RUN mkdir -p data && chown -R nodejs:nodejs /app

# Expose ports for app and Vite dev server
EXPOSE 3000 5173

# Switch to non-root user
USER nodejs

ENTRYPOINT ["/sbin/tini", "--"]

# Start with dev server
CMD ["npm", "run", "dev"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  laundry-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: laundry-enterprise-app
    ports:
      - "3000:3000"
      - "5173:5173"
    environment:
      NODE_ENV: production
      PORT: 3000
      VITE_API_URL: http://localhost:3000
      DATABASE_URL: file:./data/laundry.db
      LOG_LEVEL: info
      CORS_ORIGIN: http://localhost:3000
    volumes:
      - laundry-data:/app/data
    restart: unless-stopped
    networks:
      - laundry-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  laundry-app-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: laundry-enterprise-dev
    ports:
      - "3000:3000"
      - "5173:5173"
    environment:
      NODE_ENV: development
      PORT: 3000
      VITE_API_URL: http://localhost:3000
      DATABASE_URL: file:./data/laundry-dev.db
      LOG_LEVEL: debug
    volumes:
      - .:/app
      - /app/node_modules
      - laundry-dev-data:/app/data
    networks:
      - laundry-network
    profiles:
      - dev

volumes:
  laundry-data:
    driver: local
  laundry-dev-data:
    driver: local

networks:
  laundry-network:
    driver: bridge
```

```yaml
# .dockerignore
node_modules
npm-debug.log
dist
build
.git
.gitignore
README.md
.env
.env.local
.DS_Store
coverage
.vscode
.idea
*.log
.next
out
.turbo
.eslintcache
cypress
.yarn/cache
.pnp
```

```dockerfile
# Dockerfile.prod - Optimized production build
FROM node:20-alpine AS dependencies

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS build

WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tini curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/package*.json ./
COPY --from=build --chown=nodejs:nodejs /app/public ./public
COPY --from=build --chown=nodejs:nodejs /app/views ./views

RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

USER nodejs
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
```

```sh
# docker-build.sh
#!/bin/bash

set -e

VERSION=${1:-latest}
IMAGE_NAME="laundry-enterprise"
REGISTRY="${REGISTRY:-localhost:5000}"

echo "🔨 Building Docker image: $IMAGE_NAME:$VERSION"

# Build production image
docker build \
  --file Dockerfile.prod \
  --tag "$IMAGE_NAME:$VERSION" \
  --tag "$IMAGE_NAME:latest" \
  --build-arg NODE_ENV=production \
  .

echo "✅ Build completed: $IMAGE_NAME:$VERSION"

# Tag for registry
docker tag "$IMAGE_NAME:$VERSION" "$REGISTRY/$IMAGE_NAME:$VERSION"
docker tag "$IMAGE_NAME:latest" "$REGISTRY/$IMAGE_NAME:latest"

echo "🏷️  Tagged for registry: $REGISTRY/$IMAGE_NAME:$VERSION"

# Optional: Push to registry
if [ "$PUSH" = "true" ]; then
    docker push "$REGISTRY/$IMAGE_NAME:$VERSION"
    docker push "$REGISTRY/$IMAGE_NAME:latest"
    echo "📤 Pushed to registry: $REGISTRY/$IMAGE_NAME"
fi
```

```sh
# docker-run.sh
#!/bin/bash

set -e

CONTAINER_NAME="laundry-enterprise-app"
IMAGE_NAME="laundry-enterprise:latest"
PORT="${PORT:-3000}"
VITE_PORT="${VITE_PORT:-5173}"

echo "🚀 Starting Laundry Enterprise application..."

docker run \
  --name "$CONTAINER_NAME" \
  --rm \
  -p "$PORT:3000" \
  -p "$VITE_PORT:5173" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e VITE_API_URL="http://localhost:$PORT" \
  -v laundry-data:/app/data \
  -v laundry-logs:/app/logs \
  --health-cmd='curl -f http://localhost:3000/api/health || exit 1' \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --restart unless-stopped \
  "$IMAGE_NAME"

echo "✅ Container started: $CONTAINER_NAME"
echo "🌐 Access application at http://localhost:$PORT"
```

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: laundry-enterprise-app
  labels:
    app: laundry-enterprise
    version: v1
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: laundry-enterprise
  template:
    metadata:
      labels:
        app: laundry-enterprise
        version: v1
    spec:
      serviceAccountName: laundry-enterprise
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: laundry-app
        image: laundry-enterprise:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        - containerPort: 5173
          name: vite
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: VITE_API_URL
          value: "http://laundry-enterprise-app:3000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: laundry-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 2
        volumeMounts:
        - name: laundry-data
          mountPath: /app/data
        - name: laundry-logs
          mountPath: /app/logs
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
      volumes:
      - name: laundry-data
        persistentVolumeClaim:
          claimName: laundry-data-pvc
      - name: laundry-logs
        persistentVolumeClaim:
          claimName: laundry-logs-pvc
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - laundry-enterprise
              topologyKey: kubernetes.io/hostname
```

```yaml
# kubernetes/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: laundry-enterprise-app
  labels:
    app: laundry-enterprise
spec:
  type: LoadBalancer
  selector:
    app: laundry-enterprise
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  - name: vite
    port: 5173
    targetPort: 5173
    protocol: TCP
  sessionAffinity: ClientIP
```

```yaml
# kubernetes/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: laundry-data-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: laundry-logs-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard