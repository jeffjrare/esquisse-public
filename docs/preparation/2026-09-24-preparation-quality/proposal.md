> `Planning projection-freshness.` (épopée `aug-18-improv`, active ; B-043 serait passé en `Planned` — **non fait**, lecture seule)

# Proposition de plan : fraîcheur des projections sans second writer (B-043)

Chemin proposé : `docs/plans/2026-09-24-projection-freshness.md` · **Epic:** aug-18-improv. **Rien n'a été écrit**, aucune branche ni aucun ledger n'a été modifié.

## Context
Le détail de B-043 (`docs/BACKLOG.md:487-504`) demande que `esq state` expose le statut réel du backlog à côté de ce que disent les projections. Le problème existe encore aujourd'hui dans le dépôt :
- `docs/epics/aug-18-improv.md:80` affiche B-052 `Open` et `:83` affiche B-067 `Open` ;
- dans le backlog, ces deux lignes sont `Done` (`docs/BACKLOG.md:70`, `:85`).

Cause côté code : `state()` (`plugin/lib/cli.mjs:1767-1836`) ne lit que la tête de la roadmap (`roadmapHead`, `:1735`). `backlog.rows` ne contient que les lignes Open/Needs-decision/Planned (`plugin/skills/status/SKILL.md:29`). La règle « state may be stale » (`status/SKILL.md:82`) ne peut donc pas voir un B-129 `Done`.

Ce changement modifie un comportement produit :
- l'orientation `/esq:status` (`docs/SPEC.md:362`) ;
- le contrat de `esq state` (`docs/SPEC.md:449`, élargissement additif).

`/esq:spec` rafraîchira la spec après livraison.

## Goal
En lisant `/esq:status`, on voit qu'une projection de roadmap ou d'épopée contredit le backlog réel, et sur quels identifiants, sans lancer `/esq:roadmap` ni `/esq:epic`.

## Done looks like
- `esq state` sur ce dépôt signale B-052 et B-067 pour `aug-18-improv` : projeté `Open`, réel `Done`.
- `esq state` donne le statut réel de chaque ID couvert par la roadmap, y compris `Done` (B-129 → `Done`). Le texte `state:` projeté reste intact à côté.
- Aucun fichier `ROADMAP.md` ou `docs/epics/*.md` n'est réécrit. `esq validate` ne bloque jamais sur une projection périmée.
- `/esq:status` affiche une seule ligne de dérive quand il y en a une, et rien sinon.

## Approaches considered
1. **Faits réels à côté du projeté dans `esq state` (additif).** La CLI compare ce qui est structuré : les puces générées `- B-NNN — … — <Status>` sous `## Backlog` d'une épopée, les `covers:` de la roadmap et le statut backlog. Le modèle juge la prose `state:`.
   - Pour : un seul lecteur, pas de writer, coût marginal (fichiers déjà lus plus `docs/epics/*.md`).
   - Limite : la prose libre de la roadmap (« Both Open ») n'est pas comparée mécaniquement.
2. **Constat dans `esq validate`.** Écarté : le Stop hook bloque sur les constats de validate (`CLAUDE.md:115`). Une projection périmée deviendrait un rafraîchissement obligatoire, donc une cérémonie interdite.
3. **Rafraîchissement automatique des sections GENERATED par la CLI.** Écarté : ce serait un second writer, alors que `/esq:roadmap` et `/esq:epic` sont les seuls writers.
4. **Le modèle relit ROADMAP, épopées et backlog.** Écarté : la CLI publie déjà un parseur, et ce serait un travail déterministe repayé à chaque exécution (`CLAUDE.md:18-20`).

Horodatage ou hash de projection (autorisé en option par le détail) : écarté. Une date de commit ne prouve pas qu'un statut a divergé et produirait du bruit à chaque ajout au backlog.

## Recommendation
Approche 1. Règles déterministes, et **uniquement** celles-ci :
- **Épopée** : pour chaque puce générée, `projected` = dernier segment ` — ` (les résumés contiennent des ` — `, par ex. `aug-18-improv.md:74`) et `live` = statut backlog. On signale un écart, un ID inconnu (`live: null`), ou une ligne ouverte dont la colonne Epic vaut ce slug mais absente de la projection (`projected: null`). Seuls les écarts sont listés.
- **Roadmap** : `roadmap.live` = `{ID: statut}` pour tous les `covers:` de toutes les entrées. `roadmap.stale` liste :
  - les entrées dont tous les IDs couverts sont `Done`/`Dropped` et qui ne couvrent rien d'autre (un `epic:…` protège l'entrée) ;
  - les IDs couverts sans ligne backlog.

Contre-exemple réel à garder dans les tests : `dependable-queue` couvre B-129 (`Done`) et B-079 (`Open`). L'entrée n'est **pas** périmée et reste en `Now`. Deuxième cas : `autonomy-remainder` couvre `epic:esq-decides-implementation-detail`, qui ne doit jamais être signalé.

Dégradation par source (`D-esq-state-degrades-per-source`) :
- si `backlog.error`, alors `roadmap.live` et `epics[].stale` valent `null`, jamais `{}` ;
- une épopée illisible donne `{file, error}` ;
- sans `docs/epics/`, `epics: null`.

## Phases
Un seul lot livrable. Il comporte deux commits, parce que l'affichage n'a de valeur que s'il lit les nouveaux faits.

### Phase 1 : la dérive devient visible dans `esq state` et `/esq:status`
- **Goal :** la personne qui lit l'état voit les projections qui contredisent le backlog.
- **Files touched :** `plugin/lib/cli.mjs`, `tests/cli/esq.test.mjs`, `plugin/skills/status/SKILL.md`.
- **Tasks :**
  - Task 1.1 : `state: report live backlog status beside roadmap and epic projections`
    - généraliser `roadmapHead` pour parcourir toutes les entrées, sans changer la forme de `head` ;
    - ajouter `roadmap.live` et `roadmap.stale`, plus `epics[]` = `{file, slug, stale:[{id, projected, live}]}` ;
    - lire les statuts dans la table `backlogTable` déjà parsée (toutes les lignes, y compris Done/Dropped) ;
    - aucune écriture ;
    - tests sur fixture : écart d'épopée avec un résumé contenant ` — ` ; ligne non listée ; ID inconnu ; `dependable-queue` non signalée ; entrée `epic:` non signalée ; entrée entièrement close signalée ; `backlog.error` qui donne `null` ; octets de `ROADMAP.md` et de l'épopée identiques avant et après.
  - Task 1.2 : `status: show projection drift from esq state facts`
    - dans le tableau (`status/SKILL.md:30`), ajouter `roadmap.live`, `roadmap.stale` et `epics[].stale` ;
    - remplacer la règle `:82` : le modèle compare la prose `state:` à `roadmap.live`, et affiche une ligne « projection périmée : <fichier> — <IDs projeté→réel> ; `/esq:roadmap` ou `/esq:epic <slug>` rafraîchit » ;
    - ce n'est jamais une action `Next` imposée, et il n'y a rien à afficher sans écart.
- **Verification :**
  - `(auto)` `plugin/bin/esq state`, sur ce dépôt : `epics[]` de `docs/epics/aug-18-improv.md` contient B-052 et B-067 avec `projected: "Open"` et `live: "Done"`, `roadmap.live["B-129"]` vaut `"Done"`, et `dependable-queue` est absente de `roadmap.stale`.
  - `(auto)` `./scripts/audit.sh` : le passage produit réussit, y compris les nouveaux tests `tests/cli`. Pas de `node --test` à côté (`CLAUDE.md:63`).

Pas d'étape `(manual)` : aucun écran n'est rendu.

## Risks
- **Consommateurs de `esq state`** : `plugin/skills/{status,roadmap,advance}/SKILL.md`. Le changement est additif et un test vérifie que `roadmap.head` garde sa forme. Il faut quand même vérifier que roadmap/advance n'itèrent pas sur les clés de `roadmap`.
- **Format des puces d'épopée** : le format dépend du gabarit `/esq:epic` (`plugin/skills/epic/SKILL.md:185`). Une puce qui ne correspond pas est ignorée, pas inventée. Le risque est un faux négatif silencieux, qui reste acceptable parce que c'est un signal de conseil.
- **Non prouvé par cette phase** : le jugement du modèle sur la prose `state:` à l'intérieur de `/esq:status`. Une seule exécution réelle de `/esq:status` l'observerait. C'est une observation ultérieure, pas une campagne.
- Il faut ensuite un `claude plugin update` pour que l'utilisateur installé voie le changement. `/esq:land` et la release s'en chargent, ce n'est pas le rôle de ce plan.

## Open questions
Aucune autorité ne manque :
- le contrat vient de B-043 ;
- ordre et priorité : `docs/ROADMAP.md:28-32` et `docs/PRIORITY-REVIEW.md:65` (« small freshness/reporting change ») ;
- le choix du signal est une décision d'ingénierie.

B-075 (parqué contre en cours) reste une entrée séparée, qui n'est pas absorbée ici.

## Execution log
<!-- Appended by /esq:build, one entry per phase executed. Do not edit manually. -->

---

**Coût estimé :**
- environ 100 à 140 lignes dans `cli.mjs`, 70 lignes de tests et 3 lignes de skill : une session `/esq:build` ;
- à l'exécution, seulement la lecture de `docs/epics/*.md` (2 fichiers aujourd'hui) en plus, sans appel git supplémentaire ;
- la sortie JSON grossit d'une vingtaine de statuts, plus les écarts seulement.

**Résumé :** ajouter à `esq state` des faits réels calculés de façon déterministe à côté des projections, et laisser `/esq:status` juger la prose et afficher la dérive. Pas de writer, pas de validation bloquante, pas de rafraîchissement obligatoire.

**Suite :** en mode normal, `/esq:build docs/plans/2026-09-24-projection-freshness.md` (plan à une phase). Ici, rien n'a été créé : pas de branche `esq/projection-freshness`, pas de commit, `Origin` non lu.

~6m
