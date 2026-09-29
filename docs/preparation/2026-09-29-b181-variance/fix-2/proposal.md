Proposition de plan, en lecture seule : rien n'a été écrit, aucune branche créée, aucun registre modifié, rien exécuté.

**Cible :** `docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`. Fichier proposé : `docs/plans/2026-09-29-vitrine-fonctions-recentes-multi-membre.md`, branche `esq/vitrine-fonctions-recentes-multi-membre`. La ligne B-530 passerait à `Planned`. Je n'ai pas pu lancer `esq brief pending` ni lire `ESQ_CODEX`, faute de shell ; Codex est donc considéré comme désactivé.

## Faits vérifiés
- Les trois fonctions sont livrées : B-528, B-529 et B-358 sont `Done` dans `docs/BACKLOG.md`.
- **Le texte réel de l'avertissement n'est pas celui que le brief cite.** Dans l'app (`frontend/src/locales/fr.json:482`), il se lit « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » La règle « chaque fragment dessine l'écran réel » l'emporte : je reprends ce texte, pas « cette prise demande 6 h d'écart ».
- L'avertissement s'affiche en ambre (`border-due/40 bg-due/10 text-due-text`, `QuickLogSheet.tsx:644`). Ces couleurs existent déjà dans la vitrine (`landing/src/styles/landing.css:96-102`).
- Les pastilles de quantité n'affichent que des nombres, rangés du plus petit au plus grand. Celle qui est choisie porte `border-primary bg-primary/10` (`event-answers.tsx:786-805`).
- **Deux fonctions manquent dans `docs/SPEC.md`** : l'écart minimum et les pastilles n'y figurent pas. La copie s'appuie donc sur le code de l'app. Mettre la spec à jour relève de `/esq:spec`, en suivi.
- `audit.mjs` mesure en 390 × 844, pas en 360. Il **rapporte** la position du « ~ dans 5 h » et le débordement horizontal, mais ne les juge pas (`audit.mjs:35-44`). Un code 0 ne prouve donc pas que le « ~ » reste au-dessus de la ligne de flottaison.
- Le chiffre 5 100 apparaît à cinq endroits : `landing/scripts/audit.mjs:36` et `:115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524`, `.claude/skills/landing-and-deploy/SKILL.md:146`.

## Ce que le visiteur y gagne
Juste après avoir vu consigner une prise, il voit l'app prévenir un autre membre (« Camille l'a déjà fait il y a 2 h ») sans jamais bloquer l'enregistrement. C'est la preuve concrète du « à plusieurs ».

## Disposition
- **Ordre des sections :** `<Features />` passe entre `<Steps />` et `<Forecasting />` dans `landing/src/pages/index.astro` et `landing/src/pages/en/index.astro`.
- **Grand écran (`lg`), trois colonnes :**
  - colonne 1 : le titre, le chapeau, puis une tuile `bg-card` avec sa légende et le nouveau fragment d'écart ;
  - colonne 2 : les trois points ;
  - colonne 3 : la tuile du sélecteur de maisonnée, sans changement.
  - Mettre la tuile sous le chapeau équilibre les colonnes au lieu d'allonger la troisième. D-le-changement-de-maisonnee-se-montre-dans-sa-section reste valide ; une nouvelle décision `D-l-ecart-minimum-prouve-la-maisonnee-sous-son-chapeau` la complète.
- **Tablette (`md`), deux colonnes :** à gauche le titre, le chapeau et la tuile d'écart ; à droite les points et le sélecteur.
- **Mobile :** tout est empilé — titre, chapeau, tuile d'écart, points, sélecteur.
- **Nouveau fragment `fragments/SpacingFragment.astro`, sur le modèle de `SwitcherFragment` :**
  - `role="img"`, aucun élément focusable, tous les textes passés en props ;
  - l'en-tête du tiroir (💊 Acétaminophène), l'avertissement ambre, puis « Enregistrer quand même ».
- **Arbitrage sur le bouton :** je le dessine en contour neutre, pas en terracotta. Un bouton terracotta dans une image ferait une deuxième action sur la page (D-la-vitrine-n-a-qu-une-porte, et `QuickLogMock` ne dessine déjà aucun bouton pour la même raison). C'est un écart visuel assumé avec l'app, que je noterai dans le commentaire d'en-tête.
- **Étape 2 :** sous « Quantité · 1 comprimé », `QuickLogMock.astro` ajoute une rangée de pastilles « 1 · 2 », la « 1 » choisie. Nouvelle prop `chips`.

## Copie FR / EN
| Clé | FR | EN |
|---|---|---|
| `hero.subhead` | « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chaque membre de la maisonnée note d’un geste, et tout le monde voit la même chose, au même endroit. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. » | “The bottle, the evening pill, the smoke detector’s battery, the cat’s dewormer: everyone in the household logs with one gesture, and everyone sees the same thing, in one place. Once a rhythm shows, or once you set the dates yourself, Tamialog tells you what comes next.” |
| `features.household.spacing.caption` | « Deux personnes, une même dose : si quelqu’un d’autre vient de la consigner, l’app le dit avant qu’on la note, selon l’écart que la maisonnée a choisi. Enregistrer reste à une pression. » | “Two people, one dose: when someone else has just logged it, the app says so before you do, by the spacing your household chose. Saving is still one press away.” |
| `…spacing.notice` | « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. » | “Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries.” |
| `…spacing.action` | « Enregistrer quand même » | “Save anyway” |
| `lookingBack.points.second` (texte actuel + ajout) | « … Choisissez un bouton, puis une de ses réponses, et la liste comme les chiffres se resserrent : seulement les biberons en poudre, et leurs ml. » | “… Pick a button, then one of its answers, and the list and figures narrow with it: only the formula bottles, and their ml.” |

- Le `label` du fragment et le `phoneLabel` de l'étape 2 (« la quantité avec ses valeurs habituelles, l’une choisie ») suivent le même principe.
- Aucun nom de constante n'apparaît dans la copie (B-170). La règle de 6 h est présentée comme un choix de la maisonnée, jamais comme une posologie.
- La phrase sur le filtre est ajoutée à un point existant plutôt qu'en cinquième point, pour coûter moins de hauteur.

## La plus petite livraison complète
Une seule phase, en quatre commits :
1. **Déplacer la section et ajouter le fragment :** `Features.astro`, `SpacingFragment.astro`, les deux pages, `types.ts`, `fr.json`, `en.json`, et les en-têtes réécrits (dont « the household stays, below »).
2. **Pastilles de quantité :** `QuickLogMock.astro`, `Steps.astro`, la copie.
3. **Chapeau du héros et phrase du filtre.**
4. **Relever le plafond de hauteur :**
   - mesurer, puis fixer le plafond à la page la plus haute plus quelques dizaines de px ;
   - créer la décision `D-le-budget-de-hauteur-passe-a-<N>`, qui remplace D-le-budget-de-hauteur-passe-a-5-100 ;
   - mettre à jour les cinq endroits qui citent le seuil.

## Vérification proposée (non exécutée)
- `(auto)` `pnpm -r build` — le typecheck passe, `satisfies Copy` compris.
- `(auto)` `pnpm --filter landing test` — les tests de la vitrine passent.
- `(auto)` `node landing/scripts/audit.mjs --no-build --json` — code 0 sous le nouveau plafond, contraste AA respecté en clair et en sombre. À lire dans le JSON : le « ~ » reste dans le premier écran (vers 229 px) et aucun débordement.
- `(auto)` `grep -rn "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucun résultat.
- `(manual)` [vitrine servie par `pnpm --filter landing preview`, via run-tamialog] Ouvrir `/` puis `/en/` à 1280 et à 360 px, en clair et en sombre, et vérifier :
  - l'ordre : les étapes, puis la maisonnée, puis les prévisions ;
  - le fragment d'écart lisible en entier à 360 px ;
  - les pastilles, avec la « 1 » choisie ;
  - la phrase du filtre ;
  - l'absence de section maisonnée en bas de page ;
  - l'absence de défilement horizontal.

## Mesures encore à obtenir
- La hauteur réelle de `/` et `/en/` après les ajouts, et donc le nouveau plafond.
- La position du « ~ » après la réécriture du chapeau. Mon chapeau fait à peu près la même longueur que l'actuel, mais son effet n'est pas mesuré.

## Risques
- **Le visiteur pourrait lire l'avertissement comme une alarme.** L'ambre est la couleur réelle de l'app. La légende le présente comme une information entre membres, et le bouton neutre montre qu'on peut enregistrer quand même.
- **Écart avec le texte cité par le brief :** je propose la formulation réellement livrée, pas celle du brief.
- **Spec incomplète :** la règle « chaque affirmation se retrouve dans SPEC » ne peut pas être tenue pour l'écart minimum et les pastilles tant que `/esq:spec` n'a pas tourné. La copie cite le code de l'app en attendant.

Aucune question bloquante : toutes les autorités nécessaires sont dans le brief.
