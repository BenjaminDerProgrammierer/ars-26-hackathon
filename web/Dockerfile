FROM node:22.12.0-alpine@sha256:51eff88af6dff26f59316b6e356188ffa2c422bd3c3b76f2556a2e7e89d080bd AS base
WORKDIR /workspace/web

FROM base AS production-dependencies
COPY web/package.json web/package-lock.json ./
RUN npm ci --omit=dev

FROM base AS build
ARG SITE_URL=https://arselectronicahackathon-web.azurewebsites.net
ENV SITE_URL=$SITE_URL
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
