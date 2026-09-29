import { test, expect } from '@playwright/test';

test('joining with a pasted group code enables the next step', async ({ page }) => {
  await page.goto('/join');
  const join = page.getByRole('button', { name: 'Entrar para unirme' });
  await expect(join).toBeDisabled();
  await page.getByRole('textbox', { name: 'Pega o escribe el código' }).fill('AB12-CD34-EF56');
  await expect(join).toBeEnabled();
  await join.click();
  await expect(page.getByText('Suma puntos.')).toBeVisible();
  await page.goto('/join');
  await expect(page.getByRole('textbox', { name: 'Pega o escribe el código' })).toHaveValue('ab12cd34ef56');
});

test('a contribution can include a photo visible to the group', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('button', { name: 'Sumar puntos', exact: true }).first().click();
  await page.getByRole('textbox', { name: '¿Qué has hecho?' }).fill('Montar la mesa');
  await page.getByRole('button', { name: 'Más opciones' }).click();
  await page.getByRole('button', { name: /Cambiar fecha/ }).click();
  const now = new Date();
  const chosenDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getDate() === 15 ? '14' : '15'}`;
  await page.getByRole('button', { name: chosenDate }).click();
  await expect(page.getByRole('button', { name: /Cambiar fecha/ })).not.toContainText('Hoy');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Añadir foto' }).click();
  await (await chooser).setFiles('assets/icon.png');
  await expect(page.getByRole('button', { name: 'Cambiar foto' })).toBeVisible();
  await page.getByRole('button', { name: 'Solicitar puntos' }).click();
  const card = page.getByText('Montar la mesa', { exact: true }).filter({ visible: true }).locator('..');
  await expect(card.locator('img')).toBeVisible();
});
test('quick add uses suggestion text without requiring a category', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('button', { name: 'Sumar puntos', exact: true }).first().click();
  await page.getByRole('textbox', { name: '¿Qué has hecho?' }).focus();
  await page.getByRole('button', { name: 'Preparar una cena' }).click();
  await expect(page.getByRole('textbox', { name: '¿Qué has hecho?' })).toHaveValue('Preparar una cena');
  await page.getByRole('button', { name: 'Solicitar puntos' }).click();
  await page.getByRole('tab', { name: 'Historial' }).click();
  await expect(page.getByText('Preparar una cena', { exact: true }).first()).toBeVisible();
  await page.getByRole('tab', { name: 'Configuración' }).click();
  await page.getByRole('button', { name: 'Quitar sugerencia Preparar una cena' }).click();
  await page.getByRole('tab', { name: 'Historial' }).click();
  await expect(page.getByText('Preparar una cena', { exact: true }).first()).toBeVisible();
});

test('group shows member balances and votes on the negative balance limit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('tab', { name: /configuración/i }).click();
  const members = page.getByText('Miembros y puntos acumulados', { exact: true }).locator('..');
  await expect(members.getByText('40 pt')).toBeVisible();
  await expect(members.getByText('20 pt')).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar límite de saldo' }).click();
  await page.getByRole('textbox', { name: 'Puntos negativos permitidos' }).fill('100');
  await page.getByRole('button', { name: 'Pedir acuerdo al grupo' }).click();
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.getByRole('button', { name: 'Sam', exact: true }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await expect(page.getByText('Alex propone un límite de 100 puntos negativos')).toBeVisible();
  await page.getByRole('button', { name: 'Aceptar', exact: true }).last().click();
  await page.getByRole('tab', { name: /configuración/i }).click();
  await expect(page.getByText('Hasta 100 puntos negativos')).toBeVisible();
});
test('mobile demo: create, reach majority, redeem, persist and change language', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByText('Suma puntos.')).toBeVisible();
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await expect(page.getByText('Hola, Alex.')).toBeVisible();
  await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Sumar puntos', exact: true }).first().click();
  await page.getByRole('textbox', { name: '¿Qué has hecho?' }).fill('Organizar una escapada');
  await page.getByRole('textbox', { name: '¿Cuántos puntos?' }).fill('20');
  await page.getByRole('button', { name: 'Solicitar puntos' }).click();
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
  await expect(
    page.getByText('Organizar una escapada', { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.getByRole('button', { name: 'Alex', exact: true }).click();
  await page.getByRole('tab', { name: 'Canjes' }).click();
  await page.getByRole('button', { name: 'Canjear puntos', exact: true }).nth(1).click();
  await page.getByRole('button', { name: 'Pedir canje al grupo' }).click();
  await expect(page.getByText('CANJE', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await expect(
    page.getByText('30 disponibles para canjear · 30 reservados', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await expect(
    page.getByText('30 disponibles para canjear · 30 reservados', { exact: true }),
  ).toBeVisible();
  for (const member of ['Sam']) {
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
  await page.getByRole('tab', { name: /configuración/i }).click();
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
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
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
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await page.getByRole('button', { name: 'Proponer puntos' }).click();
  await page.getByRole('textbox', { name: 'Puntos propuestos' }).fill('10');
  await page.getByRole('button', { name: 'Enviar ajuste' }).click();
  await expect(page.getByText('Esperando la respuesta de Sam.')).toBeVisible();
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.getByRole('button', { name: 'Sam', exact: true }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await page.getByRole('button', { name: 'Aceptar los nuevos puntos' }).click();
  await expect(page.getByText('He salvado las plantas', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Historial' }).click();
  await page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page.getByText('REVISIÓN 1', { exact: true })).toBeVisible();
  await expect(page.getByText('He salvado las plantas · 15 pt', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/revision-mobile.png', fullPage: true });
});
