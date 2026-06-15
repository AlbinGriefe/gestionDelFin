import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import { getAchievementsController } from "./achievements.controller.js";

export const achievementsRouter = Router();

achievementsRouter.use(authenticate);
achievementsRouter.get("/", getAchievementsController);
