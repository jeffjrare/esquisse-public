# Proposition de plan : la vitrine montre les fonctions récentes et met le mode à plusieurs en avant

Je n'ai rien écrit, rien committé et aucune commande n'a tourné. Je n'avais pas d'interpréteur de commandes : `ESQ_CODEX` n'a donc pas pu être lu et reste considéré comme désactivé. Le CLI `esq` n'a pas été appelé non plus.

À l'exécution réelle, B-530 passerait à `Planned`. Le dépôt est en HEAD détachée : `/esq:plan` n'écrirait donc ni `Branch` ni `Origin`, et `/esq:land` ne pourrait pas livrer. Or le brief exige une branche. Il faudra se placer sur `main` avant de lancer le vrai `/esq:plan`.

## Écarts constatés dans le code

1. **La phrase citée par le brief n'est pas celle de l'app.** L'app dit « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » (`frontend/src/locales/fr.json:482`). La formule « cette prise demande 6 h d'écart » ne vient que du brief de la fonction. Comme la règle est de dessiner l'écran réel, je garde le texte de l'app.
2. **L'avertissement est ambre, pas rouge.** Il utilise `border-due/40 bg-due/10 text-due-text` (`QuickLogSheet.tsx:641-648`). Le bouton affiche « Enregistrer quand même » via `topics.duplicate.confirmAction` (`:666`).
3. **Les pastilles de quantité n'ont pas d'unité.** Elles affichent un nombre seul, et la pastille choisie a le style `border-primary bg-primary/10` (`event-answers.tsx:770-811`).
4. **`docs/SPEC.md` ne décrit ni l'écart minimum ni les pastilles.** Le filtre par option y figure bien (§ *Lire un bouton par une de ses réponses*, l.1322). Pour les deux autres, je cite le code et les décisions `D-l-espacement-tient-en-deux-colonnes` et `D-les-valeurs-frequentes-se-lisent-a-part`. Mettre `/esq:spec` à jour reste à faire, mais ça ne bloque pas ce travail.

## Ce que le visiteur y gagne

Juste après avoir vu consigner, le visiteur voit un autre membre qui avait déjà consigné, et l'app qui le dit sans jamais bloquer.

## Disposition (`Features.astro`, déplacé entre `<Steps />` et `<Forecasting />` sur les deux pages)

L'ordre dans le code reste celui du parcours du brief : texte, points, sélecteur, écart.
- **Desktop (`lg`)** : trois colonnes. La colonne 1 contient le titre et le chapeau, avec la nouvelle tuile d'écart dessous (`lg:row-start-2`). Les points et le sélecteur prennent `lg:row-span-2`. Le sélecteur reste en troisième colonne : `D-le-changement-de-maisonnee-se-montre-dans-sa-section` est respectée et n'a pas besoin d'être modifiée. C'est la colonne 1 qui a le plus de place libre, ce qui coûte le moins de hauteur.
- **`md`** : deux colonnes. À gauche, le titre, le chapeau et la tuile d'écart. À droite, les points puis le sélecteur.
- **Mobile (360 px)** : tout est empilé dans l'ordre du parcours, et le texte de l'avertissement passe à la ligne sans tronquer.

Le nouveau `fragments/SpacingFragment.astro` suit le modèle de `SwitcherFragment` : un seul `role="img"`, aucun élément focusable, tous les textes passés en props. Il montre le titre du tiroir « 💊 Dose », l'encadré ambre, puis un faux bouton `bg-primary` non interactif. J'ai préféré « Dose » à « Acétaminophène » : c'est cohérent avec l'étape 2 et ça évite de nommer un médicament.

## Copie proposée

- **`hero.subhead`** : je remplace seulement le passage du milieu, sans allonger la phrase.
  - FR : « … : chacun le note d'un geste depuis son téléphone, et toute la maisonnée le voit. Quand un rythme se dessine… »
  - EN : « …: everyone logs it in one gesture from their own phone, and the whole household sees it. Once a rhythm shows… »
- **Légende de la tuile d'écart**, sans chiffre (B-170) :
  - FR : « Un bouton peut porter l'écart que la maisonnée lui a fixé : si quelqu'un d'autre vient de le consigner, l'app le dit avant d'enregistrer, et un appui suffit pour noter quand même. »
  - EN : « A button can carry the spacing your household set for it: if someone else just logged it, the app says so before you save — and one press still logs it. »
- **Texte du fragment** :
  - FR : « Camille a consigné « Dose » il y a 2 h — au moins 6 h entre deux saisies. » et « Enregistrer quand même ».
  - EN : « Camille logged “Dose” … — at least 6 h between two entries. » et « Save anyway ». La mention du temps écoulé doit reprendre la formulation EN de l'app, que je n'ai pas vérifiée.
  - Le libellé accessible (`label`) décrit la scène dans chaque langue.
- **`steps.two.mock.sheet`** : `fieldValue` est remplacé par des pastilles `0,5 · 1 · 2` / `0.5 · 1 · 2`, avec `1` choisie. « comprimé » disparaît, puisque les pastilles de l'app n'ont pas d'unité.
- **`lookingBack.points.second`** :
  - FR : « La période — 24 h, 7 j, 30 j ou deux dates — commande la liste et les chiffres ensemble, et la page se resserre sur un bouton, puis sur une réponse : seulement les biberons en poudre, et leurs ml. »
  - EN : l'équivalent, avec « only the formula bottles, and their ml ». Les libellés de période restent ceux qu'a déjà `en.json`.

## Une seule phase, quatre commits

1. Déplacer la section maisonnée et ajouter `SpacingFragment` : `Features.astro`, `fragments/SpacingFragment.astro`, `pages/index.astro`, `pages/en/index.astro`, `copy/types.ts`, `fr.json`, `en.json`. Les commentaires d'en-tête sont réécrits et citent le code pour l'écart minimum.
2. Montrer les pastilles de quantité dans le tiroir de l'étape 2 : `QuickLogMock.astro`, `Steps.astro`, les types et la copie.
3. Nommer le filtre bouton/option dans `lookingBack` et réécrire `hero.subhead`, en FR et en EN.
4. Relever le plafond à la hauteur mesurée plus une marge de quelques dizaines de px.
   - Le nouveau plafond va dans `landing/scripts/audit.mjs:36,110-115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524-1527` et `.claude/skills/landing-and-deploy/SKILL.md:146-147`.
   - La nouvelle décision `D-le-budget-de-hauteur-passe-a-<N>` remplace `…-5-100`, qui passe à l'état Superseded.

## Vérification

- (auto) `pnpm -r build` : l'`astro check` inclus vérifie `satisfies Copy` ; les quatre paquets se construisent.
- (auto) `pnpm --filter landing test` : la suite vitest passe.
- (auto) `node landing/scripts/audit.mjs` : sortie 0 sous le nouveau plafond, AA en clair et en sombre, aucun débordement, « ~ » au-dessus de la ligne de flottaison.
- (auto) `grep -n "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` : aucune ligne.
- (auto) `grep -n "<Steps\|<Features\|<Forecasting" landing/src/pages/index.astro landing/src/pages/en/index.astro` : `Features` apparaît entre les deux sur chaque page.
- (manual) [aperçu construit, avec run-tamialog] Ouvrir `/` puis `/en/` à 1280 et à 360 px, en clair puis en sombre. Observer :
  - l'ordre étapes → maisonnée → prévision ;
  - l'avertissement lisible en entier ;
  - la pastille `1` choisie ;
  - le point sur le filtre ;
  - l'absence de défilement horizontal.

## Risques

- **Contraste de l'ambre** : dans l'app, `text-due-text` sur `bg-due/10` ne passe pas AA en clair (B-403). La vitrine a un ton plus foncé (`landing.css:102`), mais il faut le mesurer. En cas d'échec, on fonce l'encadré, jamais vers le rouge.
- **Un second bouton primaire à l'écran**, contre la règle de `QuickLogMock` qui n'en dessine pas. Le brief l'exige ; le faux bouton reste petit et fait partie de l'image.
- **La position du « ~ »** : le chapeau garde la même longueur, mais seule la mesure dira s'il reste à 229 px.
- **Le coût en hauteur est encore inconnu** et sera mesuré à la quatrième tâche.

Aucune question ouverte : le brief couvre toutes les décisions nécessaires.
