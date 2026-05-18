import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida en .env");

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Variable de entorno requerida: ${key}`);
    return value;
}

async function main() {
    console.log("Iniciando seed...");

    const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
    const gestionPassword = requireEnv("SEED_GESTION_PASSWORD");
    const viajesPassword = requireEnv("SEED_VIAJES_PASSWORD");
    const trabajadorPassword = requireEnv("SEED_TRABAJADOR_PASSWORD");

    // Campamentos
    const campA = await prisma.camps.upsert({
        where: { cmp_name: "Base Alpha" },
        update: {},
        create: {
            cmp_name: "Base Alpha",
            cmp_location: "Sector Norte - Zona Industrial",
            cmp_latitude: 9.9281,
            cmp_longitude: -84.0907,
            cmp_max_capacity: 100,
            cmp_status: "active",
        },
    });

    const campB = await prisma.camps.upsert({
        where: { cmp_name: "Refugio Beta" },
        update: {},
        create: {
            cmp_name: "Refugio Beta",
            cmp_location: "Sector Sur - Zona Residencial",
            cmp_latitude: 9.8921,
            cmp_longitude: -84.1050,
            cmp_max_capacity: 60,
            cmp_status: "active",
        },
    });

    console.log(`  Campamentos: ${campA.cmp_name}, ${campB.cmp_name}`);

    // Roles
    const roleAdmin = await prisma.roles.upsert({
        where: { rls_name: "administrador sistema" },
        update: { rls_name: "administrador sistema" },
        create: {
            rls_name: "administrador sistema",
            rls_description: "Acceso total al sistema. Gestiona el ingreso de personas.",
            rls_is_system_role: true,
        },
    });

    const roleTrabajador = await prisma.roles.upsert({
        where: { rls_name: "trabajador" },
        update: { rls_name: "trabajador" },
        create: {
            rls_name: "trabajador",
            rls_description: "Puede realizar cambios de inventario autorizados.",
            rls_is_system_role: true,
        },
    });

    const roleGestion = await prisma.roles.upsert({
        where: { rls_name: "gestion recursos" },
        update: { rls_name: "gestion recursos" },
        create: {
            rls_name: "gestion recursos",
            rls_description: "Encargado de traslados y envíos de recursos entre campamentos.",
            rls_is_system_role: true,
        },
    });

    const roleViajes = await prisma.roles.upsert({
        where: { rls_name: "encargado de viajes y comunicacion" },
        update: { rls_name: "encargado de viajes y comunicacion" },
        create: {
            rls_name: "encargado de viajes y comunicacion",
            rls_description: "Gestiona expediciones y negociaciones con otros campamentos.",
            rls_is_system_role: true,
        },
    });

    console.log(`  Roles: ${roleAdmin.rls_name}, ${roleTrabajador.rls_name}, ${roleGestion.rls_name}, ${roleViajes.rls_name}`);

    // Profesiones
    const profAdmin = await prisma.professions.upsert({
        where: { pfs_name: "Administrador" },
        update: {},
        create: {
            pfs_name: "Administrador",
            pfs_description: "Gestiona las operaciones del campamento.",
            pfs_collects_resources: false,
            pfs_food_generated_per_day: 0,
            pfs_water_generated_per_day: 0,
            id_camp: campA.id_camp,
            pfs_is_active: true,
        },
    });

    const profExplorador = await prisma.professions.upsert({
        where: { pfs_name: "Explorador" },
        update: {},
        create: {
            pfs_name: "Explorador",
            pfs_description: "Sale a buscar recursos fuera del campamento.",
            pfs_collects_resources: true,
            pfs_food_generated_per_day: 5,
            pfs_water_generated_per_day: 3,
            id_camp: campA.id_camp,
            pfs_is_active: true,
        },
    });

    const profMedico = await prisma.professions.upsert({
        where: { pfs_name: "Médico" },
        update: {},
        create: {
            pfs_name: "Médico",
            pfs_description: "Atiende a los heridos y enfermos del campamento.",
            pfs_collects_resources: false,
            pfs_food_generated_per_day: 0,
            pfs_water_generated_per_day: 0,
            id_camp: campA.id_camp,
            pfs_is_active: true,
        },
    });

    const profGuardia = await prisma.professions.upsert({
        where: { pfs_name: "Guardia" },
        update: {},
        create: {
            pfs_name: "Guardia",
            pfs_description: "Protege el perímetro del campamento.",
            pfs_collects_resources: false,
            pfs_food_generated_per_day: 0,
            pfs_water_generated_per_day: 0,
            id_camp: campA.id_camp,
            pfs_is_active: true,
        },
    });

    console.log(`  Profesiones: ${profAdmin.pfs_name}, ${profExplorador.pfs_name}, ${profMedico.pfs_name}, ${profGuardia.pfs_name}`);

    // Estados de salud
    const healthSano = await prisma.person_health.upsert({
        where: { phs_name: "Sano" },
        update: {},
        create: { phs_name: "Sano", phs_description: "Persona en buen estado de salud.", phs_can_work: true, phs_is_terminal: false, phs_is_active_status: true },
    });

    await prisma.person_health.upsert({
        where: { phs_name: "Herido leve" },
        update: {},
        create: { phs_name: "Herido leve", phs_description: "Herida menor que no impide trabajar.", phs_can_work: true, phs_is_terminal: false, phs_is_active_status: true },
    });

    await prisma.person_health.upsert({
        where: { phs_name: "Herido grave" },
        update: {},
        create: { phs_name: "Herido grave", phs_description: "Herida seria que impide trabajar.", phs_can_work: false, phs_is_terminal: false, phs_is_active_status: true },
    });

    await prisma.person_health.upsert({
        where: { phs_name: "Infectado" },
        update: {},
        create: { phs_name: "Infectado", phs_description: "Posible infección zombie. En cuarentena.", phs_can_work: false, phs_is_terminal: true, phs_is_active_status: true },
    });

    console.log("  Estados de salud creados.");

    // Personas
    const personAdmin = await prisma.persons.upsert({
        where: { id_person: 1 },
        update: {},
        create: {
            id_camp: campA.id_camp,
            id_profession: profAdmin.id_profession,
            id_person_health: healthSano.id_person_health,
            prn_name: "Carlos",
            prn_lastname: "Ramírez",
            prn_document_number: "ADM-001",
            prn_is_accepted: true,
            prn_is_active: true,
        },
    });

    const personGestion = await prisma.persons.upsert({
        where: { id_person: 2 },
        update: {},
        create: {
            id_camp: campA.id_camp,
            id_profession: profGuardia.id_profession,
            id_person_health: healthSano.id_person_health,
            prn_name: "Ana",
            prn_lastname: "Torres",
            prn_document_number: "GRS-001",
            prn_is_accepted: true,
            prn_is_active: true,
        },
    });

    const personViajes = await prisma.persons.upsert({
        where: { id_person: 3 },
        update: {},
        create: {
            id_camp: campA.id_camp,
            id_profession: profExplorador.id_profession,
            id_person_health: healthSano.id_person_health,
            prn_name: "Miguel",
            prn_lastname: "Vargas",
            prn_document_number: "VJE-001",
            prn_is_accepted: true,
            prn_is_active: true,
        },
    });

    const personTrabajador = await prisma.persons.upsert({
        where: { id_person: 4 },
        update: {},
        create: {
            id_camp: campA.id_camp,
            id_profession: profMedico.id_profession,
            id_person_health: healthSano.id_person_health,
            prn_name: "Sofía",
            prn_lastname: "Castro",
            prn_document_number: "TRB-001",
            prn_is_accepted: true,
            prn_is_active: true,
        },
    });

    console.log("  Personas creadas.");

    // Usuarios
    const hash = (pwd: string) => bcrypt.hash(pwd, 10);

    await prisma.users.upsert({
        where: { usr_username: "admin" },
        update: { usr_password: await hash(adminPassword) },
        create: {
            id_camp: campA.id_camp,
            id_role: roleAdmin.id_role,
            id_person: personAdmin.id_person,
            usr_username: "admin",
            usr_email: "admin@base-alpha.com",
            usr_password: await hash(adminPassword),
            usr_is_active: true,
        },
    });

    await prisma.users.upsert({
        where: { usr_username: "gestion" },
        update: { usr_password: await hash(gestionPassword) },
        create: {
            id_camp: campA.id_camp,
            id_role: roleGestion.id_role,
            id_person: personGestion.id_person,
            usr_username: "gestion",
            usr_email: "gestion@base-alpha.com",
            usr_password: await hash(gestionPassword),
            usr_is_active: true,
        },
    });

    await prisma.users.upsert({
        where: { usr_username: "viajes" },
        update: { usr_password: await hash(viajesPassword) },
        create: {
            id_camp: campA.id_camp,
            id_role: roleViajes.id_role,
            id_person: personViajes.id_person,
            usr_username: "viajes",
            usr_email: "viajes@base-alpha.com",
            usr_password: await hash(viajesPassword),
            usr_is_active: true,
        },
    });

    await prisma.users.upsert({
        where: { usr_username: "trabajador" },
        update: { usr_password: await hash(trabajadorPassword) },
        create: {
            id_camp: campA.id_camp,
            id_role: roleTrabajador.id_role,
            id_person: personTrabajador.id_person,
            usr_username: "trabajador",
            usr_email: "trabajador@base-alpha.com",
            usr_password: await hash(trabajadorPassword),
            usr_is_active: true,
        },
    });

    console.log("  Usuarios creados.");

    // Tipos de recursos y recursos base
    const tipoAlimento = await prisma.resource_types.upsert({
        where: { rst_name: "Alimento" },
        update: {},
        create: { rst_name: "Alimento", rst_is_priority: true, rst_description: "Recursos alimenticios." },
    });

    const tipoAgua = await prisma.resource_types.upsert({
        where: { rst_name: "Agua" },
        update: {},
        create: { rst_name: "Agua", rst_is_priority: true, rst_description: "Recursos hídricos." },
    });

    const tipoDefensa = await prisma.resource_types.upsert({
        where: { rst_name: "Defensa" },
        update: {},
        create: { rst_name: "Defensa", rst_is_priority: false, rst_description: "Munición y armas." },
    });

    const tipoHigiene = await prisma.resource_types.upsert({
        where: { rst_name: "Higiene" },
        update: {},
        create: { rst_name: "Higiene", rst_is_priority: false, rst_description: "Productos de higiene personal." },
    });

    const raciones = await prisma.resources.upsert({
        where: { rss_name: "Raciones de comida" },
        update: {},
        create: { rss_name: "Raciones de comida", id_resource_type: tipoAlimento.id_resource_type, rss_unit: "ración", rss_is_rationable: true },
    });

    const agua = await prisma.resources.upsert({
        where: { rss_name: "Agua potable" },
        update: {},
        create: { rss_name: "Agua potable", id_resource_type: tipoAgua.id_resource_type, rss_unit: "litro", rss_is_rationable: true },
    });

    const municion = await prisma.resources.upsert({
        where: { rss_name: "Munición" },
        update: {},
        create: { rss_name: "Munición", id_resource_type: tipoDefensa.id_resource_type, rss_unit: "unidad", rss_is_rationable: false },
    });

    await prisma.resources.upsert({
        where: { rss_name: "Botiquín médico" },
        update: {},
        create: { rss_name: "Botiquín médico", id_resource_type: tipoHigiene.id_resource_type, rss_unit: "kit", rss_is_rationable: false },
    });

    // Inventario inicial
    await prisma.storage.upsert({
        where: { id_camp_id_resource: { id_camp: campA.id_camp, id_resource: raciones.id_resource } },
        update: {},
        create: { id_camp: campA.id_camp, id_resource: raciones.id_resource, stg_quantity: 150, stg_min_quantity: 50 },
    });

    await prisma.storage.upsert({
        where: { id_camp_id_resource: { id_camp: campA.id_camp, id_resource: agua.id_resource } },
        update: {},
        create: { id_camp: campA.id_camp, id_resource: agua.id_resource, stg_quantity: 200, stg_min_quantity: 80 },
    });

    await prisma.storage.upsert({
        where: { id_camp_id_resource: { id_camp: campA.id_camp, id_resource: municion.id_resource } },
        update: {},
        create: { id_camp: campA.id_camp, id_resource: municion.id_resource, stg_quantity: 500, stg_min_quantity: 100 },
    });

    console.log("  Inventario inicial creado.");

    console.log("\n Seed completado exitosamente.");
    console.log("\nCredenciales (definidas en .env):");
    console.log("  admin      / SEED_ADMIN_PASSWORD       → administrador sistema");
    console.log("  gestion    / SEED_GESTION_PASSWORD     → gestion recursos");
    console.log("  viajes     / SEED_VIAJES_PASSWORD      → encargado de viajes y comunicacion");
    console.log("  trabajador / SEED_TRABAJADOR_PASSWORD  → trabajador");
    console.log("\nCampamento base: Base Alpha\n");
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
