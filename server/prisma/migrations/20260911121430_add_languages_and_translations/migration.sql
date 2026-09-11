-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "translations" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "translations" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "translations" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");
