import bcrypt from "bcryptjs";

import prisma from "../src/lib/prisma.js";
import { DEFAULT_PROFILE_TEMPLATES } from "../src/modules/persons/profile-templates.js";

interface SeedProfession {
  name: string;
  description: string;
  canExpedition?: boolean;
  canTransfer?: boolean;
  productionPenalty?: number;
  healingFoodCost?: number;
  healingAmount?: number;
  valuableBonusPoints?: number;
  transferBonusPoints?: number;
  foodPerDay?: number;
  waterPerDay?: number;
  extraFoodChancePoints?: number;
  extraFoodMin?: number;
  extraFoodMax?: number;
}

const professions: SeedProfession[] = [
  {
    name: "Medico",
    description:
      "Atiende heridas y enfermedades dentro y fuera del campamento.",
    canExpedition: true,
    canTransfer: true,
    productionPenalty: 6,
    healingFoodCost: 3,
    healingAmount: 5,
  },
  {
    name: "Guerrero",
    description: "Protege grupos durante expediciones y envios.",
    canExpedition: true,
    canTransfer: true,
    productionPenalty: 6,
  },
  {
    name: "Explorador",
    description: "Localiza rutas, zonas y recursos valiosos.",
    canExpedition: true,
    canTransfer: true,
    productionPenalty: 6,
    valuableBonusPoints: 1.5,
  },
  {
    name: "Agricultor",
    description: "Produce alimento diariamente dentro del campamento.",
    foodPerDay: 8,
  },
  {
    name: "Cientifico",
    description: "Purifica y produce agua mediante procesos tecnicos.",
    waterPerDay: 8,
  },
  {
    name: "Diplomatico",
    description: "Coordina acuerdos y envios entre campamentos.",
    canTransfer: true,
    productionPenalty: 6,
    transferBonusPoints: 1.5,
  },
  {
    name: "Cazador",
    description: "Produce alimento y puede encontrar comida extra.",
    canExpedition: true,
    foodPerDay: 8,
    extraFoodChancePoints: 3.5,
    extraFoodMin: 8,
    extraFoodMax: 10,
  },
];

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Required environment variable: ${key}`);
  return value;
}

function requireEnvAny(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  throw new Error(`Required environment variable: ${keys.join(" or ")}`);
}

async function upsertPerson(input: {
  campId: number;
  professionId: number | null;
  healthId: number;
  profileTemplateId: number | null;
  profileDescription: string;
  name: string;
  lastname: string;
  identifier: string;
  documentNumber: string;
  admissionStatus?:
    | "pending"
    | "under_review"
    | "observe"
    | "accepted"
    | "rejected";
  active?: boolean;
  admissionNotes?: string | null;
  stats: {
    health: number;
    strength: number;
    satiety: number;
    hydration: number;
    luck: number;
  };
}) {
  const existing = await prisma.persons.findFirst({
    where: { prn_identifier: input.identifier },
  });
  const data = {
    id_camp: input.campId,
    id_profession: input.professionId,
    id_person_health: input.healthId,
    id_profile_template: input.profileTemplateId,
    prn_name: input.name,
    prn_lastname: input.lastname,
    prn_identifier: input.identifier,
    prn_document_number: input.documentNumber,
    prn_profile_description: input.profileDescription,
    prn_admission_status: input.admissionStatus ?? "accepted",
    prn_is_active: input.active ?? true,
    prn_admission_notes:
      input.admissionNotes ?? "Seeded as an accepted camp member.",
  };
  const person = existing
    ? await prisma.persons.update({
        where: { id_person: existing.id_person },
        data,
      })
    : await prisma.persons.create({ data });

  await prisma.person_stats.upsert({
    where: { id_person: person.id_person },
    create: {
      id_person: person.id_person,
      pst_health: input.stats.health,
      pst_max_health: Math.max(1, input.stats.health),
      pst_strength: input.stats.strength,
      pst_satiety: input.stats.satiety,
      pst_hydration: input.stats.hydration,
      pst_luck: input.stats.luck,
      pst_level: 1,
    },
    update: {
      pst_health: input.stats.health,
      pst_max_health: Math.max(1, input.stats.health),
      pst_strength: input.stats.strength,
      pst_satiety: input.stats.satiety,
      pst_hydration: input.stats.hydration,
      pst_luck: input.stats.luck,
      pst_level: 1,
    },
  });

  return person;
}

async function main() {
  console.log("Starting seed...");

  const passwords = {
    admin: requireEnv("SEED_ADMIN_PASSWORD"),
    gestion_alpha: requireEnvAny(
      "SEED_GESTION_ALPHA_PASSWORD",
      "SEED_GESTION_PASSWORD",
    ),
    viajes_alpha: requireEnvAny(
      "SEED_VIAJES_ALPHA_PASSWORD",
      "SEED_VIAJES_PASSWORD",
    ),
    trabajador_alpha: requireEnvAny(
      "SEED_TRABAJADOR_ALPHA_PASSWORD",
      "SEED_TRABAJADOR_PASSWORD",
    ),
    gestion_beta: requireEnv("SEED_GESTION_BETA_PASSWORD"),
    viajes_beta: requireEnv("SEED_VIAJES_BETA_PASSWORD"),
  };

  const campA = await prisma.camps.upsert({
    where: { cmp_name: "Base Alpha" },
    create: {
      cmp_name: "Base Alpha",
      cmp_location: "Sector Norte - Zona Industrial",
      cmp_latitude: 0.19,
      cmp_longitude: 0.39,
      cmp_max_capacity: 100,
      cmp_status: "active",
    },
    update: {
      cmp_location: "Sector Norte - Zona Industrial",
      cmp_latitude: 0.19,
      cmp_longitude: 0.39,
      cmp_max_capacity: 100,
      cmp_status: "active",
    },
  });
  const campB = await prisma.camps.upsert({
    where: { cmp_name: "Refugio Beta" },
    create: {
      cmp_name: "Refugio Beta",
      cmp_location: "Sector Sur - Zona Residencial",
      cmp_latitude: 0.64,
      cmp_longitude: 0.41,
      cmp_max_capacity: 60,
      cmp_status: "active",
    },
    update: {
      cmp_location: "Sector Sur - Zona Residencial",
      cmp_latitude: 0.64,
      cmp_longitude: 0.41,
      cmp_max_capacity: 60,
      cmp_status: "active",
    },
  });

  const roleDefinitions = [
    {
      name: "administrador sistema",
      description: "Acceso total al sistema.",
    },
    {
      name: "trabajador",
      description: "Acceso operativo basico.",
    },
    {
      name: "gestion recursos",
      description: "Gestion de inventario y procesos diarios.",
    },
    {
      name: "encargado de viajes y comunicacion",
      description: "Gestion de expediciones, traslados y comunicacion.",
    },
  ];
  const roleByName = new Map<string, number>();
  for (const role of roleDefinitions) {
    const saved = await prisma.roles.upsert({
      where: { rls_name: role.name },
      create: {
        rls_name: role.name,
        rls_description: role.description,
        rls_is_system_role: true,
      },
      update: {
        rls_description: role.description,
        rls_is_system_role: true,
      },
    });
    roleByName.set(saved.rls_name, saved.id_role);
  }

  const healthDefinitions = [
    ["Sano", "Puede trabajar con normalidad.", true, false],
    ["Herido leve", "Herida menor que permite trabajar.", true, false],
    ["Herido grave", "Herida seria que impide trabajar.", false, false],
    ["Enfermo", "Afectado por un evento de enfermedad.", false, false],
    ["Fallecido", "Persona inactiva de forma permanente.", false, true],
  ] as const;
  const healthByName = new Map<string, number>();
  for (const health of healthDefinitions) {
    const saved = await prisma.person_health.upsert({
      where: { phs_name: health[0] },
      create: {
        phs_name: health[0],
        phs_description: health[1],
        phs_can_work: health[2],
        phs_is_terminal: health[3],
        phs_is_active_status: true,
      },
      update: {
        phs_description: health[1],
        phs_can_work: health[2],
        phs_is_terminal: health[3],
        phs_is_active_status: true,
      },
    });
    healthByName.set(saved.phs_name, saved.id_person_health);
  }

  const professionByName = new Map<string, number>();
  for (const profession of professions) {
    const saved = await prisma.professions.upsert({
      where: { pfs_name: profession.name },
      create: {
        pfs_name: profession.name,
        pfs_description: profession.description,
        pfs_collects_resources:
          Boolean(profession.canExpedition) ||
          profession.foodPerDay !== undefined ||
          profession.waterPerDay !== undefined,
        pfs_food_generated_per_day: profession.foodPerDay ?? 0,
        pfs_water_generated_per_day: profession.waterPerDay ?? 0,
        pfs_can_expedition: profession.canExpedition ?? false,
        pfs_can_transfer: profession.canTransfer ?? false,
        pfs_production_penalty: profession.productionPenalty ?? 0,
        pfs_valuable_bonus_pp: profession.valuableBonusPoints ?? 0,
        pfs_transfer_bonus_pp: profession.transferBonusPoints ?? 0,
        pfs_extra_food_chance_pp: profession.extraFoodChancePoints ?? 0,
        pfs_extra_food_min: profession.extraFoodMin ?? 0,
        pfs_extra_food_max: profession.extraFoodMax ?? 0,
        pfs_healing_food_cost: profession.healingFoodCost ?? 0,
        pfs_healing_amount: profession.healingAmount ?? 0,
        pfs_is_active: true,
      },
      update: {
        pfs_description: profession.description,
        pfs_collects_resources:
          Boolean(profession.canExpedition) ||
          profession.foodPerDay !== undefined ||
          profession.waterPerDay !== undefined,
        pfs_food_generated_per_day: profession.foodPerDay ?? 0,
        pfs_water_generated_per_day: profession.waterPerDay ?? 0,
        pfs_can_expedition: profession.canExpedition ?? false,
        pfs_can_transfer: profession.canTransfer ?? false,
        pfs_production_penalty: profession.productionPenalty ?? 0,
        pfs_valuable_bonus_pp: profession.valuableBonusPoints ?? 0,
        pfs_transfer_bonus_pp: profession.transferBonusPoints ?? 0,
        pfs_extra_food_chance_pp: profession.extraFoodChancePoints ?? 0,
        pfs_extra_food_min: profession.extraFoodMin ?? 0,
        pfs_extra_food_max: profession.extraFoodMax ?? 0,
        pfs_healing_food_cost: profession.healingFoodCost ?? 0,
        pfs_healing_amount: profession.healingAmount ?? 0,
        pfs_is_active: true,
      },
    });
    professionByName.set(saved.pfs_name, saved.id_profession);
  }

  const templateByDescription = new Map<string, number>();
  for (const template of DEFAULT_PROFILE_TEMPLATES) {
    const expectedProfessionId =
      professionByName.get(template.expectedProfession) ?? null;
    const existing = await prisma.profile_templates.findFirst({
      where: { pft_description: template.description },
    });
    const saved = existing
      ? await prisma.profile_templates.update({
          where: { id_profile_template: existing.id_profile_template },
          data: {
            id_expected_profession: expectedProfessionId,
            pft_signals: [...template.signals],
            pft_is_active: true,
          },
        })
      : await prisma.profile_templates.create({
          data: {
            id_expected_profession: expectedProfessionId,
            pft_description: template.description,
            pft_signals: [...template.signals],
            pft_is_active: true,
          },
        });
    templateByDescription.set(saved.pft_description, saved.id_profile_template);
  }

  for (const camp of [campA, campB]) {
    await prisma.camp_operational_rules.upsert({
      where: { id_camp: camp.id_camp },
      create: {
        id_camp: camp.id_camp,
        cor_admission_rules: {
          minimumHealth: 1,
          requireProfileDescription: true,
          requireAvailableCapacity: true,
        },
        cor_expedition_success: 70,
        cor_transfer_success: 75,
        cor_disease_probability: 25,
        cor_valuable_probability: 20,
        cor_disease_threshold: 25,
      },
      update: {
        cor_admission_rules: {
          minimumHealth: 1,
          requireProfileDescription: true,
          requireAvailableCapacity: true,
        },
        cor_expedition_success: 70,
        cor_transfer_success: 75,
        cor_disease_probability: 25,
        cor_valuable_probability: 20,
        cor_disease_threshold: 25,
      },
    });
  }

  const seededPeople = [
    {
      username: "admin",
      email: "admin@base-alpha.com",
      camp: campA,
      passwordKey: "admin",
      roleName: "administrador sistema",
      professionName: "Diplomatico",
      name: "Carlos",
      lastname: "Ramirez",
      identifier: "ALPHA-ADM-001",
      documentNumber: "ADM-001",
      templateIndex: 5,
      stats: { health: 8, strength: 6, satiety: 8, hydration: 8, luck: 7 },
    },
    {
      username: "gestion_alpha",
      email: "gestion.alpha@base-alpha.com",
      camp: campA,
      passwordKey: "gestion_alpha",
      roleName: "gestion recursos",
      professionName: "Cientifico",
      name: "Ana",
      lastname: "Torres",
      identifier: "ALPHA-GRS-001",
      documentNumber: "GRS-001",
      templateIndex: 8,
      stats: { health: 7, strength: 5, satiety: 8, hydration: 9, luck: 6 },
    },
    {
      username: "viajes_alpha",
      email: "viajes.alpha@base-alpha.com",
      camp: campA,
      passwordKey: "viajes_alpha",
      roleName: "encargado de viajes y comunicacion",
      professionName: "Explorador",
      name: "Miguel",
      lastname: "Vargas",
      identifier: "ALPHA-VJE-001",
      documentNumber: "VJE-001",
      templateIndex: 2,
      stats: { health: 9, strength: 8, satiety: 7, hydration: 7, luck: 9 },
    },
    {
      username: "trabajador_alpha",
      email: "trabajador.alpha@base-alpha.com",
      camp: campA,
      passwordKey: "trabajador_alpha",
      roleName: "trabajador",
      professionName: "Medico",
      name: "Sofia",
      lastname: "Castro",
      identifier: "ALPHA-TRB-001",
      documentNumber: "TRB-001",
      templateIndex: 7,
      stats: { health: 7, strength: 4, satiety: 8, hydration: 8, luck: 5 },
    },
    {
      username: "gestion_beta",
      email: "gestion.beta@refugio-beta.com",
      camp: campB,
      passwordKey: "gestion_beta",
      roleName: "gestion recursos",
      professionName: "Agricultor",
      name: "Lucia",
      lastname: "Mendez",
      identifier: "BETA-GRS-001",
      documentNumber: "B-GRS-001",
      templateIndex: 3,
      stats: { health: 8, strength: 6, satiety: 8, hydration: 7, luck: 6 },
    },
    {
      username: "viajes_beta",
      email: "viajes.beta@refugio-beta.com",
      camp: campB,
      passwordKey: "viajes_beta",
      roleName: "encargado de viajes y comunicacion",
      professionName: "Cazador",
      name: "Diego",
      lastname: "Salas",
      identifier: "BETA-VJE-001",
      documentNumber: "B-VJE-001",
      templateIndex: 6,
      stats: { health: 9, strength: 8, satiety: 7, hydration: 7, luck: 8 },
    },
  ] as const;

  for (const definition of seededPeople) {
    const template = DEFAULT_PROFILE_TEMPLATES[definition.templateIndex];
    const person = await upsertPerson({
      campId: definition.camp.id_camp,
      professionId: professionByName.get(definition.professionName)!,
      healthId: healthByName.get("Sano")!,
      profileTemplateId:
        templateByDescription.get(template.description) ?? null,
      profileDescription: template.description,
      name: definition.name,
      lastname: definition.lastname,
      identifier: definition.identifier,
      documentNumber: definition.documentNumber,
      stats: definition.stats,
    });
    const password = await bcrypt.hash(passwords[definition.passwordKey], 10);
    const user = await prisma.users.upsert({
      where: { usr_username: definition.username },
      create: {
        id_camp: definition.camp.id_camp,
        id_role: roleByName.get(definition.roleName)!,
        id_person: person.id_person,
        usr_username: definition.username,
        usr_email: definition.email,
        usr_password: password,
        usr_is_active: true,
      },
      update: {
        id_camp: definition.camp.id_camp,
        id_role: roleByName.get(definition.roleName)!,
        id_person: person.id_person,
        usr_email: definition.email,
        usr_password: password,
        usr_is_active: true,
      },
    });

    const membershipCamps =
      definition.username === "admin" ? [campA, campB] : [definition.camp];
    for (const camp of membershipCamps) {
      await prisma.user_camp_memberships.upsert({
        where: {
          id_user_id_camp: {
            id_user: user.id_user,
            id_camp: camp.id_camp,
          },
        },
        create: {
          id_user: user.id_user,
          id_camp: camp.id_camp,
          ucm_is_active: true,
        },
        update: {
          ucm_is_active: true,
        },
      });
    }
  }

  const scenarioPeople = [
    {
      identifier: "ALPHA-PENDING-001",
      documentNumber: "PEN-001",
      campId: campA.id_camp,
      name: "Daniel",
      lastname: "Rojas",
      templateIndex: 1,
      professionName: null,
      healthName: "Sano",
      admissionStatus: "pending" as const,
      stats: { health: 7, strength: 9, satiety: 6, hydration: 7, luck: 5 },
      notes: "Pendiente de evaluacion textual.",
    },
    {
      identifier: "ALPHA-OBSERVE-001",
      documentNumber: "OBS-001",
      campId: campA.id_camp,
      name: "Elena",
      lastname: "Quintero",
      templateIndex: 4,
      professionName: null,
      healthName: "Herido leve",
      admissionStatus: "observe" as const,
      stats: { health: 3, strength: 4, satiety: 5, hydration: 5, luck: 6 },
      notes: "Observacion por salud reducida.",
    },
    {
      identifier: "BETA-REJECTED-001",
      documentNumber: "REJ-001",
      campId: campB.id_camp,
      name: "Marco",
      lastname: "Leon",
      templateIndex: 0,
      professionName: null,
      healthName: "Herido grave",
      admissionStatus: "rejected" as const,
      stats: { health: 1, strength: 3, satiety: 2, hydration: 2, luck: 1 },
      notes: "Rechazado por capacidad operativa y salud.",
    },
    {
      identifier: "ALPHA-SICK-001",
      documentNumber: "ENF-001",
      campId: campA.id_camp,
      name: "Nora",
      lastname: "Jimenez",
      templateIndex: 3,
      professionName: "Agricultor",
      healthName: "Enfermo",
      admissionStatus: "accepted" as const,
      stats: { health: 2, strength: 4, satiety: 5, hydration: 4, luck: 3 },
      notes: "Paciente disponible para probar curacion.",
    },
  ];

  for (const definition of scenarioPeople) {
    const template = DEFAULT_PROFILE_TEMPLATES[definition.templateIndex]!;
    await upsertPerson({
      campId: definition.campId,
      professionId: definition.professionName
        ? professionByName.get(definition.professionName)!
        : null,
      healthId: healthByName.get(definition.healthName)!,
      profileTemplateId:
        templateByDescription.get(template.description) ?? null,
      profileDescription: template.description,
      name: definition.name,
      lastname: definition.lastname,
      identifier: definition.identifier,
      documentNumber: definition.documentNumber,
      admissionStatus: definition.admissionStatus,
      admissionNotes: definition.notes,
      stats: definition.stats,
    });
  }

  const resourceTypes = [
    ["Alimento", true, "Recursos alimenticios."],
    ["Agua", true, "Recursos hidricos."],
    ["Defensa", false, "Municion y herramientas de defensa."],
    ["Higiene", false, "Productos medicos y de higiene."],
  ] as const;
  const resourceTypeByName = new Map<string, number>();
  for (const type of resourceTypes) {
    const saved = await prisma.resource_types.upsert({
      where: { rst_name: type[0] },
      create: {
        rst_name: type[0],
        rst_is_priority: type[1],
        rst_description: type[2],
      },
      update: {
        rst_is_priority: type[1],
        rst_description: type[2],
      },
    });
    resourceTypeByName.set(saved.rst_name, saved.id_resource_type);
  }

  const resourceDefinitions = [
    ["Raciones de comida", "Alimento", "racion", true, 150, 50],
    ["Agua potable", "Agua", "litro", true, 200, 80],
    ["Municion", "Defensa", "unidad", false, 500, 100],
    ["Botiquin medico", "Higiene", "kit", false, 20, 5],
  ] as const;
  for (const resource of resourceDefinitions) {
    const saved = await prisma.resources.upsert({
      where: { rss_name: resource[0] },
      create: {
        rss_name: resource[0],
        id_resource_type: resourceTypeByName.get(resource[1])!,
        rss_unit: resource[2],
        rss_is_rationable: resource[3],
        rss_is_active: true,
      },
      update: {
        id_resource_type: resourceTypeByName.get(resource[1])!,
        rss_unit: resource[2],
        rss_is_rationable: resource[3],
        rss_is_active: true,
      },
    });
    for (const [camp, multiplier] of [
      [campA, 1],
      [campB, 0.65],
    ] as const) {
      const quantity = Number((resource[4] * multiplier).toFixed(2));
      const minimum = Number((resource[5] * multiplier).toFixed(2));
      await prisma.storage.upsert({
        where: {
          id_camp_id_resource: {
            id_camp: camp.id_camp,
            id_resource: saved.id_resource,
          },
        },
        create: {
          id_camp: camp.id_camp,
          id_resource: saved.id_resource,
          stg_quantity: quantity,
          stg_min_quantity: minimum,
        },
        update: {
          stg_quantity: quantity,
          stg_min_quantity: minimum,
        },
      });
    }
  }

  await prisma.system_settings.upsert({
    where: { sts_key: "session_timeout_minutes" },
    create: {
      sts_key: "session_timeout_minutes",
      sts_value: process.env.SESSION_TIMEOUT_MINUTES ?? "20",
      sts_value_type: "integer",
      sts_description: "Session inactivity timeout in minutes.",
      sts_is_public: true,
    },
    update: {
      sts_value: process.env.SESSION_TIMEOUT_MINUTES ?? "20",
      sts_value_type: "integer",
      sts_description: "Session inactivity timeout in minutes.",
      sts_is_public: true,
    },
  });
  await prisma.system_settings.upsert({
    where: { sts_key: "daily_ration_per_person" },
    create: {
      sts_key: "daily_ration_per_person",
      sts_value: "1",
      sts_value_type: "decimal",
      sts_description:
        "Daily amount consumed per person and rationable resource.",
      sts_is_public: false,
    },
    update: {
      sts_value: "1",
      sts_value_type: "decimal",
      sts_description:
        "Daily amount consumed per person and rationable resource.",
      sts_is_public: false,
    },
  });

  const zoneDefinitions = [
    {
      camp: campA,
      name: "Distrito industrial",
      description: "Almacenes abandonados con riesgo medio.",
      latitude: 9.934,
      longitude: -84.083,
      risk: "medium" as const,
    },
    {
      camp: campA,
      name: "Hospital central",
      description: "Posibles suministros medicos y alta presencia hostil.",
      latitude: 9.925,
      longitude: -84.101,
      risk: "high" as const,
    },
    {
      camp: campB,
      name: "Mercado del sur",
      description: "Zona comercial parcialmente explorada.",
      latitude: 9.887,
      longitude: -84.11,
      risk: "medium" as const,
    },
    {
      camp: campB,
      name: "Reserva forestal",
      description: "Area de caza con rutas poco estables.",
      latitude: 9.875,
      longitude: -84.095,
      risk: "high" as const,
    },
  ];

  for (const zone of zoneDefinitions) {
    await prisma.exploration_zones.upsert({
      where: {
        id_camp_exz_name: {
          id_camp: zone.camp.id_camp,
          exz_name: zone.name,
        },
      },
      create: {
        id_camp: zone.camp.id_camp,
        exz_name: zone.name,
        exz_description: zone.description,
        exz_latitude: zone.latitude,
        exz_longitude: zone.longitude,
        exz_risk: zone.risk,
        exz_is_active: true,
      },
      update: {
        exz_description: zone.description,
        exz_latitude: zone.latitude,
        exz_longitude: zone.longitude,
        exz_risk: zone.risk,
        exz_is_active: true,
      },
    });
  }

  const existingSeedEvent = await prisma.narrative_events.findFirst({
    where: {
      id_camp: campA.id_camp,
      nre_source_type: "seed",
      nre_reference_id: 1,
    },
  });
  const seedEventData = {
    id_camp: campA.id_camp,
    nre_type: "scarcity" as const,
    nre_status: "resolved" as const,
    nre_source_type: "seed",
    nre_reference_id: 1,
    nre_probability: null,
    nre_roll: null,
    nre_participants: [],
    nre_effects: { resource: "Agua potable", shortfall: 12 },
    nre_description:
      "Simulacion resuelta de escasez para validar la pantalla de eventos.",
  };
  if (existingSeedEvent) {
    await prisma.narrative_events.update({
      where: {
        id_narrative_event: existingSeedEvent.id_narrative_event,
      },
      data: seedEventData,
    });
  } else {
    await prisma.narrative_events.create({ data: seedEventData });
  }

  console.log("Seed completed.");
  console.log(
    "Users: admin, gestion_alpha, viajes_alpha, trabajador_alpha, gestion_beta, viajes_beta.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
