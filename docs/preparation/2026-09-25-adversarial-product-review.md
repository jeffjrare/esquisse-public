# Revue adversariale produit — 25 septembre 2026

Base : `5e9513b`, plugin source 0.3.49. Mandat : confronter esquisse à ses
objectifs de valeur livrée, qualité des idées/UX/architecture, autonomie et coût.
Analyse et priorisation seulement ; aucune implémentation ou clôture de backlog.

## Verdict

- Le socle est cohérent : skills pour le jugement, CLI pour les invariants,
  traces durables et vérification réutilisable. Une refonte générale n'est pas justifiée.
- Les intentions de qualité sont écrites. Leur effet sur les propositions reste
  partiellement démontré, comme le montrent les essais B-181/B-182 conservés.
- Un parcours produit mérite maintenant une correction complète : `/esq:ui`.
  Il dépend de capacités externes non fournies et impose plusieurs choix/coûts
  indépendamment du mandat. Ce constat porte sur les instructions ; aucun nouvel
  échec d'exécution native de UI n'est prétendu ici.
- Les dernières tâches documentaires n'ont pas livré cette amélioration produit.
  La prochaine session doit montrer un résultat utilisable, pas seulement un diff
  de consignes ou un audit mécanique vert.

## Ce qui a été examiné

README et CLAUDE ; les chemins concernés de grill, plan, ui, arch, build, review,
check et land ; manifeste, hooks, inventaire distribué ; preuves B-181/B-182/B-050.
Lecture contradictoire des cas ci-dessous, recherche dans les sources officielles
Anthropic, une commande native locale d'inventaire. Pas d'audit général du code,
de nouvelle campagne, de sous-agent, d'essai modèle ou de modification externe.
B-070 n'est pas repris. Les résultats historiques restent historiques.

## Constats classés par valeur

### 1. UI doit livrer son résultat sans hébergeur imposé — priorité de livraison

**Fait source :** `plugin/skills/ui/SKILL.md:91`, `:93`, `:123`, `:169` invoquent
`run`, `artifact-design` et `Artifact`. Aucun des deux skills n'est distribué dans
`plugin/skills/`, aucun MCP n'est fourni et le manifeste ne déclare aucune dépendance.
Le README promet pourtant une comparaison rendue et un brief. Le chemin ne prescrit
pas de livraison locale lorsque le service de publication manque. L'absence d'un
skill nommé `run` ne signifie pas non plus qu'aucun navigateur utilisable n'existe.

**Cas contradictoire :** un utilisateur possède le plugin, un brief et un navigateur,
mais pas ces extensions. Les capacités nécessaires au rendu sont disponibles ; la
procédure demande néanmoins des capacités supplémentaires pour terminer.

**Amélioration :** un HTML autonome local, ses preuves visuelles et un brief avec
des liens durables doivent suffire. Réutiliser les capacités de rendu accessibles ;
publication optionnelle lorsqu'elle est disponible et autorisée. Un hébergeur existant
reste utilisable ; l'absence réelle de navigateur reste une limite explicite, jamais
un faux PASS. Ce n'est ni un port Codex ni un nouveau service.

**Preuve attendue :** ouvrir le livrable local d'un cas réel sans `Artifact` ni
`artifact-design`, puis reprendre le brief avec les ressources qu'il cite.

### 2. UI confond parfois délégation de design et décision utilisateur

**Faits source :** UI `:65` transforme toute chaîne absente en placeholder ; `:87`
et `:154` imposent deux directions ; `:89` impose deux thèmes en greenfield ; le
passage « Then ask for the direction » impose un choix. Grill `:71` et `:97`
permettent au contraire les choix délégués et zéro question.
Son handoff `:173` recommande greenfield dès qu'un brief porte un parcours UI et
que le projet n'a pas encore d'écran, sans distinguer une direction déjà fixée.

**Cas contradictoires :** un brief autorise une direction et un thème unique ; une
nouvelle action a un résultat clair mais son libellé n'est pas fourni. Comparer deux
styles ou demander des mots ordinaires peut ajouter du travail sans valeur.

**Amélioration :** proposer une direction recommandée dans le mandat ; produire
des alternatives lorsqu'elles représentent un arbitrage utile. Couvrir les thèmes
réellement demandés. Écrire la microcopie proposée en la distinguant des faits et
promesses produit ; conserver les inconnues métier comme inconnues.

**Contre-exemple à préserver :** une exploration explicitement demandée, une
identité visuelle non déléguée ou une promesse commerciale inconnue exigent encore
respectivement plusieurs options, une décision ou une réserve. L'autonomie ne
supprime pas l'autorité utilisateur.

Les deux premiers constats peuvent former une livraison UI cohérente : proposition
locale inspectable, adaptée au mandat, sans étape externe ou choix artificiel.

### 3. Déduplication des vérifications : règle et exécution ne sont pas alignées

**Faits source :** plan `:241` demande de retirer un contrôle étroit couvert par un
autre sous conditions équivalentes. Build `:153` prescrit un test par tâche, puis
la vérification de phase ; son exemple `:322` enregistre un test CLI et l'audit
qui le contient. Build `:181` interdit pourtant de racheter le même résultat.

**Cas à traiter :** dernière tâche, mêmes entrées, contrôle déjà réussi et inclus
dans la vérification qui suit. L'exemple et la procédure peuvent provoquer du
travail répété. Aucune fréquence ni économie n'est mesurée dans cette revue.

**Contre-exemple :** un test intermédiaire avant d'autres modifications, un
environnement différent ou un contrôle plus large prouvant une autre propriété
reste utile. Supprimer tous les tests par tâche serait une régression.

**Suite :** harmoniser ce chemin après la livraison UI, avec un cas de réutilisation
et un cas d'invalidation. Ne pas ajouter un registre d'équivalence de commandes.

### 4. Les comparaisons de préparation ne mesurent pas encore la valeur globale d'esq

B-181/B-182 comparent des variantes du plugin sur un brief déjà approuvé, avec une
sortie textuelle bornée et sans implémentation. Elles ont révélé de vraies erreurs,
mais ne mesurent ni la qualité initiale des idées, ni un parcours complet, ni le
gain par rapport à Claude sans esquisse. Une différence sur un essai non concurrent
ne sépare pas causalité et variabilité. Le retrait B-182 reste raisonnable.

Ne pas poursuivre Tamialog pour obtenir un score vert. Lors de la prochaine
livraison substantielle, juger l'artefact produit et sa reprise effective. Une
comparaison sans plugin pourra répondre à une question de valeur marginale si elle
justifie son coût ; ce n'est pas une nouvelle condition de livraison.

## Architecture et idées : ce qui est déjà bien placé

- Grill établit utilisateur, friction et résultat, propose le parcours et autorise
  zéro question. Aucune nouvelle checklist de créativité n'est justifiée.
- Plan porte les approches, compromis, frontières et phases utiles. Les exigences
  produit doivent guider ces choix ; les détails qui demandent un rendu restent
  à observer plutôt qu'à déclarer résolus sur la qualité de la prose.
- Arch maintient la mémoire architecturale. Sa lecture de l'autorité actuelle et
  des décisions pertinentes est appropriée. Ce n'est pas un substitut au jugement
  architectural de plan. Ne pas rouvrir B-183 ni remettre les anciennes règles en
  vigueur parce qu'elles sont historiquement Active.
- Review juge le résultat demandé avant la conformité des tâches et limite les
  constats spéculatifs. Garder cette retenue ; ne pas transformer la revue en quota
  d'améliorations ou en audit permanent.

## Confrontation aux sources officielles consultées aujourd'hui

Les pages ci-dessous sont celles accessibles le 25 septembre 2026. Ce contrôle
n'est pas une certification Anthropic ni une garantie de conformité future.

| Sujet | Enseignement et conséquence pour esquisse |
| --- | --- |
| Distribution | [Plugins](https://code.claude.com/docs/en/plugins) et [manifest](https://code.claude.com/docs/en/plugins/manifest-reference) documentent le paquet skills/hooks et les dépendances. La structure esq correspond ; les dépendances UI implicites restent à résoudre. |
| Contexte | [Skills](https://code.claude.com/docs/en/skills) distingue découverte et chargement du corps, qui reste dans la conversation. Le nombre de commandes ne mesure pas le coût d'une invocation. |
| Instructions | [Authoring](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) recommande concision et degré de liberté adapté. Des quotas de variantes ne remplacent pas le jugement ; découper un fichier n'assure pas que sa référence sera lue. |
| Complexité | [Effective agents](https://www.anthropic.com/engineering/building-effective-agents) privilégie les mécanismes simples et proportionnés. Aucun besoin trouvé ne justifie une flotte de spécialistes ou un orchestrateur supplémentaire. |
| Qualité UI/architecture | [Harness design, 24 mars 2026](https://www.anthropic.com/engineering/harness-design-long-running-apps) relate une expérience où les critères influencent le design et où plus d'itérations n'améliorent pas toujours le résultat. Son architecture multi-agent est un retour d'expérience, pas une obligation à recopier. |
| Évaluation | [Agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) recommande cas réels, critères explicites et cas positifs/négatifs. Cela appuie la réutilisation des preuves et les contre-exemples, pas des campagnes à chaque correction. |
| Outils natifs actuels | [Plugin evals](https://code.claude.com/docs/en/plugin-evals) documente une comparaison sans plugin et des répétitions par défaut. Cette possibilité peut éviter un nouveau harness, mais son coût doit être borné avant usage. Aucun eval lancé ici. |
| Coût | [Plugin measure](https://code.claude.com/docs/en/plugins/measure) fournit l'inventaire et une estimation native par composant. Utilisée ci-dessous ; ce n'est pas une mesure de facture. |
| Hooks | [Hooks reference](https://code.claude.com/docs/en/hooks) documente événements, délais et asynchronisme utilisés ici. Le Stop local vérifie les registres sales et évite sa réentrée. Les preuves produit existantes sont réutilisées, sans refaire leur audit. |

## Mesure native, sans appel modèle

Commande : `timeout 15s claude --bare --plugin-dir ./plugin plugin details esq </dev/null`.
Exit 0, environ 0,18 seconde. 21 skills, 0 agent distribué, 5 événements de hooks,
0 MCP, 0 LSP. Estimation permanente affichée : **677 tokens**.

| Invocation | Tokens estimés du composant |
| --- | ---: |
| plan | 7 900 |
| ui | 8 400 |
| build | 12 600 |
| review | 9 300 |
| arch | 6 500 |

Ces valeurs ne couvrent pas toutes les références chargées, les lectures projet,
les outils, le raisonnement et les répétitions. Elles ne sont pas additionnées en
une facture fictive. Conclusion : traiter les parcours invoqués et le travail
inutile avant de supprimer arbitrairement des commandes. Aucun budget de contexte
n'est transformé en gate produit.

## Prochaine livraison recommandée

**Rendre `/esq:ui` autonome pour produire une proposition locale inspectable,
proportionnée au mandat.** Corriger le parcours distribué et ses consommateurs
directs ; livrer l'artefact rendu et un brief réellement reprenable. Un compte
rendu documentaire seul ne remplit pas cette acceptation.

Premier choix pour sa valeur : il rend tangible la qualité du design avant
construction et supprime des dépendances/choix qui peuvent interrompre ce travail.
Coût attendu : une compétence et ses handoffs directs, sans nouveau service ni
refonte du CLI. Ce coût reste à confirmer par la session d'exécution.

Le présent fichier est la seule modification de cette revue. Aucun commit,
backlog fermé, changement de source produit, audit relancé, essai payant,
installation ou publication.
