/**
 * URL publique pour le formulaire d'inscription (QR Code)
 * En production, définir REACT_APP_PUBLIC_URL dans .env (ex: https://smart-gestion.unilu.ac.cd)
 * Sinon utilise l'origine actuelle (localhost en dev)
 */
export function getRegistrationUrl(activityId) {
  const base = process.env.REACT_APP_PUBLIC_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/register/${activityId}`;
}
