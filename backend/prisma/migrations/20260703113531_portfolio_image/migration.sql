/*
  Warnings:

  - You are about to drop the column `emoji` on the `PortfolioProject` table. All the data in the column will be lost.
  - You are about to drop the column `gradFrom` on the `PortfolioProject` table. All the data in the column will be lost.
  - You are about to drop the column `gradTo` on the `PortfolioProject` table. All the data in the column will be lost.
  - Added the required column `image` to the `PortfolioProject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PortfolioProject" DROP COLUMN "emoji",
DROP COLUMN "gradFrom",
DROP COLUMN "gradTo",
ADD COLUMN     "image" TEXT NOT NULL;
