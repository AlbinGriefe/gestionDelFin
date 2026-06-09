import { Router } from "express";
import { authenticate } from "../../api/v1/middlewares/auth.js";
import {
  getNarrativeEventController,
  listNarrativeEventsController,
} from "./narrative-events.controller.js";

export const narrativeEventsRouter = Router();
narrativeEventsRouter.use(authenticate);
narrativeEventsRouter.get("/", listNarrativeEventsController);
narrativeEventsRouter.get("/:eventId", getNarrativeEventController);
