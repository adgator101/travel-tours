FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY backend/package.json backend/pnpm-lock.yaml ./backend/
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts

WORKDIR /app/backend

RUN pnpm install --frozen-lockfile
RUN DATABASE_URL="mysql://root:password@localhost:3306/travel_tours" pnpm prisma:generate

COPY backend/src ./src
COPY frontend /app/frontend

EXPOSE 5000

CMD ["pnpm", "start"]