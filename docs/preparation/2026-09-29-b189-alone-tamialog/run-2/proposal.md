# Proposition de plan : la vitrine montre les fonctions récentes et met le mode à plusieurs en avant

C'était une évaluation en lecture seule. Je n'ai écrit aucun fichier, créé aucune branche, fait aucun commit et lancé aucune commande. Git n'a pas été consulté. B-530 (`docs/BACKLOG.md:632`) passerait en `Planned`.

## Faits vérifiés
- **Ordre actuel :** `<Features />` vient en dernier, après `<Discover />`, dans `landing/src/pages/index.astro:84` et `landing/src/pages/en/index.astro:66`.
- **Disposition actuelle :** trois colonnes dès `lg` et deux dès `md` (`Features.astro:58-98`).
- **Le vrai texte de l'avertissement** (`frontend/src/locales/fr.json:482`) est : « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » Il s'affiche dans un encadré `border-due/40 bg-due/10 text-due-text` (`QuickLogSheet.tsx:644`). Le bouton devient « Enregistrer quand même » (`:666`).
- **Les vraies pastilles** n'affichent qu'un nombre, sous le champ. La pastille choisie est `border-primary bg-primary/10` (`event-answers.tsx:800-805`).
- **Le filtre par option** est décrit dans SPEC (`docs/SPEC.md:1297`, `:1324`).
- **Trou dans SPEC :** aucune section ne couvre l'avertissement d'espacement ni les pastilles de valeurs fréquentes. `SPEC:974` concerne le doublon, pas l'espacement. Les commentaires d'en-tête citeront donc le code. Mettre SPEC à jour avec `/esq:spec` reste une suite à lancer par l'utilisateur, pas un préalable.
- **Cinq endroits énoncent le seuil de 5 100 px :** `audit.mjs:36`, `audit.mjs:115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146`.

## Ce que le visiteur y gagne
Juste après avoir vu comment on consigne, il voit que les autres le voient. Il voit aussi que l'app évite la double prise quand deux aidants ne se parlent pas.

## Disposition
- **`lg` :** colonne 1 = titre, chapeau, puis **la nouvelle tuile d'écart**. Elle comble le vide sous un chapeau de deux lignes, donc elle coûte peu de hauteur. Colonne 2 = les trois points. Colonne 3 = le sélecteur, sans changement.
- **`md` :** colonne 1 = titre, chapeau, tuile d'écart. Colonne 2 = points, puis sélecteur.
- **Mobile (360 px) :** titre, chapeau, tuile d'écart, points, sélecteur.

D-le-changement-de-maisonnee-se-montre-dans-sa-section reste valable telle quelle : on ne crée pas de nouvelle décision, on met seulement l'en-tête à jour.

**Nouveau fragment `fragments/SpacingFragment.astro`**, sur le modèle de `SwitcherFragment` : `role="img"`, aucun élément focusable, tous les textes passés en props. Il contient :
- le titre « 💊 Acétaminophène » ;
- l'encadré aux teintes `due` déjà validées AA par `UpcomingMock`, jamais rouge ;
- une copie non interactive du bouton.

## Copie proposée

**Tuile d'écart, légende**
- FR : « Si quelqu'un d'autre vient de le faire, l'app le dit dès l'ouverture du tiroir, avec son nom et l'heure — et laisse quand même enregistrer. »
- EN : « If someone else just did it, the app says so as the drawer opens — who, and when — and still lets you save. »

**Fragment** (textes repris de l'app, mot pour mot)
- FR : « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. » · « Enregistrer quand même »
- EN : « Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries. » · « Save anyway »
- La forme anglaise de « il y a 2 h » est à confirmer contre les clés de `elapsedLabel`.

**Chapeau du héros**
- FR : « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : un geste pour noter, un seul endroit pour toute la maisonnée, et chacun voit ce que les autres ont déjà fait. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. »
- EN : « …one gesture to log, one place for the whole household, and everyone sees what the others already did. Once a rhythm shows… »

**`lookingBack.points.second`, réécrit plutôt qu'ajouter un cinquième point (moins de hauteur)**
- FR : « La période — 24 h, 7 j, 30 j ou deux dates —, le bouton et la réponse se choisissent et se cumulent : seulement les biberons en poudre, et leurs ml. La liste et les chiffres suivent ensemble. »
- EN : « The period — 24 h, 7 d, 30 d or two dates —, the button and the answer are yours to pick, and they stack: only the powder bottles, and their ml. The list and the figures follow together. »

**Pastilles de l'étape 2**
- Le champ garde « Quantité · 1 comprimé ». Dessous : `0,5 · 1 · 2`, avec « 1 » choisie (EN : `0.5 · 1 · 2`).
- `steps.two.phoneLabel` ajoute « et les valeurs fréquentes, 1 choisie ».

## Arbitrages
1. **Le texte cité dans le brief entre en conflit avec la règle « vérité contre l'app ».** Le brief cite « cette prise demande 6 h d'écart », mais le tiroir dit « au moins 6 h entre deux saisies ». Je retiens le texte de l'app : il est vrai, et il présente la règle comme un réglage, pas comme une posologie. Tu peux inverser ce choix, mais la vitrine montrerait alors une phrase que l'app n'affiche pas.
2. **Le bouton « Enregistrer quand même » est dessiné** parce que le brief l'exige. Cela s'écarte de la retenue de `QuickLogMock.astro:20-22`, qui évite de dessiner une action terracotta. Je le justifie dans l'en-tête du fragment.
3. **Types :** j'ajoute `Feature.spacing` (label, caption, title, emoji, notice, action) et `steps…sheet.chips {first, second, third}` dans `copy/types.ts`. `satisfies Copy` impose ainsi la parité FR/EN.
4. **Nouveau plafond** = la page la plus haute mesurée, plus environ 30 px, arrondi. Il sera nommé `D-le-budget-de-hauteur-passe-a-<N>`, et l'ancienne décision passera à `Superseded`.

## La plus petite livraison complète
Une seule phase, sur la branche `esq/vitrine-fonctions-recentes-multi-membre`, en cinq commits :
1. Remonter `<Features />` après `<Steps />` sur les deux pages, et réécrire les commentaires (`index.astro:76-81`, `Features.astro`).
2. Ajouter `SpacingFragment` et la tuile dans la section maisonnée (`Features.astro`, `types.ts`, `fr.json`, `en.json`).
3. Ajouter les pastilles dans `mockups/QuickLogMock.astro`, `Steps.astro:100-103` et la copie.
4. Réécrire le chapeau du héros et `lookingBack.points.second`.
5. Mesurer, relever le plafond dans les cinq endroits cités plus haut, et ajouter la décision dans `docs/DECISIONS.md`.

## Vérification proposée (non exécutée)
- `(auto)` `pnpm --filter landing build` — `astro check` passe, donc `satisfies Copy` reste vrai en FR et en EN.
- `(auto)` `pnpm --filter landing test` — la suite vitest passe.
- `(auto)` `node landing/scripts/audit.mjs` — code 0 : AA en clair et en sombre, aucun débordement, « ~ dans 5 h » au-dessus de la ligne de flottaison, hauteur sous le nouveau plafond.
- `(auto)` `grep -n "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucun résultat.
- `(auto)` `pnpm -r build` — tout le dépôt se compile.
- `(manual)` Avec run-tamialog, sur `/` puis `/en/` à 1280 et à 360 px, en clair et en sombre : l'ordre est étapes → maisonnée → prévision ; le fragment d'écart est lisible en entier ; les pastilles sont visibles ; il n'y a plus de section maisonnée en bas.

## Encore à mesurer
- La hauteur finale en FR et en EN.
- La position du « ~ dans 5 h » (229 px aujourd'hui).
- Le contraste du bouton dessiné en sombre.

Il n'y a aucune question bloquante : seul le point 1 des arbitrages est à confirmer ou à inverser.
