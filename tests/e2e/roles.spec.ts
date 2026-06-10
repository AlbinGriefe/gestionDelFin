import { expect, test, type Page } from "@playwright/test";

type DemoAccount = {
  username: string;
  password?: string;
};

const accounts = {
  admin: {
    username: "admin",
    password: process.env.E2E_ADMIN_PASSWORD,
  },
  resources: {
    username: "gestion_alpha",
    password: process.env.E2E_GESTION_ALPHA_PASSWORD,
  },
  travel: {
    username: "viajes_alpha",
    password: process.env.E2E_VIAJES_ALPHA_PASSWORD,
  },
  worker: {
    username: "trabajador_alpha",
    password: process.env.E2E_TRABAJADOR_ALPHA_PASSWORD,
  },
} satisfies Record<string, DemoAccount>;

async function login(page: Page, account: DemoAccount) {
  test.skip(!account.password, `Missing password for ${account.username}`);
  await page.goto("/login");
  await page.getByLabel(/usuario/i).fill(account.username);
  await page.getByLabel(/contrase/i).fill(account.password!);
  await page.getByRole("button", { name: /iniciar sesi/i }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("Poblacion activa")).toBeVisible();
}

test("administrator can review the complete management surface", async ({
  page,
}) => {
  await login(page, accounts.admin);
  const navigation = page.getByRole("navigation", {
    name: "Navegacion principal",
  });
  await expect(
    navigation.getByRole("link", { name: "Personas" }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Usuarios" }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Configuracion" }),
  ).toBeVisible();
  await navigation.getByRole("link", { name: "Personas" }).click();
  await expect(page.getByText(/lista de personas/i)).toBeVisible();
  await navigation.getByRole("link", { name: "Oficios" }).click();
  await expect(
    page.getByRole("heading", { name: "Cobertura actual" }),
  ).toBeVisible();
});

test("resource manager sees inventory, people care and daily process", async ({
  page,
}) => {
  await login(page, accounts.resources);
  const navigation = page.getByRole("navigation", {
    name: "Navegacion principal",
  });
  await expect(
    navigation.getByRole("link", { name: "Inventario" }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Proceso diario" }),
  ).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Usuarios" })).toHaveCount(
    0,
  );
});

test("travel manager sees zones, expeditions and transfers", async ({
  page,
}) => {
  await login(page, accounts.travel);
  const navigation = page.getByRole("navigation", {
    name: "Navegacion principal",
  });
  await expect(
    navigation.getByRole("link", { name: "Expediciones" }),
  ).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Zonas" })).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Traslados" }),
  ).toBeVisible();
  await navigation.getByRole("link", { name: "Zonas" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Zonas de exploracion" }),
  ).toBeVisible();
});

test("worker receives a read-focused navigation", async ({ page }) => {
  await login(page, accounts.worker);
  const navigation = page.getByRole("navigation", {
    name: "Navegacion principal",
  });
  await expect(
    navigation.getByRole("link", { name: "Inventario" }),
  ).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Eventos" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Personas" })).toHaveCount(
    0,
  );
  await expect(
    navigation.getByRole("link", { name: "Expediciones" }),
  ).toHaveCount(0);
});
