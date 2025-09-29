-- CreateEnum
CREATE TYPE "public"."BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."Blog" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "author" VARCHAR(100) NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "md" TEXT NOT NULL,
    "summary" TEXT,
    "cover_image" VARCHAR(512),
    "reading_time" INTEGER NOT NULL,
    "seo" JSONB,
    "status" "public"."BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_language_key" ON "public"."Blog"("slug", "language");
