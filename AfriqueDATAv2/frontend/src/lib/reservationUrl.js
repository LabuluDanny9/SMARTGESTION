/**
 * URL publique pour le formulaire de réservation (QR Code)
 * Utiliser REACT_APP_PUBLIC_URL en production
 */
export function getReservationUrl(activityId) {
  const base = process.env.REACT_APP_PUBLIC_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/reserve/${activityId}`;
}

/** URL du calendrier des réservations (formateurs / utilisateurs) */
export function getReservationCalendarUrl() {
  const base = process.env.REACT_APP_PUBLIC_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/reserve`;
}
