# UnlockHub

Toutes les astuces pour être un vrai rat du web. Accès libre, sans compte ni inscription.

## Structure

- `index.html` — accueil
- `outils.html` / `logiciel.html` — catalogue et 21 fiches de logiciels gratuits
- `astuces.html` — hub des guides
- `astuces/` — 7 catégories et 30 guides pratiques
- `apropos.html`, `conditions.html`, `confidentialite.html` — pages d'information
- `assets/site.css` — styles partagés des nouvelles pages
- `assets/logos/` — logos des logiciels et crédits

Les pages d'astuces sont statiques : aucun build n'est nécessaire pour les modifier.

## Interface

UI « UnlockHub OS » : barre de menus fixe, fenêtre façon Finder, cartes à ombre dure et zéro hero. Le style partagé est dans `assets/site.css`, la barre de menus est injectée dans chaque page et l'horloge est gérée par `assets/ui.js`.
