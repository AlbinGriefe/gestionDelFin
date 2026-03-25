import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createPersonController,
  getPersonByIdController,
  getPersonsCatalogsController,
  listPersonsController,
  updatePersonController,
} from "./persons.controller.js";
import { createPersonSchema, updatePersonSchema } from "./persons.schemas.js";

const personsRouter = Router();

personsRouter.use(authenticate);
personsRouter.get("/catalogs", getPersonsCatalogsController);
personsRouter.get("/", listPersonsController);
personsRouter.get("/:personId", getPersonByIdController);
personsRouter.post("/", validateBody(createPersonSchema), createPersonController);
personsRouter.patch(
  "/:personId",
  validateBody(updatePersonSchema),
  updatePersonController,
);

export { personsRouter };
