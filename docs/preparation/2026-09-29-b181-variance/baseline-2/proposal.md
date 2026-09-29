# Vitrine : le mode à plusieurs, plus haut dans la page et avec une preuve

Ceci est une proposition : aucun fichier n'a été écrit, aucune branche créée, rien n'a été lancé. Sans shell, je n'ai pas pu lire `ESQ_CODEX`, donc Codex n'a pas été utilisé.

## Faits vérifiés qui changent la mise en œuvre

1. **La phrase du tiroir n'est pas celle du brief.** Le vrai texte est `topics.spacing.gap.other` : « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » (`frontend/src/locales/fr.json:482`, EN :482). La règle de `Features.astro` exige les mots de l'app, donc je prends ceux-là et non « cette prise demande 6 h d'écart ».
2. **La couleur de l'avertissement est celle de l'app, pas une alarme.** L'app l'affiche en `border-due/40 bg-due/10 text-due-text` (`QuickLogSheet.tsx:644`). C'est le ton « attendu » ; `due-text` sur `bg-due/10` passe déjà l'AA (`DESIGN.md:53-56`). Le libellé du bouton est `topics.duplicate.confirmAction` : « Enregistrer quand même » / « Save anyway ».
3. **Les pastilles de quantité ne sont que des nombres.** Elles s'affichent sous le champ, en `rounded-xl border`, et celle qui est choisie en `border-primary bg-primary/10` (`event-answers.tsx:783-806`).
4. **`audit.mjs` ne fait pas échouer la position du « ~ ».** Il la signale seulement (`audit.mjs:44`). Il la mesure aussi à 390 × 844, où le chapeau passe au-dessus du téléphone. Le chapeau réécrit ne doit donc pas être plus long que l'actuel.
5. **Le seuil de 5 100 px est écrit à quatre endroits :** `landing/scripts/audit.mjs:36,111-115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146`.

## Ce que le visiteur y gagne

Juste après avoir vu comment on consigne, il voit que les autres membres le voient aussi, et que l'app le prévient quand quelqu'un vient déjà de le faire.

## Disposition de la section maisonnée

- **Desktop (`lg`, 3 colonnes) :**
  - colonne 1 : titre, chapeau, puis la **nouvelle tuile de l'écart** (`lg:row-start-2`) ;
  - colonne 2 : les trois points (`lg:row-span-2`) ;
  - colonne 3 : le sélecteur, inchangé (`lg:col-start-3 lg:row-start-1 lg:row-span-2`).
  - La colonne 1 est la plus courte, c'est donc là que l'ajout coûte le moins en hauteur. D-le-changement-de-maisonnee-se-montre-dans-sa-section reste vraie telle quelle : aucune nouvelle décision de mise en page n'est nécessaire.
- **`md` (2 colonnes) :** titre et chapeau à gauche, les points à droite ; en dessous, la tuile de l'écart et celle du sélecteur côte à côte.
- **Mobile :** tout s'empile dans l'ordre du DOM : titre, points, tuile de l'écart, sélecteur.
- **Nouveau fragment `landing/src/components/fragments/SpacingFragment.astro`,** calqué sur `SwitcherFragment.astro` :
  - un fond `bg-background`, avec un panneau `bg-card shadow-card` : « 💊 Acétaminophène », puis l'avertissement dans les classes de l'app ;
  - « Enregistrer quand même » écrit comme du texte dans un contour `border-border`, **jamais en terracotta** (règle du bento, `DESIGN.md:460`) ;
  - un seul `role="img"`, rien de focusable, toutes les chaînes passées en props.

## Copie FR / EN proposée

| Clé | FR | EN |
|---|---|---|
| `hero.subhead` | « …le vermifuge du chat : à plusieurs, chacun le note d'un geste et toute la maisonnée voit la même chose. Quand un rythme se dessine… » (suite inchangée ; « un seul endroit pour tout » disparaît, le titre le dit déjà) | « …the cat's dewormer: together, each of you logs it in one gesture and the whole household sees the same thing. Once a rhythm shows… » |
| `features.household.spacing.caption` | « Quand un autre membre vient de le faire, l'app le dit avant qu'on le refasse, selon l'écart choisi par la maisonnée. Elle n'empêche jamais d'enregistrer. » | « When another member just did it, the app says so before it's done twice, by the spacing your household chose. It never stops you saving. » |
| `…spacing.notice` | « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. » | « Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries. » |
| `…spacing.action` / `label` | « Enregistrer quand même » ; une description courte du tiroir pour l'accessibilité | « Save anyway » ; idem |
| `steps.two.mock.sheet` | `fieldValue` « 1 comprimé », avec en dessous `chips.first/second/third` : « 0,5 » · « 1 » (choisie) · « 2 » | « 1 tablet » ; « 0.5 » · « 1 » · « 2 » |
| `lookingBack.points.second` | « …ou deux dates — et elle commande la liste et les chiffres ensemble. Un bouton, voire une seule réponse, se lit à part : seulement les biberons en poudre, et leurs ml. » | « …and it governs the list and the figures together. One button, or even one answer, reads on its own: only the formula bottles, and their ml. » |

- **Source des chiffres :** « 6 h » est présenté comme un réglage de la maisonnée ; aucune constante n'apparaît dans la copie (B-170).
- **Source du filtre :** le point sur le filtre s'appuie sur `docs/SPEC.md:1322-1335`.
- **À vérifier à l'exécution (pas encore fait) :** le libellé EN de « il y a 2 h » que produit `useElapsedLabel`, et si le champ Quantité de l'app affiche l'unité à côté de la valeur.

## Arbitrages

- **Pastilles :** je garde la ligne du champ et j'ajoute la rangée de pastilles en dessous, comme dans l'app. Le cadre du téléphone ne grandit pas, donc la page ne gagne aucun px ; il faut seulement que le remplissage mesuré par `audit.mjs` reste sans coupure.
- **Filtre par option :** je modifie le deuxième point plutôt que d'en ajouter un cinquième. Ça coûte environ une ligne de hauteur.
- **Nouveau plafond :** la page la plus haute mesurée, plus 25 à 50 px, arrondi aux 50 px suivants (même logique que les marges de 35 et 26 px des fois précédentes). Il remplace D-le-budget-de-hauteur-passe-a-5-100 par `D-le-budget-de-hauteur-passe-a-<N>`. Le commentaire de `audit.mjs` cite cette décision, sans répéter l'ancien chiffre.
- **Types :** ajouter `spacing` et `chips` dans `landing/src/copy/types.ts` avec des clés nommées, jamais des listes, pour que `satisfies Copy` reste vérifié.

## La plus petite livraison complète : une seule phase, branche `esq/vitrine-fonctions-recentes-multi-membre`

1. **Déplacer la section et ajouter le fragment.** `<Features />` passe entre `<Steps />` et `<Forecasting />` dans `landing/src/pages/index.astro` et `landing/src/pages/en/index.astro`. On ajoute `SpacingFragment`, la grille, les types et la copie, et on réécrit les en-têtes de `Features.astro` et `index.astro`.
2. **Pastilles** dans `landing/src/components/mockups/QuickLogMock.astro`, avec leur copie.
3. **Chapeau du héros et point sur le filtre**, en FR et en EN.
4. **Mesure et plafond.** Mesurer, relever `BUDGET.limit`, ajouter la nouvelle décision dans `docs/DECISIONS.md`, mettre à jour les quatre endroits qui énoncent le seuil, et marquer B-530 `Planned`.

## Vérification proposée (rien n'a été exécuté)

- `(auto)` `pnpm -r build` — `astro check` passe, donc la parité FR/EN est vérifiée.
- `(auto)` `pnpm --filter landing test` — vitest vert.
- `(auto)` `node landing/scripts/audit.mjs` — code de sortie 0 sous le nouveau plafond (AA en clair et en sombre, en-tête centré). Dans sa sortie : aucun « BELOW », aucun débordement horizontal, et la hauteur réelle retenue pour la décision.
- `(auto)` `grep -n "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — ne renvoie rien.
- `(manual)` Avec le skill run-tamialog, sur un build de production, `/` puis `/en/`, à 1280 puis à 360 px, en clair puis en sombre :
  - l'ordre des sections est Étapes → Maisonnée → Prévision ;
  - l'avertissement se lit en entier à 360 px ;
  - une pastille est choisie dans le téléphone de l'étape 2 ;
  - le « ~ dans 5 h » est visible sans défiler.

## Encore à mesurer

La hauteur réelle après les ajouts, et donc la valeur N du plafond. Il ne reste aucune question pour toi : tous les choix délégués sont tranchés ci-dessus.