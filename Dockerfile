FROM node:24-alpine AS builder

WORKDIR /usr/src/app

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

RUN pnpm install --frozen-lockfile

COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

RUN pnpm run build
RUN pnpm install --prod --frozen-lockfile

FROM node:24-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

USER node

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
