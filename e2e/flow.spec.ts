import { test, expect } from '@playwright/test';
test('mobile demo: create, reach majority, redeem, persist and change language', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByText('Suma puntos.')).toBeVisible();
  await page.getByRole('button', { name: 'Probar con un grupo de ejemplo' }).click();
  await expect(page.getByText('Hola, Alex.')).toBeVisible();
  await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Sumar puntos', exact: true }).first().click();
  await page.getByRole('textbox', { name: '¿Qué has hecho?' }).fill('Organizar una escapada');
  await page.getByRole('textbox', { name: 'Puntos propuestos' }).fill('20');
  await page.getByRole('button', { name: 'Pedir que acepten mis puntos' }).click();
  await expect(
    page.getByText('Organizar una escapada', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  // Switch actors through the demo-only controls in Home.
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.getByRole('button', { name: 'Sam', exact: true }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  const proposal = page
    .getByText('Organizar una escapada', { exact: true })
    .filter({ visible: true })
    .locator('..');
  await proposal.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await expect(proposal.getByText('1 de 2 aprobaciones', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.getByRole('button', { name: 'Dani', exact: true }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await page
    .getByText('Organizar una escapada', { exact: true })
    .filter({ visible: true })
    .locator('..')
    .getByRole('button', { name: 'Aceptar', exact: true })
    .click();
  await expect(
    page.getByText('Organizar una escapada', { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.getByRole('button', { name: 'Alex', exact: true }).click();
  await page.getByRole('tab', { name: 'Canjes' }).click();
  await page.getByRole('button', { name: 'Canjear puntos', exact: true }).first().click();
  await page.getByRole('button', { name: 'Pedir canje al grupo' }).click();
  await expect(page.getByText('CANJE', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await expect(
    page.getByText('30 disponibles para canjear · 30 reservados', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Probar con un grupo de ejemplo' }).click();
  await expect(
    page.getByText('30 disponibles para canjear · 30 reservados', { exact: true }),
  ).toBeVisible();
  for (const member of ['Sam', 'Dani']) {
    await page.getByRole('button', { name: member, exact: true }).click();
    await page.getByRole('tab', { name: 'Pendientes' }).click();
    await page
      .getByText('Yo elijo la película', { exact: true })
      .locator('..')
      .getByRole('button', { name: 'Aceptar', exact: true })
      .click();
    await page.getByRole('tab', { name: 'Inicio' }).click();
  }
  await page.getByRole('button', { name: 'Alex', exact: true }).click();
  await expect(
    page.getByText('30 disponibles para canjear · 30 reservados', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByText('puntos canjeados', { exact: true })
      .locator('..')
      .getByText('30', { exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Grupo' }).click();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByText('Your crew. Your rules. Zero ceremony.')).toBeVisible();
  await page.getByRole('tab', { name: 'Home' }).click();
  await expect(page.getByText('Hi, Alex.')).toBeVisible();
  expect(errors).toEqual([]);
});
test('responsive welcome and demo do not overflow narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.screenshot({ path: 'artifacts/welcome-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Probar con un grupo de ejemplo' }).click();
  await page.getByRole('tab', { name: 'Canjes' }).click();
  await page.screenshot({ path: 'artifacts/rewards-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.screenshot({ path: 'artifacts/home-desktop.png', fullPage: true });
});
test('adjustment requires author acceptance and history shows the previous revision', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con un grupo de ejemplo' }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await page.getByRole('button', { name: 'Proponer puntos' }).click();
  await page.getByRole('textbox', { name: 'Puntos propuestos' }).fill('10');
  await page.getByRole('button', { name: 'Enviar ajuste' }).click();
  await expect(page.getByText('Esperando la respuesta del autor.')).toBeVisible();
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.getByRole('button', { name: 'Sam', exact: true }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await page.getByRole('button', { name: 'Aceptar ajuste y volver a votar' }).click();
  await expect(page.getByText('0 de 2 aprobaciones · revisión 2')).toBeVisible();
  await page.getByRole('tab', { name: 'Historial' }).click();
  await page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page.getByText('REVISIÓN 1', { exact: true })).toBeVisible();
  await expect(page.getByText('He salvado las plantas · 15 pt', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/revision-mobile.png', fullPage: true });
});
