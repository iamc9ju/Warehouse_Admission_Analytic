# ==============================================================================
# Stage 1: deps — Install exact dependencies from package-lock.json
# ==============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ==============================================================================
# Stage 2: builder — Build production standalone bundle (no secrets at build time)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build App Router (RSC + SSR + Client) and emit standalone output with runtime DB drivers
RUN npm run build && node -e 'import("node:fs").then(async (fs) => { \
  const { emitStandaloneOutput } = await import("./node_modules/vinext/dist/build/standalone.js"); \
  fs.writeFileSync("dist/server/vinext-externals.json", JSON.stringify(["pg", "@neondatabase/serverless"])); \
  emitStandaloneOutput({ root: process.cwd(), outDir: "dist" }); \
})'

# ==============================================================================
# Stage 3: runner — Minimal production runtime image
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0

# Copy standalone server, minimal runtime node_modules, dist/{client,server}, and public assets
COPY --from=builder --chown=node:node /app/dist/standalone ./

# Copy additive migration script for explicit migration execution
COPY --from=builder --chown=node:node /app/scripts/migrate-ai-reports.mjs ./scripts/migrate-ai-reports.mjs
COPY --from=builder --chown=node:node /app/docs/sql/ai-analysis-reports.sql ./docs/sql/ai-analysis-reports.sql

USER node

EXPOSE 3000

CMD ["node", "server.js"]
