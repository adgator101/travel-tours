import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const buildConnectionConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const parsedUrl = new URL(databaseUrl);
    const databaseName = parsedUrl.pathname.replace(/^\//, "");

    if (!databaseName) {
      throw new Error("DATABASE_URL must include a database name");
    }

    const sslParam = parsedUrl.searchParams.get("ssl") || parsedUrl.searchParams.get("sslmode");
    const useSsl = sslParam === "true" ? { rejectUnauthorized: false } : undefined;

    return {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port || 3306),
      user: decodeURIComponent(parsedUrl.username || ""),
      password: decodeURIComponent(parsedUrl.password || ""),
      database: decodeURIComponent(databaseName),
      connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT || 5),
      connectTimeout: 20000,
      ssl: useSsl,
    };
  }

  return {
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "password",
    database: process.env.DATABASE_NAME || "travel_tours",
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT || 5),
    connectTimeout: 20000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  };
};

const adapter = new PrismaMariaDb(buildConnectionConfig());

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}