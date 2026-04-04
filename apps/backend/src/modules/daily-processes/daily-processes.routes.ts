import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  applyProductionCorrectionController,
  runDailyProcessController,
} from "./daily-processes.controller.js";
import {
  productionCorrectionSchema,
  runDailyProcessSchema,
} from "./daily-processes.schemas.js";

const dailyProcessesRouter = Router();

dailyProcessesRouter.use(authenticate);
dailyProcessesRouter.post(
  "/run",
  validateBody(runDailyProcessSchema),
  runDailyProcessController,
);
dailyProcessesRouter.post(
  "/production-corrections",
  validateBody(productionCorrectionSchema),
  applyProductionCorrectionController,
);

export { dailyProcessesRouter };
