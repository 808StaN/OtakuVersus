-- Drop obsolete fields after moving to text-input guessing mode
DROP INDEX IF EXISTS "Scene_category_idx";

ALTER TABLE "Round"
  DROP COLUMN IF EXISTS "optionsJson";

ALTER TABLE "Scene"
  DROP COLUMN IF EXISTS "promptTitle",
  DROP COLUMN IF EXISTS "category",
  DROP COLUMN IF EXISTS "wrongOptionA",
  DROP COLUMN IF EXISTS "wrongOptionB",
  DROP COLUMN IF EXISTS "wrongOptionC";

DROP TYPE IF EXISTS "SceneCategory";
