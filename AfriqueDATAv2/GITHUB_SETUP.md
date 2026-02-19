# Mettre le projet sur GitHub

## 1. Créer le dépôt sur GitHub

1. Allez sur [github.com](https://github.com) et connectez-vous
2. Cliquez sur **New repository** (ou **+** → **New repository**)
3. Nom du dépôt : `smart-gestion` (ou un autre nom)
4. Description : `Plateforme de gestion des activités - Salle du Numérique UNILU`
5. Choisissez **Public** ou **Private**
6. **Ne cochez pas** "Initialize with README" (le projet existe déjà)
7. Cliquez sur **Create repository**

## 2. Commandes Git (dans le terminal)

```bash
# Se placer dans le dossier du projet
cd e:\smartGestion\SmartGestion

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Smart Gestion UNILU"

# Ajouter le dépôt distant (remplacez VOTRE_UTILISATEUR par votre pseudo GitHub)
git remote add origin https://github.com/VOTRE_UTILISATEUR/smart-gestion.git

# Pousser vers GitHub (branche main)
git branch -M main
git push -u origin main
```

## 3. Si vous utilisez SSH

```bash
git remote add origin git@github.com:VOTRE_UTILISATEUR/smart-gestion.git
git push -u origin main
```

## 4. Mises à jour ultérieures

```bash
git add .
git commit -m "Description des modifications"
git push
```

## ⚠️ Important

- Le fichier **.env** contient vos clés Supabase : il est dans `.gitignore` et ne sera **pas** envoyé sur GitHub.
- Les collaborateurs devront créer leur propre `.env` à partir de `.env.example`.
