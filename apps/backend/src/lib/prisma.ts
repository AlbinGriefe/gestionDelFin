import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

type MariaDbConnectionConfig = ConstructorParameters<typeof PrismaMariaDb>[0];
type MariaDbPoolConfig = Exclude<MariaDbConnectionConfig, string>;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const sslQueryParams = new Set([
  "ssl",
  "sslaccept",
  "ssl-mode",
  "sslmode",
  "sslcert",
  "sslidentity",
  "sslpassword",
]);

function normalizeDatabaseUrl(urlString: string): MariaDbConnectionConfig {
  try {
    const url = new URL(urlString);

    if (url.protocol !== "mysql:" && url.protocol !== "mariadb:") {
      return urlString;
    }

    const sslAccept = url.searchParams.get("sslaccept")?.toLowerCase();
    const sslMode = (
      url.searchParams.get("ssl-mode") ??
      url.searchParams.get("sslmode") ??
      ""
    ).toLowerCase();
    const ssl = url.searchParams.get("ssl")?.toLowerCase();
    const acceptsInvalidCerts =
      process.env.DATABASE_SSL_ACCEPT_INVALID_CERTS === "true" ||
      sslAccept === "accept_invalid_certs";
    const requiresSsl =
      ssl === "true" ||
      Boolean(sslAccept) ||
      ["required", "require", "verify_ca", "verify_identity"].includes(sslMode);

    const config: MariaDbPoolConfig = {
      host: decodeURIComponent(url.hostname),
      port: url.port ? Number.parseInt(url.port, 10) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    };

    const passthroughConfig = config as Record<string, unknown>;
    url.searchParams.forEach((value, key) => {
      if (!sslQueryParams.has(key.toLowerCase())) {
        passthroughConfig[key] = value;
      }
    });

    if (requiresSsl) {
      config.ssl = acceptsInvalidCerts ? { rejectUnauthorized: false } : true;
    }

    return config;
  } catch {
    return urlString;
  }
}

const adapter = new PrismaMariaDb(normalizeDatabaseUrl(connectionString));

// Reuse a single client during development reloads.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { Prisma };
export type { PrismaClient };
export default prisma;
