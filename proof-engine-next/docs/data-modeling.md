# Data Modeling

Les valeurs quantitatives sont calculees depuis `raw_events` et stockees dans
`project_metrics`, `metric_snapshots` et `funnel_snapshots`.

Les mappings confirmes sont stockes dans `event_mappings`. Le data quality gate
ne compte que les mappings actifs persistants, pas les exemples internes.

Les preuves synchronisees sont stockees dans `evidence_items` avec un `code`
stable (`F-001`, `S-001`, etc.) pour affichage et audit. Les diagnostics
persistes gardent les UUID de preuves quand ils existent et conservent les codes
dans la sortie structuree.

Les notes humaines restent qualitatives dans `experiment_notes` ou des preuves
classees `founder_assumption`; elles ne remplacent jamais les metriques.
