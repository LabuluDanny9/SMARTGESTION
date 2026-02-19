# Smart Gestion – Logique de la plateforme

## Objectif

Faciliter la gestion des paiements pour les activités à la **Salle du Numérique UNILU** (pratiques, cours en ligne, recherche, formations, conférences, réunions).

---

## Acteurs

| Acteur | Accès | Rôle |
|--------|-------|------|
| **Secrétaire (admin)** | Connexion mot de passe | Gestion complète, exports |
| **Étudiant** | QR Code → formulaire | Inscription aux activités |
| **Visiteur** | QR Code → formulaire | Inscription (formations, recherche, conférences) |

---

## Structure académique UNILU

### Facultés

- Médecine
- Sciences sociales et politiques
- Polytechnique
- **ESI** (PreESI, Bac1 avec 4 spécialités)
- Économie
- Agronomie
- Lettres
- Architecture

### Promotions ESI

- PreESI
- Bac1 - Génie Informatique IA
- Bac1 - Génie Civil
- Bac1 - Génie de Procédés
- Bac1 - Génie Électrique

**CRUD :** Ajout/suppression facultés, promotions, étudiants.

---

## Activités (Salle du Numérique)

| Type | Sous-types (ajoutables) |
|------|-------------------------|
| Cours en ligne | — |
| Pratiques | Informatique, Réseaux, IA, Génie Civil, Génie Procédés, Génie Électrique |
| Recherche | — |
| Formation | — |
| Conférence | — |
| Réunion | — |
| Autres | — |

---

## Workflow QR

1. **Admin** crée une activité → **QR unique** généré (`/register/{id}`)
2. **Étudiant/visiteur** scanne le QR → **formulaire**
3. Remplit : nom, faculté, promotion, matricule (si étudiant), montant, côté
4. **Validation** → insertion dans Supabase
5. **Liste à jour** visible immédiatement pour la secrétaire

---

## Exports (par activité)

### Contenu du document (Excel + PDF)

- En-tête : Smart Gestion – Salle du Numérique UNILU
- Détails : nom activité, type, date, heure, durée
- Tableau : N° | Nom | Faculté | Promotion | Montant | Côté
- Pied : Total encaissé (FC), signature secrétaire, date de génération

### Excel

- Feuille 1 : détail participants
- Feuille 2 : statistiques (nombre participants, étudiants vs visiteurs, total)

---

## Base de données (Supabase)

- `admin_profiles` – administrateurs
- `faculties`, `promotions`, `students` – structure académique
- `visitors` – non-étudiants
- `activity_types` – types d’activité (avec sous-types)
- `activities` – activités créées
- `participations` – inscriptions (nom lié à l’activité, date, heure, durée, montant, côté)
