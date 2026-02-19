# Stratégie Responsive - Smart Gestion (Bootstrap 5)

## Breakpoints Bootstrap

| Breakpoint | Taille   | Usage                    |
|------------|----------|--------------------------|
| xs         | <576px   | Mobile portrait          |
| sm         | ≥576px   | Mobile paysage           |
| md         | ≥768px   | Tablette                 |
| lg         | ≥992px   | Desktop                  |
| xl         | ≥1200px  | Grand écran              |
| xxl        | ≥1400px  | Très grand écran         |

## Layout

### Sidebar
- **Desktop (lg+)** : Sidebar fixe à gauche, réductible (72px / 260px)
- **Mobile (<lg)** : Offcanvas au clic sur hamburger, overlay

### Navbar
- **Toujours** : sticky top, recherche (masquée sur xs), profil dropdown (masqué sur xs, icône déconnexion)
- **Mobile** : Bouton menu + titre tronqué

### Contenu
- `container-fluid` : pleine largeur avec padding
- `Row` / `Col` : grille responsive (xs=1 col, sm=2, xl=4 pour KPI)

## Composants

### Cartes KPI
```jsx
<Row xs={1} sm={2} xl={4} className="g-3">
  <Col><Card>...</Card></Col>
</Row>
```
- xs : 1 colonne (stack vertical)
- sm : 2 colonnes
- xl : 4 colonnes

### Tables
- Wrapper : `<div className="table-responsive">` pour scroll horizontal
- `Table hover` pour effet au survol
- Sur mobile : considérer cartes empilées si trop de colonnes

### Formulaires
- Champs : `Form.Floating` (labels flottants)
- Boutons : `btn-mobile-full` sur xs pour pleine largeur
- Modals : `Modal centered size="lg"` pour formulaires

### FAB
- Position fixe en bas à droite
- Visible sur tous les écrans
- Dropdown vers le haut sur mobile

## Animations
- `fade-in` : apparition page
- `card-hover` : léger lift + ombre au survol
- `skeleton` : chargement

## Mobile-first
- Styles de base pour mobile
- `d-none d-sm-flex` : masqué sur mobile
- `d-lg-none` : visible uniquement sur mobile
- `w-100` sur xs pour boutons
