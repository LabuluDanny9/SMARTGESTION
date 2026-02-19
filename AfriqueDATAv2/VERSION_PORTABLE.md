# Version exécutable - Smart Gestion

## Lancer directement (double-clic)

1. **Première fois** : double-cliquez sur `COMPILER.bat`
   - Installe les dépendances et compile le projet
   - Peut prendre quelques minutes

2. **Ensuite** : double-cliquez sur `LANCER.bat`
   - Ouvre l'application dans le navigateur (http://localhost:3000)
   - Si le build n'existe pas, compile automatiquement puis lance

## Prérequis

- **Node.js** (v16 ou plus) : [nodejs.org](https://nodejs.org)
- Fichier **.env** dans `frontend/` avec vos clés Supabase (copiez depuis `.env.example`)

## Structure des scripts

| Fichier       | Rôle                                  |
|---------------|----------------------------------------|
| `COMPILER.bat`| Compile le projet (à exécuter 1 fois) |
| `LANCER.bat`  | Lance l'application                   |

## Distribution

Pour partager une version déjà compilée :

1. Exécutez `COMPILER.bat`
2. Copiez le dossier `frontend/build/` + les fichiers `LANCER.bat`, `COMPILER.bat` et `VERSION_PORTABLE.md`
3. Sur la machine cible : Node.js doit être installé, puis double-clic sur `LANCER.bat`

> **Note** : Les clés Supabase doivent être configurées dans `.env` sur chaque machine.
