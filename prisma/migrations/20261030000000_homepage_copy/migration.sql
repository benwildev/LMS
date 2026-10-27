-- New default tagline, unless the admin already wrote their own.
UPDATE "settings" SET "value" = 'Biology video courses with quizzes, notes and live classes.'
WHERE "key" = 'tagline' AND "value" = 'Video courses you unlock once with bKash.';
