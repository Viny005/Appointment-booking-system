import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDatabase = globalThis as unknown as { database?: PrismaClient };
export function getDatabase(): PrismaClient {
  if (!globalDatabase.database) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required");
    globalDatabase.database = new PrismaClient({ adapter: new PrismaPg({
      connectionString, max: 5, connectionTimeoutMillis: 3000, query_timeout: 3000,
    }) });
  }
  return globalDatabase.database;
}
