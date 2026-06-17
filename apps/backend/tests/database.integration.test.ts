import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import prisma from "../src/lib/prisma.js";

const runIntegration = process.env.RUN_DB_INTEGRATION === "true";
const integration = runIntegration ? describe : describe.skip;

async function login(username: string, password: string) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ identity: username, password });

  expect(response.status).toBe(200);
  return response.body.data.accessToken as string;
}

integration("clean database migration and seed", () => {
  it("contains the complete reproducible demo dataset", async () => {
    const counts = {
      camps: await prisma.camps.count(),
      roles: await prisma.roles.count(),
      users: await prisma.users.count(),
      memberships: await prisma.user_camp_memberships.count(),
      professions: await prisma.professions.count(),
      profiles: await prisma.profile_templates.count(),
      zones: await prisma.exploration_zones.count(),
      rules: await prisma.camp_operational_rules.count(),
    };

    expect(counts).toEqual({
      camps: 2,
      roles: 5,
      users: 6,
      memberships: 7,
      professions: 7,
      profiles: 10,
      zones: 4,
      rules: 2,
    });
  });

  it("authenticates seeded roles and applies strict permissions", async () => {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const resourcePassword = process.env.SEED_GESTION_ALPHA_PASSWORD;
    expect(adminPassword).toBeTruthy();
    expect(resourcePassword).toBeTruthy();

    const adminToken = await login("admin", adminPassword!);
    const resourceToken = await login("gestion_alpha", resourcePassword!);
    const alpha = await prisma.camps.findUniqueOrThrow({
      where: { cmp_name: "Base Alpha" },
    });
    const beta = await prisma.camps.findUniqueOrThrow({
      where: { cmp_name: "Refugio Beta" },
    });
    const food = await prisma.resources.findFirstOrThrow({
      where: { rss_name: { contains: "comida" } },
    });

    const dashboard = await request(app)
      .get("/api/v1/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.role).toBe("SuperAdmin");
    expect(dashboard.body.data.camp.name).toBe("Base Alpha");

    const allowedInventoryWrite = await request(app)
      .post("/api/v1/inventory/adjustments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        id_camp: alpha.id_camp,
        id_resource: food.id_resource,
        mode: "delta",
        quantity: 1,
        reason: "Permission test",
      });
    expect(allowedInventoryWrite.status).toBe(200);

    const allowedInventoryRead = await request(app)
      .get("/api/v1/inventory?page=1&pageSize=10")
      .set("Authorization", `Bearer ${resourceToken}`);
    expect(allowedInventoryRead.status).toBe(200);

    const forbiddenInventoryWrite = await request(app)
      .post("/api/v1/inventory/adjustments")
      .set("Authorization", `Bearer ${resourceToken}`)
      .send({
        id_camp: beta.id_camp,
        id_resource: food.id_resource,
        mode: "delta",
        quantity: 1,
        reason: "Cross-camp permission test",
      });
    expect(forbiddenInventoryWrite.status).toBe(403);
  });

  it("switches the administrator camp by replacing the active session", async () => {
    const token = await login("admin", process.env.SEED_ADMIN_PASSWORD!);
    const beta = await prisma.camps.findUniqueOrThrow({
      where: { cmp_name: "Refugio Beta" },
    });

    const switched = await request(app)
      .post("/api/v1/auth/switch-camp")
      .set("Authorization", `Bearer ${token}`)
      .send({ campId: beta.id_camp });

    expect(switched.status).toBe(200);
    expect(switched.body.data.user.campName).toBe("Refugio Beta");

    const expiredSession = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(expiredSession.status).toBe(401);
  });
});
