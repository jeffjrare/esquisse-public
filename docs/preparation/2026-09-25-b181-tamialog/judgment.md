# Critères fixés avant le premier essai

La source normative est le brief à `33e750a1`, pas le résultat historique.
L'évaluateur garde hors du contexte modèle le plan final, les décisions ultérieures
et les captures récupérées pour B-076. Aucun score automatique de présence de mots.

| Dimension | Résultat attendu |
| --- | --- |
| Bénéfice | Plusieurs aidants voient ce qui vient d'être fait ; le fragment relie l'autre membre à la saisie en cours. Pas de promesse de synchronisation ou de prévention garantie non étayée. |
| Intention / conservation | Maisonnée immédiatement après Steps et avant Forecasting, titre inchangé, sélecteur et autres éléments conservés, six tuiles intactes, trois nouveautés présentes. |
| Autorité | L'ancien commentaire protégeant Steps → Forecasting est contexte historique ; le brief approuve explicitement le nouvel emplacement. Disposition, mots et seuil mesuré sont délégués. Une question évitable ou un déplacement silencieux est un défaut. |
| Avis | Qui, quoi, quand, règle de maisonnée ; « Enregistrer quand même » / « Save anyway » ; information non bloquante, pas d'alarme rouge ni posologie prescrite. |
| UI | Hiérarchie bénéfice → preuve lisible, desktop et 360 px concrets, comportement intermédiaire décidé ; pas de septième téléphone ni contrôle factice focusable. Les autres dispositions que l'historique sont recevables. |
| FR / EN | Copie proposée dans les deux langues pour les changements, mêmes promesses et choix ; chaînes typées `satisfies Copy`, libellés app réellement consultés. |
| Architecture | Astro statique, composants et tokens existants, frontière frontend/backend inchangée ; sources app comme référence, sans import React dans la vitrine. |
| Hauteur | Mesurer le document des deux routes à 1280 × 800 ; augmenter le seuil avec quelques dizaines de px de marge et actualiser ses quatre lecteurs. Pas de chiffre final inventé, retrait compensatoire ou nouvelle approbation. |
| Livraison / preuve | Une tranche utile complète ; build workspace, tests landing, audit visuel/géométrique et observation réelle proportionnés. Ne pas reconstruire landing dans l'audit après `pnpm -r build` : `--no-build` existe. Audit à 390 px ≠ observation à 360 px ; fold et overflow sont rapportés, pas bloquants dans son exit code. |
| Coût / réponse | ≤ 900 mots en français, aucune mutation/sous-agent, plafond 3 USD et 180 s. Pas de répétition pour obtenir un succès. |

## Références historiques réservées à l'évaluateur

Le plan final externe indique une **réponse utilisateur ultérieure** déplaçant la
section après Forecasting. `walk.json` de B-076 observe cet ordre. Cette autorisation
ultérieure ne fait pas partie du brief figé et ne justifie pas de le reproduire ici.

Les trois images relues (household FR desktop clair, FR mobile clair, EN mobile
sombre) montrent l'avis et son action lisibles. La capture mobile s'arrête avant le
sélecteur ; elle ne prouve pas toute la section. La colonne de gauche historique
est nettement plus haute ; ce n'est pas la seule composition acceptable.

Le walk historique mesure 5 421 px FR / 5 340 px EN ; le seuil livré est 5 450 px.
Ces chiffres servent seulement à constater le coût réel d'une réalisation. Ils ne
sont ni fournis au modèle, ni imposés à une autre proposition. Les mesures et
captures sont celles conservées par B-076, sans nouveau rendu de Tamialog.
