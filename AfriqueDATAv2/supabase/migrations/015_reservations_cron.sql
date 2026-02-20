-- Smart Gestion - Planification expiration automatique des réservations
-- Nécessite pg_cron activé (Dashboard Supabase > Integrations > Cron)
-- Alternative manuelle : configurer via Dashboard > Cron > New Job > Database function > expire_old_reservations

-- Planifie l'expiration des réservations toutes les 5 minutes
-- Pour désactiver : SELECT cron.unschedule('expire-old-reservations');
SELECT cron.schedule(
  'expire-old-reservations',
  '*/5 * * * *',
  $$SELECT expire_old_reservations()$$
);
