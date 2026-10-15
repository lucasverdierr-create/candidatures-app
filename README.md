# Candidatures — app iPhone

Web app installable sur l'écran d'accueil de l'iPhone. Elle affiche les offres de la table Airtable `Candidatures`, permet de changer le statut, de prendre des notes d'appel et reçoit une notification à chaque nouvelle offre retenue par le scénario Make.

Aperçu sans rien configurer : ouvre `/?demo` une fois le site en ligne.

## 1. Mettre le projet sur GitHub

Les fonctions Netlify ont besoin d'un déploiement par Git (le glisser-déposer ne suffit pas).

```bash
cd candidatures-app
git init && git add . && git commit -m "App Candidatures"
gh repo create candidatures-app --private --source=. --push
```

(ou crée un dépôt privé sur github.com et pousse le dossier)

## 2. Créer le site sur Netlify

1. app.netlify.com → **Add new site → Import an existing project → GitHub** → choisis `candidatures-app`.
2. Laisse les réglages proposés (ils viennent de `netlify.toml`) → **Deploy**.

## 3. Générer les clés de notification (une seule fois)

```bash
npm install
npm run vapid
```

La commande affiche une **Public Key** et une **Private Key**.

## 4. Variables d'environnement

Netlify → ton site → **Site configuration → Environment variables → Add a variable** :

| Variable | Valeur |
|---|---|
| `AIRTABLE_TOKEN` | ton token `pat…` |
| `AIRTABLE_BASE_ID` | `appVqAv9iZbPWkEZ5` |
| `AIRTABLE_TABLE` | `Candidatures` (nom exact de l'onglet) |
| `APP_PIN` | le code d'accès que tu taperas sur l'iPhone (ex. 6 chiffres) |
| `MAKE_SECRET` | une longue chaîne aléatoire, partagée avec Make |
| `VAPID_PUBLIC_KEY` | la Public Key de l'étape 3 |
| `VAPID_PRIVATE_KEY` | la Private Key de l'étape 3 |
| `VAPID_SUBJECT` | `mailto:ton.adresse@gmail.com` |

Puis **Deploys → Trigger deploy → Deploy site** pour qu'elles soient prises en compte.

## 5. Installer l'app sur l'iPhone (iOS 16.4 minimum)

1. Ouvre l'adresse du site dans **Safari**.
2. Bouton **Partager** → **Sur l'écran d'accueil** → Ajouter.
3. Ouvre l'app **depuis l'icône**, tape ton code d'accès.
4. Touche la **cloche** → Autoriser les notifications.

Les notifications ne fonctionnent que depuis l'icône de l'écran d'accueil, pas dans Safari.

## 6. Brancher Make

À la fin de la route du haut (après le module 18 qui crée la fiche Airtable), ajoute **HTTP → Make a request** :

- URL : `https://TON-SITE.netlify.app/api/notify`
- Method : `POST`
- Header : `x-make-secret` → la même valeur que `MAKE_SECRET`
- Body type : Raw · Content type : JSON
- Request content : `{"id": "` + pastille **18 → Data → records → id** + `"}`

La notification affiche « 84/100 · Entreprise » et le poste ; la toucher ouvre directement la fiche.

## Fichiers

- `public/index.html` : l'app (liste, filtres, fiche, statut, notes)
- `public/sw.js` : service worker (hors ligne + notifications)
- `netlify/functions/` : `offres` (lecture), `offre-update` (statut, notes, date), `push-config`, `subscribe`, `notify`
- Le token Airtable reste côté serveur, jamais dans le navigateur.
