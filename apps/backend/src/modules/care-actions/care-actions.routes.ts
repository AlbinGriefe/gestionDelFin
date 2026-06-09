import { Router } from "express";
import {
  authenticate,
  requireRoles,
} from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import { healPersonController } from "./care-actions.controller.js";
import { healPersonSchema } from "./care-actions.schemas.js";

export const careActionsRouter = Router();

careActionsRouter.use(authenticate);
careActionsRouter.post(
  "/heal",
  requireRoles("Administrador sistema"),
  validateBody(healPersonSchema),
  healPersonController,
);
