# CollecteX

Application web locale pour digitaliser les collectes (eglises, associations, tontines) avec stockage dans un fichier JSON.

## Stack

- Frontend: EJS + HTML/CSS/JavaScript
- Backend: Node.js + Express
- Donnees: `data.json` local

## Demarrage

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000/login`.

## Identifiants admin

Par defaut dans `app-config.json`:

- utilisateur: `admin`
- mot de passe: `1234`

## Pages

- `/login`
- `/dashboard`
- `/collecte`
- `/historique`
- `/apropos`

## Exports

- PDF: `/collecte/:id/export/pdf`
- Excel: `/collecte/:id/export/excel`

Les fichiers sont generes dans `exports/`.

## Configuration modifiable

Le fichier `app-config.json` contient:

- identifiants admin
- informations de la page A propos
- options de monetisation futures (abonnement/licence)
