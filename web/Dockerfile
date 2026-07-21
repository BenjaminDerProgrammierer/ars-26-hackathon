FROM node:lts-alpine AS base
WORKDIR /workspace/web

FROM base AS production-dependencies
COPY web/package.json web/package-lock.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ .
COPY opendata-linz/ ../opendata-linz/
RUN npm run build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=80

COPY --chown=node:node --from=production-dependencies /workspace/web/node_modules ./node_modules
COPY --chown=node:node --from=build /workspace/web/dist ./dist
COPY --chown=node:node web/package.json ./

EXPOSE 80
USER node
CMD ["node", "./dist/server/entry.mjs"]
