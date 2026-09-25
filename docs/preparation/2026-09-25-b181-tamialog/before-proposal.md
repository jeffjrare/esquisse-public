# Proposition de plan : vitrine multi-membre (lecture seule, aucun fichier écrit)

Cible : `docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`. Le plan s'appellerait `docs/plans/2026-09-25-vitrine-fonctions-recentes-multi-membre.md`.

## Ce que j'ai vérifié, qui change le brief
- **La phrase citée par le brief n'est pas celle de l'app.** Le vrai texte est `topics.spacing.gap.other` : « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » (`frontend/src/locales/fr.json:482`). Il ne dit pas « cette prise demande 6 h d'écart ».
- **L'avertissement n'est pas dans le tiroir.** C'est une boîte de dialogue par-dessus : titre « Espacement minimal », phrase, « Enregistrer quand même ? », puis « Annuler » et « Enregistrer quand même » (`spacing-confirm.tsx:119-141`).
- **Les pastilles de quantité n'affichent qu'un nombre, sans unité.** Celle qui est choisie a le style `border-primary bg-primary/10`, le même que les pastilles de moment déjà dans le mock (`event-answers.tsx:770-811`, `QuickLogMock.astro:109-122`).
- **`audit.mjs` ne juge ni la ligne de flottaison ni le débordement horizontal**, il les rapporte seulement (`audit.mjs:44`). Un code de sortie 0 ne prouve donc pas ces deux points. Il mesure aussi le mobile à 390 px, pas à 360.
- **`docs/SPEC.md` ne décrit encore ni l'écart minimum (B-528) ni les pastilles (B-529).** Ces fonctions sont livrées, mais la SPEC n'a pas été rafraîchie.
- **Le seuil 5 100 figure à quatre endroits** : `audit.mjs:36,106-115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146`.
- **Le dépôt est en HEAD détaché.** Le plan ne pourrait pas remplir **Branch/Origin**. Or le brief exige une branche : il faudra en couper une avant `/esq:build`.

## Ce que le visiteur y gagne
Juste après avoir vu consigner, il voit que la maisonnée entière voit la même chose, et que l'app le prévient quand quelqu'un d'autre vient déjà de le faire.

## Disposition proposée
- **Ordinateur (≥ `lg`)** : on garde les trois colonnes. Colonne 1 : titre et chapeau. Colonne 2 : trois points. Colonne 3 : deux tuiles du bento empilées (`flex-col gap-4`). D'abord le sélecteur (légende = point 4), puis l'écart minimum (légende = nouveau point 5). La colonne 3 devient la plus haute, et c'est ce qui coûte des px.
- **`md`** : deux colonnes. Les deux tuiles vont sous les points, en colonne 2.
- **Mobile** : tout s'empile dans cet ordre : titre, points, sélecteur, écart. C'est l'ordre du parcours du brief.
- **Décision** : une nouvelle `D-la-section-maisonnee-porte-deux-fragments` complète `D-le-changement-de-maisonnee-se-montre-dans-sa-section` au lieu de la défaire.

## Copie proposée (FR / EN)
- **`hero.subhead`** : « … le vermifuge du chat : chacun dans la maisonnée note d'un geste, et tout le monde voit la même chose. Quand un rythme… » / « … the cat's dewormer: anyone in the household logs it in one gesture, and everyone sees the same thing. Once a rhythm… ». La longueur reste proche de l'actuelle.
- **`features.household.points.fifth`** : « Un bouton peut demander un écart entre deux saisies. Si quelqu'un d'autre vient de le faire, l'app le dit au moment de consigner — et laisse enregistrer quand même. » / « A button can ask for a gap between two entries. If someone else has just logged it, the app says so as you log — and still lets you save. »
- **`features.household.spacing`**, reprise mot pour mot de l'app :
  - titre : « Espacement minimal » / « Minimum spacing » ;
  - phrase : « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. Enregistrer quand même ? » / « Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries. Save anyway? » ;
  - boutons : « Annuler / Enregistrer quand même » / « Cancel / Save anyway » ;
  - plus un `label` accessible.
- **`lookingBack.points.second`** : « La période, c'est vous qui la choisissez — 24 h, 7 j, 30 j, ou deux dates — et une pastille resserre tout sur un bouton, puis sur une réponse : seulement les biberons en poudre, et leurs ml. » / « You choose the period — 24 h, 7 d, 30 d, or two dates — and a chip narrows everything to one button, then one answer: only the formula bottles, and their ml. »
- **Étape 2** : `fieldValue` devient `quantityChips {first, second, third}`, avec « 0,5 · 1 · 2 » / « 0.5 · 1 · 2 ». Celle du milieu est choisie, comme `pressedIndex`. Le libellé reste « Quantité », et `phoneLabel` est mis à jour.

## Arbitrages que je tranche
- **Le fragment dessine la vraie boîte de dialogue, et non « le tiroir ».** C'est la règle « vérité contre l'app ». « Annuler » est dessiné aussi, sinon le choix a l'air forcé.
- **Couleurs** : aucune couleur `destructive` ni `due`. Le bouton garde l'aspect `AlertDialogAction`, mais sans rien de focalisable (`role="img"`), comme `SwitcherFragment.astro`.
- **Les 6 h viennent de la maisonnée.** Le commentaire d'en-tête le dit : c'est un réglage de la maisonnée, pas une posologie. La copie ne nomme aucune constante (B-170).
- **La phrase du filtre réécrit un point existant au lieu d'en ajouter un**, ce qui économise des px.

## Réutilisation
- Nouveau `landing/src/components/fragments/SpacingFragment.astro`, sur le modèle de `SwitcherFragment` (props seulement, `bg-background`, `shadow-card`).
- Tuile reprise de `Features.astro:93`.
- Types dans `landing/src/copy/types.ts` (`Feature`, fiche de l'étape 2). C'est `satisfies Copy` qui garantit la parité.
- Déplacer `<Features />` dans `landing/src/pages/index.astro` et `landing/src/pages/en/index.astro`, et réécrire les deux commentaires d'en-tête.

## Plus petite livraison complète : deux phases
1. **Section maisonnée remontée et renforcée, chapeau, pastilles, filtre, en FR et EN.** Une tâche par sujet : déplacement, fragment, pastilles, filtre, chapeau.
   - `(auto)` `pnpm --filter landing build` — `astro check` accepte `satisfies Copy` en FR et en EN.
   - `(auto)` `pnpm --filter landing test` — les tests du paquet passent.
2. **Nouveau plafond mesuré.**
   - Lancer `node landing/scripts/audit.mjs --json`, relever la page la plus haute, puis fixer le plafond au chiffre mesuré plus quelques dizaines de px, comme les 26 et 35 px des fois précédentes.
   - Créer une nouvelle `D-le-budget-de-hauteur-passe-a-<N>` qui remplace l'ancienne (`Superseded`), et mettre à jour les quatre lecteurs du seuil.
   - `(auto)` `node landing/scripts/audit.mjs` — sortie 0.
   - `(auto)` `node landing/scripts/audit.mjs --no-build --json` — le « ~ » est au-dessus de la ligne de flottaison et rien ne déborde horizontalement, pour chaque lecture.
   - `(auto)` `grep -n "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucune ligne (sortie 1 attendue).
   - `(auto)` `pnpm -r build` — les quatre paquets passent.
   - `(manual)` [run-tamialog, `landing/dist`, non connecté] Ouvrir `/` puis `/en/` à 1280 et 360 px, en clair puis en sombre. Observer l'ordre Étapes → Maisonnée → Prévision, les deux tuiles, les pastilles de l'étape 2, et le fragment lisible en entier sans défilement horizontal.

## Mesures encore à obtenir
Le coût en px, le nouveau plafond et la position du « ~ » après la réécriture du chapeau (229 px aujourd'hui). Rien n'est promis avant d'avoir mesuré.

## Un seul prérequis qui dépend de vous
Le brief exige que chaque affirmation se retrouve dans `docs/SPEC.md`, mais la SPEC ne décrit pas encore B-528 ni B-529. Je recommande de lancer `/esq:spec` avant `/esq:build`, et c'est à vous de le déclencher. L'autre option : que les en-têtes citent le code et `DECISIONS.md`, et vous acceptez l'écart.
