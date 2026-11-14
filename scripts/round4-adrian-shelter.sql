-- Idempotent. Adrián's story body still named the old shelter after round 3.
-- Safe to run again: the WHERE clause matches only the leftover phrase.

BEGIN;

UPDATE stories
SET
  story = replace(story, 'Casa de Paso Esperanza', 'Albergue Camino a Casa'),
  updated_at = NOW()
WHERE slug = 'adrian'
  AND story LIKE '%Casa de Paso Esperanza%';

COMMIT;
