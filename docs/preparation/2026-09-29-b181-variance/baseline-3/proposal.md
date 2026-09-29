Je n'ai rien écrit, créé aucune branche et rien lancé : c'est une évaluation en lecture seule. Faute de shell, `ESQ_CODEX` n'a pas pu être lu, donc rien de Codex. La commande `esq` n'a pas été lancée non plus. Le plan irait dans `docs/plans/2026-09-29-vitrine-fonctions-recentes-multi-membre.md`, sur la branche `esq/vitrine-fonctions-recentes-multi-membre`.

## Deux écarts trouvés en lisant le code

1. **La phrase du brief n'est pas celle de l'app.** Le vrai tiroir dit : « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » (`frontend/src/locales/fr.json:482`), et non « cette prise demande 6 h d'écart ». Le brief exige de dessiner le vrai tiroir, donc on reprend la phrase de l'app. Le bouton est bien « Enregistrer quand même » (`topics.duplicate.confirmAction`, `QuickLogSheet.tsx:666`). L'encadré utilise le jeton ambre `due` (`QuickLogSheet.tsx:644`), ni rouge ni vert, ce qui respecte la contrainte « pas d'alarme ».
2. **`docs/SPEC.md` ne décrit ni l'écart minimum ni les pastilles de quantité.** Seul le filtre par option y est (l. 1324). Pour ces deux fonctions, les commentaires d'en-tête citeront donc le code : `QuickLogSheet.tsx:638-649`, `event-answers.tsx:770-809`, `spacing.gap.*`. Mettre SPEC à jour avec `/esq:spec` reste une suite à lancer par l'utilisateur, pas un préalable.

## Ce que le visiteur y gagne

Juste après avoir vu consigner une prise, il voit que les autres membres le voient aussi. Et l'app le prévient quand quelqu'un vient déjà de le faire.

## Disposition (section maisonnée, `Features.astro`)

| Largeur | Colonne 1 | Colonne 2 | Colonne 3 |
|---|---|---|---|
| `lg` | titre, chapeau, **tuile écart** | 3 points | tuile du sélecteur (inchangée) |
| `md` | titre, chapeau, tuile écart | 3 points, puis sélecteur | — |
| < `md` (360 px) | tout empilé : titre, chapeau, tuile écart, points, sélecteur | | |

- La colonne 1 ne contient aujourd'hui que le titre et deux lignes de chapeau : la tuile y tient avec le moins de hauteur ajoutée.
- D-le-changement-de-maisonnee-se-montre-dans-sa-section reste valable, puisque le sélecteur garde sa place. Il suffit de le noter dans le commentaire d'en-tête, sans nouvelle `D-…`.
- La tuile écart reprend la tuile du bento (`bg-card`, avec une légende).
- Son contenu vient d'un nouveau `fragments/SpacingFragment.astro`, construit sur le modèle de `SwitcherFragment.astro` : `role="img"`, aucun élément focusable, tous les textes en props.
- Le fragment montre l'en-tête du tiroir (💊 + nom), l'encadré ambre avec la phrase, puis le bouton dessiné comme un simple `span`.

## Copie proposée (FR / EN)

**Légende de la tuile écart**
- FR : « Une tuile peut demander un temps minimum entre deux saisies : l'app prévient quand quelqu'un d'autre vient déjà de le faire, sans jamais bloquer. »
- EN : « A tile can ask for a minimum time between entries: the app tells you when someone else just did it, and never blocks you. »

**Fragment**
- FR : « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. » · « Enregistrer quand même »
- EN : le texte de `en.json:482`, mot pour mot (« Camille logged “Acetaminophen” 2 h ago — at least 6 h between entries. ») · « Save anyway »
- Le « 6 h » est présenté comme un réglage choisi par la maisonnée, pas comme une posologie.
- Le format exact de `{{age}}` est à confirmer contre `elapsedLabel`.

**`hero.subhead`** : seul le milieu de la phrase change.
- FR : « … le vermifuge du chat : à plusieurs, chacun note d'un geste et voit ce que les autres ont déjà fait. Quand un rythme se dessine… »
- EN : « … the cat's dewormer: everyone who shares the job logs it in one tap and sees what the others already did. When a rhythm… »
- La longueur reste proche de l'actuelle, pour garder « ~ dans 5 h » à 229 px environ.

**`lookingBack.points.second`**, phrase ajoutée à la fin :
- FR : « Une pastille resserre tout sur un bouton, puis sur une réponse : seulement les biberons en poudre, et leurs ml. »
- EN : « A chip narrows everything to one button, then to one answer: only the formula bottles, and their ml. »

**Mock de l'étape 2**
- Sous « Quantité », une rangée de pastilles « 1 », « 2 », « 3 », avec « 1 » choisie (`border-primary bg-primary/10`, comme dans `event-answers.tsx:802`).
- Nouvelle clé `sheet.recurring` ; `phoneLabel` est mis à jour dans les deux langues.

Tous les types sont ajoutés dans `landing/src/copy/types.ts`, et `satisfies Copy` garantit la parité FR/EN.

## La plus petite livraison complète : une seule phase, cinq commits

1. **Remonter la section.** `<Features />` passe entre `<Steps />` et `<Forecasting />`, dans `pages/index.astro` et `pages/en/index.astro`. Les deux en-têtes sont réécrits, dont la phrase « the household stays, below ».
2. **Ajouter la tuile écart.** Création de `SpacingFragment.astro`, modification de la grille de `Features.astro`, ajout des clés FR/EN.
3. **Ajouter les pastilles.** `QuickLogMock.astro` gagne une prop `recurring`, et `Steps.astro` la lui passe. Je n'ai pas encore lu `Steps.astro`.
4. **Réécrire la copie.** `hero.subhead` et `lookingBack.points.second`.
5. **Relever le plafond, une fois la page mesurée.**
   - Nouveau plafond : la page la plus haute plus 25 à 50 px, arrondi comme pour le passage à 5 100 (5 065 px mesurés → 5 100).
   - Une décision `D-le-budget-de-hauteur-passe-a-<N>` remplace D-le-budget-de-hauteur-passe-a-5-100, qui passe en `Superseded`.
   - Les quatre lecteurs du seuil énoncent le nouveau chiffre : `audit.mjs:36,115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524`, `.claude/skills/landing-and-deploy/SKILL.md:146`.

## Vérification

- `(auto)` `pnpm -r build` : la vérification de types Astro passe, `satisfies Copy` compris.
- `(auto)` les tests vitest du paquet `landing` passent.
- `(auto)` `node landing/scripts/audit.mjs` se termine avec le code 0 : hauteur, contraste AA en clair et en sombre, pas de débordement, « ~ dans 5 h » au-dessus de la ligne de flottaison.
- `(auto)` une recherche de « 5 100 » ou « 5100 » dans les quatre lecteurs ne trouve plus rien.
- `(manual)` [build local, avec le skill run-tamialog] ouvrir `/` puis `/en/` à 1280 et à 360 px, en clair et en sombre. Vérifier l'ordre des sections, la tuile écart lisible en entier, les pastilles « 1 » choisie, le chapeau, et l'absence de section maisonnée en bas.

## Risques et mesures encore à obtenir

- **Hauteur réelle et nouveau chiffre** : inconnus avant construction ; si la colonne 1 dépasse la colonne 2 à `lg`, la section grandit plus que prévu.
- **Position du « ~ dans 5 h »** après la réécriture du chapeau : à mesurer.
- **Le bouton de couleur terracotta dessiné** contredit l'usage de `QuickLogMock.astro`, qui ne dessine pas de bouton d'enregistrement. On le garde quand même : le brief l'exige.
- **Contraste de `due-text` sur `due/10` en sombre** : c'est l'audit qui le confirmera.

Aucune question à trancher : les choix délégués sont décidés ci-dessus.