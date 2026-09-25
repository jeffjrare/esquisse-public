# B-043 : montrer dans `esq state` le décalage entre la roadmap et l'épopée et le statut réel du backlog

Rien n'a été écrit, ni branche, ni ledger, ni commit. Les étapes « Commit and stop » et la mise en `Planned` sont hors périmètre, comme demandé. Si ce plan était écrit, son slug serait `projection-freshness-state`, rattaché à l'épopée `aug-18-improv` (`docs/epics/aug-18-improv.md:74`).

## Contexte (faits vérifiés)

- **Ce que dit l'item.** Sa fiche (`docs/BACKLOG.md:487-504`) demande que `esq state` renvoie `roadmap.stale` ou un signal équivalent. Il doit aussi donner le statut réel de chaque ID couvert par la roadmap, sans jamais réécrire `ROADMAP.md`, dont `/esq:roadmap` reste le seul auteur. La portée a été réduite le 2026-09-24 : « petit changement de rapport, pas de rafraîchissement obligatoire ».
- **Ce que fait le code aujourd'hui.** `roadmapHead()` (`plugin/lib/cli.mjs:1735-1765`) ne lit que la première entrée de `## Now`, sans aucun statut.
- **Pourquoi `/esq:status` ne peut pas voir le problème.** `backlogRows()` (`cli.mjs:228-247`) ne garde que les lignes Open, Needs-decision et Planned. La règle actuelle de `/esq:status` (« si elle contredit les faits connus du backlog… », `plugin/skills/status/SKILL.md:82`) ne voit donc jamais un item passé à `Done`. C'est exactement le cas de B-028 le 2026-08-19.
- **Le défaut est présent aujourd'hui.** Dans `docs/epics/aug-18-improv.md:75,85,86`, la section `## Backlog` affiche B-044, B-071 et B-072 en « Open ». Or leurs lignes (`BACKLOG.md:62,89,90`) sont `Done`, et `ROADMAP.md:103` les classe « Shipped ». Ce cas servira de preuve.
- **Écart avec la spec.** L'ajout change un comportement documenté de `/esq:status` (section correspondante de `docs/SPEC.md`, que je n'ai pas relue en entier). Le changement est additif et ne contredit aucune règle. `/esq:spec` fera la mise à jour après livraison.

## Résultat utile

Aujourd'hui, `/esq:status` recopie tel quel l'état écrit dans la roadmap. Après le changement, il affichera à côté des lignes de ce type :

`B-044 — l'épopée dit Open · backlog Done`

Aucune commande de rafraîchissement ne sera nécessaire, et un décalage ne pourra plus passer pour l'état courant.

## Interaction proposée

Ce qui change pour l'utilisateur : rien à lancer de plus, aucune nouvelle cérémonie. `/esq:status` affiche un bloc « projections périmées » seulement s'il y en a :

```
⚠ roadmap : dependable-queue (Now) couvre B-129 — backlog Done
⚠ épopée aug-18-improv : B-044, B-071, B-072 — projeté Open · backlog Done
  (/esq:roadmap ou /esq:epic pour rafraîchir — facultatif)
```

La mention « state may be stale » disparaît, car elle reposait sur un jugement du modèle ; le CLI fournit désormais la liste. Le texte `state:` de la roadmap reste affiché tel qu'il est écrit.

## Approches envisagées

1. **Faits structurels calculés par le CLI (recommandée).** `esq state` lit tout le tableau du backlog, y compris Done et Dropped, puis :
   - **pour la roadmap**, liste chaque ID `covers:` des sections Now, Next et Later avec son statut réel. Un ID `Done` ou `Dropped` encore placé dans un horizon, ou absent du backlog, est marqué périmé. Ce que dit la projection, c'est sa section. Le texte `state:` en prose n'est pas analysé ; en juger reste le rôle du modèle.
   - **pour les épopées `Active`**, compare le statut en fin de ligne `- B-NNN — … — <Status>` de `## Backlog` au statut réel. Ce format est structuré, donc la comparaison est exacte.

   Coût : un parseur d'environ 60 lignes, qui réutilise `backlogTable()`. Aucun nouvel auteur, aucun format nouveau.
2. **Horodatage ou hash de la source seul.** On comparerait le dernier commit de `BACKLOG.md` à celui de `ROADMAP.md`. C'est bon marché, mais cela signale « plus vieux » et non « faux » : chaque capture passerait pour périmée, ce qui ajoute du bruit. Écarté ; la fiche le présente comme facultatif (« may »).
3. **Tout laisser au modèle dans `/esq:status`.** Il faudrait relire `BACKLOG.md` et les épopées, ce qui est interdit (`status/SKILL.md:21` : « Do not … parse backlog/roadmap facts the CLI supplies »). La vérification coûterait à chaque exécution et ne serait pas reproductible. Écarté, conformément à `CLAUDE.md` § 3.

## Recommandation et architecture

Retenir l'approche 1. Ce choix respecte la règle d'un seul auteur par fichier (`docs/ARCHITECTURE.md:114`) : `state()` ne fait que lire. Le partage des rôles est le suivant :

- **Le CLI** fournit les faits : section, statut projeté pour les épopées, statut réel.
- **Le modèle** juge de ce qu'il faut en dire, et notamment si le texte `state:` en prose est trompeur.

Pour la roadmap, je n'analyse pas la prose `state:`. Déduire « Open » d'une phrase serait une garde fragile qui contrôle du texte, ce que `CLAUDE.md` § 5 exclut. La section suffit à couvrir le cas cité (un item `Done` encore en file d'attente).

Schéma élargi, uniquement par ajout :

- `roadmap.covered: [{entry, horizon, id, live}]` et `roadmap.stale: [{entry, horizon, id, live}]`. La valeur `live: null` signifie que l'ID est absent du backlog.
- `epics: [{slug, file, stale: [{id, projected, live}]}]`, limité aux épopées `Active`.
- Si le backlog est malformé : pas de `stale` du tout, jamais une liste vide. La règle existante (« inconnu, pas zéro ») s'applique aussi ici.

Le seul consommateur de `state` est `/esq:status`. `roadmap.head` reste inchangé, ce qui assure la compatibilité avec `tests/cli/esq.test.mjs:168-173`.

Point d'architecture, à consigner dans `docs/DECISIONS.md` : le statut projeté par la roadmap est défini par sa section, non par sa prose. Décision prise d'après le dépôt, sans recherche externe.

## Tranche livrable (une seule phase)

**Phase 1 — Afficher les projections périmées dans `esq state` et `/esq:status`**

- **Fichiers :** `plugin/lib/cli.mjs`, `tests/cli/esq.test.mjs`, `plugin/skills/status/SKILL.md`, `docs/CONFORMANCE.md` (car le format `- B-NNN — … — Status` des épopées devient parsé).
- **Tâche 1.1 :** `state: report live backlog status beside roadmap and active-epic projections`.
  - Lecture complète du tableau et parsing des sections Now, Next et Later et des épopées Active.
  - Tests sur des fixtures : ID Done en Now ; ID Dropped en Later ; ID absent ; épopée en Open alors que le backlog dit Done ; épopée `Done` ignorée ; backlog malformé qui ne renvoie pas `stale` ; `ROADMAP.md` absent qui donne `roadmap: null` ; fichier resté identique après l'appel.
- **Tâche 1.2 :** `status: render CLI stale-projection facts instead of inferring them`.
  - Remplacer la règle de `status/SKILL.md:82` et ajouter les champs au tableau de `:23-32`.
  - Mettre à jour `docs/CONFORMANCE.md`.
- **Vérification :**
  - `(auto)` `node --test 'tests/cli/esq.test.mjs'` — les nouveaux cas `stale` passent et `roadmap.head` est inchangé.
  - `(auto)` `git diff --exit-code -- docs/ROADMAP.md docs/epics/ docs/BACKLOG.md` — aucun ledger n'est modifié par l'exécution (preuve de l'absence de second auteur).
  - `(auto)` `./plugin/bin/esq state` — sur ce dépôt, `epics[aug-18-improv].stale` contient B-044, B-071 et B-072 avec `projected: Open` et `live: Done`. C'est la preuve sur le cas réel décrit dans le Contexte.
  - `(auto)` `./scripts/audit.sh` — le passage produit est vert. Pas de `node --test` séparé à côté (`CLAUDE.md:63`).

**Coût estimé :** une session de build, environ 150 lignes de code et de tests. Chaque `esq state` lit en plus les épopées Active, pour un surcoût négligeable. Aucun sous-agent, aucune télémétrie.

**Non prouvé :** que le modèle formule bien le bloc dans `/esq:status`. Cela reste une lecture manuelle, sans campagne d'évaluation.

## Risques

- **Formats de lignes d'épopée variables.** La ligne `_History: …_` et les anciennes lignes sans statut final doivent être ignorées, jamais signalées comme périmées. Cas à prévoir dans les fixtures.
- **Un Planned couvert par un plan complet n'est pas « périmé ».** B-129 a tranché ce point : pas de fausse fermeture, donc seuls Done, Dropped et les IDs absents comptent.
- **Les entrées `epic:<slug>` dans `covers:`** (`ROADMAP.md:23`) ne sont pas des IDs : il faut les ignorer.
- **B-075, couvert par la même entrée `projection-standing`**, reste hors périmètre. Sa ligne n'est pas touchée.

## Autorisation manquante

Aucune pour cette conception. Une seule tension d'ordre : `ROADMAP.md:28-32` place B-043 en *Next*, après `dependable-queue` (B-079 encore Open), et `BACKLOG.md:489` dit « after B-129 », qui est livré. Lancer B-043 avant B-079 est donc un choix de priorité qui vous revient, et vous l'avez fait en ciblant B-043. En revanche, reclasser la roadmap ne relève pas de ce plan : c'est le rôle de `/esq:roadmap`.

## Suite

Pour passer à l'écriture réelle, relancez `/esq:plan B-043` sans la restriction de lecture seule. Ensuite `/esq:build` suffit, car le plan n'a qu'une phase.
