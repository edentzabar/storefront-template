-- CreateTable
CREATE TABLE "restock_notification" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "restock_notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restock_notification_productId_notifiedAt_idx" ON "restock_notification"("productId", "notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "restock_notification_productId_email_key" ON "restock_notification"("productId", "email");
