import { Router } from "express";

import { authenticate } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  createTransferController,
  getTransferByIdController,
  getTransferCatalogsController,
  listTransfersController,
  updateTransferStateController,
} from "./transfers.controller.js";
import { createTransferSchema, updateTransferStateSchema } from "./transfers.schemas.js";

const transfersRouter = Router();

transfersRouter.use(authenticate);
transfersRouter.get("/catalogs", getTransferCatalogsController);
transfersRouter.get("/", listTransfersController);
transfersRouter.get("/:transferId", getTransferByIdController);
transfersRouter.post("/", validateBody(createTransferSchema), createTransferController);
transfersRouter.patch(
  "/:transferId/state",
  validateBody(updateTransferStateSchema),
  updateTransferStateController,
);

export { transfersRouter };
