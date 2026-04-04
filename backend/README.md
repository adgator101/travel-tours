# Backend (Express)

## Scripts

- `npm run dev` - start server with nodemon
- `npm start` - start server
- `npm run prisma:generate` - generate Prisma Client
- `npm run prisma:migrate:dev` - run development migrations
- `npm run prisma:studio` - open Prisma Studio

## Environment

Create a `.env` from `.env.example` and set:

- `PORT`
- `DATABASE_URL` (MySQL)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

## Auth Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Health Check

- `GET /api/health`
