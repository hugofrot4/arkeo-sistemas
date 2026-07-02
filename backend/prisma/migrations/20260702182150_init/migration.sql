-- CreateTable
CREATE TABLE "Hero" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "badge" TEXT NOT NULL,
    "h1Line1" TEXT NOT NULL,
    "h1Accent" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "ctaPrimary" TEXT NOT NULL,
    "ctaSecondary" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);
