> `/esq:plan — writing one plan file. Bound: no subagents, at most 4 questions per round, at most 3 web searches per load-bearing decision.`

(Mandat en lecture seule : aucun fichier ne sera écrit. Pas de shell, donc `ESQ_CODEX` n'a pas pu être lu et reste traité comme désactivé.)

---

Je vérifie maintenant le tiroir réel (avertissement d'écart, pastilles de quantité) pour que les fragments le reproduisent fidèlement.

---

Lecture terminée. Je ne peux pas écrire de fichier dans ce mode, donc voici la proposition de plan.

# Plan proposé : `vitrine-fonctions-recentes-multi-membre`

Source : `docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.brief.md`. Aucun fichier, aucune branche, aucun commit. La branche et l'origine n'ont pas été lues, faute de shell. B-530 devrait passer à `Planned` quand le plan sera réellement écrit. Codex n'a pas été lancé.

## Écart avec le brief (à trancher dans le plan)
- **La phrase citée par le brief n'est pas celle de l'app.** Le brief cite « cette prise demande 6 h d'écart ». L'app dit « {{author}} a consigné « {{name}} » {{age}} — au moins {{gap}} entre deux saisies. » (`frontend/src/locales/fr.json:482`, en.json:482). Le brief exige aussi que chaque fragment reprenne l'écran réel, donc **je reprends le texte de l'app**.
- **Ce n'est pas une ligne du tiroir, c'est une boîte de dialogue.** Elle s'ouvre par-dessus le tiroir quand le serveur refuse l'enregistrement (`spacing-confirm.tsx:110-143`). Titre « Espacement minimal », boutons « Annuler » et « Enregistrer quand même ».
- **Deux fonctions manquent dans `docs/SPEC.md`** : l'espacement et les pastilles de quantité. Les commentaires d'en-tête citeront donc le code (`spacing-confirm.tsx`, `event-answers.tsx:770`, D-une-valeur-frequente-revient-trois-fois). Mettre SPEC à jour avec `/esq:spec` reste à faire ensuite ; ça ne bloque pas.

## Ce que le visiteur y gagne
Juste après avoir vu consigner, il voit qu'un autre membre de la maisonnée est prévenu avant d'enregistrer une deuxième fois la même dose. Il découvre aussi les pastilles de quantité et le filtre par bouton et par réponse.

## Disposition
**Ordre des sections** : `<Steps />` → `<Features />` → `<Forecasting />`, dans `landing/src/pages/index.astro:60-84` et `en/index.astro:58-66`. Les commentaires d'en-tête sont réécrits, dont `index.astro:77-81` (« the household stays, below »).

**Section maisonnée** (`Features.astro:58`) :
- **Grand écran (`lg`), trois colonnes.** Colonne 1 : titre, chapeau, puis la **nouvelle tuile d'écart** (même tuile `bg-card` que le sélecteur). Colonne 2 : les trois points. Colonne 3 : le sélecteur, à sa place actuelle. La colonne 1 est aujourd'hui la plus courte (deux lignes de chapeau), donc la tuile occupe de la place déjà vide. **D-le-changement-de-maisonnee-se-montre-dans-sa-section reste valable.**
- **Tablette (`md`), deux colonnes.** Colonne 1 : titre, chapeau, tuile d'écart. Colonne 2 : les points, puis le sélecteur.
- **Mobile.** Tout s'empile dans l'ordre du code : titre, chapeau, écart, points, sélecteur. Le texte passe à la ligne (`flex-wrap`, `min-w-0`), sans défilement horizontal.

**Nouveau fragment** : `fragments/SpacingFragment.astro`, sur le modèle de `SwitcherFragment.astro`. C'est une image (`role="img"`), sans rien de cliquable, et tout son texte passe par des props. Il dessine la boîte de dialogue : titre, phrase, question, « Annuler » (bouton discret) et « Enregistrer quand même » avec le style de l'app. Aucun rouge ni aucune teinte d'alerte.

**Pastilles de quantité** : `QuickLogMock.astro`. Sous le champ « Quantité · 1 comprimé », une rangée de pastilles avec des chiffres seuls, en ordre croissant, reprise des classes de `event-answers.tsx:801`. Celle qui correspond est sélectionnée (`border-primary bg-primary/10`).

## Textes FR / EN
Nouvelle clé `household.spacing` à ajouter dans `types.ts:592`. La contrainte `satisfies Copy` doit rester vérifiée.

**Légende de la tuile**
- FR : « Une règle posée sur un bouton vaut pour toute la maisonnée : si quelqu'un d'autre vient de le faire, l'app prévient avant d'enregistrer — sans jamais bloquer. »
- EN : « A rule set on a button holds for the whole household: if someone else just did it, the app says so before saving — and never blocks. »

**Contenu de la boîte**
- Médicament retenu : **« 💊 Dose »**, déjà employé sur la page. Ça évite de nommer une molécule et de laisser croire à une posologie.
- FR : « Espacement minimal » / « Camille a consigné « Dose » il y a 2 h — au moins 6 h entre deux saisies. Enregistrer quand même ? » / « Annuler » / « Enregistrer quand même ».
- EN : « Minimum spacing » / « Camille logged “Dose” 2 h ago — at least 6 h between two entries. Save anyway? » / « Cancel » / « Save anyway ».
- Le « 2 h ago » reste à caler sur le vocabulaire EN déjà présent dans `en.json`.
- Légende accessible (`label`) — FR : « La question posée avant d'enregistrer : Camille a déjà consigné la dose il y a 2 h, la règle en demande 6. » EN : « The question asked before saving: Camille logged the dose 2 h ago, the rule asks for 6. »

**Pastilles** : « 0,5 · 1 · 2 » en FR, « 0.5 · 1 · 2 » en EN, avec **1** sélectionné.

**Chapeau du héros** (`hero.subhead`, fr.json:12). La longueur reste proche de l'actuelle pour ne pas faire descendre le « ~ ».
- FR : « Le biberon, le médicament du soir, la pile du détecteur de fumée, le vermifuge du chat : chacun le note d'un geste depuis son téléphone, et toute la maisonnée voit la même chose. Quand un rythme se dessine, ou quand vous fixez les dates vous-même, Tamialog annonce la suite. »
- EN : même structure (« everyone logs it in one tap from their own phone, and the whole household sees the same thing »), à caler sur la phrase EN actuelle.

**Filtre** : on réécrit `lookingBack.points.second` au lieu d'ajouter un point, ce qui coûte moins de hauteur. Source : SPEC:1324.
- FR : « La période, c'est vous qui la choisissez — 24 h, 7 j, 30 j, ou deux dates —, et une pastille réduit tout à un bouton, puis à une de ses réponses : seulement les biberons en poudre, et leurs ml. »
- EN : « You choose the period — 24 h, 7 d, 30 d, or two dates — and one tap narrows everything to one button, then to one of its answers: only the powdered-formula bottles, and their ml. »

## Plafond de hauteur
- **Règle proposée** : nouveau plafond = page la plus haute entre `/` et `/en/`, mesurée après construction, + 25 à 40 px, arrondi à la dizaine. C'est l'usage de D-le-budget-de-hauteur-passe-a-5-100 (35 px de marge).
- **Nouvelle décision** : `D-le-budget-de-hauteur-passe-a-<N>` remplace l'actuelle, dont la ligne passe à Superseded dans `docs/DECISIONS.md:884`.
- **Lecteurs du seuil à mettre à jour** : `landing/scripts/audit.mjs:36`, `:115`, `landing/DESIGN.md:89`, `docs/ARCHITECTURE.md:1524`, `.claude/skills/landing-and-deploy/SKILL.md:146`.

## Livraison la plus petite : une seule phase, cinq commits
1. Remonter la section maisonnée et réécrire les en-têtes.
2. `SpacingFragment`, les types et la copie FR/EN.
3. Les pastilles dans `QuickLogMock` et `steps.two.mock.sheet`.
4. Le chapeau du héros et le point du filtre.
5. Mesurer, relever `BUDGET.limit`, écrire la décision, mettre à jour les lecteurs.

## Vérification (commandes à lancer au moment de construire)
- `(auto)` `pnpm -r build` — `astro check` passe, donc FR/EN à parité via `satisfies Copy`, et le build aboutit.
- `(auto)` `pnpm -C landing test` — la suite vitest de `landing` passe.
- `(auto)` `node landing/scripts/audit.mjs --no-build` — code 0 sous le nouveau plafond, AA en clair et en sombre, « ~ » au-dessus de la ligne de flottaison. Le résumé doit aussi montrer « no horizontal scroll » : ce point est seulement rapporté par le script, jamais jugé (`audit.mjs:44`), donc il faut le lire.
- `(auto)` `grep -n -e '5 100' -e '5100' landing/scripts/audit.mjs landing/DESIGN.md docs/ARCHITECTURE.md .claude/skills/landing-and-deploy/SKILL.md` — aucune ligne (sortie 1 = réussite).
- `(auto)` `grep -n -e '<Steps' -e '<Features' -e '<Forecasting' landing/src/pages/index.astro landing/src/pages/en/index.astro` — dans chaque fichier : Steps, puis Features, puis Forecasting.
- `(manual)` [skill run-tamialog, clair puis sombre, sans thème mémorisé] Ouvrir `/` puis `/en/` à 1280 px puis à 360 px et vérifier :
  - « ~ dans 5 h » visible sans défiler ;
  - pastilles avec « 1 » sélectionné dans le téléphone de l'étape 2 ;
  - section maisonnée entre les étapes et « Une prévision… », avec la tuile d'écart entière et le sélecteur ;
  - le point du filtre dans « Tout ce qui est noté se relit » ;
  - plus aucune section maisonnée en bas ;
  - aucun défilement horizontal.

## Risques et mesures à obtenir
- **À mesurer** : les hauteurs finales, la position du « ~ » après le nouveau chapeau (229 px aujourd'hui), et le remplissage de l'écran du téléphone de l'étape 2. Le script audite à 390 px ; seule l'observation manuelle couvre 360 px.
- **Principal risque d'échec** : que le visiteur lise la boîte comme une alerte d'erreur. Réponse prévue : aucun rouge, et la légende dit « sans jamais bloquer ».
- **Si la colonne 1 devient la plus haute à `lg`**, la tuile d'écart ajoute de la hauteur. C'est accepté : le mandat est de relever le plafond, pas de retirer quoi que ce soit.

Aucune question ouverte : le brief donne l'autorité nécessaire pour chaque choix.
