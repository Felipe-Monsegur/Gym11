/**
 * Emails que ven el panel de Acceso y pueden aprobar pedidos.
 * También marcá `isAdmin: true` en tu doc Firestore `allowedUsers/{uid}`
 * para que las reglas del servidor lo permitan.
 */
export const ADMIN_EMAILS: string[] = [
  'felipemonsegur@gmail.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
