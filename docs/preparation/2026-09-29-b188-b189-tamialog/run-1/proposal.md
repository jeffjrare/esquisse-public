> `Planning vitrine-fonctions-recentes-multi-membre, from docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`

# Proposition de plan : la section maisonnée remonte et montre l'écart minimum (aucun fichier écrit)

Rien n'a été écrit, aucune branche créée, aucun statut changé. Je n'avais pas de shell : le CLI `esq`, `ESQ_CODEX` et `esq brief pending` n'ont pas tourné. Le plan à écrire serait `docs/plans/2026-09-29-vitrine-fonctions-recentes-multi-membre.md`, sur la branche `esq/vitrine-fonctions-recentes-multi-membre`, et la ligne B-530 passerait en `Planned`.

## Faits vérifiés qui changent le brief
- **Le vrai texte de l'app n'est pas celui cité par le brief.** Le tiroir affiche « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » (`frontend/src/locales/fr.json:482`). En anglais : "{{author}} logged “{{name}}” {{age}} — at least {{gap}} between two entries.". La formule « cette prise demande 6 h d'écart » vient du brief de la fonction, pas de ce qui a été livré. La règle « vérité contre l'app » l'emporte, donc je reprends le texte livré.
- **Le style du bandeau** : `border-due/40 bg-due/10 text-due-text` (`QuickLogSheet.tsx:644`). C'est l'ambre de l'app, pas du rouge, et ces jetons existent déjà dans `landing.css:96-102`.
- **Le bouton** : « Enregistrer quand même » / "Save anyway" (`topics.duplicate.confirmAction`).
- **Les pastilles de quantité** ne montrent que des nombres (`formatDecimal`), dans une rangée `rounded-xl border`. La pastille choisie est en `border-primary bg-primary/10` (`event-answers.tsx:770-806`), exactement comme les pastilles de moment du mock actuel.
- **Trous dans `docs/SPEC.md`** : ni l'écart minimum ni les pastilles n'y sont décrits. Seul le filtre par option l'est (§ *Lire un bouton par une de ses réponses*). Les commentaires d'en-tête citeront donc le code source. Mettre SPEC à jour relèvera d'un `/esq:spec` ultérieur.
- **Ce que l'audit vérifie vraiment** (`audit.mjs`) :
  - le mobile est mesuré en 390 px, pas en 360 ;
  - la position du « ~ » par rapport à la ligne de flottaison est seulement *affichée*, jamais contrôlée ;
  - d'autres textes énoncent 5 100 : l'en-tête d'`audit.mjs` (lignes 36 et 108-115), `DESIGN.md:89`, `ARCHITECTURE.md:1524` et `landing-and-deploy/SKILL.md:146`.
- **Un autre en-tête devient faux** : celui de `LookingBack.astro` (« before `Features` », ligne 13).

## Ce que le visiteur y gagne
Juste après avoir vu consigner, il voit qu'un autre membre l'a déjà fait. L'app le prévient, et l'enregistrement reste possible d'une pression.

## Disposition
- **Desktop (`lg`), trois colonnes** :
  - colonne 1 : titre, chapeau, puis la **tuile de l'écart**, qui occupe le vide sous le chapeau court ;
  - colonne 2 : les trois points ;
  - colonne 3 : le sélecteur de maisonnée, inchangé.
- **`md`** : la colonne 1 garde titre, chapeau et tuile de l'écart ; la colonne 2 reçoit les points puis le sélecteur (comme aujourd'hui).
- **Mobile** : titre, chapeau, écart, points, sélecteur, tout empilé.

D-le-changement-de-maisonnee-se-montre-dans-sa-section reste valide. Une nouvelle décision `D-l-ecart-minimum-prouve-la-maisonnee-sous-son-chapeau` l'accompagne, et la § household de `DESIGN.md` est mise à jour.

**Le fragment** : un nouveau `fragments/SpacingFragment.astro`, sur le modèle de `SwitcherFragment` (un seul `role="img"`, rien de focalisable, toutes les chaînes en props). Il contient :
- l'en-tête du tiroir « 💊 Acétaminophène » ;
- le bandeau ambre ;
- une ligne « Annuler · Enregistrer quand même », avec le bouton dessiné en bordure seulement, jamais en `bg-primary` (`DESIGN.md:460`).

## Copie FR / EN
- **Chapeau du héros** : « … un seul endroit pour tout, à plusieurs : chaque membre de la maisonnée consigne, et tous voient. Quand un rythme… » / "… one place for all of it, shared: every member of the household logs, and everyone sees it. Once a rhythm…"
- **Légende de la tuile** (`household.spacing.caption`) : « Un bouton peut demander un écart entre deux saisies. Si quelqu'un d'autre vient de le consigner, l'app le dit au moment de consigner — qui, et il y a combien de temps — sans jamais empêcher d'enregistrer. » / "A button can ask for a gap between two entries. If someone else has just logged it, the app says so as you log — who, and how long ago — and never stops you saving."
- **Bandeau** : « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. » / "Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries."
  - Les 6 h s'affichent comme un réglage du bouton, pas comme une posologie.
  - La forme anglaise de `{{age}}` est à vérifier dans `useElapsedLabel` au build.
- **Filtre, ajouté à `lookingBack.points.second`** : « … On peut aussi n'en lire qu'un bouton, puis qu'une réponse : seulement les biberons en poudre, et leurs ml. » / "… You can also read just one button, then just one answer: only the powdered bottles, and their ml."
- **Pastilles de l'étape 2** : « 0,5 · 1 · 2 » / "0.5 · 1 · 2", avec « 1 » choisie, et le champ contient « 1 ». Si le vrai libellé du champ affiche une unité, on la reprend ; sinon le « comprimé » disparaît, puisque l'app ne l'afficherait pas.

## La plus petite livraison complète : une phase, quatre commits
1. **Types et copie** : `copy/types.ts` (`Feature.spacing`, `QuickLogCopy.sheet.chips`), puis `fr.json` et `en.json`, avec `satisfies Copy`.
2. **Mock et fragment** : `QuickLogMock.astro` et `Steps.astro` pour les pastilles, `SpacingFragment.astro` et `Features.astro` pour la tuile, puis l'ordre des sections dans `pages/index.astro` et `pages/en/index.astro`. Les en-têtes de `Features`, `index` et `LookingBack` sont réécrits.
3. **Nouveau plafond**, mesuré après le commit 2 : la page la plus haute plus 25 à 50 px, arrondi à la cinquantaine. Il est reporté dans `audit.mjs`, `DESIGN.md`, `ARCHITECTURE.md` et le skill. La décision `D-le-budget-de-hauteur-passe-a-<N>` remplace celle de 5 100, qui passe en *Superseded*.
4. La décision de disposition dans `docs/DECISIONS.md`.

## Vérification proposée (rien n'a été exécuté)
- `(auto)` `pnpm -r build` — l'`astro check` du paquet landing passe, parité `satisfies Copy` comprise.
- `(auto)` `pnpm test` — le contrôle de parité des locales et les tests landing passent.
- `(auto)` `node landing/scripts/audit.mjs` — une seule mesure qui couvre :
  - la sortie 0, avec AA en clair et en sombre, sans débordement ;
  - les pages sous le nouveau plafond ;
  - « first « ~ » … above the fold » sur `/` et `/en/` en 1280.
- `(auto)` `grep -rn "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — ne renvoie rien.
- `(manual)` [build local, skill run-tamialog] sur `/` puis `/en/`, en 1280 et en 360, clair et sombre. Observer :
  - l'ordre des sections : étapes, maisonnée, prévision ;
  - le bandeau d'écart lu en entier ;
  - les pastilles avec « 1 » choisie ;
  - la phrase du filtre ;
  - plus de section maisonnée en bas ;
  - aucun défilement horizontal à 360.

## Mesures encore à obtenir
- La hauteur réelle après ajouts (j'estime environ +100 à 200 px, sans mesure).
- La position du « ~ » après le nouveau chapeau.
- Le remplissage du téléphone de l'étape 2.
- La forme anglaise du temps écoulé.

## Risques
- **Premier risque** : un visiteur lit l'ambre comme une alarme médicale. Réponse : le vrai jeton `due` de l'app, une légende sans chiffre, et un bouton qui reste visible.
- **Écart de formulation** : la copie livrée diffère de la citation du brief. Je la tranche par la règle de vérité du brief lui-même.

Aucune question en suspens : chaque choix délégué entre dans le mandat.
