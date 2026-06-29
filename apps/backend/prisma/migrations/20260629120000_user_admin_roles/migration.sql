-- AlterEnum
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

CREATE TYPE "UserRole" AS ENUM ('User', 'Admin');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE "role"::text
    WHEN 'ORGANIZER' THEN 'User'::"UserRole"
    WHEN 'PARTICIPANT' THEN 'User'::"UserRole"
  END
);

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'User';

DROP TYPE "UserRole_old";
