# Préparation : la vitrine montre les fonctions récentes et met le mode à plusieurs en avant

Je n'ai rien écrit ni exécuté. Mandat : `docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`. Aucune question n'est nécessaire.

## Ce que j'ai vérifié

- **Texte réel de l'app pour l'écart.** Il n'est pas celui du brief : « Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. » (`frontend/src/locales/fr.json:482`). En anglais : « Camille logged “Acetaminophen” 2 h ago — at least 6 h between two entries. » La formule du brief, « cette prise demande 6 h d'écart », vient du brief de la fonction, pas de l'app livrée. La règle « dessiner l'écran réel » l'emporte : j'utilise le texte livré.
- **Aspect de l'avis dans le tiroir.** C'est une phrase seule, sans titre, dans un encadré ambre `border-due/40 bg-due/10 text-due-text` (`QuickLogSheet.tsx:638-649`). Le bouton affiche « Enregistrer quand même » (`:665`). Les jetons `due` existent déjà dans `landing/src/styles/landing.css:96-102`. C'est l'ambre de l'app, pas du rouge.
- **Pastilles de quantité.** Ce sont des nombres seuls, sans unité (`formatDecimal`). La pastille choisie a `border-primary bg-primary/10`. Il n'y en a que sous un champ numérique (`event-answers.tsx:770-811`).
- **SPEC incomplète.** `docs/SPEC.md` ne décrit ni la règle d'écart ni les pastilles récurrentes. Pour ces deux points, la preuve est le code cité ci-dessus. Le filtre par option, lui, est bien décrit (`SPEC.md:1324`). Je propose de lancer `/esq:spec` ensuite, sans en faire une condition préalable.
- **Pas de terracotta dans les images.** `landing/DESIGN.md:20,462` impose un seul bouton terracotta par écran. Les fragments n'ont aucun contrôle (`SwitcherFragment.astro:14-17`).
- **L'audit mesure à 1280 et à 390 px, pas à 360 px** (`audit.mjs:100-103`). Le 360 px ne sera donc contrôlé qu'à la main.

## Résultat pour le visiteur

Juste après « Comment ça marche », il voit que chaque membre consigne et que l'app prévient quand quelqu'un d'autre vient déjà de le faire, sans rien bloquer. Il voit aussi les pastilles de quantité dans l'étape 2 et le filtre par bouton et par option dans « Tout ce qui est noté se relit ».

## Disposition

On garde la grille de `Features.astro:58`. Le nouveau fragment se range **dans la première colonne, sous le chapeau**. Ainsi, D-le-changement-de-maisonnee-se-montre-dans-sa-section reste valable (trois colonnes, sélecteur en colonne 3) : c'est un complément, pas un remplacement.

- **Ordinateur (`lg`)** : titre, chapeau et fragment d'écart · les trois points · la tuile du sélecteur.
- **Tablette (`md`)** : titre, chapeau et fragment d'écart · les points puis le sélecteur.
- **Mobile** : tout empilé. Titre, chapeau, fragment d'écart, points, sélecteur.

**Nouveau fragment `fragments/SpacingFragment.astro`.** Il suit le modèle de `SwitcherFragment` : `role="img"`, un `label`, toutes les chaînes en props. Il reprend la tuile `bg-card` avec une légende, et dessine :
- l'en-tête du tiroir, « 💊 Acétaminophène » ;
- l'avis dans les classes de l'app ;
- le bouton « Enregistrer quand même » **en contour, sans remplissage terracotta**. C'est un écart assumé, à expliquer dans le commentaire d'en-tête.

**Ordre des sections.** Dans `pages/index.astro` et `pages/en/index.astro`, `<Features>` passe entre `<Steps />` et `<Forecasting />`. Le commentaire « the household stays, below » (`index.astro:76-81`) est réécrit, ainsi que l'en-tête de `Features.astro`.

## Copie proposée

**Chapeau du héros (`hero.subhead`)**, même longueur à peu près :
- FR : « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chacun note d'un geste depuis son téléphone, et toute la maisonnée voit ce que les autres ont fait. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. »
- EN : même phrase ; je n'ai pas lu le chapeau anglais actuel, donc la version exacte reste à écrire au moment de l'implémentation.

**Légende du fragment d'écart (`household.spacing.caption`)** :
- FR : « Une règle que la maisonnée s'est donnée : quand quelqu'un vient déjà de le faire, l'app le dit avant qu'on le refasse — et on enregistre quand même d'un seul appui. »
- EN : « A rule your household set itself: when someone has just done it, the app says so before it's done twice — and one press still saves. »

**Nom accessible du fragment (`label`)** :
- FR : « Le tiroir Consigner d'Acétaminophène : Camille l'a consigné il y a 2 h, la règle en demande au moins 6, et le bouton Enregistrer quand même. »
- EN : même contenu en anglais.

**Pastilles de l'étape 2 (`steps.two.mock.sheet`)** : `fieldValue` est remplacé par `unit: "comprimé" / "tablet"` et par les pastilles « 1 » (choisie) et « 2 ». Dans `QuickLogMock.astro`, on dessine le libellé et l'unité, puis la rangée de pastilles. Le `phoneLabel` devient « … le moment, la quantité choisie parmi celles qui reviennent, puis la confirmation. »

**« Tout ce qui est noté se relit » (`lookingBack.points.second`)** : je réécris ce point au lieu d'en ajouter un, ce qui ne coûte presque aucune hauteur.
- FR : « La période — 24 h, 7 j, 30 j ou deux dates —, puis un bouton, puis une réponse : seulement les biberons en poudre, et leurs ml. Ce que vous choisissez commande la liste et les chiffres ensemble. »
- EN : « The period — 24 h, 7 d, 30 d or two dates — then a button, then an answer: only the formula bottles, and their ml. What you pick drives the list and the figures together. »

La correspondance avec la SPEC, dans `LookingBack.astro:29`, doit aussi citer les sections sur le filtre par bouton et par option.

## Livraison : une seule phase, cinq commits

1. Section maisonnée déplacée, `SpacingFragment`, copie FR/EN et types dans `copy/types.ts`, commentaires d'en-tête.
2. Nouveau chapeau du héros.
3. Pastilles dans `QuickLogMock` et `steps.two`.
4. Point sur le filtre dans `lookingBack`.
5. Nouveau plafond de hauteur : **mesure la plus haute + environ 30 px**. On remplace D-le-budget-de-hauteur-passe-a-5-100 par `D-le-budget-de-hauteur-passe-a-<N>`. Le chiffre est mis à jour dans `landing/scripts/audit.mjs:36,106-115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146`.

À faire sur une branche. Aucun fichier sous `frontend/` ni `backend/` n'est touché.

## Vérification

- `(auto)` `pnpm -r build` — construit tout. `astro check` vérifie aussi que `fr.json` et `en.json` respectent `satisfies Copy`.
- `(auto)` `pnpm --filter landing test` — les tests `vitest` du paquet `landing` passent.
- `(auto)` `node landing/scripts/audit.mjs --no-build` — réutilise le `dist/` déjà construit. Doit sortir avec le code 0 sous N (contraste AA clair et sombre, en-tête centré). Le rapport doit aussi montrer « ~ » **above** the fold et aucun débordement horizontal.
- `(auto)` `rg -n "5[  ]?100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucune ligne (le code de sortie 1 compte comme réussite).
- `(manual)` Avec le skill `run-tamialog`, depuis le haut de `/` puis de `/en/`, à 1280 et 360 px, en clair puis en sombre : défiler jusqu'aux étapes. On doit voir les pastilles « 1 » (choisie) et « 2 », puis la maisonnée avec le fragment d'écart lisible en entier et le sélecteur, puis « Une prévision… ». Il ne doit plus rester de section maisonnée en bas, ni de défilement horizontal.

## Mesures encore à obtenir

La nouvelle hauteur et donc N, la position du « ~ » après le nouveau chapeau, et le contraste de `text-due-text` sur `bg-due/10` en thème sombre dans la vitrine.
