# Sub-agent QA Harness

Ce harness teste le contrat attendu pour un site fictif connecte a un sous-agent
Codex, sans appeler de modele externe en CI.

## Principe

1. Le site fictif est fourni sous forme de snapshot JSON: pages, URL, titres et
   faits citables.
2. Le sous-agent recoit uniquement ce snapshot et une liste de questions.
3. Chaque reponse doit citer les `factIds` utilises.
4. L'evaluateur rejette les citations inconnues, les reponses qui ne contiennent
   pas les elements attendus, et les questions hors perimetre qui ne sont pas
   refusees.

## Fichiers

- Contrat et evaluateur: `src/lib/ai/site-qa.ts`
- Fixture du site fictif: `tests/fixtures/site-qa/atelier-nova.ts`
- Tests: `tests/unit/site-qa.test.ts`

## Branchement Codex reel

Un provider Codex reel devra produire le meme shape que `SiteAnswer`. Les tests
unitaires restent deterministes; un test d'integration avec `OPENAI_API_KEY` peut
etre ajoute separement et marque optionnel pour ne pas bloquer la CI locale.
