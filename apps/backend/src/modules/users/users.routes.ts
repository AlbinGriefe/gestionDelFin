import { Router } from "express";

import { authenticate, requireRoles } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createUserController,
  getUserByIdController,
  getUsersCatalogsController,
  listUsersController,
  updateUserController,
} from "./users.controller.js";
import { createUserSchema, updateUserSchema } from "./users.schemas.js";

const usersRouter = Router();

usersRouter.use(authenticate, requireRoles("Administrador sistema"));
usersRouter.get("/catalogs", getUsersCatalogsController);
usersRouter.get("/", listUsersController);
usersRouter.get("/:userId", getUserByIdController);
usersRouter.post("/", validateBody(createUserSchema), createUserController);
usersRouter.patch(
  "/:userId",
  validateBody(updateUserSchema),
  updateUserController,
);

export { usersRouter };
