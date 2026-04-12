import { Router } from "express";

import prisma from "../../../lib/prisma.js";
import { authRouter } from "../../../modules/auth/auth.routes.js";
import { campsRouter } from "../../../modules/camps/camps.routes.js";
import { eventsRouter } from "../../../modules/events/events.routes.js";
import { professionsRouter } from "../../../modules/professions/professions.routes.js";
import { authService } from "../../../modules/auth/auth.service.js";
import { expeditionsRouter } from "../../../modules/expeditions/expeditions.routes.js";
import { personsRouter } from "../../../modules/persons/persons.routes.js";
import { inventoryRouter } from "../../../modules/inventory/inventory.routes.js";
import { sessionsRouter } from "../../../modules/sessions/sessions.routes.js";
import { settingsRouter } from "../../../modules/settings/settings.routes.js";
import { transfersRouter } from "../../../modules/transfers/transfers.routes.js";
import { usersRouter } from "../../../modules/users/users.routes.js";
import { createSuccessResponse } from "../../../shared/responses/api-response.js";
import { dailyProcessesRouter } from "../../../modules/daily-processes/daily-processes.routes.js";

const apiV1Router = Router();

apiV1Router.get("/health", async (request, response, next) => {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    const sessionConfig = await authService.getSessionConfig();

    response.status(200).json(
      createSuccessResponse(
        {
          status: "ok",
          apiVersion: "v1",
          database: "connected",
          serverTime: sessionConfig.serverTime,
          sessionTimeoutMinutes: sessionConfig.sessionTimeoutMinutes,
        },
        request.requestId,
      ),
    );
  } catch (error) {
    next(error);
  }
});

apiV1Router.use("/auth", authRouter);
apiV1Router.use("/camps", campsRouter);
apiV1Router.use("/events", eventsRouter);
apiV1Router.use("/professions", professionsRouter);
apiV1Router.use("/expeditions", expeditionsRouter);
apiV1Router.use("/inventory", inventoryRouter);
apiV1Router.use("/persons", personsRouter);
apiV1Router.use("/sessions", sessionsRouter);
apiV1Router.use("/settings", settingsRouter);
apiV1Router.use("/transfers", transfersRouter);
apiV1Router.use("/users", usersRouter);
apiV1Router.use("/daily-processes", dailyProcessesRouter);
export { apiV1Router };
