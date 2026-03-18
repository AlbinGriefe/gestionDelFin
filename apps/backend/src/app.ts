import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";

import { errorHandler } from "./api/v1/middlewares/error-handler.js";
import { notFoundHandler } from "./api/v1/middlewares/not-found.js";
import { apiV1Router } from "./api/v1/routes/index.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";

function resolveCorsOrigin() {
  if (env.CORS_ORIGIN === "*") {
    return true;
  }

  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return allowedOrigins;
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin: resolveCorsOrigin(),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    res.setHeader("X-Server-Time", new Date().toISOString());

    next();
  });

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: "gestionDelFin backend",
        apiPrefix: env.API_PREFIX,
        status: "ok",
      },
    });
  });

  app.use(env.API_PREFIX, apiV1Router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info("Express application configured.", {
    apiPrefix: env.API_PREFIX,
    nodeEnv: env.NODE_ENV,
  });

  return app;
}

export const app = createApp();
