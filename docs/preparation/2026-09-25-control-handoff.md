# Reprise — analyse, contrôle et choix des améliorations esq

État observé le 2026-09-25 : `930b3b5`, version source 0.3.48, arbre propre avant
ce document. Ce point de reprise n'est ni un nouveau registre ni une certification
du plugin. Revalider uniquement les changements intervenus depuis cette référence.

## Rôle de cette conversation

L'utilisateur fait réaliser chaque cible dans une autre session Codex, puis revient
ici avec « complété, Next ». Ici, on contrôle le résultat disponible, on questionne
sa valeur et ses limites, puis on fournit **une cible et un prompt de travail**.
Ne pas lancer l'implémentation simplement parce qu'il dit Next. Un incident concret
peut devenir prioritaire ; diagnostiquer sans modifier son autre projet ni fusionner.

## Objectifs à préserver

- Maximiser les fonctionnalités utiles effectivement livrées, sans interruptions inutiles.
- Améliorer les idées, la préparation des features, l'UX et les choix d'architecture.
- Réduire lectures, allers-retours, vérifications répétées et longueur des réponses.
- Garder les preuves et contraintes produit. Une solution courte mais incorrecte ne gagne rien.
- CLI pour la structure déterministe ; modèle pour le jugement. Pas de nouveau framework,
  rôle, statut, service ou cérémonie sans besoin observé.

Communication demandée : phrases courtes en bullets. Avant : ce qui sera fait et
pourquoi. Après : ce qui a réellement été fait, vérifié et reste incertain.

## Contrôle à chaque retour

1. Lire `CLAUDE.md` et les consignes applicables. Consulter le statut Git, quelques
   commits récents, puis seulement les lignes/détails de backlog et preuves concernés.
   Regrouper les lectures indépendantes ; borner les sorties pour éviter les troncatures.
2. Distinguer session terminée, correction livrée, acceptation démontrée et publication.
   Vérifier les pièces pertinentes, sans rejouer les tests déjà acquis. Un commit ou
   un audit vert ne prouve pas à lui seul la qualité d'une proposition générée.
3. Contester la solution sur le cas réel et un cas légitime à préserver : intention
   utilisateur, architecture, résultat visible, coût, limites. Pas de revue générale
   ni de sous-agent systématique. Distinguer erreur observée et risque inféré.
4. Choisir une seule amélioration : défaut utilisateur observé ou besoin sélectionné,
   gain concret, plus petite solution complète, preuve proportionnée. Ne pas vider
   mécaniquement le backlog ni poursuivre indéfiniment les petites corrections de texte.
5. Fournir un prompt autonome pour la session d'exécution : cible, preuve de départ,
   contraintes, contre-exemple utile, vérification non doublonnée, registres et commit.
   Les instructions applicables déterminent les contrôles nécessaires ; aucun test
   ciblé ne s'ajoute à un audit équivalent qui le couvre déjà.

Les sessions d'exécution conservent l'autorité d'implémentation habituelle. Par défaut :
commit local, aucun push, installation ou publication. Les commits de release déjà
présents ne constituent pas une autorisation permanente de publier. Ne jamais écrire
directement sous `~/.claude/`. Pas de nouvel essai modèle payant ou d'envoi de code à
un fournisseur sans autorisation et borne adaptées ; les anciennes autorisations
concernaient leurs essais précis.

## Livraisons confirmées, à ne pas refaire

| Travail | Résultat / repère |
| --- | --- |
| B-075 | Travail parqué, raison et reprise dans les lecteurs ; statuts inchangés (`040895c`). |
| B-183 | Autorité architecturale, lectures et rapports ciblés ; quota d'alternatives supprimé (`eb6fd5e`). Correction d'instructions, pas preuve de meilleures idées. |
| B-003 / B-184 | Réservation des IDs sur branches conservées, puis collisions de rang à la fusion (`421a79c`, `2678174`). |
| B-079 / B-024 | Continuation ciblée depuis la roadmap ; suite utile à « Je ne sais pas — montre-moi où » (`7e260cf`, `456465a`). |
| B-163 / B-185 | Références Markdown non exécutées ; espaces significatifs des commandes préservés (`50daa37`, `5488a97`). |
| B-107 | Réparer la commande prospective avant la preuve ; land garde l'identité exacte et la fraîcheur (`402e0ae`). |
| B-076 / B-013 | Preuves UI retrouvables ; verdict check centré sur résultat, écarts et prochaine action (`812aae2`, `f934d6e`). |

Incident réel B-185 : dans le plan events-tracker
`docs/plans/2026-09-24-vitrine-fonctions-recentes-multi-membre.md`, le lecteur
compactait deux espaces de `grep` en un. Cela empêchait la réutilisation de la preuve
et faisait échouer la commande altérée. Défaut déjà présent dans le snapshot public
initial, pas introduit par B-163. Le projet externe reste en lecture seule ; sa
fusion effective n'a pas été confirmée dans cette conversation.

## Points encore ouverts et première action

- **B-070 :** l'utilisateur a confirmé le 25 septembre : **analyse terminée sans
  changement**. Le checkout conserve `Planned`, sans nouveau commit ou compte rendu
  identifiable. Ne pas redemander ce verdict ni relancer la même analyse. Ce retour
  ne prouve ni des économies ni l'absence générale de relectures ; ne pas clôturer
  la ligne sur cette seule base. Passer à une autre amélioration.
- **B-181/B-182 :** Open. Les instructions ont évolué, mais les essais de préparation
  conservés n'établissent pas encore la qualité attendue. Pas de clôture par taille
  de texte ou audit mécanique. Ne pas racheter le même essai pour obtenir du vert.
- **B-169/C :** Open ; sélectionner un besoin spécialiste concret avant toute guidance.
  Les anciens résumés A/D/B peuvent être historiques : B-179 est livré, ne pas le refaire.
- **B-005 :** candidat technique restant, pas encore sélectionné ici. Vérifier d'abord
  si les preuves B-003/B-184 couvrent réellement le cas combiné : fusion Git sans
  marqueur, ID présent dans l'ancêtre, réconciliation en une seule entrée. Ajouter
  seulement la preuve manquante, ou corriger un défaut effectivement reproduit.
- Travail conditionnel/parqué : pas de port Codex, intégration Sheets ou campagne
  de mesure déclenchés pour simplement vider les lignes ouvertes.

**À la reprise :** vérifier uniquement les changements depuis cette passation, puis
recommander une seule cible. Garder en vue le besoin principal de meilleures features préparées,
pas seulement l'entretien du workflow. Aucun prochain travail n'est déjà lancé.

## Preuves à ouvrir seulement selon le besoin

- [Préparation : résultats et limites](2026-09-24-preparation-quality.md).
- [Revue architecture et sources Anthropic du 24 septembre](2026-09-24-architecture-preparation-review.md).
- [B-107](2026-09-25-b107-command-repair.md), [B-076](2026-09-25-b076-ui-evidence.md),
  [B-013](2026-09-25-b013-check-report.md).

Les sources Anthropic ont déjà été consultées sur six pages officielles. Réutiliser
ce constat daté ; une nouvelle vérification ciblée se justifie par une question
actuelle ou un changement pertinent, pas à chaque Next. Aucun document ici ne
certifie tout le plugin ni l'adhérence future d'un modèle aux instructions.
