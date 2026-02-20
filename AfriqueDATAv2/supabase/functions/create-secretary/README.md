# Edge Function : create-secretary (obsolète)

**Cette Edge Function n'est plus utilisée.** L'ajout de secrétaires se fait désormais côté frontend via `frontend/src/lib/createSecretary.js` (signUp Supabase Auth + insert dans `admin_profiles`).

## Prérequis

- La migration `012_admin_profiles_policies.sql` doit être exécutée sur la base (SQL Editor Supabase) pour activer la politique RLS "Admin insert admin profile".

## Test

Paramètres → Ajouter un secrétaire → remplir le formulaire (email, mot de passe, nom).

---

### Ancien déploiement (si vous souhaitez garder l'Edge Function)

1. Installez le [Supabase CLI](https://supabase.com/docs/guides/cli) si nécessaire.
2. Connectez-vous : `supabase login`
3. Liez le projet : `supabase link --project-ref VOTRE_PROJECT_REF`
4. Déployez : `supabase functions deploy create-secretary`
