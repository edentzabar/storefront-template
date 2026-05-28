-- AlterTable
ALTER TABLE "category" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "category_parentId_idx" ON "category"("parentId");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
