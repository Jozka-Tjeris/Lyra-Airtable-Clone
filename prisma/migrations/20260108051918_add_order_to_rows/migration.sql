-- DropIndex
DROP INDEX "Row_tableId_idx";

-- AlterTable
ALTER TABLE "Row" ADD COLUMN     "order" SERIAL NOT NULL;

-- CreateIndex
CREATE INDEX "Row_tableId_order_idx" ON "Row"("tableId", "order");
