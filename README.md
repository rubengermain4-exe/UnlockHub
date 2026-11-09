# UnlockHub

Toutes les astuces pour être un vrai rat du web. Accès libre, sans compte ni inscription.

## Structure

- `index.html` — accueil (séquence « déverrouillage » au scroll)
- `astuces.html` — hub des guides, filtre instantané
- `astuces/` — 7 dossiers et 30 guides pratiques
- `outils.html` / `logiciel.html` — catalogue et 21 fiches de logiciels gratuits (données dans `logiciels.js`)
- `apropos.html`, `conditions.html`, `confidentialite.html` — pages d’information
- `assets/site.css` — système de design partagé (couleurs, typo, espacements, composants)
- `assets/home.css`, `assets/home.js` — styles et animations propres à l’accueil
- `assets/ui.js` — navigation, recherche globale, apparitions, sommaire actif
- `assets/search-index.js` — index de la recherche globale (généré)
- `assets/fonts/` — Host Grotesk, hébergée sur le site (aucune requête vers Google Fonts)
- `assets/logos/` — logos des logiciels et crédits

Le site est statique : aucun build n’est nécessaire pour l’afficher.

## Interface

- **Signature :** le verbe de la marque est « déverrouiller ». Sur l’accueil, le cadenas s’ouvre au scroll puis la caméra traverse la serrure. Entre deux pages, la nouvelle page s’ouvre par une serrure (View Transitions, Chrome, Edge et Safari récents ; les autres navigateurs changent de page normalement).
- **Recherche globale :** touche `/` ou `Ctrl K` / `⌘ K` sur toutes les pages.
- **Accessibilité :** contenu visible sans JavaScript, `prefers-reduced-motion` respecté (états finaux, pas de séquence), focus visible, lien d’évitement.

## Ajouter ou modifier une page

1. Copier une page existante du même type (un guide dans `astuces/`, par exemple) et remplacer le contenu de `<main>`.
2. Ajouter la carte du guide dans `astuces.html` et dans la page du dossier concerné.
3. Mettre à jour la recherche : `python3 tools/build-search-index.py`
4. Pour modifier le menu ou le pied de page partout : éditer `tools/chrome.py`, puis `python3 tools/chrome.py`
