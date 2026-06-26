# Prompt Codex — Proof Engine + Backend Gateway

Tu es le lead product engineer, architecte logiciel et développeur full-stack responsable de créer un SaaS fonctionnel à partir de zéro.

Le nom provisoire du produit est **« Proof Engine »**. Centralise ce nom dans un fichier de configuration afin qu’il soit facile à modifier ultérieurement.

Les explications, l’interface utilisateur et la documentation destinée à l’utilisateur doivent être en français. Le code, les noms de variables, les noms de fichiers, les types, les tables et les commentaires techniques doivent être en anglais.

---

## 1. Mode de travail

Commence par inspecter intégralement le dépôt.

- Si le dépôt est vide, initialise le projet.
- Si du code existe déjà, ne supprime rien sans raison et adapte le plan à l’existant.
- Commence par rédiger un plan d’implémentation précis dans `docs/implementation-plan.md`.
- Identifie les risques, dépendances et inconnues.
- Pose une question uniquement lorsqu’une information bloque réellement l’implémentation.
- Dans les autres cas, choisis une hypothèse raisonnable, documente-la et avance.
- Après le plan, implémente le projet. Ne t’arrête pas à la création d’une maquette ou du squelette.
- Travaille par vertical slices utilisables.
- Fournis des comptes rendus courts à chaque étape importante :
  1. ce qui vient d’être réalisé ;
  2. ce qui a été vérifié ;
  3. ce qui reste ;
  4. les éventuels blocages.
- Ne prétends jamais qu’une commande ou un test est réussi sans l’avoir réellement exécuté.
- N’utilise pas de versions canary, beta ou expérimentales sauf nécessité démontrée.
- Utilise les dernières versions stables et mutuellement compatibles au moment de l’installation.
- Crée et maintiens un `AGENTS.md` à la racine du projet.

---

## 2. Vision du produit

Proof Engine aide les fondateurs de SaaS et de produits numériques à arrêter de faire du marketing à l’aveugle.

Le produit doit se connecter dès le départ aux backends, bases de données, systèmes d’événements et sources de vérité des applications qu’il analyse. Les diagnostics, suivis et apprentissages doivent être fondés sur des données réelles synchronisées automatiquement, pas sur des chiffres saisis à la main.

Le produit ne doit pas être un générateur de conseils marketing génériques.

Il doit transformer :

- le contexte du produit ;
- les métriques réelles synchronisées automatiquement depuis le backend des applications analysées ;
- les événements produit réels ;
- les retours clients stockés dans le backend, les tickets ou les tables support connectées ;
- les objections ;
- les entretiens et conversations lorsqu’ils existent dans une source connectée ;
- les observations commerciales ;
- les hypothèses du fondateur, clairement séparées des données réelles ;

en :

1. un diagnostic prioritaire ;
2. un seul goulot d’étranglement principal ;
3. une expérience marketing mesurable ;
4. des ressources d’exécution directement utilisables ;
5. une décision fondée sur les résultats ;
6. un apprentissage conservé pour les expériences futures.

**Promesse principale :**

> Transformez vos preuves terrain en une expérience commerciale mesurable.

**Titre de la landing page :**

> Arrêtez de faire du marketing à l’aveugle.

**Sous-titre :**

> Proof Engine identifie votre principal goulot d’étranglement, construit l’expérience prioritaire et apprend de chaque résultat.

**CTA principal :**

> Créer mon premier diagnostic

---

## 3. Principes produit non négociables

Le produit doit respecter les invariants suivants.

### 3.1 Evidence first

Une recommandation doit être rattachée à des preuves précises.

### 3.2 Séparation stricte

Distinguer visuellement et techniquement :

- les faits ;
- les signaux ;
- les hypothèses ;
- les inconnues.

### 3.3 Une priorité à la fois

Le système ne propose qu’un goulot d’étranglement principal et une expérience prioritaire.

### 3.4 Mesurabilité obligatoire

Toute expérience doit contenir :

- une hypothèse ;
- une cible ;
- un canal ;
- une offre ;
- une métrique principale ;
- une durée ;
- des règles de décision continuer / modifier / arrêter.

### 3.5 Absence de fausse certitude

Lorsque les données sont insuffisantes, le système doit répondre **« données insuffisantes »** et demander des preuves supplémentaires.

### 3.6 Aucune invention

L’IA ne doit jamais inventer :

- une citation client ;
- une métrique ;
- un benchmark ;
- un témoignage ;
- une information concurrentielle ;
- une preuve ;
- une statistique commerciale.

### 3.7 Pas de benchmark universel

Les diagnostics utilisent en priorité :

- les objectifs définis par l’utilisateur ;
- les métriques historiques du projet ;
- les observations collectées.

Ne pas appliquer de taux de conversion universels comme s’ils étaient certains.

### 3.8 Résultat plutôt qu’activité

Ne pas recommander de « publier plus » sans expliquer :

- pour qui ;
- avec quelle promesse ;
- par quel canal ;
- selon quelle hypothèse ;
- avec quelle métrique de réussite.

### 3.9 Validation humaine

Tous les contenus générés sont modifiables avant utilisation.

### 3.10 Une seule expérience active

Un projet ne peut avoir qu’une expérience au statut `running` à la fois.

---


### 3.11 Source de vérité backend

Les métriques, les événements de funnel, les résultats d’expérience et les preuves quantitatives doivent provenir de sources connectées.

Le produit doit refuser de produire un diagnostic présenté comme fiable si aucune source de données réelle n’est connectée.

### 3.12 Zéro saisie manuelle pour les métriques et résultats

La saisie manuelle ne doit pas être utilisée pour :

- les métriques de produit ;
- les résultats d’expériences ;
- les volumes d’événements ;
- les conversions ;
- les revenus ;
- les cohortes ;
- les taux d’activation ;
- les taux de rétention.

L’utilisateur peut ajouter une annotation, un commentaire ou une hypothèse, mais ces éléments doivent toujours être marqués comme qualitatifs ou hypothétiques. Ils ne doivent jamais remplacer les données issues du backend.


### 3.13 Architecture du moteur hybride obligatoire

Le produit doit être construit comme un moteur hybride. Les résultats ne doivent pas être « décidés » par l’IA ni affichés avec de simples phrases toutes faites.

Architecture obligatoire :

1. **Data Layer**
   - se connecte aux sources réelles de l’application analysée ;
   - lit les données synchronisées depuis les connecteurs ou le Gateway ;
   - normalise les événements, entités, revenus et états produit ;
   - ne fournit jamais de métrique inventée ou saisie manuellement comme source de vérité.

2. **Metrics Engine**
   - calcule les conversions, funnels, activations, revenus, cohortes, rétentions et délais entre étapes ;
   - produit des snapshots déterministes ;
   - applique les formules versionnées ;
   - explique la provenance exacte de chaque chiffre.

3. **Decision Engine**
   - applique des règles déterministes pour décider : `validated`, `invalidated`, `inconclusive`, `insufficient_data` ;
   - compare baseline, période d’expérience, métrique principale et guardrail metrics ;
   - détecte les limites méthodologiques ;
   - ne délègue jamais la décision finale de statut à l’IA seule.

4. **AI Reasoning Layer**
   - explique les données réelles ;
   - formule des hypothèses ;
   - propose la prochaine expérience ;
   - génère des ressources d’exécution ;
   - rédige des apprentissages lisibles ;
   - cite toujours les métriques, snapshots, événements et preuves utilisés.

Règle absolue :

```text
Données réelles pour la vérité.
Règles déterministes pour la décision.
IA pour l’interprétation, l’explication et la recommandation.
```

Les phrases fixes ne peuvent servir qu’à structurer l’interface. Elles ne doivent jamais remplacer l’analyse personnalisée issue des données connectées.

## 4. Utilisateur cible du MVP

Le MVP cible :

- les fondateurs de micro-SaaS ;
- les entrepreneurs numériques ;
- les petites équipes produit ;
- les projets possédant entre zéro et quelques dizaines de clients ;
- les fondateurs ayant un produit existant, mais une acquisition ou une conversion incertaine.

Le produit doit pouvoir fonctionner même avec peu de données, mais il doit clairement réduire son niveau de confiance lorsque les preuves sont insuffisantes.

---


## 5. Exemple prioritaire de cas d’usage : MYteuf

Le produit doit être capable d’aider un fondateur à analyser et améliorer un SaaS événementiel comme **MYteuf**.

MYteuf est une application photo collaborative pour événements.

Principe :

- un organisateur crée un événement ;
- il reçoit un lien ou un QR code ;
- les invités rejoignent l’événement ;
- les invités ajoutent leurs photos ;
- l’organisateur récupère un album partagé.

Le système doit comprendre que ce type de produit possède deux types d’utilisateurs :

1. **l’organisateur**, qui crée et partage l’événement ;
2. **les invités**, qui rejoignent l’événement et ajoutent les photos.

Pour ce type de projet, le diagnostic ne doit pas se limiter au trafic, aux inscriptions ou aux conseils marketing généralistes.

### 5.1. Tunnel MYteuf à analyser

Exemple de tunnel à supporter dans le produit :

```text
landing_viewed
create_event_started
event_created
qr_code_viewed
share_button_clicked
link_copied
whatsapp_share_clicked
guest_joined
first_photo_uploaded
five_photos_uploaded
three_contributors_reached
album_viewed_by_organizer
checkout_started
purchase_completed
second_event_created
```

Le système doit permettre à l’utilisateur de définir ses propres événements de tracking, mais il doit aussi proposer une structure adaptée à un SaaS multi-acteurs comme MYteuf.

Ces événements ne doivent pas être saisis manuellement. Ils doivent être synchronisés depuis le backend de l’application analysée, son système d’analytics interne, un endpoint d’ingestion ou un connecteur de base de données.

### 5.2. Définition configurable de l’activation

Définition possible d’un événement activé :

```text
Un événement peut être considéré comme activé lorsqu’il atteint :
- au moins 3 participants différents ;
- au moins 20 photos déposées ;
- dans les 48 heures suivant le premier partage.
```

Cette définition doit être enregistrée comme une hypothèse configurable, et non comme une vérité universelle.

Le produit doit permettre de modifier cette définition selon le type d’événement :

- mariage ;
- anniversaire ;
- soirée privée ;
- événement d’entreprise ;
- festival ;
- regroupement familial ;
- autre.

Le système doit aussi pouvoir distinguer :

- événement créé ;
- événement partagé ;
- événement rejoint ;
- événement ayant reçu une première photo ;
- événement activé ;
- événement converti en paiement ;
- événement ayant généré une recommandation ou un second événement.

### 5.3. Exemples de faits pour MYteuf

Exemples de faits que le système doit pouvoir synchroniser automatiquement depuis le backend de MYteuf ou depuis une source connectée :

```text
F-001
Sur 100 événements créés, 31 ont reçu au moins une photo d’invité.

F-002
42 % des organisateurs ont utilisé le bouton de partage.

F-003
68 % des invités ayant rejoint un événement ont envoyé une photo.

F-004
Plusieurs utilisateurs demandent comment transmettre le QR code aux invités.

F-005
Les événements créés sur mobile ont un taux de partage supérieur aux événements créés sur ordinateur.
```

Ces éléments doivent être traités comme des faits uniquement s’ils proviennent de mesures, d’observations documentées ou de citations exactes.

### 5.4. Exemples de signaux pour MYteuf

Exemples de signaux :

```text
S-001
Les mariages semblent recevoir plus de contributions que les anniversaires.

S-002
Les événements partagés via WhatsApp semblent s’activer plus rapidement.

S-003
Les événements créés sur mobile semblent mieux fonctionner.

S-004
Les organisateurs semblent plus motivés lorsqu’ils voient un aperçu de l’expérience invité.
```

Les signaux doivent rester distincts des faits tant que le volume de données, la qualité d’observation ou la cohérence des résultats ne permettent pas de les considérer comme fortement établis.

### 5.5. Exemples d’hypothèses pour MYteuf

Exemples d’hypothèses :

```text
H-001
Les organisateurs ne comprennent pas assez vite qu’ils doivent partager le QR code ou le lien.

H-002
Les invités hésitent à envoyer leurs photos par manque de confiance.

H-003
Le positionnement trop généraliste “tous les événements” réduit la conversion.

H-004
Les mariages pourraient être un meilleur segment initial que les anniversaires.

H-005
Un message WhatsApp prérempli pourrait augmenter le taux de partage.
```

Une hypothèse ne doit jamais être affichée comme une vérité. Elle doit toujours rester testable, falsifiable et reliée à une expérience mesurable.

### 5.6. Exemples d’inconnues pour MYteuf

Exemples d’inconnues :

```text
I-001
Combien d’organisateurs téléchargent réellement le QR code ?

I-002
Quel canal de partage produit le plus de contributeurs ?

I-003
Les invités scannent-ils le QR code sans finir l’envoi ?

I-004
Quel type d’événement produit le meilleur taux d’activation ?

I-005
Quelle proportion des événements activés devient payante ?

I-006
Quel seuil d’activité prédit réellement la satisfaction de l’organisateur ?
```

Lorsqu’une inconnue est critique, le diagnostic doit recommander de collecter une preuve supplémentaire plutôt que de générer une recommandation marketing artificiellement confiante.

### 5.7. Exemple de diagnostic attendu pour MYteuf

Si les données montrent que beaucoup d’événements sont créés mais peu sont partagés, le système doit pouvoir conclure :

```text
Goulot principal :
activation de l’organisateur.

Raison :
la rupture principale se produit entre la création de l’événement et le partage du lien ou QR code.

Preuves utilisées :
F-001, F-002, F-004.

Confiance :
modérée à élevée selon la quantité et la fraîcheur des preuves.

Données manquantes :
- temps moyen entre création et premier partage ;
- canal de partage le plus utilisé ;
- différence mobile / desktop ;
- raison déclarée de non-partage.

Prochaine action :
tester un parcours de partage guidé immédiatement après la création de l’événement.
```

Le système ne doit pas recommander d’augmenter l’acquisition si le principal blocage mesuré se situe dans l’activation.

### 5.8. Exemple d’expérience générée pour MYteuf

Titre :

```text
Parcours de partage guidé après création.
```

Hypothèse :

```text
Si l’organisateur est guidé immédiatement après la création, davantage d’événements recevront une première photo dans les 24 heures.
```

Cible :

```text
Nouveaux organisateurs ayant terminé la création d’un événement.
```

Changement testé :

```text
Remplacer l’écran de confirmation passif par un écran d’action contenant :
- bouton “Partager sur WhatsApp” ;
- bouton “Copier le lien” ;
- bouton “Télécharger le QR code” ;
- aperçu de l’expérience invité ;
- checklist de lancement ;
- rappel si aucun invité n’a rejoint l’événement.
```

Métrique principale :

```text
Pourcentage d’événements recevant une première photo d’un invité dans les 24 heures.
```

Métriques de protection :

```text
- taux de création d’événement terminée ;
- taux d’abandon après création ;
- taux d’invités rejoignant sans envoyer de photo.
```

Règles de décision :

```text
Continuer :
l’activation augmente significativement sans dégrader la création d’événement.

Modifier :
le résultat varie fortement selon le type d’événement ou le canal de partage.

Arrêter :
aucun gain n’est observé ou l’abandon augmente.
```

Le système doit générer les ressources nécessaires :

- textes d’interface ;
- message WhatsApp ;
- e-mail de rappel ;
- plan de tracking ;
- script d’entretien utilisateur.

### 5.9. Exemples de ressources générées pour MYteuf

Textes d’interface possibles :

```text
Votre événement est prêt

Invitez maintenant vos proches à ajouter leurs photos.

[Partager sur WhatsApp]
[Télécharger le QR code]
[Copier le lien]
```

Message WhatsApp possible :

```text
J’ai créé un album partagé pour notre événement 📸

Ajoutez directement les photos que vous prendrez ici :
[LIEN_DE_L_EVENEMENT]
```

E-mail de rappel possible :

```text
Objet : Votre album attend ses premières photos

Votre événement est prêt, mais aucun invité ne l’a encore rejoint.

Partagez maintenant le lien ou téléchargez le QR code pour commencer à collecter les souvenirs.
```

Plan de tracking possible :

```text
share_screen_viewed
whatsapp_share_clicked
qr_downloaded
link_copied
reminder_sent
first_guest_joined
first_guest_photo_uploaded
```

Script d’entretien possible :

```text
Après avoir créé l’événement, qu’avez-vous pensé devoir faire ensuite ?

Comment avez-vous tenté de transmettre l’album aux invités ?

Qu’est-ce qui vous a ralenti ?

Comment partagez-vous habituellement les informations liées à votre événement ?

À quel moment auriez-vous considéré l’album comme utile ?
```

Les textes générés doivent toujours être modifiables avant utilisation.

### 5.10. Apprentissage attendu après expérience

À la clôture d’une expérience MYteuf, le système doit pouvoir produire un apprentissage du type :

```text
Résultat :
validé, invalidé ou non concluant.

Observation :
le parcours de partage guidé a augmenté ou non la proportion d’événements recevant une première photo dans les 24 heures.

Éléments soutenus :
- le partage est une étape critique de l’activation ;
- WhatsApp est souvent utilisé pour inviter les participants ;
- l’aperçu invité peut rassurer l’organisateur.

Éléments non prouvés :
- le QR code est meilleur que le lien ;
- l’effet est identique pour tous les types d’événements ;
- l’activation améliore nécessairement le revenu.

Questions restantes :
- quel canal de partage produit le plus de contributeurs ?
- les mariages réagissent-ils différemment des anniversaires ?
- quel niveau de contribution prédit réellement un achat ?
```

Le système ne doit jamais conclure que l’expérience a prouvé une causalité si les données ne viennent pas d’un test suffisamment contrôlé.

### 5.11. Règle de généralisation

MYteuf est un exemple prioritaire, mais le SaaS ne doit pas être codé uniquement pour MYteuf.

Le produit doit utiliser cet exemple pour mieux supporter les produits numériques multi-acteurs, notamment :

- marketplace ;
- outil collaboratif ;
- application événementielle ;
- SaaS avec utilisateur créateur et utilisateur invité ;
- produit où la valeur dépend d’une activation collective.

L’objectif est que Proof Engine puisse analyser MYteuf sans devenir un outil exclusivement dédié à MYteuf.


---

## 6. Connexion backend obligatoire dès le MVP

Proof Engine ne doit pas être conçu comme un outil où l’utilisateur saisit manuellement ses chiffres.

Dès le MVP, le produit doit se connecter aux applications qu’il analyse afin de lire leurs données réelles et de suivre automatiquement les expériences.

### 6.1 Principe central

Le projet analysé doit avoir au moins une source de données connectée avant de pouvoir lancer un diagnostic complet.

Sans source connectée :

- le diagnostic doit rester au statut `insufficient` ;
- la confiance doit être plafonnée à un niveau faible ;
- les métriques ne doivent pas être inventées ;
- le produit doit guider l’utilisateur vers la connexion du backend ;
- aucune expérience ne doit pouvoir être marquée comme mesurée automatiquement.

### 6.2 Sources de données à supporter dans le MVP

Le MVP doit supporter au minimum quatre modes de connexion.

#### A. Supabase / PostgreSQL read-only

Permettre à l’utilisateur de connecter une base PostgreSQL ou Supabase de l’application analysée avec un rôle en lecture seule.

Objectifs :

- lire les tables métier ;
- détecter les colonnes utiles ;
- mapper des tables vers des événements produit ;
- calculer des métriques ;
- suivre les expériences.

Le connecteur doit utiliser uniquement des permissions read-only.

#### B. Firebase / Firestore read-only

Support obligatoire, car MYteuf peut utiliser Firebase.

Permettre la connexion via un service account Firebase Admin, stocké chiffré côté serveur.

Objectifs :

- lire des collections Firestore ;
- lire des événements structurés ;
- synchroniser les documents liés aux événements, invités, photos, partages, uploads et paiements si ces collections existent ;
- suivre les changements via synchronisation planifiée.

Le connecteur ne doit jamais écrire dans Firestore pendant le MVP.

#### C. Endpoint REST sécurisé

Permettre à une application analysée d’exposer un endpoint REST en lecture seule.

Proof Engine doit pouvoir appeler cet endpoint avec une clé API ou un bearer token chiffré.

Exemple :

```text
GET /proof-engine/events?since=2026-06-01T00:00:00Z
GET /proof-engine/entities/events?since=2026-06-01T00:00:00Z
GET /proof-engine/metrics?from=2026-06-01&to=2026-06-30
```

#### D. Webhook / event collector

Proof Engine doit fournir un endpoint d’ingestion permettant aux applications analysées d’envoyer leurs événements produit.

Exemple :

```text
POST /api/ingest/events
```

Payload attendu :

```json
{
  "eventName": "first_photo_uploaded",
  "occurredAt": "2026-06-23T14:12:00Z",
  "actorId": "guest_123",
  "actorType": "guest",
  "entityId": "event_456",
  "entityType": "myteuf_event",
  "properties": {
    "source": "qr_code",
    "device": "mobile",
    "eventType": "wedding"
  }
}
```

L’endpoint doit vérifier :

- la signature ;
- la clé du projet ;
- le quota ;
- le schéma ;
- les duplications ;
- l’horodatage.

#### E. Stripe read-only pour les revenus

Ne pas confondre avec la facturation de Proof Engine.

Le MVP ne doit pas implémenter la facturation de Proof Engine, mais il peut implémenter un connecteur Stripe read-only pour l’application analysée afin de mesurer :

- checkout_started ;
- purchase_completed ;
- refunds ;
- revenu attribué ;
- panier moyen ;
- conversion payante.

Ce connecteur doit être strictement read-only.

#### F. Gateway IA / Codex / MCP compatible

Proof Engine doit également supporter un mode de connexion par Gateway afin que l’IA, les agents de développement et les environnements type Codex puissent accéder aux sources autorisées via une couche contrôlée.

Ce mode doit être traité comme un connecteur read-only supplémentaire, pas comme un raccourci qui contourne la sécurité.

Objectifs :

- permettre de connecter des sources via un Gateway compatible MCP ou HTTP ;
- supporter des profils de connexion de type `codex_mcp_gateway`, `custom_http_gateway` et `hermes_style_gateway` ;
- permettre à Codex, pendant le développement, d’utiliser un Gateway configuré pour inspecter des schémas, tester les mappings et valider les connecteurs sans exposer les secrets dans le dépôt ;
- permettre à Proof Engine, en production, de lire les données autorisées via le Gateway sans dépendre de Codex pour fonctionner ;
- donner à l’IA un accès uniquement à des opérations typées, validées et auditées.

Exemples d’opérations autorisées via Gateway :

```text
list_sources
inspect_schema
list_events
read_events_since
read_entities_since
run_metric_query
fetch_funnel_snapshot
fetch_cohort_snapshot
test_connection
```

Opérations interdites dans le MVP :

```text
write_record
update_record
delete_record
send_email
publish_campaign
modify_remote_backend
execute_unrestricted_sql
```

Le Gateway doit être conçu comme une abstraction. Ne pas coder Proof Engine uniquement pour un service nommé Hermes. Créer des interfaces adaptables afin de connecter plus tard Hermes, Codex MCP, un Gateway interne, un MCP server custom ou un endpoint HTTP sécurisé.

### 6.3 Assistant de connexion

Créer un assistant de connexion dans l’interface.

Routes attendues :

```text
/app/[workspaceSlug]/projects/[projectId]/connectors
/app/[workspaceSlug]/projects/[projectId]/connectors/new
/app/[workspaceSlug]/projects/[projectId]/connectors/[dataSourceId]
/app/[workspaceSlug]/projects/[projectId]/gateway
/app/[workspaceSlug]/projects/[projectId]/gateway/new
/app/[workspaceSlug]/projects/[projectId]/gateway/[gatewayConnectionId]
/app/[workspaceSlug]/projects/[projectId]/event-mapping
/app/[workspaceSlug]/projects/[projectId]/data-quality
```

L’assistant doit permettre de :

1. choisir le type de backend ;
2. saisir les paramètres de connexion ;
3. tester la connexion ;
4. scanner les tables, collections ou événements disponibles ;
5. proposer un mapping automatique ;
6. permettre à l’utilisateur de confirmer le mapping ;
7. configurer un profil Gateway lorsque le backend passe par Codex, MCP, Hermes-style ou HTTP Gateway ;
8. tester les capabilities Gateway ;
9. lancer une première synchronisation ;
10. afficher la qualité des données ;
11. débloquer le diagnostic uniquement si les données minimales existent.

### 6.4 Mapping canonique des événements

Le produit doit convertir les événements spécifiques de chaque app en événements canoniques.

Événements canoniques recommandés :

```text
landing_viewed
signup_started
signup_completed
project_created
core_action_started
core_action_completed
invite_sent
shared_link_clicked
guest_joined
content_uploaded
activation_reached
checkout_started
purchase_completed
subscription_started
subscription_cancelled
second_project_created
referral_created
```

Pour MYteuf, le mapping doit proposer automatiquement :

```text
myteuf_event_created       -> project_created
event_created              -> project_created
qr_code_viewed             -> core_action_started
share_button_clicked       -> invite_sent
link_copied                -> invite_sent
whatsapp_share_clicked     -> invite_sent
guest_joined               -> guest_joined
first_photo_uploaded       -> content_uploaded
five_photos_uploaded       -> activation_reached
three_contributors_reached -> activation_reached
purchase_completed         -> purchase_completed
second_event_created       -> second_project_created
```

Le mapping doit être modifiable, versionné et auditable.

### 6.5 Détection automatique des métriques

À partir des événements synchronisés, Proof Engine doit calculer automatiquement :

- visiteurs qualifiés ;
- créations commencées ;
- créations terminées ;
- taux de partage ;
- premiers invités rejoints ;
- premiers uploads ;
- activation ;
- conversion payante ;
- revenu ;
- rétention ;
- second usage ;
- temps entre étapes ;
- rupture principale du tunnel.

Ces métriques doivent être recalculées à chaque synchronisation.

### 6.6 Suivi automatique des expériences

Lorsqu’une expérience démarre, Proof Engine doit :

1. capturer automatiquement la baseline depuis les données connectées ;
2. associer l’expérience à une population ou période mesurable ;
3. suivre la métrique principale sans saisie manuelle ;
4. synchroniser les résultats régulièrement ;
5. afficher les variations ;
6. identifier les limites méthodologiques ;
7. produire l’apprentissage à la clôture avec les données réelles.

L’utilisateur peut ajouter des notes qualitatives, mais pas modifier les valeurs de métriques.

### 6.7 Synchronisation

Implémenter :

- synchronisation initiale ;
- synchronisation incrémentale ;
- synchronisation planifiée ;
- synchronisation manuelle déclenchée par bouton, mais sans saisie manuelle de valeurs ;
- journal des synchronisations ;
- reprise après erreur ;
- déduplication ;
- gestion du `since` cursor ;
- statut de santé du connecteur.

Les tâches planifiées peuvent utiliser :

- Vercel Cron ;
- Route Handlers sécurisés ;
- Supabase cron si disponible localement ou en déploiement.

Ne pas introduire de queue externe dans le MVP sauf impossibilité démontrée.

### 6.8 Sécurité des connexions

Toutes les informations sensibles des applications analysées doivent être chiffrées côté serveur.

Exigences :

- ne jamais stocker un secret en clair ;
- ne jamais envoyer un secret au navigateur ;
- utiliser une clé d’encryption côté serveur via `APP_ENCRYPTION_KEY` ;
- prévoir une rotation de clé via `key_version` ;
- journaliser les accès sans journaliser les secrets ;
- n’utiliser que des permissions read-only ;
- afficher à l’utilisateur les permissions nécessaires ;
- permettre de supprimer un connecteur et ses secrets ;
- isoler les données par workspace ;
- tester l’isolation RLS des données synchronisées.

### 6.9 Data quality gate

Avant un diagnostic, le système doit vérifier :

- au moins une source connectée active ;
- une synchronisation réussie récente ;
- un mapping minimal des événements ;
- suffisamment d’événements pour calculer au moins une partie du tunnel ;
- l’existence d’une métrique principale candidate ;
- la fraîcheur des données.

Si ce gate échoue, afficher une page d’état claire :

```text
Diagnostic non disponible : données réelles insuffisantes.
Connectez votre backend ou corrigez le mapping pour lancer l’analyse.
```

### 6.10 MYteuf : analyse backend attendue

Pour MYteuf, Proof Engine doit pouvoir analyser automatiquement :

- événements créés ;
- événements partagés ;
- QR codes affichés ou téléchargés ;
- liens copiés ;
- partages WhatsApp ;
- invités ayant rejoint ;
- photos envoyées ;
- nombre de contributeurs par événement ;
- type d’événement ;
- délai entre création et premier partage ;
- délai entre partage et premier invité ;
- délai entre premier invité et première photo ;
- albums consultés par l’organisateur ;
- achats ou upgrades si disponibles ;
- second événement créé ;
- événements inactifs.

La première analyse MYteuf doit être capable de conclure automatiquement si le goulot est plutôt :

- acquisition ;
- création d’événement ;
- partage du lien/QR ;
- arrivée des invités ;
- upload photo ;
- activation collective ;
- conversion payante ;
- rétention ou second usage.

### 6.11 Données manuelles interdites comme source de vérité

Supprimer ou éviter toute interface dont le rôle principal serait de demander à l’utilisateur de saisir des métriques à la main.

Interdit dans le MVP :

- formulaire manuel de résultats d’expérience ;
- formulaire manuel de métriques produit ;
- champ permettant de remplacer une métrique synchronisée ;
- faux graphiques ;
- données de démonstration présentées comme réelles.

Autorisé :

- annotation humaine ;
- hypothèse du fondateur ;
- validation du mapping ;
- commentaire sur une expérience ;
- confirmation ou correction du goulot proposé ;
- correction du libellé d’un événement canonique.

Ces éléments autorisés doivent être stockés séparément des métriques synchronisées.


### 6.12 Connector Gateway et accès IA contrôlé

Créer dans Proof Engine une couche **Connector Gateway**. Cette couche sert d’unique passage entre l’IA et les données externes.

L’IA ne doit jamais recevoir :

- une clé Supabase ;
- une clé Firebase ;
- un service account ;
- une clé Stripe ;
- un token Gateway ;
- une chaîne de connexion PostgreSQL ;
- un secret MCP ;
- un accès SQL libre.

L’IA doit uniquement pouvoir demander des données via des fonctions serveur typées, par exemple :

```ts
connectorGateway.inspectSchema(dataSourceId)
connectorGateway.fetchEvents(dataSourceId, { since, limit })
connectorGateway.computeFunnel(projectId, funnelDefinition, period)
connectorGateway.getMetricSnapshot(projectId, metricKey, period)
connectorGateway.getExperimentResult(experimentId)
```

Ces fonctions doivent :

- vérifier l’utilisateur et le workspace ;
- vérifier les permissions du connecteur ;
- appliquer les limites de volume ;
- masquer ou hasher les identifiants sensibles lorsque possible ;
- filtrer les champs non nécessaires ;
- journaliser l’accès ;
- retourner des sorties validées par Zod ;
- refuser toute opération d’écriture dans le backend analysé.

### 6.13 Gateway compatible Codex / MCP

Prévoir une intégration compatible avec les workflows où Codex ou un agent de développement utilise un Gateway de connexion, comme on connecterait un service via Hermes, un MCP server ou un autre système de Gateway.

Exigences d’implémentation :

- créer une interface `GatewayProvider` ;
- créer au minimum un `MockGatewayProvider` pour les tests ;
- créer un `HttpGatewayProvider` pour les gateways HTTP sécurisés ;
- créer une structure prête pour `McpGatewayProvider` ;
- créer une structure prête pour `CodexMcpGatewayProvider` ;
- créer une structure prête pour `HermesStyleGatewayProvider` sans supposer l’API réelle d’Hermes ;
- stocker chaque profil Gateway dans une table dédiée ;
- chiffrer tous les tokens ;
- tester la connexion et les capabilities avant activation ;
- afficher les capabilities disponibles dans l’UI ;
- empêcher l’activation si les capabilities minimales de lecture ne sont pas disponibles.

Capabilities minimales attendues :

```text
schema.inspect
events.read
entities.read
metrics.read
health.check
```

Capabilities optionnelles :

```text
funnels.compute
cohorts.compute
revenue.read
experiments.read
logs.read
```

Capabilities interdites dans le MVP :

```text
data.write
data.delete
campaign.send
email.send
payment.modify
backend.mutate
```

### 6.14 Codex Gateway : usage développement et documentation

Codex peut être utilisé pour développer, tester et auditer les connecteurs, mais le produit final ne doit pas dépendre de Codex pour fonctionner en production.

Créer une documentation dédiée :

```text
docs/codex-gateway.md
docs/gateway-contracts.md
```

`docs/codex-gateway.md` doit expliquer :

- comment configurer un Gateway local ou distant pour le développement ;
- comment fournir les variables d’environnement sans les commiter ;
- comment Codex peut inspecter un schéma via Gateway ;
- comment tester le mapping d’événements ;
- comment utiliser le connecteur mock en CI ;
- quelles opérations sont interdites ;
- comment vérifier que les secrets ne sont jamais exposés au client.

Créer aussi un fichier d’exemple :

```text
docs/examples/gateway-profile.example.json
```

Exemple de profil Gateway :

```json
{
  "provider": "codex_mcp_gateway",
  "name": "Codex local gateway",
  "transport": "mcp",
  "mode": "read_only",
  "capabilities": [
    "schema.inspect",
    "events.read",
    "entities.read",
    "metrics.read",
    "health.check"
  ],
  "scopes": [
    "project:read",
    "events:read",
    "metrics:read"
  ]
}
```

Le dépôt ne doit jamais contenir de vrai token Gateway. Seuls des exemples vides ou factices sont autorisés.

### 6.15 Contrat technique Gateway

Définir un contrat commun pour tous les providers Gateway.

Types attendus :

```ts
type GatewayCapability =
  | "schema.inspect"
  | "events.read"
  | "entities.read"
  | "metrics.read"
  | "funnels.compute"
  | "cohorts.compute"
  | "revenue.read"
  | "experiments.read"
  | "logs.read"
  | "health.check";

type GatewayProviderKind =
  | "mock_gateway"
  | "http_gateway"
  | "mcp_gateway"
  | "codex_mcp_gateway"
  | "hermes_style_gateway";

interface GatewayProvider {
  testConnection(input: TestGatewayConnectionInput): Promise<GatewayHealthResult>;
  listCapabilities(input: GatewayConnectionRef): Promise<GatewayCapability[]>;
  inspectSchema(input: InspectSchemaInput): Promise<GatewaySchemaResult>;
  readEvents(input: ReadGatewayEventsInput): Promise<GatewayEventBatch>;
  readEntities(input: ReadGatewayEntitiesInput): Promise<GatewayEntityBatch>;
  readMetrics(input: ReadGatewayMetricsInput): Promise<GatewayMetricBatch>;
}
```

Chaque implémentation doit avoir :

- des schémas Zod d’entrée et sortie ;
- des tests unitaires ;
- des fixtures ;
- une gestion d’erreur claire ;
- un timeout configurable ;
- des retries limités uniquement sur erreurs transitoires ;
- un journal d’accès sans données sensibles.

### 6.16 Règle anti-boîte noire

Même si les données viennent d’un Gateway, Proof Engine doit conserver une traçabilité complète :

- source exacte ;
- connecteur utilisé ;
- capability utilisée ;
- période lue ;
- volume de données ;
- mapping appliqué ;
- formule de métrique ;
- date de synchronisation ;
- version du mapping ;
- version du prompt IA utilisé pour l’interprétation.

Aucun diagnostic ne doit afficher une conclusion sans afficher au moins les sources et métriques ayant conduit à cette conclusion.

## 7. Stack technique

Utilise le stack suivant.

### Runtime et gestionnaire

- version LTS de Node.js compatible avec la version stable de Next.js installée ;
- pnpm ;
- lockfile obligatoire ;
- fichier `.nvmrc` ;
- `packageManager` renseigné dans `package.json`.

### Application

- Next.js stable ;
- App Router ;
- React ;
- TypeScript en mode strict ;
- dossier `src/` ;
- React Server Components par défaut ;
- Client Components uniquement lorsque l’interactivité l’exige ;
- Server Actions pour les mutations internes ;
- Route Handlers pour les endpoints d’IA et les futurs webhooks.

### Interface

- Tailwind CSS stable ;
- shadcn/ui installé avec le CLI officiel ;
- Lucide React pour les icônes ;
- next-themes pour le thème clair/sombre ;
- composants shadcn ajoutés uniquement lorsqu’ils sont utilisés ;
- Sonner pour les notifications ;
- Recharts à travers les composants Chart de shadcn uniquement lorsque des métriques réelles existent ;
- date-fns avec locale française.

### Formulaires et validation

- React Hook Form ;
- Zod ;
- validation côté client pour l’expérience utilisateur ;
- validation systématique côté serveur ;
- ne jamais faire confiance aux données du navigateur.

### Backend Proof Engine

- Supabase ;
- Supabase Auth ;
- PostgreSQL ;
- `@supabase/ssr` ;
- migrations SQL versionnées ;
- Row Level Security sur toutes les tables exposées ;
- types TypeScript générés depuis la base ;
- utiliser les clés Supabase publishable et secret actuelles ;
- ne jamais exposer une clé secrète dans le navigateur ;
- stocker les secrets de connecteurs uniquement chiffrés côté serveur ;
- utiliser une clé `APP_ENCRYPTION_KEY` côté serveur.

### Connecteurs de données

Installer uniquement les dépendances nécessaires aux connecteurs réellement implémentés dans le MVP :

- `pg` pour PostgreSQL / Supabase read-only ;
- `firebase-admin` pour Firebase / Firestore read-only ;
- `stripe` pour un connecteur Stripe read-only de l’application analysée ;
- `zod` pour valider toutes les configurations, payloads et mappings ;
- API `crypto` native de Node.js pour le chiffrement AES-GCM des secrets ;
- Route Handlers Next.js pour les webhooks et l’ingestion d’événements.

Les connecteurs doivent être server-only. Aucun SDK admin, secret ou connection string ne doit être importé dans un Client Component.

### IA

- SDK JavaScript officiel OpenAI ;
- Responses API ;
- Structured Outputs ;
- schémas Zod ;
- tous les appels OpenAI exclusivement côté serveur ;
- modèle configurable par variable d’environnement ;
- valeur suggérée dans `.env.example` : `OPENAI_MODEL=gpt-5.4-mini` ;
- prévoir facultativement : `OPENAI_DEEP_MODEL=gpt-5.5` ;
- aucun identifiant de modèle dispersé dans le code ;
- centraliser le choix des modèles dans `src/config/ai.ts`.

### Tests

- Vitest ;
- React Testing Library ;
- Playwright ;
- tests déterministes utilisant un fournisseur IA mock ;
- GitHub Actions pour lint, typecheck, tests et build.

### Déploiement cible

- Vercel ;
- Supabase hébergé ;
- l’application doit également être exécutable en local.

### Ne pas utiliser

- Redux ;
- une base vectorielle ;
- un ORM supplémentaire si le client Supabase typé suffit ;
- du scraping web ;
- une saisie manuelle comme source principale de métriques ;
- un CMS ;
- des microservices ;
- une architecture monorepo ;
- une queue externe ;
- des fonctionnalités expérimentales inutiles.

---

## 8. Initialisation attendue

Si le dépôt est vide :

1. Crée une application Next.js avec :
   - TypeScript ;
   - ESLint ;
   - Tailwind ;
   - App Router ;
   - `src/` ;
   - alias `@/*` ;
   - pnpm.

2. Initialise shadcn/ui avec sa configuration stable actuelle.

3. Configure notamment les composants nécessaires :
   - Button
   - Card
   - Input
   - Textarea
   - Label
   - Form
   - Select
   - Checkbox
   - Radio Group
   - Badge
   - Alert
   - Dialog
   - Sheet
   - Dropdown Menu
   - Tabs
   - Table
   - Progress
   - Separator
   - Skeleton
   - Tooltip
   - Scroll Area
   - Breadcrumb
   - Sidebar
   - Sonner
   - Chart

N’installe pas aveuglément tous les composants si certains ne sont pas utilisés.

4. Configure les scripts :

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm db:start
pnpm db:stop
pnpm db:reset
pnpm db:types
```

---

## 9. Architecture des dossiers

Utilise une architecture orientée fonctionnalités similaire à :

```text
src/
  app/
    (marketing)/
    (auth)/
    (app)/
    api/
      ingest/
      cron/
      connectors/
      gateway/
      mcp/
  components/
    ui/
    layout/
    shared/
  features/
    auth/
    onboarding/
    projects/
    connectors/
    data-quality/
    event-mapping/
    evidence/
    diagnostics/
    experiments/
    assets/
    metrics/
    learnings/
  lib/
    ai/
      prompts/
      schemas/
      providers/
      evaluators/
    connectors/
      providers/
        postgres/
        firebase/
        rest-api/
        webhook/
        stripe/
        gateway/
      gateway/
        providers/
        capabilities/
        audit/
        mcp/
      schemas/
      sync/
      mapping/
      encryption/
      health/
    analytics/
      funnels/
      metrics/
      activation/
    supabase/
    auth/
    validation/
    repositories/
    security/
    utils/
  config/
  content/
  types/

supabase/
  migrations/
  seed.sql

docs/
  implementation-plan.md
  product-spec.md
  architecture.md
  connector-contracts.md
  gateway-contracts.md
  codex-gateway.md
  data-modeling.md
  ai-contracts.md
  security.md
  backlog.md
```

Principes d’architecture :

- composants métier proches de leur fonctionnalité ;
- composants UI génériques dans `components/ui` ;
- aucun composant page gigantesque ;
- pas de logique métier directement dans les composants de présentation ;
- pas de duplication de validation ;
- schémas Zod partagés ;
- frontières serveur/client clairement identifiables ;
- connecteurs strictement server-only ;
- aucun import de secret dans un Client Component ;
- aucun accès direct du navigateur aux backends analysés ;
- préférer la composition à des abstractions complexes ;
- ne pas créer une couche générique avant d’avoir au moins deux usages réels.

## 10. Routes

### Routes publiques

- `/`
- `/login`
- `/signup`
- `/auth/callback`
- `/privacy`
- `/terms`

### Routes authentifiées

- `/app/onboarding`
- `/app/[workspaceSlug]/dashboard`
- `/app/[workspaceSlug]/projects/[projectId]/connectors`
- `/app/[workspaceSlug]/projects/[projectId]/connectors/new`
- `/app/[workspaceSlug]/projects/[projectId]/connectors/[dataSourceId]`
- `/app/[workspaceSlug]/projects/[projectId]/gateway`
- `/app/[workspaceSlug]/projects/[projectId]/gateway/new`
- `/app/[workspaceSlug]/projects/[projectId]/gateway/[gatewayConnectionId]`
- `/app/[workspaceSlug]/projects/[projectId]/event-mapping`
- `/app/[workspaceSlug]/projects/[projectId]/data-quality`
- `/app/[workspaceSlug]/projects/[projectId]/evidence`
- `/app/[workspaceSlug]/projects/[projectId]/diagnostic`
- `/app/[workspaceSlug]/projects/[projectId]/experiments`
- `/app/[workspaceSlug]/projects/[projectId]/experiments/[experimentId]`
- `/app/[workspaceSlug]/projects/[projectId]/learnings`
- `/app/[workspaceSlug]/settings`

### Routes API serveur

- `POST /api/ingest/events`
- `POST /api/connectors/[dataSourceId]/test`
- `POST /api/connectors/[dataSourceId]/sync`
- `POST /api/gateway/[gatewayConnectionId]/test`
- `POST /api/gateway/[gatewayConnectionId]/inspect-schema`
- `POST /api/gateway/[gatewayConnectionId]/sync`
- `POST /api/cron/sync-connectors`
- `POST /api/webhooks/stripe`
- `POST /api/mcp/proof-engine-gateway`

Toutes les routes `/app` doivent être protégées côté serveur.

Toutes les routes API de connecteurs et d’ingestion doivent :

- vérifier l’authentification ou la signature ;
- vérifier l’appartenance au workspace ;
- valider les payloads avec Zod ;
- ne jamais exposer les secrets ;
- journaliser les erreurs sans fuite de données sensibles.

Après inscription :

1. créer automatiquement le profil ;
2. créer un workspace ;
3. ajouter l’utilisateur comme owner ;
4. rediriger vers l’onboarding ;
5. guider l’utilisateur vers la connexion de la première source de données.

## 11. Parcours utilisateur du MVP

Le parcours fonctionnel obligatoire est :

1. L’utilisateur crée son compte.
2. Il crée ou complète son workspace.
3. Il décrit son produit.
4. Il connecte le backend ou une source de données réelle de l’application analysée.
5. Il teste la connexion.
6. Proof Engine scanne les tables, collections, événements ou endpoints disponibles.
7. L’utilisateur confirme le mapping proposé entre données sources et événements canoniques.
8. Proof Engine lance une première synchronisation.
9. Proof Engine calcule automatiquement les métriques disponibles.
10. Le produit affiche la qualité et la fraîcheur des données.
11. L’utilisateur renseigne uniquement la cible, le problème, l’offre et les contraintes stratégiques.
12. Proof Engine crée automatiquement des preuves quantitatives à partir des données synchronisées.
13. Il lance un diagnostic.
14. Le produit sépare faits, signaux, hypothèses et inconnues.
15. Il identifie un goulot d’étranglement principal ou déclare les données insuffisantes.
16. Il génère une expérience prioritaire.
17. L’utilisateur modifie le plan et démarre l’expérience.
18. Proof Engine suit automatiquement la métrique principale via les connecteurs.
19. L’utilisateur peut ajouter des notes qualitatives, mais ne saisit pas les métriques.
20. Le système clôture ou aide à clôturer l’expérience à partir des données synchronisées.
21. Le système produit un apprentissage et une prochaine recommandation.

Le MVP n’est considéré comme terminé que lorsque ce parcours fonctionne de bout en bout avec au moins un connecteur réel et le fournisseur IA mock en test.

La boucle complète attendue est :

```text
connexion backend → synchronisation → mapping → métriques réelles → diagnostic → expérience → suivi automatique → apprentissage
```

## 12. Onboarding

Construis un onboarding en six étapes, responsive, avec barre de progression.

### Étape 1 — Produit

- nom du produit ;
- URL facultative ;
- description courte ;
- modèle économique ;
- stade actuel ;
- type de produit : SaaS simple, SaaS multi-acteurs, marketplace, app événementielle, outil collaboratif, autre.

### Étape 2 — Connexion backend

Cette étape est obligatoire avant un diagnostic complet.

L’utilisateur choisit une source :

- Supabase / PostgreSQL ;
- Firebase / Firestore ;
- endpoint REST ;
- webhook/event collector ;
- Stripe read-only ;
- autre source future, désactivée si non implémentée.

L’interface doit afficher :

- permissions nécessaires ;
- statut de connexion ;
- bouton de test ;
- résultat du test ;
- dernière synchronisation ;
- prochaine synchronisation ;
- erreurs de connexion ;
- guide d’intégration.

### Étape 3 — Mapping des données

Après connexion, Proof Engine doit proposer un mapping automatique.

L’utilisateur confirme ou corrige :

- tables ou collections ;
- noms d’événements sources ;
- événements canoniques ;
- acteur principal ;
- type d’entité ;
- date d’événement ;
- propriétés importantes ;
- métrique principale candidate.

Cette étape ne doit pas demander de chiffres manuels.

### Étape 4 — Marché et offre

- segment cible ;
- utilisateur principal ;
- problème résolu ;
- déclencheur d’achat supposé ;
- solution actuelle utilisée par le client ;
- proposition de valeur actuelle ;
- prix ou fourchette de prix ;
- mode de vente ;
- durée approximative du cycle de vente ;
- offre d’essai éventuelle.

### Étape 5 — Métriques détectées

Afficher les métriques automatiquement détectées :

- visiteurs ;
- leads ;
- réponses positives si source disponible ;
- inscriptions ;
- activations ;
- clients payants ;
- revenu mensuel ;
- résiliations ;
- temps entre étapes ;
- métriques spécifiques à l’app analysée.

Chaque métrique possède :

- nom ;
- valeur calculée ;
- unité ;
- période ;
- source connectée ;
- fraîcheur ;
- niveau de confiance ;
- formule de calcul ;
- valeur cible facultative.

La valeur calculée ne doit pas être éditable manuellement.

### Étape 6 — Objectif

- objectif commercial prioritaire ;
- budget d’expérimentation ;
- canaux déjà accessibles ;
- contraintes ;
- délai souhaité ;
- définition de l’activation à utiliser pour le premier diagnostic.

L’onboarding doit pouvoir être quitté et repris.

Le diagnostic complet doit rester bloqué tant qu’aucune source connectée n’a réussi une première synchronisation.

## 13. Gestion des preuves

Créer une **Evidence Inbox** alimentée automatiquement par les sources connectées.

L’utilisateur ne doit pas saisir les preuves quantitatives à la main.

L’utilisateur peut :

- valider ou invalider une preuve détectée ;
- ajouter une note qualitative ;
- taguer une preuve ;
- relier une preuve à un diagnostic ;
- marquer une observation comme hypothèse ;
- corriger un mapping source → preuve.

### Sources de preuves

```text
backend_event
computed_metric
funnel_dropoff
retention_signal
payment_signal
support_table
customer_feedback_table
analytics_event
experiment_result
founder_annotation
other_connected_source
```

### Types de preuves

```text
customer_interview
sales_call
support_request
customer_objection
analytics
market_signal
competitor_observation
founder_assumption
backend_metric
product_event
payment_event
other
```

### Classification

```text
fact
signal
assumption
unknown
```

### Champs

- titre ;
- contenu ;
- type ;
- classification ;
- source connectée ;
- ID source ;
- période observée ;
- date d’observation ;
- niveau de force : weak, medium, strong ;
- tags ;
- note interne ;
- formule ou requête de calcul si applicable ;
- fraîcheur des données ;
- lien vers `data_source_id`, `sync_run_id` ou `raw_event_id`.

### Règles

- `founder_assumption` doit être classé `assumption` par défaut ;
- une citation synchronisée doit être stockée exactement telle qu’elle est reçue ;
- ne jamais transformer automatiquement une hypothèse en fait ;
- un fait quantitatif doit être relié à une source connectée ou à une métrique calculée ;
- afficher des filtres par type, classification, force, source et fraîcheur ;
- permettre de sélectionner les preuves utilisées dans un diagnostic ;
- afficher clairement combien de faits, signaux, hypothèses et inconnues sont disponibles ;
- indiquer visuellement les preuves issues d’une synchronisation récente ;
- indiquer visuellement les preuves obsolètes.

Aucun scraping ou import manuel d’URL dans le MVP.

Aucune métrique manuelle ne doit être acceptée comme preuve factuelle.

## 14. Moteur de diagnostic

### Catégories de goulots d’étranglement

```text
acquisition
positioning_offer
conversion
activation
retention
unknown
```

Le diagnostic doit combiner :

1. une couche déterministe ;
2. une analyse IA structurée.

La couche déterministe calcule notamment :

- `dataCompletenessScore` ;
- `evidenceCoverageScore` ;
- `evidenceDiversityScore` ;
- nombre de faits ;
- nombre de signaux ;
- nombre d’hypothèses ;
- présence ou absence de métriques ;
- présence ou absence de valeurs cibles.

Crée une première heuristique documentée et facilement modifiable.

### Exigences minimales

- si aucune preuve autre que des hypothèses n’existe, plafonner fortement la confiance ;
- si moins de trois preuves existent, afficher une confiance faible ;
- ne pas laisser le modèle IA définir seul le score final de confiance ;
- la confiance finale est calculée par l’application ;
- chaque affirmation importante doit contenir les IDs des preuves associées ;
- les IDs renvoyés doivent être validés contre les preuves réellement fournies ;
- tout ID inconnu invalide la réponse ;
- lorsqu’un diagnostic n’est pas suffisamment fondé, utiliser `bottleneck=unknown`.

### Structure Zod du résultat de diagnostic

```ts
DiagnosticOutput {
  status: "sufficient" | "insufficient"
  summary: string
  facts: Array<{
    statement: string
    evidenceIds: string[]
  }>
  signals: Array<{
    statement: string
    evidenceIds: string[]
  }>
  assumptions: Array<{
    statement: string
    evidenceIds: string[]
  }>
  bottleneck: {
    type:
      "acquisition"
      | "positioning_offer"
      | "conversion"
      | "activation"
      | "retention"
      | "unknown"
    rationale: string
    evidenceIds: string[]
  }
  missingEvidence: Array<{
    question: string
    reason: string
  }>
  nextBestAction: string
  warnings: string[]
}
```

### Affichage du diagnostic

- résumé ;
- goulot principal ;
- score de confiance ;
- faits ;
- signaux ;
- hypothèses ;
- données manquantes ;
- prochaine action ;
- date et version du diagnostic.

Permettre à l’utilisateur de confirmer ou de modifier le goulot proposé.

Une modification humaine doit être enregistrée séparément de la proposition de l’IA.

---

## 15. Génération d’expérience

À partir du diagnostic, générer une seule expérience prioritaire.

### Structure attendue

```ts
ExperimentPlanOutput {
  title: string
  hypothesis: string
  targetSegment: string
  problem: string
  channel: string
  offer: string
  valueProposition: string
  rationale: string
  primaryMetric: {
    key: string
    name: string
    unit: string
    baseline: number | null
    target: number | null
    targetIsHypothesis: boolean
    direction: "increase" | "decrease"
  }
  guardrailMetrics: Array<{
    key: string
    name: string
    unit: string
  }>
  durationDays: number
  estimatedBudget: number | null
  steps: Array<{
    order: number
    title: string
    description: string
  }>
  decisionRules: {
    continue: string
    iterate: string
    stop: string
  }
  requiredAssets: Array<
    "landing_page"
    | "cold_email"
    | "interview_script"
  >
  evidenceIds: string[]
  risks: string[]
}
```

### Règles

- une seule métrique principale ;
- maximum deux guardrail metrics ;
- aucune métrique inventée ;
- lorsqu’une cible n’est pas fournie par l’utilisateur, la marquer comme hypothèse ;
- budget conforme aux contraintes saisies ;
- ne pas proposer automatiquement de publicité payante si le budget est nul ;
- chaque expérience doit pouvoir être modifiée avant son démarrage ;
- appliquer une contrainte en base empêchant plusieurs expériences `running` pour un même projet.

### Statuts

```text
draft
ready
running
completed
abandoned
```

---

## 16. Ressources d’exécution

Le MVP peut générer trois types de ressources :

1. `landing_page`
2. `cold_email`
3. `interview_script`

Chaque ressource doit être :

- rattachée à une expérience ;
- générée sur demande, et non automatiquement ;
- modifiable ;
- versionnée ;
- copiable ;
- enregistrée dans la base.

### Landing page

- eyebrow ;
- headline ;
- subheadline ;
- problème ;
- proposition de valeur ;
- bénéfices ;
- objections ;
- CTA ;
- FAQ ;
- aucune preuve sociale inventée.

### Cold email

- trois objets ;
- premier message ;
- deux relances ;
- CTA unique ;
- aucune fausse personnalisation ;
- aucune affirmation invérifiable.

### Interview script

- introduction ;
- questions comportementales ;
- questions sur le problème ;
- questions sur les solutions actuelles ;
- questions sur l’urgence ;
- questions sur la volonté de payer ;
- clôture ;
- éviter les questions orientées qui suggèrent la réponse.

---

## 17. Mesure et apprentissage

Sur la page d’une expérience en cours :

- afficher la métrique principale ;
- afficher la baseline calculée depuis les données connectées ;
- afficher la cible ;
- afficher la dernière valeur synchronisée ;
- afficher l’évolution uniquement avec des données réelles ;
- afficher la fraîcheur des données ;
- afficher la source connectée ;
- permettre de déclencher une synchronisation ;
- permettre l’ajout d’une note qualitative ;
- montrer le temps restant ;
- permettre de terminer ou d’abandonner l’expérience.

Interdire la saisie manuelle de relevés de métriques.

À la clôture, calculer automatiquement depuis les sources connectées :

- résultat final ;
- nombre de personnes ou entités exposées ;
- réponses si source disponible ;
- conversions ;
- dépenses si source disponible ;
- revenu attribué si source disponible ;
- objections observées si source connectée ;
- limites méthodologiques.

Demander uniquement à l’utilisateur :

- notes qualitatives ;
- contexte exceptionnel ;
- décision humaine finale si nécessaire.

Générer ensuite un apprentissage structuré :

```ts
LearningOutput {
  outcome: "validated" | "invalidated" | "inconclusive"
  observedResult: string
  supportedFindings: string[]
  rejectedFindings: string[]
  unresolvedQuestions: string[]
  reusableLearnings: string[]
  nextRecommendation: string
  evidenceIds: string[]
}
```

Ne jamais conclure qu’une causalité est prouvée lorsque l’expérience ne permet qu’une corrélation.

Lorsque les données proviennent d’une comparaison avant/après non randomisée, l’apprentissage doit indiquer explicitement que la causalité reste incertaine.

## 18. Dashboard

Le dashboard doit afficher :

- progression de l’onboarding ;
- statut des connecteurs ;
- fraîcheur des données ;
- qualité du mapping ;
- projet actif ;
- nombre de faits, signaux et hypothèses ;
- score de complétude des données ;
- score de qualité des données synchronisées ;
- goulot d’étranglement actuel ;
- niveau de confiance ;
- expérience active ;
- métrique principale ;
- dernier apprentissage ;
- prochaine action recommandée.

Ajouter des états vides réellement utiles.

Exemples :

> Ajoutez trois observations terrain pour obtenir un diagnostic plus fiable.

> Aucune expérience active. Lancez d’abord un diagnostic.

Ne pas afficher de graphiques fictifs.

---

## 19. Modèle de données

Créer des migrations SQL pour les tables suivantes.

### `profiles`

- id
- full_name
- avatar_url
- locale
- created_at
- updated_at

### `workspaces`

- id
- name
- slug
- owner_id
- plan
- created_at
- updated_at

### `workspace_members`

- workspace_id
- user_id
- role
- created_at

### `projects`

- id
- workspace_id
- name
- website_url
- description
- business_model
- stage
- product_type
- target_segment
- primary_user
- problem_statement
- buying_trigger
- current_alternative
- value_proposition
- pricing_description
- sales_motion
- sales_cycle
- primary_goal
- experiment_budget
- available_channels
- constraints
- activation_definition
- data_connection_required
- onboarding_completed_at
- created_by
- created_at
- updated_at

### `data_sources`

- id
- workspace_id
- project_id
- provider
- name
- status
- sync_mode
- config
- last_successful_sync_at
- last_failed_sync_at
- last_error
- created_by
- created_at
- updated_at

Providers MVP :

```text
postgres
supabase_postgres
firebase_firestore
rest_api
webhook_events
stripe_readonly
mock_gateway
http_gateway
mcp_gateway
codex_mcp_gateway
hermes_style_gateway
```

### `connector_secrets`

- id
- workspace_id
- project_id
- data_source_id
- encrypted_payload
- encryption_key_version
- created_by
- created_at
- updated_at

Cette table ne doit jamais être accessible depuis le client navigateur.

### `sync_runs`

- id
- workspace_id
- project_id
- data_source_id
- status
- sync_type
- started_at
- finished_at
- cursor_before
- cursor_after
- records_read
- records_inserted
- records_updated
- records_deduplicated
- error_code
- error_message
- created_at

### `connector_health_checks`

- id
- workspace_id
- project_id
- data_source_id
- status
- latency_ms
- checked_at
- message
- created_at

### `gateway_profiles`

- id
- workspace_id
- project_id
- provider
- name
- transport
- mode
- endpoint_url
- capabilities
- scopes
- status
- last_health_check_at
- created_by
- created_at
- updated_at

Providers Gateway attendus :

```text
mock_gateway
http_gateway
mcp_gateway
codex_mcp_gateway
hermes_style_gateway
```

### `gateway_secrets`

- id
- workspace_id
- project_id
- gateway_profile_id
- encrypted_payload
- encryption_key_version
- created_by
- created_at
- updated_at

Cette table ne doit jamais être accessible depuis le client navigateur.

### `gateway_capability_checks`

- id
- workspace_id
- project_id
- gateway_profile_id
- capability
- status
- latency_ms
- checked_at
- message
- created_at

### `gateway_tool_runs`

- id
- workspace_id
- project_id
- gateway_profile_id
- data_source_id
- capability
- operation
- input_hash
- output_hash
- records_read
- status
- latency_ms
- error_code
- error_message
- created_at

Cette table sert à auditer toutes les lectures de données effectuées via Gateway, y compris celles déclenchées par l’IA ou Codex pendant le développement.

### `source_schemas`

- id
- workspace_id
- project_id
- data_source_id
- schema_type
- object_name
- fields
- sample_payload
- discovered_at
- created_at

### `event_mappings`

- id
- workspace_id
- project_id
- data_source_id
- source_event_name
- canonical_event_name
- actor_id_path
- actor_type
- entity_id_path
- entity_type
- occurred_at_path
- properties_mapping
- funnel_stage
- is_active
- version
- created_by
- created_at
- updated_at

### `raw_events`

- id
- workspace_id
- project_id
- data_source_id
- sync_run_id
- external_id
- event_name
- canonical_event_name
- actor_id
- actor_type
- entity_id
- entity_type
- occurred_at
- received_at
- properties
- hash
- created_at

Prévoir une contrainte d’unicité sur `(workspace_id, project_id, data_source_id, hash)` pour éviter les doublons.

### `project_metrics`

- id
- workspace_id
- project_id
- key
- name
- value
- unit
- period_start
- period_end
- source
- data_source_id
- formula
- freshness_status
- confidence_level
- target_value
- created_at
- updated_at

Les valeurs de `project_metrics` doivent être calculées automatiquement depuis les sources connectées.

### `metric_snapshots`

- id
- workspace_id
- project_id
- experiment_id
- metric_key
- metric_name
- value
- unit
- period_start
- period_end
- data_source_id
- sync_run_id
- formula
- recorded_at
- created_at

Cette table remplace la saisie manuelle de relevés.

### `funnel_snapshots`

- id
- workspace_id
- project_id
- data_source_id
- funnel_name
- period_start
- period_end
- steps
- dropoffs
- primary_dropoff_step
- created_at

### `evidence_items`

- id
- workspace_id
- project_id
- type
- classification
- title
- content
- source
- source_kind
- data_source_id
- sync_run_id
- raw_event_id
- metric_snapshot_id
- observed_at
- period_start
- period_end
- strength
- freshness_status
- formula
- tags
- created_by
- created_at
- updated_at

### `diagnostics`

- id
- workspace_id
- project_id
- status
- proposed_bottleneck
- confirmed_bottleneck
- confidence_score
- completeness_score
- data_quality_score
- evidence_ids
- data_source_ids
- structured_output
- model
- prompt_version
- created_by
- created_at

### `experiments`

- id
- workspace_id
- project_id
- diagnostic_id
- title
- status
- hypothesis
- target_segment
- channel
- offer
- value_proposition
- primary_metric
- guardrail_metrics
- measurement_source_id
- baseline_snapshot_id
- duration_days
- estimated_budget
- steps
- decision_rules
- evidence_ids
- started_at
- ended_at
- final_outcome
- created_by
- created_at
- updated_at

### `experiment_assets`

- id
- workspace_id
- project_id
- experiment_id
- asset_type
- title
- content
- version
- created_by
- created_at
- updated_at

### `experiment_measurements`

- id
- workspace_id
- project_id
- experiment_id
- metric_snapshot_id
- measurement_type
- value
- unit
- source
- recorded_at
- created_at

### `experiment_notes`

- id
- workspace_id
- project_id
- experiment_id
- note
- created_by
- created_at

Les notes sont qualitatives et ne remplacent jamais les mesures synchronisées.

### `learnings`

- id
- workspace_id
- project_id
- experiment_id
- outcome
- structured_output
- data_source_ids
- evidence_ids
- created_by
- created_at

### `ai_runs`

- id
- workspace_id
- project_id
- feature
- provider
- model
- prompt_version
- input_hash
- input_size
- input_tokens
- output_tokens
- latency_ms
- success
- error_code
- created_at

### `usage_events`

- id
- workspace_id
- user_id
- event_type
- quantity
- created_at

Utiliser :

- UUID ;
- `timestamptz` ;
- contraintes `NOT NULL` pertinentes ;
- foreign keys ;
- cascade uniquement lorsqu’elle est réellement voulue ;
- index sur `workspace_id`, `project_id`, `created_at` et les colonnes utilisées par les policies ;
- index sur `data_source_id`, `sync_run_id`, `canonical_event_name`, `occurred_at` ;
- une contrainte ou un index partiel pour une seule expérience `running` par projet.

Les sorties IA complètes peuvent être enregistrées en JSONB, mais les données utiles à la recherche, au calcul, à l’audit et à l’interface doivent également avoir des colonnes normalisées.

## 20. Authorization et RLS

Toutes les tables métier doivent avoir RLS activé.

### Règles générales

- un utilisateur ne peut accéder qu’aux workspaces dont il est membre ;
- owner peut tout gérer dans son workspace ;
- les requêtes doivent filtrer explicitement par `workspace_id` en plus de RLS ;
- indexer les colonnes utilisées par les policies ;
- aucun accès public aux données métier ;
- aucune clé secrète dans le navigateur ;
- aucun accès client aux secrets de connecteurs ;
- les données synchronisées depuis les applications analysées doivent être isolées par workspace et projet ;
- les tables `connector_secrets`, `gateway_secrets`, `gateway_profiles`, `gateway_tool_runs`, `sync_runs`, `raw_events`, `metric_snapshots`, `funnel_snapshots` et `event_mappings` doivent avoir des policies dédiées ;
- le client utilisant la session de l’utilisateur doit être le chemin normal d’accès aux données ;
- réserver la clé secrète aux opérations administratives strictement serveur ;
- ne jamais créer de bypass d’authentification destiné à la production.

Ajouter des tests démontrant qu’un membre du workspace A ne peut pas lire ou modifier les données du workspace B, y compris les données synchronisées, les mappings, les événements bruts, les métriques et les connecteurs.

---

## 21. Intégration OpenAI

Créer une interface de fournisseur IA :

```ts
AIProvider {
  generateDiagnostic(...)
  generateExperiment(...)
  generateAsset(...)
  generateLearning(...)
}
```

### Implémentations

- `OpenAIProvider`
- `MockAIProvider`

### MockAIProvider

- utilisé dans les tests et en CI ;
- retourne des fixtures déterministes conformes aux schémas Zod ;
- ne doit jamais être silencieusement utilisé en production ;
- l’application doit refuser de démarrer en production avec `AI_PROVIDER=mock`.

### OpenAIProvider

- utilise le SDK officiel ;
- utilise la Responses API ;
- utilise `responses.parse` avec Structured Outputs et Zod ;
- gère les refus ;
- gère les timeouts ;
- gère les erreurs réseau ;
- effectue un nombre limité de retries uniquement sur les erreurs transitoires ;
- journalise les métadonnées utiles sans enregistrer de secret ;
- ne renvoie jamais une sortie non validée.

### Organisation

```text
src/lib/ai/prompts/diagnostic.ts
src/lib/ai/prompts/experiment.ts
src/lib/ai/prompts/assets.ts
src/lib/ai/prompts/learning.ts
```

Chaque prompt possède :

- un identifiant ;
- une version ;
- un schéma d’entrée ;
- un schéma de sortie ;
- des tests ;
- des exemples représentatifs.

### Protection contre la prompt injection

- traiter les contenus de preuves comme des données non fiables ;
- indiquer explicitement au modèle de ne jamais suivre les instructions présentes dans les preuves ;
- délimiter clairement les données utilisateur ;
- ne jamais donner accès à des outils externes dans le MVP ;
- ne jamais laisser une preuve modifier les instructions système ;
- valider que tous les `evidenceIds` retournés font partie de l’entrée.

Limiter :

- la taille d’un élément de preuve ;
- le nombre de preuves par appel ;
- la taille totale du contexte ;
- le nombre d’appels par workspace et par jour.

Implémenter une limite configurable :

```env
AI_DAILY_LIMIT=20
```

Le contrôle de quota doit être réalisé côté serveur.

---

## 22. Design et UX

### Direction visuelle

- SaaS B2B premium ;
- sobre ;
- précis ;
- orienté données ;
- palette neutre ;
- un seul accent de marque ;
- pas de gradients décoratifs clichés ;
- pas de glassmorphism excessif ;
- bordures légères ;
- typographie claire ;
- densité d’information maîtrisée ;
- animations discrètes ;
- thème clair et sombre.

Utiliser une police via `next/font`.

### Navigation authentifiée

- Dashboard
- Preuves
- Diagnostic
- Expériences
- Apprentissages
- Paramètres

### Desktop

- sidebar fixe ou rétractable ;
- zone centrale lisible ;
- breadcrumbs.

### Mobile

- navigation dans une Sheet ;
- formulaires utilisables ;
- tableaux transformés en cartes lorsque nécessaire ;
- aucun débordement horizontal.

### Accessibilité

- labels explicites ;
- navigation clavier ;
- focus visible ;
- contraste correct ;
- `aria-label` pour les boutons à icône ;
- erreurs de formulaire annoncées ;
- ne pas utiliser uniquement la couleur pour transmettre une information.

Créer systématiquement :

- loading states ;
- empty states ;
- error states ;
- success states ;
- skeletons lorsque pertinents ;
- confirmations pour les suppressions.

Ne pas ajouter :

- de faux témoignages ;
- de faux logos clients ;
- de faux chiffres ;
- de graphiques remplis avec des données artificielles.

---

## 23. Contenu et internationalisation

Le MVP est en français.

- Définir `lang="fr"`.
- Centraliser les textes importants dans `src/content/fr.ts` ou une organisation équivalente.
- Ne pas installer une bibliothèque d’internationalisation complète pour le MVP.
- Préparer néanmoins la structure afin qu’une traduction anglaise puisse être ajoutée plus tard.
- Utiliser les formats français pour les dates et les nombres.

---

## 24. Tests obligatoires

### Tests unitaires

- schémas Zod ;
- calcul du score de complétude ;
- calcul du score de confiance ;
- validation des `evidenceIds` ;
- règles de décision ;
- limite d’une expérience active ;
- contrôles de quota ;
- prompts et sorties mock.

### Tests composants

- onboarding ;
- assistant de connexion backend ;
- configuration Gateway ;
- validation des capabilities Gateway ;
- validation du mapping d’événements ;
- visualisation des métriques synchronisées ;
- rendu du diagnostic ;
- formulaire de création d’expérience ;
- annotations qualitatives ;
- états insuffisants.

Aucun test composant ne doit dépendre d’un formulaire de saisie manuelle de métriques ou de résultats.

### Tests d’intégration

- création de profil et workspace ;
- isolation RLS ;
- création d’un projet ;
- création d’un connecteur mock ;
- création d’un profil Gateway mock ;
- test des capabilities Gateway ;
- synchronisation d’événements depuis le connecteur mock ;
- mapping d’événements source vers événements canoniques ;
- génération de preuves quantitatives depuis les données synchronisées ;
- enregistrement d’un diagnostic ;
- création, suivi automatique et clôture d’une expérience.

### Test end-to-end principal

1. créer un utilisateur de test ;
2. se connecter ;
3. terminer l’onboarding ;
4. connecter une source mock ou Gateway mock ;
5. tester la connexion et les capabilities ;
6. synchroniser des événements produit ;
7. valider le mapping ;
8. vérifier la data quality ;
9. lancer un diagnostic avec `MockAIProvider` ;
10. générer une expérience ;
11. démarrer l’expérience ;
12. synchroniser automatiquement les résultats ;
13. terminer l’expérience ;
14. consulter l’apprentissage.

Les tests ne doivent pas appeler réellement OpenAI.
Les tests ne doivent pas exiger de vrai Gateway Codex, Hermes ou MCP externe : utiliser des mocks déterministes.

---

## 25. Documentation

Créer les fichiers suivants.

### `README.md`

- objectif du produit ;
- stack ;
- prérequis ;
- installation ;
- variables d’environnement ;
- lancement local ;
- Supabase local ;
- migrations ;
- génération des types ;
- tests ;
- build ;
- déploiement.

### `AGENTS.md`

- architecture ;
- conventions ;
- scripts ;
- invariants produit ;
- règles de sécurité ;
- exigences de tests ;
- commandes de vérification ;
- fichiers à ne pas modifier manuellement.

### `docs/product-spec.md`

- vision ;
- utilisateur cible ;
- parcours ;
- fonctionnalités ;
- hors périmètre.

### `docs/architecture.md`

- composants ;
- flux de données ;
- frontières serveur/client ;
- Supabase ;
- IA ;
- décisions techniques.

### `docs/gateway-contracts.md`

- interface `GatewayProvider` ;
- capabilities supportées ;
- transports supportés ;
- schémas Zod ;
- règles de sécurité ;
- stratégie de mock ;
- limites du MVP.

### `docs/codex-gateway.md`

- configuration développement ;
- variables d’environnement ;
- exemple de profil Gateway ;
- utilisation avec Codex et MCP lorsque disponible ;
- règles pour ne jamais commiter de secrets ;
- commandes de test ;
- limites de sécurité.

### `docs/ai-contracts.md`

- modèles d’entrée ;
- modèles de sortie ;
- versions de prompts ;
- règles de grounding ;
- gestion des erreurs ;
- stratégie d’évaluation.

### `docs/security.md`

- modèle d’autorisation ;
- RLS ;
- secrets ;
- validation ;
- prompt injection ;
- quotas.

### `docs/backlog.md`

- fonctionnalités reportées.

Créer également `.env.example` avec au minimum :

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

APP_ENCRYPTION_KEY=
CONNECTOR_WEBHOOK_SECRET=
CONNECTOR_SYNC_CRON_SECRET=

CONNECTOR_GATEWAY_ENABLED=true
GATEWAY_REQUEST_TIMEOUT_MS=15000
GATEWAY_MAX_RECORDS_PER_REQUEST=5000
GATEWAY_ALLOWED_PROVIDERS=mock_gateway,http_gateway,mcp_gateway,codex_mcp_gateway,hermes_style_gateway
CODEX_GATEWAY_PROFILE=
MCP_GATEWAY_URL=
MCP_GATEWAY_TOKEN=
HERMES_STYLE_GATEWAY_URL=
HERMES_STYLE_GATEWAY_TOKEN=

AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_DEEP_MODEL=gpt-5.5
AI_DAILY_LIMIT=20

# Variables facultatives pour tests locaux de connecteurs read-only.
TEST_POSTGRES_READONLY_URL=
TEST_FIREBASE_SERVICE_ACCOUNT_JSON=
TEST_STRIPE_READONLY_SECRET_KEY=
TEST_GATEWAY_PROFILE_JSON=
```

---

## 26. Hors périmètre du MVP

Ne pas implémenter maintenant :

- la facturation de Proof Engine ;
- les invitations de collaborateurs ;
- OAuth social ;
- scraping de sites ;
- publication automatique de campagnes ;
- envoi automatique d’e-mails ;
- intégrations CRM complexes ;
- écriture dans les CRM ou outils connectés ;
- connexion universelle à n’importe quel backend sans mapping, configuration ou contrat Gateway ;
- modification ou écriture dans les backends analysés ;
- suppression de données dans les backends analysés ;
- embeddings ;
- base vectorielle ;
- application mobile native ;
- génération d’images ;
- marketplace de templates ;
- système d’affiliation ;
- administration globale complexe.

À ne pas mettre hors périmètre :

- connexion backend read-only ;
- Firebase / Firestore read-only ;
- Supabase / PostgreSQL read-only ;
- endpoint REST read-only ;
- webhook d’ingestion d’événements ;
- Stripe read-only pour mesurer les revenus de l’app analysée ;
- synchronisation automatique ;
- mapping d’événements ;
- suivi automatique des expériences ;
- Gateway read-only compatible Codex / MCP / HTTP ;
- connecteur Gateway mock pour CI ;
- documentation `docs/codex-gateway.md`.

Préparer des frontières architecturales propres, mais ne pas créer de fausses fonctionnalités ou de boutons cassés.

Ne pas créer de mode où le succès du MVP dépend de chiffres saisis manuellement.

## 27. Ordre d’implémentation

Procède dans cet ordre.

### Milestone 1 — Fondation

- inspection ;
- plan ;
- Next.js ;
- TypeScript ;
- Tailwind ;
- shadcn/ui ;
- structure ;
- configuration ;
- `AGENTS.md`.

### Milestone 2 — Base et authentification

- Supabase local ;
- migrations initiales ;
- types ;
- RLS ;
- signup ;
- login ;
- callback ;
- création automatique du workspace.

### Milestone 3 — Connecteurs et ingestion

- tables `data_sources`, `connector_secrets`, `gateway_profiles`, `gateway_secrets`, `gateway_tool_runs`, `sync_runs`, `raw_events`, `event_mappings`, `metric_snapshots` ;
- chiffrement des secrets ;
- interface `GatewayProvider` ;
- Gateway mock ;
- connecteur mock ;
- webhook d’ingestion signé ;
- connecteur PostgreSQL / Supabase read-only ;
- connecteur Firebase / Firestore read-only ;
- connecteur REST read-only minimal ;
- connecteur Gateway HTTP / MCP minimal avec mock ;
- structure Codex MCP Gateway prête et documentée ;
- structure Hermes-style Gateway prête sans dépendance réelle ;
- connecteur Stripe read-only si faisable dans le temps du MVP ;
- synchronisation initiale et incrémentale ;
- journal des synchronisations ;
- santé du connecteur ;
- tests.

### Milestone 4 — Mapping et qualité des données

- scan des sources ;
- mapping source → canonical event ;
- mapping MYteuf proposé ;
- calcul de métriques depuis `raw_events` ;
- funnel snapshots ;
- data quality gate ;
- pages connecteurs, Gateway, mapping et data quality.

### Milestone 5 — Onboarding et projets

- onboarding en six étapes ;
- connexion backend obligatoire ;
- sauvegarde ;
- dashboard minimal alimenté par données synchronisées ;
- métriques détectées automatiquement.

### Milestone 6 — Evidence Inbox automatique

- génération automatique de preuves depuis les métriques, events et funnel dropoffs ;
- filtres ;
- classifications ;
- notes qualitatives ;
- interdiction des métriques manuelles comme faits ;
- tests.

### Milestone 7 — Diagnostic

- scoring déterministe ;
- data quality gate ;
- schéma IA ;
- MockAIProvider ;
- OpenAIProvider ;
- interface diagnostic ;
- tests.

### Milestone 8 — Expérience et suivi automatique

- génération ;
- édition ;
- statuts ;
- contrainte d’une expérience active ;
- association à une métrique synchronisée ;
- baseline automatique ;
- suivi automatique ;
- ressources d’exécution.

### Milestone 9 — Résultats et apprentissage

- synchronisation des résultats ;
- clôture ;
- génération de l’apprentissage ;
- dashboard final.

### Milestone 10 — Qualité

- responsive ;
- accessibilité ;
- états d’erreur ;
- tests E2E ;
- CI ;
- documentation ;
- build final.

À la fin de chaque milestone, exécute les vérifications pertinentes avant de continuer.

## 28. Critères d’acceptation

Le projet est accepté uniquement si :

- `pnpm install` fonctionne ;
- `pnpm dev` démarre l’application ;
- `pnpm lint` réussit ;
- `pnpm typecheck` réussit ;
- `pnpm test` réussit ;
- `pnpm build` réussit ;
- le parcours E2E principal fonctionne avec le fournisseur IA mock ;
- un connecteur mock permet une synchronisation complète ;
- un Gateway mock permet une synchronisation complète ;
- le webhook d’ingestion reçoit, valide, déduplique et stocke des événements ;
- au moins un connecteur backend réel est implémenté en read-only ;
- Firebase / Firestore read-only est implémenté ou clairement livré avec un connecteur fonctionnel et testé ;
- l’interface `GatewayProvider` existe et est testée ;
- le Gateway HTTP/MCP est documenté ;
- le mode Codex Gateway est documenté dans `docs/codex-gateway.md` ;
- aucun vrai token Gateway n’est commité ;
- les métriques du dashboard proviennent de données synchronisées ;
- les preuves quantitatives sont générées depuis les sources connectées ;
- le diagnostic complet est bloqué si aucune source réelle ou mock de test n’est connectée ;
- le suivi d’expérience utilise des métriques synchronisées ;
- aucun formulaire ne permet de remplacer manuellement les résultats d’expérience ;
- aucun secret n’est commité ;
- aucun secret de connecteur ou Gateway n’est envoyé au navigateur ;
- les secrets de connecteurs et Gateway sont chiffrés au repos ;
- toutes les tables métier ont RLS ;
- les tables de données synchronisées ont RLS ;
- l’isolation entre workspaces est testée ;
- aucune sortie IA non validée n’est enregistrée ;
- aucun conseil central n’est généré sans preuve ou marqué comme hypothèse ;
- aucun faux contenu commercial n’est affiché ;
- aucune page essentielle n’est une simple maquette ;
- aucun TODO critique ne reste dans le parcours principal ;
- le README permet à un autre développeur de lancer le projet.

Le MVP n’est pas accepté si l’analyse repose principalement sur des chiffres saisis manuellement.

## 29. Compte rendu final

À la fin, donne un compte rendu comprenant :

1. résumé des fonctionnalités réalisées ;
2. choix d’architecture ;
3. structure des principales tables ;
4. connecteurs implémentés ;
5. Gateway providers implémentés ou préparés ;
6. stratégie de synchronisation ;
7. variables d’environnement nécessaires ;
8. commandes de lancement ;
9. commandes de test ;
10. résultats exacts de chaque vérification exécutée ;
11. limitations réelles restantes ;
12. liste des fichiers importants ;
13. prochaines étapes recommandées.

Ne masque aucune erreur ou étape non exécutée.

Ne déclare pas le projet terminé tant que la boucle complète suivante n’est pas fonctionnelle :

> preuves → diagnostic → expérience → résultats → apprentissage
