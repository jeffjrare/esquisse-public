**Cible : `vitrine-fonctions-recentes-multi-membre`, à partir de `docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`.** Comme demandé, je n'ai rien écrit, créé ni exécuté ; voici la proposition.

## Ce que le visiteur y gagne
Juste après avoir vu comment on consigne, le visiteur voit que l'app sert à plusieurs : elle prévient quand quelqu'un d'autre vient de faire la même chose. Il voit aussi les pastilles de quantité et le filtre par option.

## Constats vérifiés, dont un écart avec le brief
- **L'app ne dit pas « cette prise demande 6 h d'écart ».** Cette phrase vient de B-528. Le tiroir affiche en réalité, avant l'enregistrement : « {author} a consigné « {name} » {age} — au moins {gap} entre deux saisies. » (`frontend/src/locales/fr.json:482`). Le bouton devient alors « Enregistrer quand même » (`QuickLogSheet.tsx:641-667`).
  - L'encart est ambre (`border-due/40 bg-due/10 text-due-text`), jamais rouge.
  - Comme `Features.astro` impose d'être fidèle à l'app, j'utilise le texte de l'app.
- **Les pastilles de quantité** affichent des nombres seuls, sous le champ qui garde sa valeur. La pastille égale à la valeur du champ est cochée (`event-answers.tsx:770-808`).
- **`docs/SPEC.md` ne décrit ni l'écart minimum ni les pastilles.** Les affirmations de la copie renvoient donc au code ci-dessus et aux résolutions de B-528 et B-529. Il faudra lancer `/esq:spec` ensuite, mais cela ne bloque pas ce travail.
- **`audit.mjs` fait échouer seulement trois choses** : le contraste, le plafond de hauteur et l'alignement de l'en-tête. Le débordement horizontal et la position du « ~ » sont seulement rapportés (lignes 35-44) : il faudra lire ces valeurs. Le format mobile mesuré est 390 px, pas 360.
- **Git est en HEAD détachée.** Un vrai passage de `/esq:plan` n'ajouterait donc pas les champs Branch/Origin. Pour travailler sur une branche comme le demande le brief, il faudra en créer une avant `/esq:build`.

## Disposition
Section maisonnée, dans `Features.astro` :
- **Desktop (`lg`, 3 colonnes)** :
  - colonne 1 : titre, chapeau, puis la **tuile d'écart** ;
  - colonne 2 : les trois points ;
  - colonne 3 : la tuile du sélecteur, sans changement.
- **`md`** : colonne 1 en `md:row-span-2` (titre, chapeau, tuile d'écart). La colonne 2 garde les points puis le sélecteur.
- **Mobile** : l'ordre du DOM donne titre, chapeau, écart, points, sélecteur.

La preuve arrive ainsi juste sous l'affirmation. Le sélecteur garde sa place, ce qui précise D-le-changement-de-maisonnee-se-montre-dans-sa-section sans l'annuler. Je l'inscris dans une nouvelle décision, `D-l-ecart-minimum-prouve-la-maisonnee`.

Nouveau fichier `landing/src/components/fragments/SpacingFragment.astro`, sur le modèle de `SwitcherFragment` :
- `role="img"`, rien de focalisable, toutes les chaînes passées en props ;
- en-tête « 💊 Acétaminophène », encart ambre, bouton « Enregistrer quand même » dans sa vraie couleur terracotta. La section n'a pas d'autre action terracotta, à confirmer à l'écran.

Étape 2 (`QuickLogMock.astro`) : sous le champ, une rangée de pastilles `0,5 · 1 · 2`, la pastille `1` cochée. Le téléphone ne change pas de taille.

## Copie FR / EN
- **`hero.subhead`** (le titre ne change pas) :
  - FR : « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chacun dans la maisonnée note d'un geste, au même endroit, et tous voient ce que les autres ont noté. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. »
  - EN : « The bottle, the evening pill, the smoke detector's battery, the cat's dewormer: everyone in the household logs with one gesture, in one place, and everyone sees what the others logged. Once a rhythm shows, or once you set the dates yourself, Tamialog tells you what comes next. »
- **Légende de la tuile d'écart** (`features.household.spacing.caption`) :
  - FR : « La maisonnée peut fixer un écart minimal sur un bouton. Si un autre membre vient déjà de consigner, le tiroir le dit avant d'enregistrer — et c'est vous qui décidez. »
  - EN : « The household can set a minimum spacing on a button. If another member just logged it, the drawer says so before you save — and the call is yours. »
- **Texte du fragment** :
  - FR : « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. » / « Enregistrer quand même »
  - EN : « Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries. » / « Save anyway »
  - Le libellé accessible (`label`) décrit la même scène. Le « 6 h » est un réglage fictif de la maisonnée, jamais une posologie ; le commentaire d'en-tête le dit.
- **`lookingBack.points.second`**, modifié plutôt qu'ajouté, pour limiter la hauteur :
  - FR : « La période, c'est vous qui la choisissez — 24 h, 7 j, 30 j, ou deux dates. Relisez un seul bouton, puis une seule réponse : seulement les biberons en poudre, et leurs ml. La liste et les chiffres suivent. »
  - EN : « You choose the period — 24 h, 7 d, 30 d, or two dates. Read back one button, then one answer: only the powdered-formula bottles, and their ml. The list and the figures follow. »
- **Pastilles** : `0,5`, `1`, `2` en FR, `0.5`, `1`, `2` en EN. Le champ reste « 1 comprimé » / « 1 tablet ».

## Plus petite livraison complète : une seule phase
Le relèvement du plafond doit rester dans la même phase que les ajouts qui le rendent nécessaire.

1. **Pastilles** dans l'étape 2 : `QuickLogMock.astro`, `steps.two.mock.sheet.chips` dans `fr.json` et `en.json`, puis `copy/types.ts` et `Steps.astro`.
2. **Filtre** : nouveau `lookingBack.points.second` en FR et en EN.
3. **Section maisonnée** :
   - la section passe après `<Steps />` dans `pages/index.astro` et `pages/en/index.astro` ;
   - `SpacingFragment.astro` et la nouvelle disposition de `Features.astro` ;
   - le type `features.household.spacing` et le nouveau `hero.subhead` ;
   - les commentaires d'en-tête réécrits, dont « the household stays, below » ;
   - la décision de disposition.
4. **Plafond** :
   - mesurer, puis fixer `BUDGET.limit` au-dessus de la plus haute page mesurée, en arrondissant à la cinquantaine de px supérieure avec au moins 25 px de marge (l'usage a été de 26 à 35 px) ;
   - reporter le chiffre dans `audit.mjs` (le commentaire et `BUDGET`), `landing/DESIGN.md`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146` ;
   - `D-le-budget-de-hauteur-passe-a-<N>` remplace D-le-budget-de-hauteur-passe-a-5-100, avec pour fondement le mandat du brief.

Mon estimation, non mesurée : environ +150 à 200 px, dus presque entièrement à la tuile d'écart. Le plafond tomberait donc vers 5 250-5 300 px.

## Vérification
- `(auto)` `pnpm -r build` — `astro check` passe, donc `satisfies Copy` reste valide en FR et en EN.
- `(auto)` `pnpm --filter landing test` — `theme.test.ts` et les tests de copie passent.
- `(auto)` `node landing/scripts/audit.mjs --no-build` — code de sortie 0 sous le nouveau plafond (AA clair et sombre, en-tête centré). Dans ce même rapport, lire aussi : aucun débordement horizontal, le « ~ dans 5 h » près de 229 px et au-dessus de la ligne de flottaison, le remplissage des écrans de téléphone ≤ 100 %.
- `(auto)` `grep -rn "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucun résultat.
- `(manual)` [build de preview, skill run-tamialog, sans thème mémorisé] Ouvrir `/` puis `/en/` à 1280 et à 360 px, en clair puis en sombre. Observer :
  - l'ordre Étapes → Maisonnée → Prévision ;
  - le fragment d'écart lisible en entier à 360 px ;
  - la pastille `1` cochée ;
  - aucune section maisonnée sous le bento.

## Risques et mesures encore à obtenir
- La hauteur réelle et le plafond ne sont pas mesurés. Le remplissage de l'écran de l'étape 2 non plus.
- Le libellé de temps écoulé en anglais (« 2 h ago ») doit être comparé à `useElapsedLabel` avant le commit 3.
- Un vrai passage de `/esq:plan` ferait aussi passer B-530 en Planned.

Aucune question en suspens : tous les choix délégués sont tranchés.
