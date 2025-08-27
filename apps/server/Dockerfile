# Multi-stage Dockerfile for NestJS (monorepo: npm workspaces)
# - Builds server (apps/server)
# - Keeps node_modules (incl. devDeps) to support tsconfig-paths at runtime

FROM node:20-bullseye-slim AS deps
WORKDIR /app

# Copy lockfile and package manifests first for better layer caching
COPY package*.json ./
COPY apps/server/package*.json apps/server/

# Install workspace deps (uses root package-lock.json)
RUN npm ci


FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build server and generate Prisma client
RUN npm run server:build \
 && npx prisma generate


FROM node:20-bullseye-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Keep node_modules from deps stage so tsconfig-paths/register is available
COPY --from=deps /app/node_modules ./node_modules

# Ensure Prisma Client runtime files are present (generated in builder stage)
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built server output and package.json (for clarity)
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

# App runtime
ENV PORT=3000
EXPOSE 3000
WORKDIR /app/apps/server
CMD ["node", "-r", "tsconfig-paths/register", "dist/main.js"]


