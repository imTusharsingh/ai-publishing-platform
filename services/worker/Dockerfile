FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages ./packages
COPY services/worker ./services/worker
RUN npm ci --workspace=@repo/worker --include-workspace-root

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services/worker ./services/worker
COPY package.json ./
CMD ["npm", "run", "start", "--workspace=@repo/worker"]
