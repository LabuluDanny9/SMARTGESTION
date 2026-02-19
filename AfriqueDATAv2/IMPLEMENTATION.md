# Smart Gestion – Implémentation Entreprise

**Plateforme intelligente de gestion des activités numériques – Salle du Numérique UNILU**

---

## 1. Interface Admin (UX Premium)

### Layout
- **Sidebar** : Navigation à gauche, repliable (bouton Réduire)
- **Header** : Profil admin (initiales, nom, email) + déconnexion
- **Responsive** : Menu mobile (hamburger) sur tablette et téléphone
- **Thème** : Blanc / Bleu / Gris

### Animations
- `animate-fade-in` : apparition des pages
- `animate-slide-in` : transitions latérales
- Transitions sur les composants

### Composants
| Composant | Chemin | Rôle |
|-----------|--------|------|
| AdminLayout | `components/layout/AdminLayout.jsx` | Layout principal avec header |
| Sidebar | `components/layout/Sidebar.jsx` | Navigation avec sections |
| StudentSearch | `components/StudentSearch.jsx` | Recherche autocomplete étudiants |

---

## 2. Tableau de Bord

- **KPI cards** : Total activités, encaissements, étudiants, visiteurs
- **Recherche globale** : Par activité ou nom d’étudiant (debounce 400 ms)
- **Revenus mensuels** : Graphique en barres (6 derniers mois)
- **Heatmap** : Participation par jour (Lun–Dim) sur 12 semaines
- **Étudiants vs Visiteurs** : Graphique en secteurs
- **Activité récente** : Dernières inscriptions

---

## 3. Gestion des Activités

### Création
- Titre, type, date, heure, durée
- **Capacité max** (optionnel)
- **Prix par défaut** (FC)
- **Notes internes**
- Faculté, département, promotion, formateur
- QR généré automatiquement
- Lien public : `/register/:activityId` ou `/inscription/:activityId`

### Panneau d’activité
- Compteur de participants en direct
- Alerte capacité atteinte
- Revenus totaux
- Recherche rapide étudiant (autocomplete)
- Liste officielle (si promotion ciblée)
- Inscriptions externes (QR)
- Export PDF / Excel

---

## 4. Recherche Étudiants

- **Autocomplete** : Par nom ou matricule
- **Cache** : Dernières sélections (localStorage)
- **Mise en évidence** : Correspondances surlignées
- **Filtrage** : Par faculté ou promotion si activité ciblée

---

## 5. Exports PDF / Excel

### PDF
- En-tête Smart Gestion (bandeau bleu)
- Métadonnées activité
- Tableau : N°, Nom, Faculté, Promotion, Montant, Côté
- Total encaissé, générateur, date/heure
- Pied de page institutionnel

### Excel
- Feuille Activité : en-tête + participants + pied
- Feuille Statistiques : total, étudiants/visiteurs, date

---

## 6. Formulaire QR (Mobile)

- Type : Étudiant / Visiteur
- Nom complet + Montant (pré-rempli si prix par défaut)
- Vérification des doublons (même nom, même activité)
- Contrôle de capacité max
- Écran de confirmation après envoi

---

## 7. Automatisation

- Totaux et stats mis à jour en temps réel
- Détection des doublons (inscription QR)
- Vérifications de capacité sur formulaire public
- Journal d’audit (`audit_logs`) pour traçabilité

---

## 8. Base de Données (Migrations)

| Fichier | Contenu |
|---------|---------|
| `008_activity_capacity_price_notes.sql` | `capacite`, `prix_default`, `notes` sur `activities` |
| `009_audit_logs.sql` | Table `audit_logs` pour traçabilité |

---

## 9. Déploiement

1. **Supabase** : Appliquer les migrations (008, 009)
2. **Frontend** : `npm run build` puis hébergement (Vercel, Netlify…)
3. **Variables** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 10. Stack Technique

- React 19 + React Router 7
- Tailwind CSS
- Supabase (Postgres, Auth)
- Recharts, jsPDF, jspdf-autotable, xlsx, qrcode.react
- lucide-react (icônes)
