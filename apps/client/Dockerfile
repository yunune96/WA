FROM node:20-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/client/package*.json apps/client/
RUN npm ci

FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time public envs for Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=${NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}

RUN npm run client:build

FROM node:20-bullseye-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/apps/client/.next/standalone ./
COPY --from=builder /app/apps/client/.next/static ./apps/client/.next/static
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node","apps/client/server.js"]


