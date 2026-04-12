import { Router } from "express";
import { authenticate } from "../../api/v1/middlewares/auth.js";
import {
  getDailyProcessStatusController,
  runDailyProcessController,
} from "./daily-processes.controller.js";

export const dailyProcessesRouter = Router();

dailyProcessesRouter.use(authenticate);

// POST /api/v1/daily-processes/run
// Roles: Gestión recursos, Administrador sistema
dailyProcessesRouter.post("/run", runDailyProcessController);

// GET /api/v1/daily-processes/status/:campId
// Cualquier usuario autenticado puede consultar su campamento
dailyProcessesRouter.get("/status/:campId", getDailyProcessStatusController);