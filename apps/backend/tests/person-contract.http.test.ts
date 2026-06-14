import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { validateBody } from "../src/api/v1/middlewares/validate-body.js";
import {
  createPersonSchema,
  updatePersonSchema,
} from "../src/modules/persons/persons.schemas.js";

function createContractApp() {
  const app = express();
  app.use(express.json());
  app.post("/persons", validateBody(createPersonSchema), (req, res) => {
    res.status(201).json(req.body);
  });
  app.patch(
    "/persons/:personId",
    validateBody(updatePersonSchema),
    (req, res) => {
      res.status(200).json(req.body);
    },
  );
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ZodError) {
        res.status(400).json({ code: "VALIDATION_ERROR" });
        return;
      }
      res.status(500).json({ code: "INTERNAL_SERVER_ERROR" });
    },
  );
  return app;
}

describe("POST /persons contract", () => {
  it("accepts a textual profile and strips removed visual fields", async () => {
    const response = await request(createContractApp()).post("/persons").send({
      id_camp: 1,
      prn_name: "Ana",
      prn_lastname: "Ruiz",
      prn_profile_description:
        "Organiza cuidados, atiende heridas y mantiene la calma bajo presion.",
      prn_photo_url: "https://legacy.invalid/photo.jpg",
      prn_is_accepted: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.prn_profile_description).toContain("atiende heridas");
    expect(response.body).not.toHaveProperty("prn_photo_url");
    expect(response.body).not.toHaveProperty("prn_is_accepted");
  });

  it("rejects a profile description that is too short", async () => {
    const response = await request(createContractApp()).post("/persons").send({
      id_camp: 1,
      prn_name: "Ana",
      prn_lastname: "Ruiz",
      prn_profile_description: "Muy breve",
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("accepts a date-only birth date from the person form", async () => {
    const response = await request(createContractApp()).post("/persons").send({
      prn_name: "Ana",
      prn_lastname: "Ruiz",
      prn_birth_date: "1994-07-18",
    });

    expect(response.status).toBe(201);
    expect(response.body.prn_birth_date).toBe("1994-07-18T00:00:00.000Z");
  });

  it("accepts the legacy ISO birth date when updating a person", async () => {
    const response = await request(createContractApp())
      .patch("/persons/1")
      .send({ prn_birth_date: "1994-07-18T00:00:00.000Z" });

    expect(response.status).toBe(200);
    expect(response.body.prn_birth_date).toBe("1994-07-18T00:00:00.000Z");
  });

  it("rejects an impossible calendar date", async () => {
    const response = await request(createContractApp()).post("/persons").send({
      prn_name: "Ana",
      prn_lastname: "Ruiz",
      prn_birth_date: "2026-02-30",
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
