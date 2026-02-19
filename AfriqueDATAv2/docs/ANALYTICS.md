# Intelligence Analytics - Smart Gestion

Système d’analytics orienté BI pour la Salle du Numérique UNILU.

## Architecture

- **Sources** : `participations`, `activities`, `activity_types`, `faculties`, `students`, `visitors`
- **Vues SQL** : `supabase/migrations/011_analytics_views.sql`
- **Lib** : `frontend/src/lib/analytics.js` (récupération) + `insightEngine.js` (traitement)
- **UI** : `frontend/src/pages/Analytics.jsx`

## Modules

### 1. Financial Intelligence
- Revenus quotidiens / mensuels
- Tendance mensuelle (bar chart)
- Prévision (moyenne mobile)
- Rentabilité par activité
- Revenu moyen par participant
- Détection pics / chutes

### 2. Participation Intelligence
- Heatmap par jour / semaine (12 semaines)
- Heures de pointe (créneaux horaires)
- Participation par faculté
- Ratio étudiants / visiteurs
- Facultés les plus actives

### 3. Activity Performance
- Performance par type d’activité
- Rentabilité par activité
- Taux de remplissage (capacité)
- Types sous-performants

### 4. Behavioral Analytics
- Utilisateurs récurrents
- Vitesse d’inscription
- Clustering de sessions

### 5. IA / Insights
- Résumés en langage naturel (« Revenus +12 % »)
- Détection anomalies (Z-score)
- Doublons potentiels
- Paiements atypiques (outliers)
- Recommandations (créneaux, jours, types)

## Exécution de la migration

```bash
cd SmartGestion
npx supabase db push
# ou
psql $DATABASE_URL -f supabase/migrations/011_analytics_views.sql
```

## Accès

Menu latéral → **Analytics** (icône Brain).

Si les vues ne sont pas encore créées, la page bascule sur un fallback calculé à partir des participations.
