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

RUN useradd --create-home --uid 10001 nodeapp

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER nodeapp

EXPOSE 3000

CMD ["node", "dist/index.js"]