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

## Docker and Azure

This repo is set up to run as a single container that serves both the Express API and the static frontend.

Build locally from the repository root:

```bash
docker build -t travel-tours .
docker run -p 5000:5000 --env-file backend/.env travel-tours
```

For Azure deployment, use the GitHub Actions workflow in `.github/workflows/azure-container-app.yml`.
It expects these secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `AZURE_ACR_NAME`
- `AZURE_CONTAINER_APP_NAME`

The container app should already exist and have ingress enabled. The workflow grants it `AcrPull` on your registry and updates the app to the latest image on every push to `main`.

At runtime, configure the same database and auth settings from `backend/.env.example` in the Azure Container App environment variables.
