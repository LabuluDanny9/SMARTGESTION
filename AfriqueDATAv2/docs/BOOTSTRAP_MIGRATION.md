# Migration Bootstrap 5 - Smart Gestion

## Résumé

La plateforme Smart Gestion utilise maintenant **Bootstrap 5** pour un design responsive, moderne et professionnel, tout en conservant la charte rouge/blanc.

## Ce qui a été livré

### 1. Infrastructure
- **Bootstrap 5.3** + **react-bootstrap** + **bootstrap-icons**
- Thème personnalisé : `src/theme/bootstrap-custom.scss`
  - Primaire rouge (#dc2626)
  - Typographie Plus Jakarta Sans
  - Animations : fade-in, card-hover, skeleton

### 2. Layout responsive
- **AdminLayout** : `d-flex` + `container-fluid`
- **Sidebar desktop (lg+)** : barre fixe, réductible (72px / 260px)
- **Sidebar mobile (<lg)** : Offcanvas au clic sur hamburger
- **Navbar** : sticky, recherche Ctrl+K, dropdown profil, toggle thème

### 3. Dashboard
- **KPI cards** : `Row` / `Col` responsive (1/2/4 colonnes)
- **Charts** : Recharts dans `Card` Bootstrap
- **Table** : `table-responsive`, `Table hover`
- **Recherche** : `InputGroup`, bouton avec `Spinner`
- **Alertes** : cartes avec `card-hover`
- **Skeleton loaders** : pendant le chargement

### 4. Composants
- **GlobalSearch** : Modal Bootstrap (remplace overlay custom)
- **QuickActionsFAB** : Dropdown Bootstrap (align="end", drop="up")
- **FormFloatingInput** : champ avec label flottant

### 5. Stratégie
- Voir `docs/RESPONSIVE_STRATEGY.md` pour les breakpoints et patterns

## Compatibilité

- **Tailwind** : conservé pour les pages non encore migrées (Facultes, Activites, Login, etc.)
- Les deux frameworks coexistent ; les nouveaux composants utilisent Bootstrap

## Prochaines étapes (optionnel)

1. Migrer Login avec `Form.Floating`
2. Migrer les formulaires (Activites, Etudiants) vers Modal + floating labels
3. Migrer les tables (Paiements, etc.) vers `table-responsive` + dropdown d’actions
4. Supprimer Tailwind une fois toute la base migrée

## Structure des fichiers modifiés

```
src/
├── theme/bootstrap-custom.scss   (nouveau)
├── index.js                      (import Bootstrap)
├── index.css                     (Tailwind + compat)
├── components/
│   ├── layout/
│   │   ├── AdminLayout.jsx       (Bootstrap)
│   │   └── Sidebar.jsx           (Bootstrap Icons)
│   ├── ui/
│   │   └── FormFloatingInput.jsx (nouveau)
│   ├── GlobalSearch.jsx          (Modal Bootstrap)
│   └── QuickActionsFAB.jsx       (Dropdown Bootstrap)
└── pages/
    └── Dashboard.jsx             (Bootstrap)
```
