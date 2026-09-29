# Proposition de plan : `vitrine-fonctions-recentes-multi-membre`

Le plan cible est tiré de `docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`. Rien n'a été écrit : pas de branche créée, pas de commit, et le registre n'a pas été modifié. Je n'ai pas pu lire l'état Git (branche non observée). B-530 serait passé en `Planned`.

## Ce que j'ai vérifié dans le code

- **La phrase de l'avertissement ne correspond pas au brief.** L'app livrée dit « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. », et non « cette prise demande 6 h d'écart » (`frontend/src/locales/fr.json:482`, EN :482). La règle du brief est de dessiner l'écran réel, donc j'ai retenu la vraie phrase.
- **L'avertissement est ambre, pas rouge.** Il utilise `border-due/40 bg-due/10 text-due-text` (`QuickLogSheet.tsx:644`), et ces jetons existent déjà dans `landing/src/styles/landing.css:96-102`. Le bouton affiche alors `topics.duplicate.confirmAction`, soit « Enregistrer quand même » / « Save anyway ».
- **Les pastilles de quantité** affichent un nombre seul, sans unité. La pastille choisie a `border-primary bg-primary/10`, les autres `border-border bg-card` (`event-answers.tsx:770-809`). L'app en montre 4 au plus, en ordre croissant (D-une-valeur-frequente-revient-trois-fois).
- **Le seuil 5 100 est énoncé à quatre endroits :** `audit.mjs:36,111,115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146`.
- **`docs/SPEC.md` ne décrit ni l'écart minimum ni les pastilles** (B-528 et B-529 sont pourtant `Done`). Les commentaires d'en-tête citeront donc les décisions et le code : D-la-regle-d-espacement-vit-au-serveur, D-une-valeur-frequente-revient-trois-fois, `QuickLogSheet.tsx`. Pour mettre SPEC à jour, il faudra lancer `/esq:spec` ensuite. Ce n'est pas un préalable. Le filtre, lui, est bien documenté (`SPEC.md:1302-1336`).

## Ce que le visiteur y gagne

Juste après avoir vu consigner, le visiteur voit qu'un autre membre l'a déjà fait. L'app le prévient sans le bloquer. C'est la preuve concrète du « à plusieurs », et elle arrive avant le point où la plupart des visiteurs arrêtent de défiler.

## Disposition

La section `Features` est déplacée entre `<Steps />` et `<Forecasting />` dans `pages/index.astro` et `pages/en/index.astro`. Dans les deux pages, le commentaire « the household stays, below » est réécrit.

- **Ordinateur (`lg`, trois colonnes) :**
  - colonne 1 : titre, chapeau, puis la nouvelle tuile de l'écart ;
  - colonne 2 : les trois points (`lg:row-span-2`) ;
  - colonne 3 : la tuile du sélecteur (`lg:row-span-2`).
  
  La colonne 1 est aujourd'hui la plus courte : c'est là que la tuile coûte le moins de hauteur. Le sélecteur reste en troisième colonne, donc D-le-changement-de-maisonnee-se-montre-dans-sa-section tient toujours et n'a pas besoin d'être remplacée.
- **`md` (deux colonnes) :** ligne 1 = titre et chapeau · points ; ligne 2 = tuile de l'écart · tuile du sélecteur.
- **Mobile (360 px) :** tout est empilé dans l'ordre du DOM : titre, chapeau, points, écart, sélecteur. L'avertissement passe à la ligne au lieu d'être tronqué.

Le nouveau fragment `landing/src/components/fragments/SpacingFragment.astro` suit le modèle de `SwitcherFragment` : `role="img"`, rien de focalisable, toutes les chaînes passées en props. Il dessine l'en-tête « 💊 Acétaminophène », l'avertissement ambre et le bouton « Enregistrer quand même » avec `bg-primary`, comme dans l'app. Ce bouton déroge à la retenue terracotta de `QuickLogMock`. Je l'assume parce que ce bouton est justement ce que la tuile doit prouver.

## Copie FR / EN

**`hero.subhead`** (longueur quasi identique, pour garder le « ~ dans 5 h » visible sans défiler) :
- FR : « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chacun dans la maisonnée note d'un geste, et tous voient la même chose au même endroit. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. »
- EN : « The bottle, the evening pill, the smoke detector's battery, the cat's dewormer: anyone in the household logs it in one gesture, and everyone sees the same thing in one place. Once a rhythm shows, or once you set the dates yourself, Tamialog tells you what comes next. »

**Légende de la tuile de l'écart** (`features.household.spacing.caption`) :
- FR : « Un bouton peut demander un écart entre deux saisies. Si quelqu'un d'autre vient de le faire, l'app le dit avant qu'on enregistre — sans jamais empêcher d'enregistrer. »
- EN : « A button can ask for a gap between two entries. If someone else just logged it, the app says so before you save — and never stops you from saving. »

**Avertissement dans le fragment :**
- FR : « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. »
- EN : « Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries. »
- Le libellé accessible décrit la même scène. Le « 6 h » est présenté comme un réglage de la maisonnée, pas comme une posologie. Le format EN de l'âge (« 2 h ago ») reste à confirmer dans `topics.card.ago` en EN.

**`lookingBack.points.second`**, une phrase ajoutée sans rien retirer :
- FR : « … ensemble. Un bouton, puis une de ses réponses, resserre toute la page : seulement les biberons en poudre, et leurs ml. »
- EN : « … together. Pick a button, then one of its answers, and the whole page narrows to it: only the powdered-formula bottles, and their ml. »

**Pastilles de l'étape 2 :** `sheet.fieldValue` est remplacé par `sheet.chips` { first « 0,5 », second « 1 », third « 2 » } (EN « 0.5 », « 1 », « 2 »). Celle du milieu est choisie, selon la convention `pressedIndex` de `QuickLogMock`. « Quantité » reste le libellé.

## Plus petite livraison complète

Une seule phase sur `landing/`, en quatre commits :

1. Remonter la section maisonnée et y ajouter `SpacingFragment` : `Features.astro`, les deux `index.astro`, `copy/types.ts`, `fr.json`, `en.json`, et les commentaires d'en-tête.
2. Mettre les pastilles de quantité dans le mock de l'étape 2 : `QuickLogMock.astro`, `Steps.astro`, types et copie.
3. Réécrire le chapeau du héros et nommer le filtre dans `lookingBack`, en ajoutant les deux sections du filtre (`SPEC.md:1302-1336`) à la table de vérité de `LookingBack.astro`.
4. Relever le plafond : le nouveau `BUDGET.limit` vaut la page la plus haute mesurée plus environ 25 à 50 px, arrondie. On crée `D-le-budget-de-hauteur-passe-a-<N>`, qui remplace l'ancienne décision (`Superseded`), et on met à jour les quatre lecteurs du seuil.

## Vérification

- `(auto)` `pnpm -r build` — `astro check` et `satisfies Copy` passent sur les quatre paquets.
- `(auto)` `pnpm --filter landing test` — la suite vitest de `landing` passe.
- `(auto)` `node landing/scripts/audit.mjs --no-build` (après la construction du `build` ci-dessus) — sortie 0 : contraste AA en clair et en sombre, pas de débordement, en-tête centré, « ~ » dans la première vue, et document sous le nouveau plafond.
- `(auto)` `grep -rn "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — ne trouve plus aucun seuil en vigueur (seule une mention historique de l'ancienne valeur reste admise).
- `(manual)` [build servi par run-tamialog] Ouvrir `/` et `/en/` à 1280 puis 360 px, en clair puis en sombre. Observer : la section maisonnée entre les étapes et la prévision, l'avertissement lisible en entier, les pastilles dans l'étape 2, et aucune section maisonnée en bas de page.

## Mesures encore à obtenir

- La hauteur réelle après les ajouts, qui fixe `N`.
- La position du « ~ » après la réécriture du chapeau (aujourd'hui à 229 px).
- Le remplissage du téléphone de l'étape 2 : l'audit le signale sans le juger.
- Le contraste de `text-due-text` sur `bg-due/10` en sombre, à confirmer par l'audit.

## Arbitrage à confirmer

Le brief cite l'avertissement avec les mots « cette prise demande 6 h d'écart ». J'ai retenu à la place la phrase que l'app affiche vraiment, pour respecter la règle de vérité contre l'app. Si vous tenez à la formulation du brief, il faudrait modifier le texte de l'app, ce qui est hors périmètre.
