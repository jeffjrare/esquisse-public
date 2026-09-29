Ce que j'ai fait : lu le brief, le plugin esq, `CLAUDE.md`, la vitrine, l'app et les registres. Aucune écriture et aucune commande lancée. `ESQ_CODEX` n'a pas pu être lu faute de shell, donc Codex n'est pas utilisé.

> `Planning vitrine-fonctions-recentes-multi-membre, from docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`

## Faits vérifiés qui changent le plan

- **La phrase citée par le brief n'est pas celle de l'app.** L'avertissement est une boîte de dialogue (`frontend/src/components/features/topics/spacing-confirm.tsx`). Son titre est « Espacement minimal ». Sa phrase, dans `frontend/src/locales/fr.json:482` (même clé dans `en.json`), est : « {author} a consigné « {name} » {age} — au moins {gap} entre deux saisies. Enregistrer quand même ? ». Ses boutons sont « Annuler » et « Enregistrer quand même ». Le brief exige aussi que la vitrine reproduise l'app, donc je retiens le texte de l'app. « cette prise demande 6 h d'écart » ne sera pas repris.
- **Une pastille de quantité affiche un nombre seul**, sans unité (« 1 », « 0,5 »), et se place sous le champ (`event-answers.tsx:592-806`). L'état « choisi » vient de la valeur du champ (D-la-pastille-affiche-le-nombre-lu).
- **`docs/SPEC.md` ne décrit ni l'écart minimum, ni les pastilles récurrentes.** La copie s'appuie donc sur le code cité ci-dessus et sur D-une-valeur-frequente-revient-trois-fois. Le filtre par option, lui, est dans SPEC l. 1324.
- Le seuil 5 100 apparaît à 4 endroits : `landing/scripts/audit.mjs` (l. 36 et 115), `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146`.
- L'audit mesure à 1280 et à 390 px. Les 360 px du brief ne se vérifient qu'à la main.
- Le dépôt est en HEAD détaché : un vrai run n'aurait ni `Branch` ni `Origin` et ne pourrait pas être fusionné par `/esq:land`. Il faudrait se placer sur `main` avant de lancer le plan.

## Ce que le visiteur y gagne

Juste après avoir vu une saisie, il voit l'app prévenir que Camille vient déjà de faire la même chose. C'est la preuve concrète qu'on s'en sert à plusieurs. Les trois fonctions livrées récemment sont nommées ou montrées sur la page.

## Disposition

- **Ordre des sections, sur `/` et `/en/`** : Steps → Features → Forecasting → LookingBack → Discover, sans rien après. Déplacer la section ne coûte aucun px.
- **Ordinateur (`lg`)** : les trois colonnes restent en place. La 3ᵉ colonne empile deux tuiles `bg-card` : d'abord l'écart minimum (c'est la preuve), puis le sélecteur de maisonnée, sans changement. D-le-changement-de-maisonnee-se-montre-dans-sa-section reste valable et n'est pas remplacée.
- **Tablette (`md`)** : la tuile d'écart passe sous le chapeau (colonne 1, 2ᵉ rangée), le sélecteur reste sous les points (colonne 2). Les deux colonnes restent équilibrées.
- **Mobile** : tout s'empile dans cet ordre : titre, chapeau, points, écart, sélecteur.
- **Nouveau composant `fragments/SpacingFragment.astro`**, sur le modèle de `SwitcherFragment` : c'est une image (`role="img"`), rien n'y est cliquable et tous les textes arrivent en props. Il reprend la boîte de dialogue : titre, phrase, puis « Annuler » en contour et « Enregistrer quand même » comme bouton principal. Aucune couleur d'alerte.
- **Pastilles de l'étape 2** : dans `QuickLogMock.astro`, la ligne « Quantité » reste en place et une rangée « 0,5 · 1 · 2 » s'ajoute dessous, « 1 » choisi (`border-primary bg-primary/10`, comme dans l'app). Je garde le champ parce que l'app montre le champ et les pastilles ensemble. C'est un écart assumé avec le mot « devient » du brief.

## Copie proposée (FR / EN)

- **`hero.subhead`** (longueur quasi identique, pour ne pas descendre le « ~ dans 5 h ») :
  - FR : « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chacun dans la maisonnée note d'un geste, et tout le monde voit la même chose, au même endroit. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. »
  - EN : « …: anyone in the household logs it in one gesture, and everyone sees the same thing, in one place. Once a rhythm shows… »
- **Légende de la tuile d'écart** :
  - FR : « Quand quelqu'un d'autre vient déjà de le faire, l'app le dit avant d'enregistrer, selon la règle que la maisonnée s'est donnée. Elle prévient, elle ne bloque pas. »
  - EN : « When someone else has just done it, the app says so before saving, by the rule the household set itself. It warns; it never blocks. »
- **Contenu du fragment** :
  - FR : « Espacement minimal » / « Camille a consigné « Dose » il y a 2 h — au moins 6 h entre deux saisies. Enregistrer quand même ? »
  - EN : « Minimum spacing » / « Camille logged “Dose” 2 h ago — at least 6 h between two entries. Save anyway? »
  - J'utilise « Dose » plutôt qu'« Acétaminophène » : c'est la tuile de l'étape 2, et on évite de nommer un médicament à côté d'une durée qui pourrait passer pour une posologie.
- **`lookingBack.points.second`** : je modifie ce point au lieu d'en ajouter un 5ᵉ, pour économiser de la hauteur.
  - FR : « La période, c'est vous qui la choisissez — 24 h, 7 j, 30 j, ou deux dates — et on peut resserrer sur un seul bouton, puis sur une seule réponse : seulement les biberons en poudre, et leurs ml. La liste et les chiffres suivent ensemble. »
  - EN : « …and you can narrow to one button, then one answer: only the powdered-formula bottles, and their ml. The list and the figures follow together. »

## Plus petite livraison complète : une seule phase, 5 commits

1. Pastilles dans le mock de l'étape 2 : `QuickLogMock.astro`, `Steps.astro`, `copy/types.ts`, `fr.json`, `en.json`.
2. Point du filtre dans `lookingBack` (`fr.json`, `en.json`).
3. Nouveau chapeau du héros (`fr.json`, `en.json`).
4. Section maisonnée : déplacement dans `pages/index.astro` et `pages/en/index.astro`, `SpacingFragment`, grille de `Features.astro`, types, copie, et réécriture des commentaires d'en-tête.
5. Plafond de hauteur : on mesure d'abord. Le nouveau plafond est le plus petit multiple de 50 au moins 25 px au-dessus de la page la plus haute, comme dans le précédent. On le reporte chez les 4 lecteurs du seuil et on écrit `D-le-budget-de-hauteur-passe-a-<N>`, qui remplace D-le-budget-de-hauteur-passe-a-5-100.

Côté registres, B-530 passerait en `Planned`. Un seul commit de plan est proposé ici ; rien n'a été écrit.

## Vérification proposée

- `(auto)` `pnpm -r build` — `astro check` passe (FR/EN `satisfies Copy`), puis tout le build.
- `(auto)` `pnpm --filter landing test` — la suite vitest de `landing` passe.
- `(auto)` `node landing/scripts/audit.mjs --no-build` — code 0 : AA en clair et en sombre à 1280 et 390, sous le nouveau plafond, en-tête centré ; le « ~ » reste au-dessus de 800 px et rien ne déborde. Prérequis : `ensure-driver.mjs`.
- `(auto)` `grep -n "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucune ligne (sortie 1 attendue).
- `(manual)` [landing construite et servie via run-tamialog, en clair puis en sombre] Sur `/` à 1280 puis 360 px : vérifier le chapeau, les pastilles de l'étape 2, la section maisonnée entre les étapes et « Une prévision… » avec ses deux tuiles, le filtre nommé, l'absence de section en bas et de défilement horizontal, et la phrase d'écart entière.
- `(manual)` Même parcours sur `/en/`.

## Encore à mesurer, et risques

- **Le coût en hauteur et le nouveau plafond** ne sont pas connus ; ils seront mesurés à l'étape 5.
- **Le « ~ dans 5 h »** est aujourd'hui à 229 px ; il faudra le relire avec le nouveau chapeau.
- **Le bouton principal dans le fragment** : c'est un second bouton de couleur à l'écran, alors que la vitrine n'en montre qu'un (D-la-vitrine-n-a-qu-une-porte, `QuickLogMock` ne dessine pas de bouton d'enregistrement). Si l'effet gêne, on le dessine en contour.
- **Refus probable** : le visiteur ne remarque pas la tuile en bas de la 3ᵉ colonne. C'est pourquoi elle est en tête de colonne à `lg` et sous le chapeau à `md`.

Aucune question en suspens : tous les choix ci-dessus restent dans ce que le brief délègue.
