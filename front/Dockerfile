# syntax=docker/dockerfile:1.6

# ================================
# Stage 1: Build the Vite app
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Vite bakes VITE_* env vars into the bundle at build time.
# Override at build with: --build-arg VITE_API_BASE_URL=https://your-api.example.com
ARG VITE_API_BASE_URL=https://pokeapi.api.apps.orquesta.consulting
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ================================
# Stage 2: Serve with `serve`
# ================================
FROM node:20-alpine AS runtime

WORKDIR /app

# `serve` is a small static file server. The -s flag enables SPA fallback —
# every unknown path returns index.html so React Router can handle it.
RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 13001

CMD ["serve", "-s", "dist", "-l", "13001", "--no-clipboard"]