FROM node:22-slim AS base

ENV PNPM_HOME=/pnpm \
	PATH=/pnpm:$PATH \
	SHOP_SERVICE_PORT=3000

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build

COPY tsconfig.json ./
COPY src ./src

RUN pnpm exec prisma generate && pnpm build && pnpm prune --prod

FROM node:22-slim AS runtime

ENV NODE_ENV=production \
	SHOP_SERVICE_PORT=3000

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/* \
	&& useradd --create-home --uid 10001 nodeapp

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

RUN chown -R nodeapp:nodeapp /app

USER nodeapp

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma && ./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]