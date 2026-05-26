-- CreateTable
CREATE TABLE "abandoned_cart" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "customerName" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "recoveryToken" TEXT NOT NULL,
    "reminderSentAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abandoned_cart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "abandoned_cart_recoveryToken_key" ON "abandoned_cart"("recoveryToken");

-- CreateIndex
CREATE INDEX "abandoned_cart_email_idx" ON "abandoned_cart"("email");

-- CreateIndex
CREATE INDEX "abandoned_cart_reminderSentAt_idx" ON "abandoned_cart"("reminderSentAt");
