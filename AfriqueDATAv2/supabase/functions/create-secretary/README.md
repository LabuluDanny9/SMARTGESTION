# Edge Function : create-secretary

Cette fonction permet aux administrateurs connectés d'ajouter un nouveau secrétaire depuis l'application.

## Déploiement

1. Installez le [Supabase CLI](https://supabase.com/docs/guides/cli) si nécessaire.
2. Connectez-vous : `supabase login`
3. Liez le projet : `supabase link --project-ref VOTRE_PROJECT_REF`
4. Déployez : `supabase functions deploy create-secretary`

Le `SUPABASE_SERVICE_ROLE_KEY` est automatiquement disponible dans les Edge Functions.

## Test

Depuis l'app : Paramètres → Ajouter un secrétaire → remplir le formulaire.
