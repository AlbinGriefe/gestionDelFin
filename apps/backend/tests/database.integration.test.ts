import request from "supertest";
import bcrypt from "bcryptjs";
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

async function evaluateAdmission(input: {
  token: string;
  personId: number;
  forceRefresh?: boolean;
}) {
  return request(app)
    .post("/api/v1/admission-evaluations")
    .set("Authorization", `Bearer ${input.token}`)
    .send({
      personId: input.personId,
      forceRefresh: input.forceRefresh ?? true,
    });
}

async function confirmAdmission(input: {
  token: string;
  evaluationId: number;
  userDecision: "accept" | "observe" | "reject";
  userObservation?: string;
}) {
  return request(app)
    .patch(`/api/v1/admission-evaluations/${input.evaluationId}/confirm`)
    .set("Authorization", `Bearer ${input.token}`)
    .send({
      userDecision: input.userDecision,
      userObservation: input.userObservation,
    });
}

async function createPendingPersonForTest(input: {
  campId: number;
  identifier: string;
}) {
  const person = await prisma.persons.create({
    data: {
      id_camp: input.campId,
      prn_name: "Persona",
      prn_lastname: "Capacidad",
      prn_identifier: input.identifier,
      prn_document_number: input.identifier,
      prn_profile_description:
        "Perfil de prueba con datos suficientes para evaluar admision.",
      prn_admission_status: "pending",
      prn_is_active: true,
    },
  });

  await prisma.person_stats.create({
    data: {
      id_person: person.id_person,
      pst_health: 5,
      pst_max_health: 5,
      pst_strength: 5,
      pst_satiety: 5,
      pst_hydration: 5,
      pst_luck: 5,
      pst_level: 1,
    },
  });

  return person;
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

    const admin = await prisma.users.findUniqueOrThrow({
      where: { usr_username: "admin" },
      include: {
        roles: true,
        user_camp_memberships: {
          where: { ucm_is_active: true },
        },
      },
    });

    expect(admin.roles.rls_name).toBe("SuperAdmin");
    expect(admin.user_camp_memberships).toHaveLength(counts.camps);
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

  it("confirms admission decisions and writes audit records", async () => {
    const token = await login("admin", process.env.SEED_ADMIN_PASSWORD!);
    const scenarios = [
      {
        identifier: "ALPHA-PENDING-001",
        decision: "accept",
        expectedStatus: "accepted",
      },
      {
        identifier: "ALPHA-OBSERVE-001",
        decision: "observe",
        expectedStatus: "observe",
      },
      {
        identifier: "BETA-REJECTED-001",
        decision: "reject",
        expectedStatus: "rejected",
      },
    ] as const;

    for (const scenario of scenarios) {
      const person = await prisma.persons.findUniqueOrThrow({
        where: { prn_identifier: scenario.identifier },
      });
      const evaluation = await evaluateAdmission({
        token,
        personId: person.id_person,
      });

      expect(evaluation.status).toBe(201);
      expect(evaluation.body.meta.requestId).toEqual(expect.any(String));

      const confirmed = await confirmAdmission({
        token,
        evaluationId: evaluation.body.data.evaluation.id,
        userDecision: scenario.decision,
        userObservation: `Decision ${scenario.decision} integration test.`,
      });

      expect(confirmed.status).toBe(200);
      expect(confirmed.body.meta.requestId).toEqual(expect.any(String));
      expect(confirmed.body.data.isFinal).toBe(true);
      expect(confirmed.body.data.userDecision).toBe(scenario.decision);
      expect(confirmed.body.data.person.admissionStatus).toBe(
        scenario.expectedStatus,
      );

      const storedPerson = await prisma.persons.findUniqueOrThrow({
        where: { id_person: person.id_person },
      });
      expect(storedPerson.prn_admission_status).toBe(scenario.expectedStatus);

      const auditCount = await prisma.person_records.count({
        where: { id_person: person.id_person },
      });
      expect(auditCount).toBeGreaterThan(0);
    }
  }, 15000);

  it("keeps finalized admission confirmations idempotent", async () => {
    const token = await login("admin", process.env.SEED_ADMIN_PASSWORD!);
    const person = await createPendingPersonForTest({
      campId: (
        await prisma.camps.findUniqueOrThrow({
          where: { cmp_name: "Base Alpha" },
        })
      ).id_camp,
      identifier: "IT-IDEMPOTENT-ADMISSION",
    });

    try {
      const evaluation = await evaluateAdmission({
        token,
        personId: person.id_person,
      });
      expect(evaluation.status).toBe(201);

      const firstConfirmation = await confirmAdmission({
        token,
        evaluationId: evaluation.body.data.evaluation.id,
        userDecision: "accept",
      });
      expect(firstConfirmation.status).toBe(200);

      const repeatedConfirmation = await confirmAdmission({
        token,
        evaluationId: evaluation.body.data.evaluation.id,
        userDecision: "reject",
      });

      expect(repeatedConfirmation.status).toBe(200);
      expect(repeatedConfirmation.body.data.userDecision).toBe("accept");
      expect(repeatedConfirmation.body.data.person.admissionStatus).toBe(
        "accepted",
      );
    } finally {
      await prisma.persons.deleteMany({
        where: { prn_identifier: "IT-IDEMPOTENT-ADMISSION" },
      });
    }
  });

  it("returns a functional error when admission capacity is full", async () => {
    const token = await login("admin", process.env.SEED_ADMIN_PASSWORD!);
    const camp = await prisma.camps.findUniqueOrThrow({
      where: { cmp_name: "Base Alpha" },
    });
    const acceptedCount = await prisma.persons.count({
      where: {
        id_camp: camp.id_camp,
        prn_is_active: true,
        prn_admission_status: "accepted",
      },
    });
    const person = await createPendingPersonForTest({
      campId: camp.id_camp,
      identifier: "IT-CAPACITY-ADMISSION",
    });

    try {
      await prisma.camps.update({
        where: { id_camp: camp.id_camp },
        data: { cmp_max_capacity: acceptedCount },
      });

      const evaluation = await evaluateAdmission({
        token,
        personId: person.id_person,
      });
      expect(evaluation.status).toBe(201);

      const confirmed = await confirmAdmission({
        token,
        evaluationId: evaluation.body.data.evaluation.id,
        userDecision: "accept",
      });

      expect(confirmed.status).toBe(409);
      expect(confirmed.body.error.code).toBe(
        "ADMISSION_CAMP_CAPACITY_EXCEEDED",
      );
      expect(confirmed.body.meta.requestId).toEqual(expect.any(String));
    } finally {
      await prisma.camps.update({
        where: { id_camp: camp.id_camp },
        data: { cmp_max_capacity: camp.cmp_max_capacity },
      });
      await prisma.persons.deleteMany({
        where: { prn_identifier: "IT-CAPACITY-ADMISSION" },
      });
    }
  });

  it("prevents camp admins from evaluating admissions outside memberships", async () => {
    const alpha = await prisma.camps.findUniqueOrThrow({
      where: { cmp_name: "Base Alpha" },
    });
    const betaPerson = await prisma.persons.findUniqueOrThrow({
      where: { prn_identifier: "BETA-REJECTED-001" },
    });
    const adminRole = await prisma.roles.findUniqueOrThrow({
      where: { rls_name: "administrador sistema" },
    });
    const password = "CampAdmin12345!";
    const user = await prisma.users.upsert({
      where: { usr_username: "admin_alpha_test" },
      create: {
        id_camp: alpha.id_camp,
        id_role: adminRole.id_role,
        id_person: null,
        usr_username: "admin_alpha_test",
        usr_email: "admin.alpha.test@example.com",
        usr_password: await bcrypt.hash(password, 10),
        usr_is_active: true,
      },
      update: {
        id_camp: alpha.id_camp,
        id_role: adminRole.id_role,
        id_person: null,
        usr_password: await bcrypt.hash(password, 10),
        usr_is_active: true,
      },
    });
    await prisma.user_camp_memberships.upsert({
      where: {
        id_user_id_camp: {
          id_user: user.id_user,
          id_camp: alpha.id_camp,
        },
      },
      create: {
        id_user: user.id_user,
        id_camp: alpha.id_camp,
        ucm_is_active: true,
      },
      update: { ucm_is_active: true },
    });

    const token = await login("admin_alpha_test", password);
    const response = await evaluateAdmission({
      token,
      personId: betaPerson.id_person,
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ADMISSION_FORBIDDEN_CAMP");
    expect(response.body.meta.requestId).toEqual(expect.any(String));
  });
});
