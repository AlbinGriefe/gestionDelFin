import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import {
  getEventByIdController,
  listEventsController,
} from "./events.controller.js";

const eventsRouter = Router();

eventsRouter.use(authenticate);
eventsRouter.get("/", listEventsController);
eventsRouter.get("/:eventId", getEventByIdController);

export { eventsRouter };
