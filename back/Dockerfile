# syntax=docker/dockerfile:1.6

# ================================
# Stage 1: Build the Vite app
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Vite reads VITE_* env vars at build time and bakes them into the bundle.
# Override at build with: --build-arg VITE_API_BASE_URL=http://your-backend:18080
ARG VITE_API_BASE_URL=http://localhost:18080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install deps using the lockfile for reproducibility
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ================================
# Stage 2: Serve with Nginx
# ================================
FROM nginx:1.27-alpine AS runtime

# Custom nginx config (listens on 13001, SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 13001

CMD ["nginx", "-g", "daemon off;"]
