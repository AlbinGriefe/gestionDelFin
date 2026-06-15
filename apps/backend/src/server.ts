import { app } from "./app.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info("Backend listening.", {
    apiPrefix: env.API_PREFIX,
    port: env.PORT,
  });
});

server.on("error", (error: Error) => {
  logger.error("Server failed to start.", { error });
  process.exit(1);
});

async function shutdown(signal: string) {
  logger.info("Shutdown signal received.", { signal });

  server.close((error?: Error) => {
    if (error) {
      logger.error("Graceful shutdown failed.", { error, signal });
      process.exit(1);
    }

    logger.info("HTTP server closed.", { signal });
    process.exit(0);
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}
