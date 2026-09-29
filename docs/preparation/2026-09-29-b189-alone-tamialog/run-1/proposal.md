J'ai fini de lire. Voici la proposition de plan. Aucun fichier n'a été écrit, aucune branche créée ni aucun commit fait : sans shell, `ESQ_CODEX` et la branche Git n'ont pas pu être lus.

**Plan : `vitrine-fonctions-recentes-multi-membre`**, d'après `docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`.

## Ce que le visiteur y gagne
Juste après avoir vu consigner (étape 2), il voit que les autres le voient. Un membre est même prévenu quand quelqu'un d'autre vient de faire la même chose. Il découvre aussi les pastilles de quantité et le filtre par réponse. Aucun élément n'est retiré.

## Vérifié dans le code
- **Emplacement de l'avertissement.** Il s'affiche dans le tiroir avant l'appui (`frontend/src/components/features/topics/QuickLogSheet.tsx:641-667`), en ambre `bg-due/10 border-due/40 text-due-text`, jamais en rouge. Le bouton devient alors « Enregistrer quand même » / « Save anyway ».
- **La phrase livrée diffère de celle du brief.** L'app dit « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. » (`frontend/src/locales/fr.json:482`, `en.json:482`), pas « cette prise demande 6 h d'écart ». Je retiens la phrase de l'app, parce que la contrainte « vérité contre l'app » l'emporte.
- **Pastilles de quantité.** Ce sont des nombres seuls, sans unité, groupés sous « Valeurs fréquentes » (`frontend/src/components/features/topics/event-answers.tsx:770-811`). La pastille choisie a le style `border-primary bg-primary/10`.
- **Le filtre par réponse** est documenté (`docs/SPEC.md:1322`).
- **Lacune dans SPEC.** Ni l'écart minimum ni les pastilles n'y figurent. La trace passe donc par le code cité ci-dessus. Un `/esq:spec` peut suivre, mais n'est pas un préalable.
- **Lecteurs du seuil de 5 100 px** : `landing/scripts/audit.mjs:36,110-115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524-1527` et `.claude/skills/landing-and-deploy/SKILL.md:146`.

## Disposition
- **Ordre** (dans `landing/src/pages/index.astro` et `landing/src/pages/en/index.astro`) : `Steps`, puis `Features`, puis `Forecasting`, puis `LookingBack`, puis `Discover`.
- **Desktop (`lg`)** : les trois colonnes restent. La 3ᵉ colonne empile deux tuiles : l'écart minimum d'abord (la preuve), puis le sélecteur de maisonnée. D-le-changement-de-maisonnee-se-montre-dans-sa-section reste vraie, donc pas de nouvelle décision pour la mise en page.
- **`md`** : la même pile passe sous les points, en 2ᵉ colonne.
- **Mobile** : tout est empilé. Le fragment utilise `flex-wrap` et `min-w-0`, et la phrase peut passer à la ligne.
- **Nouveau fragment** `landing/src/components/fragments/SpacingFragment.astro`, sur le modèle de `SwitcherFragment.astro` :
  - un puits `bg-background` avec un panneau `bg-card` ;
  - un titre « 💊 Acétaminophène » ;
  - l'avis ambre ;
  - « Enregistrer quand même » dessiné comme une ligne de texte, jamais en terracotta (règle de `DESIGN.md` § bento) ;
  - un seul `role="img"`, rien de focalisable.
- **Mock de l'étape 2** (`landing/src/components/mockups/QuickLogMock.astro`) : le champ « 1 comprimé » est remplacé par la ligne « Quantité · comprimé », suivie des pastilles « 0,5 · 1 · 2 », « 1 » choisie. Le téléphone ne grandit pas.

## Copie proposée FR / EN
| Clé | FR | EN |
|---|---|---|
| `hero.subhead` | Le biberon, le médicament du soir, la pile du détecteur, le vermifuge du chat : à plusieurs, chacun note d'un geste depuis son téléphone, et toute la maisonnée voit la même chose. Quand un rythme se dessine, ou quand vous fixez les dates, Tamialog annonce la suite. | The bottle, the evening pill, the detector battery, the cat's dewormer: everyone logs with one gesture from their own phone, and the whole household sees the same thing. Once a rhythm shows, or once you set the dates, Tamialog tells you what comes next. |
| `features.household.spacing.caption` | Sur un bouton, la maisonnée peut régler un écart. Au moment de consigner, l'app dit qui vient de le faire, et depuis quand. Enregistrer reste toujours possible. | On a button, the household can set a spacing. As you log, the app says who just did it, and how long ago. Saving always stays possible. |
| `…spacing.notice` | Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. | Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries. |
| `…spacing.action` | Enregistrer quand même | Save anyway |
| `lookingBack.points.second` | La période, c'est vous qui la choisissez — 24 h, 7 j, 30 j ou deux dates — et vous pouvez n'y lire qu'un bouton, puis qu'une de ses réponses : seulement les biberons en poudre, et leurs ml. La liste et les chiffres suivent ensemble. | You choose the period — 24 h, 7 d, 30 d or two dates — and can read just one button, then just one of its answers: only the formula bottles, and their ml. The list and the figures follow together. |

Il faut aussi : un `label` accessible pour le fragment, `steps.two.mock.sheet.unit` et `chips.{first,second,third}` avec des clés nommées, pas de liste (`landing/src/copy/types.ts`). Le « 6 h » est présenté comme un réglage de la maisonnée, jamais comme une posologie.

## Plus petite livraison complète : une seule phase
1. Remonter `Features` dans les deux pages et réécrire les en-têtes de `index.astro` et de `Features.astro`.
2. Ajouter `SpacingFragment`, sa tuile et sa copie FR/EN, et étendre les types.
3. Ajouter les pastilles dans `QuickLogMock`, avec `QuickLogCopy` et la copie.
4. Réécrire le chapeau du héros et le point du filtre, et ajouter la trace SPEC dans l'en-tête de `LookingBack.astro`.
5. **Plafond.** Mesurer avec l'audit, puis poser la limite au plus petit multiple de 50 px qui laisse au moins 20 px au-dessus de la page la plus haute. Créer `D-le-budget-de-hauteur-passe-a-<N>`, qui remplace l'ancienne décision (celle-ci passe à « Superseded »), et mettre à jour les quatre lecteurs. Mettre aussi à jour `DESIGN.md` : les sections household et mockups, et la phrase « only the household is left, below it ».

Au tri, B-530 passera à « Planned » avec `esq backlog set-status`.

## Vérification (à exécuter plus tard, pas maintenant)
- `(auto)` `pnpm -r build` — `astro check` confirme que `satisfies Copy` tient en FR et en EN, et le CSP passe.
- `(auto)` `pnpm --filter landing test` — la suite vitest de la vitrine passe.
- `(auto)` `node landing/scripts/audit.mjs` — code de sortie 0 sous `<N>` : AA en clair et en sombre, pas de débordement, en-tête centré, « ~ dans 5 h » visible sans défiler.
- `(auto)` `grep -n "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucun résultat attendu (le code de sortie 1 compte comme réussite).
- `(manual)` Avec le skill `run-tamialog`, ouvrir `/` puis `/en/`, à 1280 puis à 360 px, en clair puis en sombre :
  - la section maisonnée se trouve entre « Comment ça marche » et « Une prévision… » ;
  - l'avis d'écart se lit en entier ;
  - les pastilles apparaissent dans le téléphone de l'étape 2, sans rognage ;
  - il n'y a pas de défilement horizontal.

## Mesures encore à obtenir
- La hauteur réelle. Mon estimation, non mesurée : environ +200 à 250 px, soit un plafond autour de 5 300–5 400.
- La position du « ~ » après le nouveau chapeau, que je garde de longueur égale ou plus court.
- Le contraste de `due-text` sur l'avis posé sur une carte.
- La densité (60 %) du téléphone de l'étape 2 avec la rangée de pastilles.

## Risques
- **Écart avec le brief sur la phrase de l'avis.** Si tu tiens au libellé « cette prise demande… », il faudrait l'écrire différemment de l'app, ce que la règle de vérité interdit.
- Un pic de hauteur plus grand que prévu reste couvert par le principe « on relève, on ne retire rien ».
- Sans section SPEC, le texte sur l'écart ne s'appuie que sur le code.

Aucune question bloquante : toutes les autorités nécessaires sont dans le brief.

**Prochaine étape :** avec le shell disponible, relancer `/esq:plan` sur ce brief pour écrire ce fichier de plan et créer `esq/vitrine-fonctions-recentes-multi-membre`, puis `/esq:build <plan>` (une seule phase).
