import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not defined.");

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Crear campamento
  const camp = await prisma.camps.upsert({
    where: { cmp_name: "Campamento Alpha" },
    update: {},
    create: {
      cmp_name: "Campamento Alpha",
      cmp_location: "San José, Costa Rica",
      cmp_max_capacity: 100,
      cmp_status: "active",
    },
  });
  console.log("✅ Campamento creado:", camp.cmp_name);

  // 2. Crear rol admin
  const role = await prisma.roles.upsert({
    where: { rls_name: "Administrador sistema" },
    update: {},
    create: {
      rls_name: "Administrador sistema",
      rls_description: "Acceso total al sistema",
      rls_is_system_role: true,
    },
  });
  console.log("✅ Rol creado:", role.rls_name);

  // 3. Crear usuario admin
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const user = await prisma.users.upsert({
    where: { usr_username: "admin" },
    update: {},
    create: {
      usr_username: "admin",
      usr_email: "admin@gestiondelfin.com",
      usr_password: hashedPassword,
      usr_is_active: true,
      id_role: role.id_role,
      id_camp: camp.id_camp,
    },
  });
  console.log("✅ Usuario creado:", user.usr_username);

  // 4. Crear profesión básica
  const profession = await prisma.professions.upsert({
    where: { pfs_name: "Sin profesión" },
    update: {},
    create: {
      pfs_name: "Sin profesión",
      pfs_description: "Persona sin profesión asignada",
      pfs_collects_resources: false,
      pfs_food_generated_per_day: 0,
      pfs_water_generated_per_day: 0,
      pfs_is_active: true,
    },
  });
  console.log("✅ Profesión creada:", profession.pfs_name);

  // 5. Crear persona de prueba
  const person = await prisma.persons.upsert({
    where: { id_person: 1 },
    update: {},
    create: {
      prn_name: "Juan",
      prn_lastname: "Pérez",
      prn_document_number: "123456789",
      prn_is_accepted: false,
      prn_is_active: true,
      id_camp: camp.id_camp,
      id_profession: profession.id_profession,
    },
  });
  console.log("✅ Persona creada:", person.prn_name, person.prn_lastname);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });