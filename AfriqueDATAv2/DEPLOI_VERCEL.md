# Déploiement sur Vercel – Smart Gestion

## 1. Prérequis

- Compte [Vercel](https://vercel.com)
- Projet sur [GitHub](https://github.com)
- Projet Supabase configuré

---

## 2. Pousser le code sur GitHub

```bash
cd e:\smartGestion
git init
git add .
git commit -m "Smart Gestion - déploiement Vercel"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git push -u origin main
```

---

## 3. Créer le projet sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous (via GitHub).
2. Cliquez sur **Add New** → **Project**.
3. Importez votre dépôt GitHub.
4. **Important** : définissez le **Root Directory** :
   - Cliquez sur **Edit** à côté de "Root Directory".
   - Choisissez : `SmartGestion/frontend`
   - Validez.

---

## 4. Variables d'environnement

Dans **Settings** → **Environment Variables**, ajoutez :

| Nom | Valeur | Environnement |
|-----|--------|---------------|
| `REACT_APP_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview |
| `REACT_APP_SUPABASE_ANON_KEY` | Votre clé anon Supabase | Production, Preview |
| `REACT_APP_PUBLIC_URL` | `https://votre-app.vercel.app` | Production, Preview |

> **Note** : Après le premier déploiement, remplacez `REACT_APP_PUBLIC_URL` par l’URL réelle de votre projet Vercel (ex. `https://smart-gestion-xxx.vercel.app`).

---

## 5. Déploiement

1. Cliquez sur **Deploy**.
2. Vercel va :
   - installer les dépendances (`npm install`)
   - lancer le build (`npm run build`)
   - déployer le dossier `build`
3. À la fin, vous obtiendrez une URL du type : `https://smart-gestion-xxx.vercel.app`.

---

## 6. Configuration Supabase (CORS)

Dans le dashboard Supabase → **Authentication** → **URL Configuration** :

- **Site URL** : `https://votre-app.vercel.app`
- **Redirect URLs** : ajoutez `https://votre-app.vercel.app/**`

---

## 7. Mises à jour

Chaque `git push` sur la branche `main` déclenche un nouveau déploiement automatique.

---

## Structure attendue du dépôt

```
smartGestion/
├── SmartGestion/
│   ├── frontend/          ← Root Directory Vercel
│   │   ├── package.json
│   │   ├── vercel.json
│   │   ├── public/
│   │   └── src/
│   └── ...
└── ...
```
