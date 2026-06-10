import { Router } from "express";
import { authenticate, requireRoles } from "../../api/v1/middlewares/auth.js";
import { validateBody } from "../../api/v1/middlewares/validate-body.js";
import {
  confirmProfessionRecommendationController,
  createProfessionRecommendationController,
} from "./profession-recommendations.controller.js";
import {
  confirmProfessionRecommendationSchema,
  createProfessionRecommendationSchema,
} from "./profession-recommendations.schemas.js";

export const professionRecommendationsRouter = Router();

professionRecommendationsRouter.use(authenticate);
professionRecommendationsRouter.use(requireRoles("Administrador sistema"));
professionRecommendationsRouter.post(
  "/",
  validateBody(createProfessionRecommendationSchema),
  createProfessionRecommendationController,
);
professionRecommendationsRouter.patch(
  "/:recommendationId/confirm",
  validateBody(confirmProfessionRecommendationSchema),
  confirmProfessionRecommendationController,
);
