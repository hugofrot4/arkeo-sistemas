-- CreateTable
CREATE TABLE "Differential" (
    "id" SERIAL NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Differential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Differential_order_idx" ON "Differential"("order");
