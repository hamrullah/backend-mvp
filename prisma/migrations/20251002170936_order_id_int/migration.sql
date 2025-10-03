/*
  Warnings:

  - Added the required column `order_id` to the `ms_voucher_redeem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ms_voucher_redeem" DROP COLUMN "order_id",
ADD COLUMN     "order_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ms_voucher_redeem_order_id_key" ON "public"."ms_voucher_redeem"("order_id");
