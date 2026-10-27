-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "compare_price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "instructor" TEXT NOT NULL DEFAULT '';
