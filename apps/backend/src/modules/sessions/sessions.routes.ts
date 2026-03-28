import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  getCurrentSessionController,
  getSessionByIdController,
  listSessionsController,
  revokeSessionController,
} from "./sessions.controller.js";
import { revokeSessionSchema } from "./sessions.schemas.js";

const sessionsRouter = Router();

sessionsRouter.use(authenticate);
sessionsRouter.get("/", listSessionsController);
sessionsRouter.get("/current", getCurrentSessionController);
sessionsRouter.get("/:sessionId", getSessionByIdController);
sessionsRouter.patch(
  "/:sessionId/revoke",
  validateBody(revokeSessionSchema),
  revokeSessionController,
);

export { sessionsRouter };
