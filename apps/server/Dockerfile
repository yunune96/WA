# Multi-stage Dockerfile for NestJS (monorepo: npm workspaces)
# - Builds server (apps/server)
# - Keeps node_modules (incl. devDeps) to support tsconfig-paths at runtime

FROM node:20-bullseye-slim AS deps
WORKDIR /app

# Copy lockfile and package manifests first for better layer caching
COPY package*.json ./
COPY apps/server/package*.json apps/server/

# Install workspace deps incl. devDependencies (tsc, rimraf, etc.)
RUN npm ci --include=dev


FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY . .

# Generate Prisma Client first, then build TypeScript
ENV PATH=/app/apps/server/node_modules/.bin:/app/node_modules/.bin:$PATH
RUN npx prisma generate --schema=prisma/schema.prisma \
 && npm run server:build


FROM node:20-bullseye-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Keep node_modules from deps stage so tsconfig-paths/register is available
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/package.json ./package.json

# Ensure Prisma Client runtime files are present (generated in builder stage)
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built server output and package.json (for clarity)
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/server/tsconfig.json ./apps/server/tsconfig.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# App runtime
ENV PORT=3000
EXPOSE 3000
WORKDIR /app/apps/server
CMD ["node", "-r", "tsconfig-paths/register", "dist/main.js"]


