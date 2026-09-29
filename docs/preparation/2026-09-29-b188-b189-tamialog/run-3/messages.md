> `/esq:plan — writing one plan file. Bound: no subagents, at most 4 questions per round, at most 3 web searches per load-bearing decision.`

(Lecture seule : aucune commande shell disponible, donc `ESQ_CODEX` n'est pas observé et Codex n'est pas utilisé ; aucune écriture.)

---

> `Planning vitrine-fonctions-recentes-multi-membre, from docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`

---

Je vérifie encore le rendu réel des pastilles récurrentes et les sections SPEC associées, puis je rédige la proposition.

---

Investigation terminée ; je vérifie juste les scripts du paquet `landing` avant de rédiger.

---

# Proposition de plan : remonter la section maisonnée et montrer les fonctions récentes sur la vitrine

Rien n'a été écrit ni commité, aucune branche créée. Le shell n'était pas disponible, donc `ESQ_CODEX` et la branche Git n'ont pas été observés. Je n'ai pas lancé `esq brief pending` : j'ignore donc si les briefs `filtrer-un-sujet-par-option` et `minimum-spacing-warning` sont encore en attente.

## Faits vérifiés qui modifient le brief
- **Le texte réel de l'avertissement n'est pas celui cité dans le brief.** L'app n'affiche pas « cette prise demande 6 h d'écart ». Elle affiche une boîte de dialogue par-dessus le tiroir. Titre : « Espacement minimal ». Phrase : `topics.spacing.gap.other`, suivie de « Enregistrer quand même ? ». Boutons : « Annuler » et « Enregistrer quand même » (`frontend/src/components/features/topics/spacing-confirm.tsx:119-139`, `frontend/src/locales/fr.json:479-503`). La règle « vérité contre l'app » l'emporte : le fragment dessinera cette boîte.
- **Les pastilles de quantité sont de simples nombres** (0,5 ou 1, sans unité), placés sous le champ. Une pastille paraît choisie quand le champ contient sa valeur (`event-answers.tsx:770-811`).
- **`docs/SPEC.md` ne décrit ni l'écart minimum ni les pastilles.** Pour justifier la copie, il faudra citer le code ci-dessus et le brief de la fonction. `/esq:spec` peut suivre plus tard.
- **La charte interdit de peindre en terracotta un bouton dans une image** : une seule action terracotta par écran (`landing/DESIGN.md:20`, `:462`).
- **Le seuil de 5 100 px est écrit à quatre endroits** : `landing/scripts/audit.mjs:36,110-115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524`, `.claude/skills/landing-and-deploy/SKILL.md:146`.
- **B-530 est ouvert** et passera en `Planned`.

## Ce que le visiteur y gagne
Juste après avoir vu comment on consigne, il voit que les autres membres voient aussi. La preuve est concrète : l'app prévient quand Camille vient déjà de donner le médicament, sans jamais bloquer l'enregistrement.

## Disposition proposée
- **Ordre des sections** dans `landing/src/pages/index.astro` et `landing/src/pages/en/index.astro` : Steps → Features → Forecasting → LookingBack → Discover. Les commentaires qui disent « the household stays, below » sont réécrits.
- **Ordinateur (`lg`)** : trois colonnes.
  - Colonne 1 : le titre, le chapeau, puis la nouvelle tuile de l'écart minimum. Elle occupe le vide sous le chapeau.
  - Colonne 2 : les trois points, inchangés.
  - Colonne 3 : la tuile du sélecteur, inchangée.
- **Tablette (`md`)** : deux colonnes. À gauche, le titre, le chapeau et la tuile d'écart ; à droite, les points puis le sélecteur.
- **Mobile** : tout est empilé dans l'ordre titre, chapeau, écart, points, sélecteur.
- **Décision existante** : D-le-changement-de-maisonnee-se-montre-dans-sa-section reste valable (le sélecteur garde sa troisième colonne). On l'amende sans la remplacer.
- **Nouveau fichier `landing/src/components/fragments/SpacingFragment.astro`** :
  - calqué sur `SwitcherFragment` : `role="img"`, rien de focalisable, tous les mots passés en props ;
  - une carte avec le titre, la phrase et deux boutons dessinés en contour neutre, sans terracotta, rouge ni ambre ;
  - la légende de la tuile est une nouvelle clé `features.household.spacing.caption`.
- **Mock de l'étape 2** : `QuickLogMock.astro` garde la ligne « Quantité · 1 comprimé » et ajoute dessous les pastilles « 0,5 · 1 · 2 », le « 1 » choisi.
  - **Point d'arbitrage :** le brief dit que la valeur « devient » une rangée de pastilles. Mais l'app garde le champ au-dessus des pastilles, donc supprimer le champ ne correspondrait pas à l'écran réel.

## Copie proposée (nouveaux mots en FR / EN)
- **`hero.subhead`** (la liste d'exemples du début et la phrase finale restent) :
  - FR : « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chacun note d'un geste, et toute la maisonnée voit la même chose, au même endroit. Quand un rythme se dessine… »
  - EN : "The bottle, the evening pill, the smoke detector's battery, the cat's dewormer: anyone logs it in one gesture, and the whole household sees the same thing, in one place. Once a rhythm shows…"
- **Légende de la tuile d'écart :**
  - FR : « Si quelqu'un d'autre vient déjà de le faire, l'app le dit avant d'enregistrer : qui, et il y a combien de temps. L'écart, c'est la maisonnée qui le règle, et on peut toujours enregistrer quand même. »
  - EN : "If someone else has just done it, the app says so before saving: who, and how long ago. The household sets the spacing, and you can always save anyway."
- **Contenu du fragment :**
  - FR : « Espacement minimal » / « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. Enregistrer quand même ? » / « Annuler » / « Enregistrer quand même ».
  - EN : "Minimum spacing" / "Camille logged "Acetaminophen" 2 h ago — at least 6 h between two entries. Save anyway?" / "Cancel" / "Save anyway".
  - La légende présente les 6 h comme un réglage de la maisonnée, pas comme une posologie. Le chiffre n'apparaît que dans l'image, jamais dans la légende (B-170).
- **`lookingBack.points.second`** (réécrit plutôt qu'ajouter un cinquième point, pour limiter la hauteur) :
  - FR : « La période, c'est vous qui la choisissez — 24 h, 7 j, 30 j, ou deux dates. Une pastille ne relit qu'un bouton, puis une seule de ses réponses : seulement les biberons en poudre, et leurs ml. La liste et les chiffres suivent ensemble. »
  - EN : "You choose the period — 24 h, 7 d, 30 d, or two dates. A chip reads back a single button, then a single one of its answers: only the powdered-formula bottles, and their ml. The list and the figures follow together."

## Livraison : une seule phase, `/esq:build`
- **Tâche 1.1 — étape 2 et « Tout ce qui est noté se relit ».**
  - Pastilles ajoutées au mock et à `steps.two.mock.sheet` (avec l'index de la pastille choisie).
  - Réécriture de `lookingBack.points.second`.
  - Fichiers : `landing/src/copy/types.ts`, `fr.json`, `en.json`, `QuickLogMock.astro`, `Steps.astro`.
- **Tâche 1.2 — section maisonnée.**
  - Création de `SpacingFragment.astro`, nouvelle grille dans `Features.astro` avec son en-tête réécrit.
  - Nouvel ordre dans les deux pages.
  - Nouveau chapeau du héros.
  - Mise à jour de `landing/DESIGN.md` (partie maisonnée).
- **Tâche 1.3 — plafond de hauteur.**
  - Mesurer avec `node landing/scripts/audit.mjs`.
  - Nouveau plafond : la page la plus haute plus 25 à 40 px, dans l'esprit de la décision précédente (+35 px).
  - Nouvelle décision `D-le-budget-de-hauteur-passe-a-<N>`, qui remplace l'ancienne.
  - Les quatre endroits qui citent le seuil sont alignés sur le nouveau chiffre.

## Vérification proposée (non exécutée)
- `(auto)` `pnpm --filter landing test` — les tests Vitest du paquet `landing` passent.
- `(auto)` `node landing/scripts/audit.mjs` — code de sortie 0 : sous le nouveau plafond, « ~ » au-dessus de la ligne de flottaison, contraste AA en clair et en sombre, aucun débordement.
- `(auto)` `grep -nE '5.?100' landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucune ligne trouvée (le code de sortie 1 compte comme réussite).
- `(auto)` `pnpm -r build` — les quatre paquets se construisent, `astro check` et `satisfies Copy` compris.
- `(manual)` Avec run-tamialog, sur la vitrine construite, ouvrir `/` puis `/en/`, à 1280 et à 360 px, en clair puis en sombre. Vérifier :
  - l'ordre Étapes → maisonnée → Prévision ;
  - le fragment d'écart est lisible en entier ;
  - trois pastilles apparaissent, le « 1 » choisi ;
  - le point sur les pastilles de lecture est présent ;
  - aucun défilement horizontal.

## Mesures encore à obtenir
- La hauteur réelle de `/` et `/en/` après les ajouts. Mon estimation d'environ +120 à 160 px à `lg` n'est pas mesurée.
- La position du « ~ » avec le nouveau chapeau (elle est aujourd'hui à 229 px).
- Le format exact de l'âge produit par `elapsedLabel` (« il y a 2 h » ?).

## Risques
- **Le principal :** le fragment d'écart peut se lire comme une alarme. La réponse est la carte neutre et la légende qui présente l'écart comme un réglage de la maisonnée.
- Les pastilles peuvent faire grandir le téléphone de l'étape 2, et donc la page. La mesure de la tâche 1.3 le dira.

Aucune question bloquante : tous les choix délégués sont tranchés ci-dessus.
