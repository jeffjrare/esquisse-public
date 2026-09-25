> `Planning projection-freshness-live-facts.` (entrée directe B-043 ; aucun brief consommé)

# B-043 — Plan : montrer quand la roadmap ou un epic est périmé, sans second rédacteur

**Epic :** `aug-18-improv`. Les champs Branch et Origin sont absents parce que HEAD est détaché. Sur votre demande, je n'ai rien écrit, créé aucune branche et changé aucun statut de backlog.

## Contexte (faits vérifiés)

- `esq state` lit seulement la tête de `## Now` via `roadmapHead` (`plugin/lib/cli.mjs:1735-1765`). Il renvoie `state` tel qu'écrit, sans le comparer au backlog.
- `backlog.rows` exclut les lignes `Done` et `Dropped` (`ROW_STATUSES`, `plugin/lib/cli.mjs:226`). Aujourd'hui, `/esq:status` doit donc deviner s'il y a désaccord (`plugin/skills/status/SKILL.md:82`), alors qu'il ne voit jamais qu'un élément couvert est terminé.
- Le décalage existe dans ce dépôt en ce moment. `docs/epics/aug-18-improv.md:75,85,86` affiche B-044, B-071 et B-072 `Open`. `docs/BACKLOG.md:62,89,90` les marque `Done`.
- `esq state` ne lit aucun epic : `cli.mjs` ne mentionne jamais `docs/epics/`.
- Le contrat de B-043 (`docs/BACKLOG.md:498-502`) :
  - un signal explicite `roadmap.stale` ;
  - le statut live de chaque ID couvert, à côté du texte projeté ;
  - une preuve de fraîcheur déterministe ;
  - jamais de réécriture de ROADMAP.md.
- La portée actuelle (`:489`) ajoute : pas de rafraîchissement obligatoire.

## Résultat utile

Quand quelqu'un lance `/esq:status`, il voit le texte projeté et, à côté, le statut réel des éléments concernés. Si une projection est périmée, il voit aussi depuis quel commit, sans avoir à lancer `/esq:roadmap` ou `/esq:epic`. `/esq:status` choisit l'action suivante d'après le statut réel, pas d'après le texte périmé.

## Interaction proposée

`esq state` reçoit des champs **additifs** :

```json
"roadmap": { "file": "docs/ROADMAP.md", "head": { …inchangé…, "live": [{"id":"B-079","status":"Open"}] },
  "freshness": { "since": "<sha du dernier commit de ROADMAP.md>",
                 "stale": true,
                 "changed": [{"id":"B-129","then":"Open","now":"Done"}] } },
"epics": [{ "file":"docs/epics/aug-18-improv.md",
            "stale":[{"id":"B-044","projected":"Open","live":"Done"}] }]
```

`/esq:status` affiche par exemple :

`Roadmap : dependable-queue — projeté « … » · live : B-129 Done, B-079 Open ⚠ projection antérieure à 2 changements de statut (depuis a1b2c3d) — /esq:roadmap pour rafraîchir`

C'est un conseil, jamais un blocage. Aucune commande ni cérémonie nouvelle.

## Approches examinées

1. **Laisser juger le modèle, comme aujourd'hui.** Rejetée : le modèle ne reçoit pas les lignes `Done`. Il ne peut donc pas voir la dérive observée sur B-028.
2. **Rafraîchir les projections pendant la livraison** (build ou land réécrivent `state:`). Rejetée : cela crée un second rédacteur (`docs/ARCHITECTURE.md:76` et `:169`) et une cérémonie obligatoire.
3. **Analyser la prose de `state:`** pour y chercher des mots de statut. Rejetée : le format est libre (voir `docs/ROADMAP.md:18`), l'analyse serait fragile, et cela revient à contrôler de la prose (`CLAUDE.md:22-25`).
4. **Un marqueur hash ou date écrit par `/esq:roadmap`**, comme `last-spec`. Il faudrait changer le rédacteur et son format. Surtout, n'importe quelle modification du backlog signalerait « périmé » : trop de bruit.
5. **Recommandée : une base Git pour la roadmap et une comparaison directe pour les epics.**
   - **Roadmap.** Le CLI récupère `since` = `git log -1 --format=%H -- docs/ROADMAP.md`, puis lit `git show <since>:docs/BACKLOG.md`. Pour **chaque** ID couvert par une ligne `**covers:**`, dans tout le fichier, il compare le statut à cette date au statut actuel. Tout écart apparaît dans `changed`. C'est un fait structurel et précis, et le rédacteur ne change pas.
   - **Epics.** Leur section `## Backlog` est générée au format `- B-NNN — … — <Statut>` (`docs/epics/aug-18-improv.md:71-74`). Le dernier segment se compare directement au statut live.

**Compromis.** Les deux méthodes restent déterministes, sans aucun rédacteur nouveau, pour un coût d'environ 2 appels Git et 2 petites lectures par `esq state`. En contrepartie, une roadmap déjà fausse au moment de son commit n'est pas détectée. Une roadmap non commitée, modifiée dans l'arbre de travail ou sans historique (clone superficiel) donne `stale: null` avec une `reason`. Inconnu n'est jamais présenté comme frais. Je décide ce point moi-même, puisque c'est un choix d'ingénierie.

## Tranche livrable : une seule phase

**Fichiers :** `plugin/lib/cli.mjs`, `tests/cli/esq.test.mjs`, `plugin/skills/status/SKILL.md`.

**Tâches (un commit chacune) :**

1. **Tâche 1.1 : `esq state` indique la fraîcheur de la roadmap.**
   - Un lecteur de statut pour tous les statuts, sans toucher `backlogRows` ni son filtre.
   - `head.live` pour la tête.
   - `roadmap.freshness` calculé sur toutes les lignes `covers`.
   - Un ID absent du backlog donne `status: "missing"`.
   - ROADMAP.md reste en lecture seule.
2. **Tâche 1.2 : `esq state` compare la section générée de chaque epic au backlog live.**
   - Le champ `epics[]` n'apparaît que si `docs/epics/` existe.
   - Une ligne illisible donne `{file, error}` et ne fait pas échouer tout l'instantané. Ce principe existe déjà pour les plans (`cli.mjs:1785-1791`).
3. **Tâche 1.3 : `/esq:status` lit les faits live et fraîcheur au lieu de deviner.**
   - Réécrire `SKILL.md:82`.
   - Ajouter les champs au tableau `:26-34`.
   - La ligne `:119` s'appuie sur `live` pour « Open item » et pour le décompte d'au moins deux éléments encore Open.
   - Le rendu de l'epic (`:57`, `:136`) ajoute l'écart.
   - Le seul conseil reste `/esq:roadmap` ou `/esq:epic <slug>`.

**Élargissement de schéma :** il est additif. Le seul consommateur qui compare la structure exacte est le test `tests/cli/esq.test.mjs:82` (`deepEqual` sur `roadmap`), qu'il faudra mettre à jour. La ligne `:95` (`head: null`) doit rester valide avec `freshness`.

## Vérification

- `(auto)` `node --test 'tests/cli/esq.test.mjs'` — les nouveaux cas passent, sur un dépôt Git de test :
  - ROADMAP et BACKLOG commités avec B-001 `Open`, puis B-001 passé `Done` dans un commit ultérieur : `stale: true`, et `changed` contient `{B-001, Open, Done}` ;
  - aucun changement : `stale: false` ;
  - ROADMAP.md modifié sans commit : `stale: null` avec `reason` ;
  - ID couvert absent du backlog : `missing` ;
  - `covers` vide ou `## Now` vide : pas d'erreur ;
  - ligne d'epic `Open` alors que le backlog dit `Done` : listée ;
  - epic mal formé : `error` ;
  - pas de répertoire `docs/epics/` : champ absent ;
  - un test d'octets prouve que ROADMAP.md et les epics restent inchangés après `state`.
- `(auto)` `plugin/bin/esq state` — sur ce dépôt, le JSON liste B-044, B-071 et B-072 dans `epics[aug-18-improv].stale`. C'est la preuve sur le cas réel.
- `(auto)` `./scripts/audit.sh` — la passe produit est au vert. `CLAUDE.md:57-65` l'exige en dernière phase, et elle couvre déjà les suites node : pas de `node --test` supplémentaire après elle.

Pas d'étape `(manual)` : aucun écran n'est rendu.

## Coût

- Une session de build.
- Environ 100 à 150 lignes dans le CLI, environ 8 tests et environ 6 lignes de skill.
- À l'exécution : 2 sous-processus Git et N lectures d'epics par `esq state`, c'est-à-dire par `/esq:status`. Pas de sous-agent, pas de mesure, rien qui bloque.

## Risques

- **Historique Git indisponible** (clone superficiel, fichiers non suivis) : on renvoie `null` avec une raison, jamais `false`.
- **Format des epics.** Je ne l'ai vérifié que sur le fichier produit, pas dans le template de `/esq:epic`. Le build doit lire ce template avant la tâche 1.2. Si les formats divergent, on ne compare que les lignes qui correspondent exactement.
- **Changement produit.** `/esq:status` signale désormais la péremption de façon mécanique. Le SPEC devra être mis à jour ensuite par `/esq:spec`, déclenché par l'utilisateur, sans l'écrire ici.
- **Hors périmètre.** B-075 (parqué ou en cours) et la file complète dans `/esq:status`. La roadmap le permet : B-043 peut partir seul (`docs/PRIORITY-REVIEW.md:38`).

## Autorité manquante

Aucune ne bloque. Le seul point qui revient à l'utilisateur est l'**ordre** : la roadmap place B-043 dans `Next`, après B-079 qui est encore `Open` (`docs/ROADMAP.md:18,28-32`). Le lancer maintenant revient à le choisir devant B-079. Ce plan ne tranche pas cette priorité.
