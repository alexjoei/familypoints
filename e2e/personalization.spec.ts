import { test, expect } from '@playwright/test';
test('the centered add button stays available on every group screen without resetting the form', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  for (const tab of ['Inicio', 'Pendientes', 'Canjes', 'Historial', 'Grupo']) {
    await page.getByRole('tab', { name: tab, exact: false }).click();
    const button = page.getByTestId('add-family-points');
    await expect(button).toBeVisible();
    const box = (await button.boundingBox())!,
      viewport = page.viewportSize()!;
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(2);
    expect(box.y).toBeGreaterThan(viewport.height - 170);
    await button.click();
    await expect(page.getByRole('heading', { name: 'Sumar puntos', exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: '¿Qué has hecho?' }).fill('Mi borrador');
    await page.getByTestId('add-family-points').click();
    await expect(page.getByRole('textbox', { name: '¿Qué has hecho?' })).toHaveValue('Mi borrador');
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await page.getByRole('button', { name: 'Ver detalle' }).click();
  await page.getByTestId('add-family-points').click();
  await expect(page.getByRole('heading', { name: 'Sumar puntos', exact: true })).toBeVisible();
});
test('themes are selectable, applied throughout the app, and survive a reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  for (const theme of ['Calma', 'Noche', 'Club', 'Pop']) {
    await page.getByRole('tab', { name: 'Grupo' }).click();
    await page.getByRole('radio', { name: theme, exact: true }).click();
    await expect(page.getByRole('radio', { name: theme, exact: true })).toBeChecked();
    await page.getByRole('tab', { name: 'Inicio' }).click();
    await expect(page.getByText('Puntos acumulados', { exact: true })).toBeVisible();
    await page.screenshot({ path: `artifacts/theme-${theme.toLowerCase()}.png`, fullPage: true });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.getByRole('tab', { name: 'Grupo' }).click();
  await page.getByRole('radio', { name: 'Noche', exact: true }).click();
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('tab', { name: 'Grupo' }).click();
  await expect(page.getByRole('radio', { name: 'Noche', exact: true })).toBeChecked();
  await page.getByTestId('add-family-points').click();
  await page.screenshot({ path: 'artifacts/add-night.png', fullPage: true });
});
test('pending cards show each voter, distinguish viewing from voting and show both outcomes', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('tab', { name: 'Pendientes' }).click();
  await expect(page.getByLabel('Alex: Pendiente', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Dani: Pendiente', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver detalle' }).click();
  await expect(page.getByLabel('Alex: Visto, sin votar', { exact: true })).toBeVisible();
  await expect(page.getByText('Respuesta de tu pareja')).toBeVisible();
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page.getByLabel('Alex: Visto, sin votar', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await expect(page.getByText('Sam quiere sumar 15 puntos')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Historial' }).click();
  await page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page.getByLabel('Alex: Rechazado', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/voter-states.png', fullPage: true });
});
