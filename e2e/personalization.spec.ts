import { test, expect } from '@playwright/test';
test('the centered add button stays available on every group screen without resetting the form', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  for (const tab of ['Inicio', 'Pendientes', 'Canjes', 'Historial', 'Configuración']) {
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
  for (const theme of ['Calma', 'Noche', 'Pop']) {
    await page.getByRole('tab', { name: /configuración/i }).click();
    await page.getByRole('radio', { name: theme, exact: true }).click();
    await expect(page.getByRole('radio', { name: theme, exact: true })).toBeChecked();
    await page.getByRole('tab', { name: 'Inicio' }).click();
    await expect(page.getByText('Puntos acumulados', { exact: true })).toBeVisible();
    await page.screenshot({ path: `artifacts/theme-${theme.toLowerCase()}.png`, fullPage: true });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.getByRole('tab', { name: /configuración/i }).click();
  await page.getByRole('radio', { name: 'Noche', exact: true }).click();
  await page.getByRole('tab', { name: 'Inicio' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('tab', { name: /configuración/i }).click();
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
  await expect(page.getByText('¿Rechazar esta solicitud?')).toBeVisible();
  await page.getByRole('textbox', { name: 'Motivo (opcional)' }).fill('No encaja aún');
  await page.getByRole('button', { name: 'Confirmar rechazo' }).click();
  await expect(page.getByText('Sam quiere sumar 15 puntos')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Historial' }).click();
  await page.getByRole('button', { name: 'Ver detalle' }).first().click();
  await expect(page.getByLabel('Alex: Rechazado', { exact: true })).toBeVisible();
  await expect(page.getByText('No encaja aún')).toBeVisible();
  await page.getByRole('button', { name: 'Deshacer mi rechazo' }).click();
  await expect(page.getByText('Alex ha deshecho su rechazo')).toBeVisible();
  await page.screenshot({ path: 'artifacts/voter-states.png', fullPage: true });
});
test('a non-owner can add and remove categories and suggestions with one tap on ×', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('button', { name: 'Sam', exact: true }).click();
  await page.getByRole('tab', { name: 'Configuración' }).click();
  await expect(page.getByRole('heading', { name: 'Configuración de grupo' })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 700 });
  const settingsTab = await page.getByRole('tab', { name: 'Configuración' }).boundingBox();
  const settingsLabel = await page.getByText('Configuración', { exact: true }).boundingBox();
  expect(settingsTab).not.toBeNull();
  expect(settingsLabel).not.toBeNull();
  expect(settingsLabel!.x).toBeGreaterThanOrEqual(settingsTab!.x - 1);
  expect(settingsLabel!.x + settingsLabel!.width).toBeLessThanOrEqual(settingsTab!.x + settingsTab!.width + 1);
  const fontSizes = await Promise.all(['Inicio', 'Configuración'].map((label) => page.getByText(label, { exact: true }).evaluate((el) => getComputedStyle(el).fontSize)));
  expect(fontSizes[1]).toBe(fontSizes[0]);
  await expect(page.getByRole('radio', { name: 'Cool' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Añadir categoría' }).click();
  await page.getByRole('textbox', { name: 'Nombre de la categoría' }).fill('Planes');
  await page.getByRole('button', { name: 'Guardar categoría' }).click();
  await expect(page.getByText('Planes', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Añadir sugerencia' }).click();
  await page.getByRole('textbox', { name: '¿Qué se puede hacer?' }).fill('Organizar salida');
  await page.getByRole('button', { name: 'Planes', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar sugerencia' }).click();
  await expect(page.getByText('Organizar salida')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar sugerencia Organizar salida' }).click();
  await expect(page.getByText('Organizar salida')).toHaveCount(0);
  await page.getByRole('button', { name: 'Añadir sugerencia' }).click();
  await page.getByRole('textbox', { name: '¿Qué se puede hacer?' }).fill('Otra salida');
  await page.getByRole('button', { name: 'Planes', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar sugerencia' }).click();
  await expect(page.getByText('Otra salida')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar categoría Planes' }).click();
  await expect(page.getByText('Planes', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Otra salida')).toHaveCount(0);
  await page.getByRole('button', { name: 'Quitar categoría Cocina' }).click();
  await expect(page.getByText('Preparar una cena')).toHaveCount(0);
});
test('giving points credits the other person immediately without a vote', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('button', { name: 'Otorgar puntos' }).click();
  await expect(page.getByText('Sam', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: '¿Por qué?' }).fill('Por salvar la cena');
  await page.getByRole('textbox', { name: '¿Cuántos puntos?' }).fill('23');
  await page.getByRole('button', { name: 'Otorgar puntos' }).click();
  await page.getByRole('tab', { name: 'Historial' }).click();
  await expect(page.getByText('23 puntos otorgados')).toBeVisible();
  await page.getByRole('tab', { name: 'Configuración' }).click();
  await expect(page.getByText('43 pt')).toBeVisible();
});
test('notification choices are personal and survive a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('tab', { name: 'Configuración' }).click();
  await expect(page.getByRole('switch', { name: 'Solicitudes para revisar' })).toBeChecked();
  await expect(page.getByRole('switch', { name: 'Cambios en el grupo' })).not.toBeChecked();
  await page.getByRole('switch', { name: 'Solicitudes para revisar' }).uncheck();
  await page.reload();
  await page.getByRole('button', { name: 'Probar con una pareja de ejemplo' }).click();
  await page.getByRole('tab', { name: 'Configuración' }).click();
  await expect(page.getByRole('switch', { name: 'Solicitudes para revisar' })).not.toBeChecked();
  await page.getByRole('button', { name: 'Sam', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Solicitudes para revisar' })).toBeChecked();
});
