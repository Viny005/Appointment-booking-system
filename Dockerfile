# syntax=docker/dockerfile:1.7

FROM node:24.15.0-bookworm-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate && npm run build

FROM base AS runtime-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --create-home appuser \
 && mkdir -p /data/profile-images \
 && chown -R appuser:nodejs /data/profile-images

COPY --from=runtime-deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=appuser:nodejs /app/.next ./.next
COPY --from=build --chown=appuser:nodejs /app/src ./src
COPY --from=build --chown=appuser:nodejs /app/scripts ./scripts
COPY --from=build --chown=appuser:nodejs /app/prisma ./prisma
COPY --from=build --chown=appuser:nodejs /app/package.json ./package.json
COPY --from=build --chown=appuser:nodejs /app/package-lock.json ./package-lock.json
COPY --from=build --chown=appuser:nodejs /app/next.config.ts ./next.config.ts
COPY --from=build --chown=appuser:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=appuser:nodejs /app/tsconfig.json ./tsconfig.json

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm","run","start","--","-H","0.0.0.0","-p","3000"]
