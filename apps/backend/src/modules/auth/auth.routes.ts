import { Router } from "express";

import {
  loginController,
  logoutController,
  meController,
  sessionConfigController,
  switchCampController,
} from "./auth.controller.js";
import { loginSchema, switchCampSchema } from "./auth.schemas.js";
import { authenticate } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";

const authRouter = Router();

authRouter.get("/session-config", sessionConfigController);
authRouter.post("/login", validateBody(loginSchema), loginController);
authRouter.get("/me", authenticate, meController);
authRouter.post("/logout", authenticate, logoutController);
authRouter.post(
  "/switch-camp",
  authenticate,
  validateBody(switchCampSchema),
  switchCampController,
);

export { authRouter };
