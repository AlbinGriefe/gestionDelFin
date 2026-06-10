import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import { getDashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get("/", getDashboardController);
