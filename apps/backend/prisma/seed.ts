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
    description: "Atiende heridas y enfermedades dentro y fuera del campamento.",
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
    description: "Negocia y protege la coordinacion de envios entre campamentos.",
    canTransfer: true,
    productionPenalty: 6,
    transferBonusPoints: 1.5,
  },
  {
    name: "Cazador",
    description: "Produce alimento y puede encontrar comida extra en expediciones.",
    canExpedition: true,
    foodPerDay: 8,
    extraFoodChancePoints: 3.5,
    extraFoodMin: 8,
    extraFoodMax: 10,
  },
];

async function main() {
  for (const role of [
    ["Administrador sistema", "Administracion completa del sistema."],
    ["Trabajador", "Acceso operativo basico."],
    ["Gestion recursos", "Gestion de inventario y procesos diarios."],
    [
      "Encargado de viajes y comunicacion",
      "Gestion de expediciones, traslados y comunicacion.",
    ],
  ] as const) {
    await prisma.roles.upsert({
      where: { rls_name: role[0] },
      create: {
        rls_name: role[0],
        rls_description: role[1],
        rls_is_system_role: true,
      },
      update: { rls_description: role[1] },
    });
  }

  for (const health of [
    {
      name: "Sano",
      description: "Puede trabajar con normalidad.",
      canWork: true,
      terminal: false,
    },
    {
      name: "Herido",
      description: "Requiere atencion medica.",
      canWork: false,
      terminal: false,
    },
    {
      name: "Enfermo",
      description: "Afectado por un evento de enfermedad.",
      canWork: false,
      terminal: false,
    },
    {
      name: "Fallecido",
      description: "Persona inactiva de forma permanente.",
      canWork: false,
      terminal: true,
    },
  ]) {
    await prisma.person_health.upsert({
      where: { phs_name: health.name },
      create: {
        phs_name: health.name,
        phs_description: health.description,
        phs_can_work: health.canWork,
        phs_is_terminal: health.terminal,
        phs_is_active_status: true,
      },
      update: {
        phs_description: health.description,
        phs_can_work: health.canWork,
        phs_is_terminal: health.terminal,
        phs_is_active_status: true,
      },
    });
  }

  const professionByName = new Map<string, number>();
  for (const profession of professions) {
    const saved = await prisma.professions.upsert({
      where: { pfs_name: profession.name },
      create: {
        pfs_name: profession.name,
        pfs_description: profession.description,
        pfs_collects_resources:
          profession.canExpedition ?? profession.foodPerDay !== undefined,
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

  for (const template of DEFAULT_PROFILE_TEMPLATES) {
    const expectedProfessionId =
      professionByName.get(template.expectedProfession) ?? null;
    const existing = await prisma.profile_templates.findFirst({
      where: { pft_description: template.description },
    });
    if (existing) {
      await prisma.profile_templates.update({
        where: { id_profile_template: existing.id_profile_template },
        data: {
          id_expected_profession: expectedProfessionId,
          pft_signals: [...template.signals],
          pft_is_active: true,
        },
      });
    } else {
      await prisma.profile_templates.create({
        data: {
          id_expected_profession: expectedProfessionId,
          pft_description: template.description,
          pft_signals: [...template.signals],
          pft_is_active: true,
        },
      });
    }
  }

  const camps = await prisma.camps.findMany({ select: { id_camp: true } });
  for (const camp of camps) {
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
      update: {},
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
