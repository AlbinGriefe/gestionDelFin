import { Router } from "express";

import prisma from "../../../lib/prisma.js";
import { authRouter } from "../../../modules/auth/auth.routes.js";
import { authService } from "../../../modules/auth/auth.service.js";
import { personsRouter } from "../../../modules/persons/persons.routes.js";
import { createSuccessResponse } from "../../../shared/responses/api-response.js";

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
apiV1Router.use("/persons", personsRouter);

export { apiV1Router };
