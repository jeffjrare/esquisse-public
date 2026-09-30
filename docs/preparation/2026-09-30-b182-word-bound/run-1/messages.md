> `/esq:plan — writing one plan file. Bound: no subagents, at most 4 questions per round, at most 3 web searches per load-bearing decision.`

Mode lecture seule demandé : je n'écrirai ni plan, ni branche, ni registre ; le shell n'est pas disponible (`ESQ_CODEX` non lu → aucun appel Codex).

---

> `Planning vitrine-fonctions-recentes-multi-membre, from docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`

Load UI reference, and read landing files.

---

Je vérifie encore le rendu réel des pastilles et la spec du filtre par option, puis je rédige la proposition.

---

# Proposition de plan : vitrine « fonctions récentes, mode à plusieurs »

Je n'ai rien écrit ni committé, et je n'ai créé ni branche ni registre. La branche n'a pas été observée, car je n'avais pas de shell. Le plan réel passera par `esq/vitrine-fonctions-recentes-multi-membre`, et B-530 passera à `Planned` au moment de l'écrire.

## Un point à trancher : la phrase citée dans le brief n'est pas celle de l'app

Le brief cite « cette prise demande 6 h d'écart ». L'app affiche une autre phrase, dans une boîte de dialogue ouverte par-dessus le tiroir, et non dans le tiroir lui-même (`frontend/src/components/features/topics/spacing-confirm.tsx:119-141`). Voici son texte (`frontend/src/locales/fr.json:482,502-503`, `en.json:482,502-503`) :

- **Titre :** « Espacement minimal »
- **Phrase :** « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. Enregistrer quand même ? »

Le brief impose aussi que chaque fragment reproduise l'écran réel. **J'applique donc le texte de l'app.** Ce choix reste à confirmer, car c'est la seule vraie contradiction dans le brief.

## Ce que le visiteur y gagne

Juste après avoir vu consigner une entrée, il voit un autre membre de la maisonnée prévenu en direct, puis le sélecteur de maisonnée. Les trois fonctions récentes apparaissent sur la page, et rien n'est retiré.

## Disposition

- **Ordre des sections, sur `/` et `/en/` :** … `<Steps />` → `<Features />` → `<Forecasting />` → `<LookingBack />` → `<Discover />` → pied de page (`landing/src/pages/index.astro:60-84`, `en/index.astro:58-66`).
- **Ordinateur (`lg`) :** on garde les trois colonnes. La colonne 3 empile deux tuiles `bg-card` : d'abord l'écart minimum, qui est la preuve, puis le sélecteur. Chaque tuile a sa légende. Cela modifie D-le-changement-de-maisonnee-se-montre-dans-sa-section (`docs/DECISIONS.md:16205`), qui sera remplacée par **D-la-section-maisonnee-montre-deux-fragments**.
- **Tablette (`md`) :** la colonne 1 garde le titre et le chapeau, la colonne 2 les trois points. En dessous, une rangée avec les deux tuiles côte à côte.
- **Mobile (< `md`) :** tout s'empile : titre, chapeau, points, tuile d'écart, tuile du sélecteur. La phrase passe à la ligne, sans troncature ni défilement horizontal.
- **Nouveau fragment `landing/src/components/fragments/SpacingFragment.astro` :** il reprend le modèle de `SwitcherFragment.astro`. Il est déclaré comme image (`role="img"`), ne contient aucun élément sélectionnable au clavier et ne code aucun mot en dur.
  - Il dessine la boîte de dialogue : le titre, la phrase, puis les boutons « Annuler » (bordure) et « Enregistrer quand même » (contour `border-primary`, sans remplissage).
  - Pas de remplissage pour le bouton, pour éviter une seconde action colorée, comme `ImportFragment.astro:11-14` en donne la raison.
  - Aucun rouge ni vert.
- **Pastilles de l'étape 2 :** dans `QuickLogMock.astro:124-127`, la rangée de pastilles se place sous le champ, comme dans l'app (`event-answers.tsx:592-597,800-805`). Les valeurs sont des nombres seuls, en ordre croissant : `0,5 · 1 · 2` (EN `0.5 · 1 · 2`). La valeur 1 est sélectionnée avec le style `border-primary bg-primary/10`.
  - Arbitrage : le brief dit que « 1 comprimé » *devient* des pastilles. Je garde quand même le champ au-dessus, parce que l'app le garde.
- **Données du fragment d'écart :** Camille, « Acétaminophène » (EN « Acetaminophen »), il y a 2 h, règle de 6 h. Le commentaire d'en-tête présentera ce 6 h comme un réglage choisi par la maisonnée, jamais comme une posologie.

## Copie FR / EN proposée

| Clé | FR | EN |
|---|---|---|
| `hero.subhead` | Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chacun dans la maisonnée consigne d'un geste, et tous voient la même chose au même endroit. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. | The bottle, the evening pill, the smoke detector's battery, the cat's dewormer: everyone in the household logs with one gesture, and everyone sees the same thing in one place. Once a rhythm shows, or once you set the dates yourself, Tamialog tells you what comes next. |
| `features.household.points.fifth` (légende de la tuile d'écart) | Une règle posée sur un bouton, comme un espacement minimal, vaut pour toute la maisonnée : si quelqu'un d'autre vient de le faire, l'app le dit au moment d'enregistrer, et on enregistre quand même si c'est voulu. | A rule set on a button, such as a minimum spacing, holds for the whole household: if someone else has just done it, the app says so as you save, and you can save anyway. |
| `features.household.spacing` (textes du fragment) | Espacement minimal · Camille a consigné « Acétaminophène » il y a 2 h — au moins 6 h entre deux saisies. · Enregistrer quand même ? · Annuler · Enregistrer quand même | Minimum spacing · Camille logged "Acetaminophen" 2 h ago — at least 6 h between two entries. · Save anyway? · Cancel · Save anyway |
| Ajout à `lookingBack.points.second` | On peut aussi ne relire qu'un bouton, voire une seule de ses réponses : seulement les biberons en poudre, et leurs ml. | You can also read back a single button, or just one of its answers: only the powdered bottles, and their ml. |

- **Sources :** le filtre vient de `docs/SPEC.md:1324`. Les textes « Annuler » et « Cancel » (`common.cancel`) sont à relire dans les fichiers de langue de l'app au moment de la réalisation.
- **Types :** `landing/src/copy/types.ts` reçoit `points.fifth`, `spacing` et `sheet.chips`, pour que la vérification `satisfies Copy` continue de passer.

## Réutilisation et architecture

On reprend `Section.astro` et la tuile du bento. `Features.astro` n'affiche toujours qu'une seule section, et `Steps.astro:95-104` transmet simplement les pastilles au mock. Rien ne change sous `frontend/` ni sous `backend/`. On réécrit les commentaires d'en-tête de `Features.astro` (lignes 1-35) et de `index.astro` (lignes 76-81, « the household stays, below »).

## Livraison minimale : une seule phase, cinq commits

1. Remonter la section maisonnée sur les deux pages, ajouter `SpacingFragment`, la copie, les types, et remplacer D-le-changement-de-maisonnee…
2. Nouveau chapeau du héros.
3. Pastilles dans le mock de l'étape 2.
4. Phrase sur le filtre dans `lookingBack`.
5. Mesurer la hauteur, puis fixer le nouveau plafond à la page la plus haute plus quelques dizaines de px, arrondi à la centaine. Cela passe par une nouvelle décision **D-le-budget-de-hauteur-passe-a-<mesure>**, qui remplace D-le-budget-de-hauteur-passe-a-5-100. Tous les endroits qui énoncent ce plafond doivent être mis à jour : `audit.mjs:36,115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524` et `.claude/skills/landing-and-deploy/SKILL.md:146`.

## Vérification (commandes proposées, non exécutées)

- `(auto)` `pnpm -r build` : l'étape `astro check` accepte `fr.json` et `en.json` avec `satisfies Copy`.
- `(auto)` Les tests du paquet `landing` (`vitest run`) passent. Le nom exact du script reste à lire dans `landing/package.json`.
- `(auto)` `node landing/scripts/audit.mjs` se termine avec le code 0. Il contrôle le contraste AA en clair et en sombre, l'absence de débordement, le « ~ dans 5 h » qui reste visible sans défiler (229 px aujourd'hui) et la hauteur sous le nouveau plafond.
- `(auto)` `grep -n "5 100\|5100" landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` ne renvoie aucune ligne (code de sortie 1).
- `(manual)` Avec le skill run-tamialog, ouvrir `/` et `/en/` à 1280 puis à 360 px, en clair puis en sombre. Vérifier :
  - l'ordre Étapes → maisonnée → Prévision ;
  - le fragment d'écart lisible en entier ;
  - les pastilles avec « 1 » sélectionnée ;
  - la phrase sur le filtre ;
  - aucune section maisonnée en bas de page.

## Faits vérifiés et mesures encore à obtenir

- **Vérifié :** la phrase et la boîte de dialogue de l'app, le style des pastilles, le plafond actuel `5100` (`audit.mjs:115`), les endroits qui énoncent ce plafond, et le texte de la spec sur le filtre.
- **Encore à obtenir :**
  - le coût réel en px de la section, et donc le nouveau plafond ;
  - la position du « ~ » avec le nouveau chapeau, qui a une longueur proche de l'actuel ;
  - le contraste du contour `border-primary` en sombre ;
  - si le champ de l'app affiche l'unité « comprimé » à côté du nombre.

## Risques

- La première raison pour laquelle un visiteur passerait à côté, c'est une colonne 3 trop haute qui ressemble à du texte en vrac. La tuile d'écart en tête de colonne, avec sa légende, est la réponse prévue ; la vérification manuelle à 1280 px le confirmera.
- Autre risque : que le 6 h soit lu comme une posologie. Le commentaire d'en-tête et la légende présentent la règle comme un réglage de la maisonnée.

La seule question ouverte est celle du début : faut-il garder la phrase du brief, ou celle de l'app que je propose ?
