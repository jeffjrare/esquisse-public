> `Planning vitrine-fonctions-recentes-multi-membre, from docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`

# Vitrine : les fonctions récentes et le mode à plusieurs

Je n'ai rien écrit : pas de plan, pas de branche, pas de registre modifié, pas de commit. Codex n'est pas utilisé, faute de shell pour lire `ESQ_CODEX`.

## Ce que j'ai vérifié

- **La section maisonnée arrive en dernier sur les deux pages**, après `<Discover />` : `landing/src/pages/index.astro:84` et `en/index.astro:66`. Aujourd'hui, elle montre seulement le sélecteur de maisonnée, dans une troisième colonne dès `lg`. C'est la décision `D-le-changement-de-maisonnee-se-montre-dans-sa-section` ; le code est dans `Features.astro:58-98`.
- **L'avertissement d'écart n'est pas dans le tiroir.** C'est une fenêtre de confirmation qui s'ouvre par-dessus (`frontend/src/components/features/topics/spacing-confirm.tsx`). Elle contient :
  - le titre « Espacement minimal » ;
  - la phrase « Camille a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. », suivie de « Enregistrer quand même ? » (`frontend/src/locales/fr.json:479-503`) ;
  - les boutons « Annuler » et « Enregistrer quand même ».
- **La tournure du brief n'existe pas dans l'app.** « cette prise demande 6 h d'écart » ne correspond à aucun texte. Le brief exige aussi que chaque fragment reproduise l'écran réel. Je garde donc le texte de l'app.
- **Les pastilles de quantité sont des nombres seuls.** Il n'y a pas d'unité ; la pastille choisie a le style `border-primary bg-primary/10` (`event-answers.tsx:770-809`).
- **Le filtre par réponse est décrit dans le SPEC** (`docs/SPEC.md:1322-1335`) : « seulement les biberons en poudre, et leurs ml ».
- **Le plafond de 5 100 px est écrit à cinq endroits** : `landing/scripts/audit.mjs:36` et `:115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146`.

## Encore à mesurer

- La nouvelle hauteur de `/` et `/en/`, donc le chiffre du nouveau plafond.
- La position du « ~ dans 5 h » une fois le chapeau réécrit (229 px aujourd'hui).
- Le contraste AA des nouveaux fragments, en clair et en sombre.

## Disposition

- **Desktop (`lg`, 1280 px)** : on garde les trois colonnes. La troisième empile deux tuiles `bg-card` :
  1. la tuile existante du sélecteur, avec le quatrième point en légende ;
  2. une nouvelle tuile d'écart, avec un cinquième point en légende, au-dessus de `SpacingFragment`.
  
  La décision existante est complétée, pas remplacée.
- **Tablette (`md`)** : la tuile d'écart occupe la case vide sous le titre (colonne 1, rangée 2). Elle ne coûte donc pas de hauteur.
- **Mobile (360 px)** : tout est empilé dans cet ordre : titre, points, sélecteur, écart. La phrase passe à la ligne (pas de `truncate`) pour rester lisible en entier.

## Copie proposée

| Clé | FR | EN |
|---|---|---|
| `hero.subhead` | « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chacun note d'un geste, et toute la maisonnée voit ce que les autres ont noté. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. » | "The bottle, the evening pill, the smoke detector's battery, the cat's dewormer: everyone logs with one gesture, and the whole household sees what the others logged. Once a rhythm shows, or once you set the dates yourself, Tamialog tells you what comes next." |
| `household.points.fifth` | « Si la maisonnée a fixé un écart pour un bouton, l'app prévient quand quelqu'un d'autre vient déjà de le faire — sans jamais empêcher d'enregistrer. » | "If the household set a spacing on a button, the app warns you when someone else has just done it — without ever stopping you from saving." |
| `household.spacing` (fragment) | Titre « Espacement minimal » ; phrase « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. Enregistrer quand même ? » ; boutons « Annuler » / « Enregistrer quand même » ; `label` pour l'accessibilité | Même texte, repris des chaînes EN de l'app : "Minimum spacing", "Camille logged "Acetaminophen" 2 h ago — at least 6 h between two entries. Save anyway?", "Cancel" / "Save anyway" |
| `lookingBack.points.third` | « …chacun avec l'écart à la période précédente, et se restreignent à un bouton, puis à une de ses réponses : seulement les biberons en poudre, et leurs ml. » | "…each with its change from the previous period, and narrow to one button, then to one of its answers: only the formula bottles, and their ml." |
| `steps.two.mock.sheet` | `fieldValue` devient `fieldValue` + `chips` : « 1 » (choisie), « 2 », « 0,5 » | "1" (selected), "2", "0.5" |

## Arbitrages

1. **Le texte de l'app plutôt que la citation du brief** : c'est la règle de vérité du brief elle-même. Je le signale comme un écart au brief.
2. **Le bouton « Enregistrer quand même » est dessiné en contour neutre, pas en terracotta.** `DESIGN.md` limite la terracotta à une action par écran et interdit tout élément cliquable dans un fragment (lignes 21 et 458). Le mot est gardé, la couleur ne l'est pas.
3. **« 6 h » est présenté comme un réglage de la maisonnée**, dans le fragment seulement, jamais comme une posologie. Il n'y a pas de rouge. Les points restent sans chiffres (B-170).
4. **Aucune nouvelle puce dans « Tout ce qui est noté se relit »** : j'allonge le troisième point pour économiser des pixels.

## Réutilisation

- **Nouveau fragment `landing/src/components/fragments/SpacingFragment.astro`**, sur le modèle de `SwitcherFragment` : `role="img"`, rien de focusable, tous les textes passés en props.
- **Pastilles** : on prolonge `QuickLogMock.astro` avec une prop `chips`, dans le style des pastilles de moment déjà présentes.
- **Types** : on étend `Feature` et le mock de l'étape 2 dans `landing/src/copy/types.ts`. `satisfies Copy` impose la parité FR/EN.

## Plus petite livraison complète : une seule phase, sur `esq/vitrine-fonctions-recentes-multi-membre`

- **Tâche 1** — Remonter la maisonnée après `<Steps />` sur `/` et `/en/`, et réécrire les commentaires d'en-tête (y compris « the household stays, below »).
- **Tâche 2** — Ajouter le fragment d'écart et le cinquième point, en FR et EN, et mettre à jour les en-têtes de `Features.astro` et de la décision complétée.
- **Tâche 3** — Ajouter les pastilles dans le mock de l'étape 2, le filtre dans « Tout ce qui est noté se relit » et le nouveau chapeau du héros.
- **Tâche 4** — Mesurer, puis fixer le plafond à la page la plus haute plus quelques dizaines de px. Créer `D-le-budget-de-hauteur-passe-a-<N>`, remplacer l'ancienne décision et corriger les cinq endroits qui citent 5 100. B-530 passe à Planned.

## Vérification proposée (rien n'a été lancé)

- `(auto)` `pnpm -r build` — vérifie les types (dont `satisfies Copy`) et construit `landing/dist`.
- `(auto)` `pnpm --filter landing test` — les tests vitest du paquet passent.
- `(auto)` `node landing/scripts/audit.mjs --no-build` — sort avec le code 0 sous le nouveau plafond : AA clair et sombre, pas de débordement, « ~ » au-dessus de la ligne de flottaison.
- `(auto)` `grep -rn "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — ne trouve plus rien.
- `(manual)` [skill run-tamialog, sans session] Ouvrir `/` puis `/en/` en 1280 et en 360 px, en clair et en sombre, et vérifier :
  - l'ordre : étapes → maisonnée (avec le sélecteur et l'écart) → prévision ;
  - la phrase d'écart visible en entier ;
  - les pastilles avec « 1 » choisie ;
  - l'absence de section maisonnée en bas de page.

## Risques

- **Le risque principal : un visiteur ne voit pas l'avertissement.** Si la troisième colonne devient trop haute sur desktop, l'écart finit sous la ligne de flottaison de la section. Solution de repli : le placer en colonne 1, sous le titre, comme à `md`.
- Le nouveau chapeau pourrait faire descendre le « ~ » ; l'audit le détecte.

## Question ouverte

Aucune ne manque d'autorité : tous les choix délégués sont tranchés ci-dessus.
