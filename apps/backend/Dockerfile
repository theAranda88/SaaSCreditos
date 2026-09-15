FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm ci --ignore-scripts

FROM deps AS build
COPY packages ./packages
COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend
RUN npm run db:generate
WORKDIR /app
RUN npm run build --workspace=@creditos/shared-types
RUN npm run build --workspace=@creditos/backend

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache wget
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]
