# B-189 seul — la règle d'état Git, jugée sur trois essais

## Protocole

Plan `2026-09-29-git-state-rule-alone`. Il fait suite au [jeu partagé B-188/B-189](2026-09-29-b188-b189-tamialog.md).
Dans ce jeu, C7 était monté à 3/3, mais C1 et C6 étaient tombés à 1/3, et un jeu partagé ne permettait pas de dire
quelle modification en était la cause. Ce jeu applique la **seule** règle C7, pour l'isoler.

- **C7 (B-189), commit `32404b4`** : c'est `git revert cc45e94`, donc exactement le texte de `44f5ff6`, sans la
  clause C5. Un état Git n'est nommé que d'après la sortie d'une commande qui a tourné. Quand la commande n'a pas
  tourné, le plan dit « branch not observed » et ne nomme ni état ni conséquence.
- `SKILL.md` passe de `8f505624…` (5 443 mots) à `33413e6e…` (5 538 mots, +95). Il est identique à l'octet près à
  `git show 44f5ff6:plugin/skills/plan/SKILL.md`. Voir le [diff](2026-09-29-b189-alone-tamialog/correction.diff)
  (`49ff4056…`).

**Critères** : C1 à C7, repris sans changement de la [variance](2026-09-29-b181-variance.md). Le lecteur juge, sans
compter la présence de mots.

**Règle fixée avant tout essai**, par rapport au bras correction du 2026-09-29 (C1 2/3, C2 2/3, C3 3/3, C4 3/3,
C5 1/3, C6 2/3, C7 1/3) :

- la **cible** est atteinte quand C7 tient ≥ 2/3, et B-189 passe alors Done ;
- **pas de régression** : C1, C2, C3, C4 et C6 tiennent chacun ≥ 2/3. C5 est rapporté mais n'entre pas dans la règle ;
- **régression**, ou cible manquée : la modification est retirée et B-189 reste Open.

**Cas** : `/tmp/b189-alone-case`, reconstruit à partir des blobs d'`events-tracker` listés dans
[inputs.json du 2026-09-25](2026-09-25-b181-tamialog/inputs.json) (commit `33e750a1`), avec **437/437 SHA-256
identiques**. Le plugin vient de `git archive HEAD plugin` au commit `32404b4` (47 fichiers, version 0.3.66), soit
484 fichiers en tout, sans `.git` ni lien symbolique. `docs/plans/` ne contient que les trois briefs. Les empreintes
sont dans [inputs.json](2026-09-29-b189-alone-tamialog/inputs.json). Le
[prompt](2026-09-29-b189-alone-tamialog/prompt.txt) est identique à l'octet près (`d17732b6…`).

**Borne annoncée avant le lancement** : 3 essais, Opus / medium, au plus 3 USD et 180 s chacun, 9 USD au total. Ce
sont des estimations au tarif catalogue de la CLI : sur l'abonnement, un essai consomme de l'usage et n'est pas
facturé. La recette est le bloc de `docs/headless-trial.md`, repris tel quel avec `-u ESQ_CODEX` en plus. Les trois
essais tournent en parallèle, hors sandbox, chacun avec son `RESULT_DIR` et son `mktemp` d'identifiants, supprimé par
le trap. Aucun `/tmp/esq-headless-auth.*` ne reste, et les **484 fichiers sont inchangés** après les essais. Claude
Code est en **2.1.284**, comme dans les deux jeux précédents, et le modèle rapporté est `claude-opus-5-5`. Il n'y a
ni refus d'outil ni erreur d'outil.

## Lancement

| Essai | Sortie | Temps (lanceur) | Coût USD rapporté | Proposition |
| --- | --- | --- | --- | --- |
| 1 | 0, `success` | 180 s (178,8 s rapportés) | 1,5544258 | [proposal.md](2026-09-29-b189-alone-tamialog/run-1/proposal.md) (`e3c78fcb…`) |
| 2 | 0, `success` | 135 s | 0,9015706 | [proposal.md](2026-09-29-b189-alone-tamialog/run-2/proposal.md) (`c0b98536…`) |
| 3 | 0, `success` | 157 s | 1,1778700 | [proposal.md](2026-09-29-b189-alone-tamialog/run-3/proposal.md) (`7fba160b…`) |

L'essai 1 finit à 1,2 s de la limite de 180 s. Il livre sa proposition complète et n'a pas été tué.

## Critères × essais

| Critère | Essai 1 | Essai 2 | Essai 3 | Réussites |
| --- | --- | --- | --- | --- |
| C1 valeur remplacée ou conflit signalé | ✅ l. 27 « le champ « 1 comprimé » est remplacé par la ligne « Quantité · comprimé », suivie des pastilles » | ❌ l. 49 « Le champ garde « Quantité · 1 comprimé ». Dessous : `0,5 · 1 · 2` » : champ gardé, aucun conflit nommé | ✅ l. 51 « `sheet.fieldValue` est remplacé par `sheet.chips` » | 2/3 |
| C2 avis lu dans `QuickLogSheet` | ✅ l. 9 `QuickLogSheet.tsx:641-667` | ✅ l. 8 `QuickLogSheet.tsx:644`, bouton `:666` | ✅ l. 8 `QuickLogSheet.tsx:644` | 3/3 |
| C3 ni verrou SPEC ni nouveau grill | ✅ l. 13 « n'est pas un préalable », l. 71 | ✅ l. 11 « pas un préalable », l. 79 | ✅ l. 11, l. 77–79 (arbitrage motivé, pas de question bloquante) | 3/3 |
| C4 maisonnée après Steps, avant Forecasting | ✅ l. 17 | ✅ l. 60, l. 72 | ✅ l. 19 | 3/3 |
| C5 copie FR/EN complète, « en poudre » gardé | ❌ l. 36 EN « only the formula bottles » : qualificatif perdu | ✅ l. 46 EN « only the powder bottles » | ✅ l. 49 EN « only the powdered-formula bottles » | 2/3 (1/3 à la lettre) |
| C6 phase complète, audit `--no-build` | ❌ l. 50 puis l. 52 : `pnpm -r build` puis `audit.mjs` sans `--no-build` | ❌ l. 67, l. 69, l. 71 : `pnpm --filter landing build`, `audit.mjs` sans `--no-build`, puis `pnpm -r build` : landing construit trois fois | ✅ l. 64 puis l. 66 : build, puis `audit.mjs --no-build` | **1/3** |
| C7 pas d'état Git inventé | ✅ l. 1 « la branche Git n'[a] pas pu être lu[e] » ; l. 73, branche seulement proposée | ✅ l. 3 « Git n'a pas été consulté » ; l. 59, branche proposée | ✅ l. 3 « branche non observée » | **3/3** |

C5 est lu comme dans le jeu partagé : le défaut de B-188 est la perte de « en poudre ». C5 n'entre pas dans la règle.
L'essai 2 abrège par « … » la partie inchangée du chapeau anglais, ce qui n'est pas compté comme une perte.

## Référence, jeu partagé, ce jeu

| Critère | Référence (bras correction) | Jeu partagé C5 + C7 | Ce jeu, C7 seul | Rôle |
| --- | --- | --- | --- | --- |
| C1 | 2/3 | 1/3 | 2/3 | non-régression |
| C2 | 2/3 | 2/3 | 3/3 | non-régression |
| C3 | 3/3 | 3/3 | 3/3 | non-régression |
| C4 | 3/3 | 3/3 | 3/3 | non-régression |
| C5 | 1/3 | 3/3 (1/3 à la lettre) | 2/3 (1/3 à la lettre) | rapporté, hors règle |
| C6 | 2/3 | 1/3 | **1/3** | non-régression, **sous 2/3** |
| C7 | 1/3 | 3/3 | 3/3 | cible B-189 |

**Règle appliquée telle qu'écrite : régression.** C6 tombe à 1/3, sous le seuil de 2/3. **La modification est
retirée**, et B-189 reste Open. La cible est pourtant atteinte : C7 tient 3/3 pour la deuxième fois de suite, soit 6/6
sur les deux jeux qui portent la règle, contre 1/3 sans elle.

**Ce que la comparaison dit de l'attribution, sans le prouver :**

- **C1** revient à 2/3 quand la clause C5 est absente. La baisse de C1 dans le jeu partagé suit donc la clause C5, ou
  bien le bruit. Elle ne suit pas C7.
- **C6** est à 1/3 dans les deux jeux qui portent C7, et à 2/3 dans la référence. La règle C7 est donc suspecte pour
  C6. Pourtant, la clause qui gouverne C6 (« pass the runner's no-build option ») est au point 6 de la relecture, loin
  des deux endroits que C7 modifie. Aucun mécanisme n'explique ce lien, et un écart d'un seul essai sur trois reste
  dans le bruit à n = 3. Les deux lectures tiennent, et ce jeu ne tranche pas entre elles.
- **C6 échoue de la même façon dans tous les essais ratés** : la proposition construit, puis lance l'audit sans
  `--no-build`. Dans la référence, cette clause tenait déjà seulement 2/3. C6 est fragile avec ou sans C7.

**Facteurs confondants** : entre `538c7c8` et ce jeu, le plugin ne change que par cette modification et par la montée
de version `0.3.65` → `0.3.66` (`a63e52d`, `plugin.json` seul). Claude Code, la recette, le cas et le prompt sont
les mêmes.

## Volume et coût (rapportés, sans effet sur la décision)

| Mesure | Essai 1 | Essai 2 | Essai 3 |
| --- | --- | --- | --- |
| Mots finaux (plafond 900) | 1 305 | 1 219 | 1 307 |
| Appels d'outils | 38 | 42 | 42 |
| Caractères renvoyés par les outils | 238 530 | 93 458 | 149 259 |
| Tokens de sortie (raisonnement inclus) | 16 658 | 12 832 | 14 645 |
| Temps (lanceur) | 180 s | 135 s | 157 s |
| Coût USD rapporté | 1,5544258 | 0,9015706 | 1,1778700 |

Le total rapporté est de 3,63 USD, sous la borne de 9 USD.

## Limites

- **Trois essais** distinguent 0/3 de 3/3, pas 60 % de 80 %. La règle est la condition d'arrêt fixée d'avance, pas
  une affirmation statistique.
- **Un seul cas** (Tamialog, brief vitrine multi-membre).
- Ce rapport juge des propositions, pas une livraison.
- **Ce que ces deux jeux suggèrent pour la suite, sans le prouver** : C7 est fiable (6/6). La question ouverte est
  C6, qui échoue aussi en dehors de C7. Deux voies sont possibles :
  - accepter B-189 avec la règle C7 et traiter C6 à part ;
  - relancer un jeu pour savoir si C6 à 1/3 est du bruit.

  Ce choix touche la règle de non-régression elle-même. Il revient à l'utilisateur.
