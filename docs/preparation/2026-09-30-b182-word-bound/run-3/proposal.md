# Proposition de plan : la vitrine montre les fonctions récentes et met le mode à plusieurs en avant

Je n'ai rien écrit, créé ni committé. Sans shell, `ESQ_CODEX` n'a pas pu être lu : aucun appel Codex. La branche n'a pas été observée, donc aucun `**Branch:**`/`**Origin:**` n'est proposé. Si le plan était écrit, la ligne à passer en `Planned` serait B-530 (`docs/BACKLOG.md:632`).

## Conflits avec le brief, à trancher

1. **Texte de l'écart.** Le texte livré dans l'app n'est pas celui cité par le brief. L'app affiche « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » (`frontend/src/locales/fr.json:482`). Le bouton est « Enregistrer quand même » (`QuickLogSheet.tsx:666`). La règle « vérité contre l'app » passe avant la citation du brief, qui venait du brief de la fonction : on dessine le texte livré. La forme exacte de `{{age}}` est à confirmer dans `spacing-rule.ts`.
2. **Pastilles de quantité.** Dans l'app, les pastilles sont des nombres seuls, sous le champ (`event-answers.tsx:592,805`). Le brief demande que la valeur « devient » une rangée de pastilles : je supprime la valeur et garde le libellé. Cette simplification du dessin sera notée dans l'en-tête.
3. **SPEC.** `docs/SPEC.md` ne décrit ni l'écart minimum ni les pastilles récurrentes (grep vide). La section « Lire un bouton par une de ses réponses » couvre bien le filtre (`SPEC.md:1322`). Pour les deux premières fonctions, les en-têtes citeront le code source de l'app. `/esq:spec` reste une suite à lancer par toi, sans bloquer ce travail.

## Résultat pour le visiteur

Juste après « Comment ça marche », le visiteur voit que Tamialog prévient quand quelqu'un d'autre vient déjà de faire le geste, sans jamais bloquer. Il voit aussi les quantités habituelles en un tap et la lecture d'une seule réponse d'un bouton.

## Disposition

- **Grille inchangée** (`Features.astro:58`). Le fragment d'écart va dans la **première colonne, sous le chapeau**. Le sélecteur reste en 3ᵉ colonne dès `lg`.
- **Décision existante.** D-le-changement-de-maisonnee-se-montre-dans-sa-section (`DECISIONS.md:16213`) n'est donc pas défaite. Une nouvelle décision, `D-l-ecart-minimum-se-montre-sous-le-chapeau-de-la-maisonnee`, enregistre cet emplacement.
- **Desktop (`lg`) :** titre, chapeau et tuile d'écart · trois points · tuile du sélecteur.
- **`md` :** deux colonnes équilibrées : titre, chapeau et écart | points et sélecteur. Placer l'écart en colonne 3 aurait fait de la colonne 2 la plus haute, d'où ce choix.
- **Mobile (360 px) :** tout est empilé dans l'ordre titre, chapeau, écart, points, sélecteur. La preuve arrive donc juste après la promesse.
- **Nouveau `fragments/SpacingFragment.astro`,** sur le modèle de `SwitcherFragment` : `role="img"`, rien de focalisable, chaque chaîne passée en prop.
  - Il montre le titre du tiroir « 💊 Acétaminophène », puis l'avis en ambre `border-due/40 bg-due/10 text-due-text`, comme `QuickLogSheet.tsx:644`. C'est le jeton « à venir » de l'app : ni rouge ni vert.
  - Le bouton « Enregistrer quand même » reprend la forme de l'app. Aucun autre bouton terracotta n'est visible dans cet écran.
- **Ordre des sections.** `<Features />` passe entre `<Steps />` et `<Forecasting />` dans `pages/index.astro` et `pages/en/index.astro`. Les commentaires sont réécrits (`index.astro:76-81` et l'en-tête de `Features.astro`).

## Copie FR / EN proposée

- **`hero.subhead`** (longueur ≈ l'actuelle, pour ne pas faire descendre le « ~ dans 5 h ») :
  - FR : « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : à plusieurs, chacun note d'un geste et tous voient ce que les autres ont fait. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. »
  - EN : « The bottle, the evening pill, the smoke detector's battery, the cat's dewormer: whoever does it logs it in one gesture, and everyone else sees it. Once a rhythm shows, or once you set the dates yourself, Tamialog tells you what comes next. »
- **Légende de la tuile d'écart** (nouvelle clé `features.household.spacing.caption`) :
  - FR : « Un bouton peut demander un écart entre deux saisies : si quelqu'un d'autre vient de le faire, l'app le dit avant d'enregistrer, sans jamais bloquer. »
  - EN : « A button can ask for a gap between two entries: if someone else just did it, the app says so before saving, and never blocks. »
- **Contenu du fragment :**
  - FR : « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. » / « Enregistrer quand même »
  - EN : « Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries. » / « Save anyway »
  - Ces chiffres appartiennent au dessin, pas à la copie courante (B-170). Le commentaire d'en-tête précise que 6 h est un réglage de la maisonnée, pas une posologie.
  - Il faut aussi un `label` accessible dans les deux langues.
- **`lookingBack.points.second` :**
  - FR : « La période se choisit — 24 h, 7 j, 30 j ou deux dates —, puis un bouton, puis une de ses réponses : seulement les biberons en poudre, et leurs ml. La liste et les chiffres suivent ensemble. »
  - EN : même phrase, avec les libellés de période déjà présents dans `en.json`.
- **`steps.two.mock.sheet` :** `fieldValue` est remplacé par `fieldChips: { first: "1", second: "2" }`, la première pastille étant choisie. Le style suit `event-answers.tsx:802`. Le `phoneLabel` de l'étape 2 dit « les quantités habituelles » au lieu de « la quantité par défaut ».
- **Types.** `landing/src/copy/types.ts` (`Feature`, et le type de `sheet` ligne 114) est mis à jour. La vérification `satisfies Copy` garantit la parité FR/EN.

## Livraison : une seule phase, quatre commits

1. `landing: le tiroir de l'étape 2 montre les pastilles de quantité` (`QuickLogMock.astro`, `Steps.astro:103`, `types.ts`, `fr.json`, `en.json`).
2. `landing: la maisonnée remonte après les étapes, avec le fragment d'écart` (`SpacingFragment.astro`, `Features.astro`, les deux pages, la copie).
3. `landing: le chapeau du héros et le filtre par option`.
4. `landing: le budget de hauteur passe à <N> px`.
   - **Calcul de N :** mesurer la page la plus haute, puis prendre le premier multiple de 50 au moins 25 px au-dessus. C'est l'usage des marges précédentes, 26 et 35 px.
   - **Lecteurs du seuil à mettre à jour :** `audit.mjs:115` et son commentaire (lignes 110-112), `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524`, `.claude/skills/landing-and-deploy/SKILL.md:146`.
   - **Décision :** `D-le-budget-de-hauteur-passe-a-<N>` remplace D-le-budget-de-hauteur-passe-a-5-100, qui passe en `Superseded`.

## Vérification (à exécuter plus tard)

- `(auto)` `pnpm -r build` — `astro check` réussit, donc `satisfies Copy` tient en FR et en EN, et le site se construit.
- `(auto)` `pnpm --filter landing test` — les tests vitest du paquet landing passent.
- `(auto)` `node landing/scripts/audit.mjs` — code de sortie 0 :
  - `/` et `/en/` restent sous N px ;
  - le contraste AA tient en clair et en sombre ;
  - aucun débordement horizontal ;
  - l'en-tête reste centré ;
  - le « ~ » reste au-dessus de la ligne de flottaison.
- `(auto)` `grep -nE "5 ?100 px|limit: 5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucun résultat (le code de sortie 1 compte comme réussite).
- `(auto)` `grep -n "<Steps\|<Features\|<Forecasting" landing/src/pages/index.astro landing/src/pages/en/index.astro` — dans chaque fichier, l'ordre est Steps, Features, Forecasting.
- `(manual)` Avec le skill run-tamialog, ouvrir `/` puis `/en/` à 1280 et à 360 px, en clair puis en sombre. Vérifier que :
  - la maisonnée suit les étapes ;
  - l'avis d'écart est lisible en entier à 360 px ;
  - les pastilles apparaissent, avec « 1 » choisie ;
  - la phrase du filtre est présente ;
  - il n'y a plus de section maisonnée en bas.

## Faits vérifiés et mesures encore à obtenir

- **Vérifié :**
  - les chaînes et le rendu de l'app aux chemins cités ;
  - le plafond actuel, 5 100 (`audit.mjs:115`) ;
  - les lecteurs du seuil.
- **Encore à mesurer :**
  - la hauteur finale et N ;
  - la position du « ~ » après le nouveau chapeau (229 px d'après le brief) ;
  - le contraste de l'ambre du fragment en sombre.

## Risque principal

Un visiteur qui ne défile pas jusqu'à la maisonnée ne lira que le chapeau du héros. C'est la raison de la réécriture du chapeau, qui porte seule le « à plusieurs » au-dessus de la ligne de flottaison.

Aucune question n'est ouverte : la seule qui pourrait rester est l'ordre de priorité entre le texte du brief et le texte livré (conflit 1). Si tu veux reprendre mot pour mot la phrase du brief, dis-le.
