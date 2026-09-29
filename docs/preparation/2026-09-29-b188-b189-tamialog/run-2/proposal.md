# Proposition de plan : vitrine, fonctions récentes et mode multi-membre

Brief retenu : `docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`. Rien n'a été écrit, ni fichier ni branche ni commit. Je n'ai pas pu lancer `esq brief pending` ni lire la branche Git : l'état de la branche n'a pas été observé.

## Faits vérifiés
- **Ordre actuel des sections**, identique sur les deux pages (`landing/src/pages/index.astro:60-84` et `en/index.astro:58-66`) : `Steps` → `Forecasting` → `LookingBack` → `Discover` → `Features`.
- **Le vrai avertissement d'écart ne dit pas la phrase du brief.** Le tiroir affiche `topics.spacing.gap.other` : « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » (EN : "{{author}} logged “{{name}}” {{age}} — at least {{gap}} between two entries."). La formule « cette prise demande 6 h d'écart » n'existe pas dans l'app.
  - Le ton est ambre `due` (`border-due/40 bg-due/10 text-due-text`), pas rouge. Le bouton dit « Enregistrer quand même » / "Save anyway".
  - Sources : `frontend/src/components/features/topics/QuickLogSheet.tsx:641-667` et `frontend/src/locales/fr.json:479-503`. Les jetons `due` existent déjà dans `landing/src/styles/landing.css:96-102`.
- **Pastilles de quantité** (`event-answers.tsx:770-811`) : une rangée `flex-wrap gap-2` placée sous le champ. Les valeurs sont des nombres sans unité. La pastille choisie porte `border-primary bg-primary/10`, soit le même style que les pastilles de moment de `QuickLogMock.astro`.
- **La SPEC est incomplète.** Elle documente le filtre par option (`docs/SPEC.md:1320-1336`, « seulement les biberons en poudre, et **leurs** ml »), mais ni la règle d'écart ni les pastilles récurrentes. Pour ces deux-là, je cite le code comme source. Une mise à jour via `/esq:spec` pourra suivre, sans bloquer ce travail.
- **Un commentaire existant contredit le nouvel ordre.** L'en-tête de `LookingBack.astro:13-18` dit que l'étape 3 et `Forecasting` forment une paire, et que « nothing may come between them ». Le brief tranche explicitement pour placer la maisonnée entre les deux, donc je réécris ce commentaire.
- **Quatre lecteurs du seuil de 5 100 px** : `audit.mjs:36,108-115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146`.
- **L'audit mesure 1280 × 800 et 390 × 844.** Le 360 px demandé par le brief ne sera vérifié qu'à la main.

## Résultat pour le visiteur
Juste après avoir vu consigner, le visiteur voit ce qui arrive quand deux aidants ne se parlent pas : l'app prévient que Camille vient déjà de donner la dose. Il voit aussi que le tiroir propose les valeurs habituelles, et que la relecture peut se limiter à un bouton ou à une réponse.

## Disposition
- **Desktop (`lg`)** : trois colonnes, comme aujourd'hui.
  - Colonne 1 : titre et chapeau, puis la **nouvelle tuile d'écart** (`bg-card`, avec une légende au-dessus du fragment). Elle occupe l'espace vide sous le chapeau.
  - Colonne 2 : les trois points.
  - Colonne 3 : la tuile du sélecteur de maisonnée, inchangée.
  - D-le-changement-de-maisonnee-se-montre-dans-sa-section reste donc valable, sans amendement. L'en-tête de `Features.astro` décrira ce nouveau placement.
- **`md`** : deux colonnes. À gauche, titre, chapeau et tuile d'écart ; à droite, les points puis le sélecteur.
- **Mobile** : tout est empilé, dans l'ordre titre, chapeau, écart, points, sélecteur. Le libellé du fragment passe à la ligne au lieu d'être tronqué (D-les-fragments-passent-a-la-ligne-plutot-que-tronquer).
- **Nouveau `fragments/SpacingFragment.astro`**, calqué sur `SwitcherFragment` : un seul `role="img"`, rien de focusable, toutes les chaînes en props. Il dessine l'en-tête « 💊 Acétaminophène », l'avis ambre et le bouton plein « Enregistrer quand même », fidèle à l'app.
- **Types** : `Feature.spacing = { caption, label, title, notice, action }`, avec des clés nommées (D-149).

## Copie FR / EN proposée
- **`hero.subhead`** :
  - FR : « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chaque membre de la maisonnée note d'un geste, et tous voient la même chose au même endroit. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. »
  - EN : "The bottle, the evening pill, the smoke detector’s battery, the cat’s dewormer: every member of the household logs it in one gesture, and everyone sees the same thing in one place. Once a rhythm shows, or once you set the dates yourself, Tamialog tells you what comes next."
- **Légende de la tuile d'écart** :
  - FR : « Un bouton peut porter un écart minimum, choisi par la maisonnée. Si quelqu'un d'autre vient de consigner, l'app le dit avant qu'on enregistre — et n'empêche jamais d'enregistrer quand même. »
  - EN : "A button can carry a minimum gap, set by the household. If someone else has just logged it, the app says so before you save — and never stops you from saving anyway."
- **Texte de l'avis** :
  - FR : « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. »
  - EN : "Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries."
  - Le « 2 h ago » anglais reste à confirmer contre `useElapsedLabel`.
- **Étape 2** : sous « Quantité 1 comprimé » / "Amount 1 tablet", des pastilles `sheet.chips` { first: « 1 » (choisie), second: « 2 » }. La fin de `phoneLabel` devient « …la quantité avec ses valeurs fréquentes, puis la confirmation » / "…the amount with its frequent values, then the confirmation".
- **`lookingBack.points.second`**, réécrit plutôt qu'un cinquième point, pour ne pas ajouter de hauteur :
  - FR : « La période, c'est vous qui la choisissez — 24 h, 7 j, 30 j, ou deux dates —, et un bouton, puis une réponse, resserrent tout le reste : seulement les biberons en poudre, et leurs ml. »
  - EN : "You choose the period — 24 h, 7 d, 30 d, or two dates — and a button, then an answer, narrow everything else: only the powder bottles, and their ml."

## Arbitrages
- **La phrase de l'avis est celle de l'app, pas celle du brief.** La contrainte « chaque fragment dessine l'écran réel » l'emporte. Qui, depuis quand et la règle restent présents.
- **« 6 h » n'apparaît que dans le texte dessiné de l'app**, jamais dans la copie en prose (B-170). La légende présente la règle comme un réglage de la maisonnée, pas comme une posologie.
- **Le bouton est dessiné en terracotta, comme dans l'app.** C'est une exception assumée à l'habitude de `QuickLogMock` (pas de bouton d'action dans un dessin), parce que le brief exige ce bouton. L'audit de contraste le couvre.

## Plus petite livraison complète : une seule phase
1. Déplacer `<Features />` juste après `<Steps />` sur les deux pages et réécrire les en-têtes de `index.astro`, `Features.astro` et `LookingBack.astro`.
2. Ajouter `SpacingFragment`, les types et la copie FR/EN.
3. Ajouter les pastilles au mock `QuickLogMock` (props et types).
4. Réécrire le chapeau du héros et `lookingBack.points.second`.
5. Mesurer, puis fixer `BUDGET.limit` à la page la plus haute plus quelques dizaines de px.
   - Créer la décision `D-le-budget-de-hauteur-passe-a-<N>`, qui remplace l'actuelle, et mettre le nouveau chiffre dans les quatre lecteurs.
   - Mon estimation, non mesurée : environ +100 à 150 px, venus de la colonne 1.

## Vérification
- `(auto)` `pnpm -r build` — `astro check` passe, donc `satisfies Copy` tient en FR et en EN.
- `(auto)` `pnpm --filter landing test` — les tests vitest du paquet `landing` passent.
- `(auto)` `node landing/scripts/audit.mjs --no-build` — code de sortie 0 sur le build déjà fait :
  - AA respecté en clair et en sombre, sans débordement horizontal ;
  - `/` et `/en/` sous le nouveau plafond ;
  - « ~ » au-dessus de la ligne de flottaison.
  - Prérequis : `ensure-driver.mjs`.
- `(auto)` `grep -n "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucune ligne (sortie 1).
- `(manual)` [build de prod servi par run-tamialog, visite neuve] Ouvrir `/` puis `/en/` à 1280 px et à 360 px, en clair et en sombre. Observer :
  - l'ordre étapes → maisonnée → prévision ;
  - l'avis ambre lisible en entier ;
  - les pastilles « 1 » et « 2 » ;
  - aucun défilement horizontal.

## Risques
- La phrase de l'avis s'écarte de la citation du brief : c'est voulu, pour rester fidèle à l'app.
- Séparer l'étape 3 de `Forecasting` affaiblit leur enchaînement. C'est accepté par le brief.
- La valeur EN de `useElapsedLabel` et la place du script de parité `check-locales.mjs` dans le build n'ont pas été vérifiées.

Aucune question bloquante.
