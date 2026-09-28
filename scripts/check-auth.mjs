// Node 24: npm run check:auth loads .env without printing its contents.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Falta configurar .env: EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  process.exit(1);
}
try {
  const base = new URL(url);
  if (base.protocol !== 'https:') throw new Error('Usa la URL HTTPS de tu proyecto Supabase.');
  if (key.startsWith('sb_secret_')) throw new Error('La app solo puede usar una clave pública, nunca una clave secreta.');
  const response = await fetch(new URL('/auth/v1/settings', base), {
    headers: { apikey: key }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Supabase Auth no responde correctamente (HTTP ${response.status}).`);
  const settings = await response.json();
  if (!settings.external?.google) throw new Error('Supabase responde, pero el proveedor Google no está habilitado.');
  console.log('Supabase accesible y Google habilitado.');
  console.log('Pendiente prueba manual: iniciar sesión, volver a la app, cerrar sesión y entrar con la segunda cuenta.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No se pudo comprobar Google.');
  process.exitCode = 1;
}
