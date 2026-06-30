-- AlterTable
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "code" TEXT;

DROP INDEX IF EXISTS "Room_code_key";

-- Reset partial backfill from a failed migration attempt
UPDATE "Room" SET "code" = NULL;

-- Backfill existing rows with unique random codes
DO $$
DECLARE
  room_row RECORD;
  new_code TEXT;
  done BOOLEAN;
BEGIN
  FOR room_row IN SELECT "id" FROM "Room" WHERE "code" IS NULL LOOP
    done := FALSE;

    WHILE NOT done LOOP
      new_code := (
        SELECT string_agg(ch, '')
        FROM (
          SELECT substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1) AS ch
          FROM generate_series(1, 6)
        ) AS s
      );

      BEGIN
        UPDATE "Room" SET "code" = new_code WHERE "id" = room_row."id";
        done := TRUE;
      EXCEPTION
        WHEN unique_violation THEN
          NULL;
      END;
    END LOOP;
  END LOOP;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "code" SET NOT NULL;
