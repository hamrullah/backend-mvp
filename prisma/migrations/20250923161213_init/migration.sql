/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - The `id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `affiliate_commissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `affiliates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payouts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `redemption_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vendor_payables` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vendors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `voucher_instances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vouchers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password_hash` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."affiliate_commissions" DROP CONSTRAINT "affiliate_commissions_affiliate_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."affiliate_commissions" DROP CONSTRAINT "affiliate_commissions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."affiliates" DROP CONSTRAINT "affiliates_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_voucher_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_affiliate_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."redemption_logs" DROP CONSTRAINT "redemption_logs_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."redemption_logs" DROP CONSTRAINT "redemption_logs_voucher_instance_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vendor_payables" DROP CONSTRAINT "vendor_payables_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vendor_payables" DROP CONSTRAINT "vendor_payables_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vendors" DROP CONSTRAINT "vendors_owner_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."voucher_instances" DROP CONSTRAINT "voucher_instances_order_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."voucher_instances" DROP CONSTRAINT "voucher_instances_voucher_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vouchers" DROP CONSTRAINT "vouchers_vendor_id_fkey";

-- AlterTable
ALTER TABLE "public"."users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "phone",
DROP COLUMN "role",
DROP COLUMN "updatedAt",
ADD COLUMN     "role_id" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "password_hash" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."Account";

-- DropTable
DROP TABLE "public"."RefreshToken";

-- DropTable
DROP TABLE "public"."Session";

-- DropTable
DROP TABLE "public"."VerificationToken";

-- DropTable
DROP TABLE "public"."affiliate_commissions";

-- DropTable
DROP TABLE "public"."affiliates";

-- DropTable
DROP TABLE "public"."order_items";

-- DropTable
DROP TABLE "public"."orders";

-- DropTable
DROP TABLE "public"."payouts";

-- DropTable
DROP TABLE "public"."redemption_logs";

-- DropTable
DROP TABLE "public"."settings";

-- DropTable
DROP TABLE "public"."vendor_payables";

-- DropTable
DROP TABLE "public"."vendors";

-- DropTable
DROP TABLE "public"."voucher_instances";

-- DropTable
DROP TABLE "public"."vouchers";

-- DropEnum
DROP TYPE "public"."CommissionStatus";

-- DropEnum
DROP TYPE "public"."KycStatus";

-- DropEnum
DROP TYPE "public"."PayableStatus";

-- DropEnum
DROP TYPE "public"."PayeeType";

-- DropEnum
DROP TYPE "public"."PaymentStatus";

-- DropEnum
DROP TYPE "public"."PayoutStatus";

-- DropEnum
DROP TYPE "public"."RedemptionResult";

-- DropEnum
DROP TYPE "public"."UserStatus";

-- DropEnum
DROP TYPE "public"."VoucherInstanceStatus";

-- DropEnum
DROP TYPE "public"."VoucherStatus";

-- CreateTable
CREATE TABLE "public"."ms_role" (
    "id" SERIAL NOT NULL,
    "code_role" TEXT NOT NULL,
    "name_role" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "ms_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ms_admin" (
    "id" SERIAL NOT NULL,
    "code_admin" TEXT NOT NULL,
    "name_admin" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "image" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "user_id" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "ms_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ms_member" (
    "id" SERIAL NOT NULL,
    "code_member" TEXT NOT NULL,
    "name_member" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "image" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "user_id" INTEGER,
    "status" INTEGER NOT NULL DEFAULT 1,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "affiliate_id" INTEGER,

    CONSTRAINT "ms_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ms_affiliate" (
    "id" SERIAL NOT NULL,
    "code_affiliate" TEXT NOT NULL,
    "name_affiliate" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "image" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "user_id" INTEGER,
    "status" INTEGER NOT NULL DEFAULT 1,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "referral_code" TEXT NOT NULL,

    CONSTRAINT "ms_affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ms_vendor" (
    "id" SERIAL NOT NULL,
    "code_vendor" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "image" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "user_id" INTEGER,
    "status" INTEGER NOT NULL DEFAULT 1,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "ms_vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_vouchers" (
    "id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "category_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ms_vouchers" (
    "id" SERIAL NOT NULL,
    "code_voucher" TEXT NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "category_voucher_id" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2) NOT NULL,
    "weight" DECIMAL(10,2),
    "dimension" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "voucher_start" TIMESTAMP(3),
    "voucher_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "ms_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ms_vouchers_image" (
    "id" SERIAL NOT NULL,
    "voucher_id" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "ms_vouchers_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trx_orders" (
    "id" SERIAL NOT NULL,
    "code_trx" TEXT NOT NULL,
    "member_id" INTEGER NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "payment_methode" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "date_order" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "trx_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trx_orders_detail" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "voucher_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "sub_total" DECIMAL(14,2) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "trx_orders_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."affiliate_commision" (
    "id" SERIAL NOT NULL,
    "affilate_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "commision" DECIMAL(12,2) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "flag" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "affiliate_commision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ms_role_code_role_key" ON "public"."ms_role"("code_role");

-- CreateIndex
CREATE UNIQUE INDEX "ms_admin_code_admin_key" ON "public"."ms_admin"("code_admin");

-- CreateIndex
CREATE UNIQUE INDEX "ms_admin_email_key" ON "public"."ms_admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ms_admin_user_id_key" ON "public"."ms_admin"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ms_member_code_member_key" ON "public"."ms_member"("code_member");

-- CreateIndex
CREATE UNIQUE INDEX "ms_member_email_key" ON "public"."ms_member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ms_member_user_id_key" ON "public"."ms_member"("user_id");

-- CreateIndex
CREATE INDEX "ms_member_affiliate_id_idx" ON "public"."ms_member"("affiliate_id");

-- CreateIndex
CREATE UNIQUE INDEX "ms_affiliate_code_affiliate_key" ON "public"."ms_affiliate"("code_affiliate");

-- CreateIndex
CREATE UNIQUE INDEX "ms_affiliate_email_key" ON "public"."ms_affiliate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ms_affiliate_user_id_key" ON "public"."ms_affiliate"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ms_affiliate_referral_code_key" ON "public"."ms_affiliate"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "ms_vendor_code_vendor_key" ON "public"."ms_vendor"("code_vendor");

-- CreateIndex
CREATE UNIQUE INDEX "ms_vendor_email_key" ON "public"."ms_vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ms_vendor_user_id_key" ON "public"."ms_vendor"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ms_vouchers_code_voucher_key" ON "public"."ms_vouchers"("code_voucher");

-- CreateIndex
CREATE INDEX "ms_vouchers_vendor_id_idx" ON "public"."ms_vouchers"("vendor_id");

-- CreateIndex
CREATE INDEX "ms_vouchers_category_voucher_id_idx" ON "public"."ms_vouchers"("category_voucher_id");

-- CreateIndex
CREATE INDEX "ms_vouchers_image_voucher_id_idx" ON "public"."ms_vouchers_image"("voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "trx_orders_code_trx_key" ON "public"."trx_orders"("code_trx");

-- CreateIndex
CREATE INDEX "trx_orders_member_id_idx" ON "public"."trx_orders"("member_id");

-- CreateIndex
CREATE INDEX "trx_orders_detail_order_id_idx" ON "public"."trx_orders_detail"("order_id");

-- CreateIndex
CREATE INDEX "trx_orders_detail_voucher_id_idx" ON "public"."trx_orders_detail"("voucher_id");

-- CreateIndex
CREATE INDEX "affiliate_commision_affilate_id_idx" ON "public"."affiliate_commision"("affilate_id");

-- CreateIndex
CREATE INDEX "affiliate_commision_member_id_idx" ON "public"."affiliate_commision"("member_id");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "public"."users"("role_id");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."ms_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_admin" ADD CONSTRAINT "ms_admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_member" ADD CONSTRAINT "ms_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_member" ADD CONSTRAINT "ms_member_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."ms_affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_affiliate" ADD CONSTRAINT "ms_affiliate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_vendor" ADD CONSTRAINT "ms_vendor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_vouchers" ADD CONSTRAINT "ms_vouchers_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."ms_vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_vouchers" ADD CONSTRAINT "ms_vouchers_category_voucher_id_fkey" FOREIGN KEY ("category_voucher_id") REFERENCES "public"."category_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_vouchers_image" ADD CONSTRAINT "ms_vouchers_image_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "public"."ms_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trx_orders" ADD CONSTRAINT "trx_orders_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."ms_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trx_orders_detail" ADD CONSTRAINT "trx_orders_detail_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."trx_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trx_orders_detail" ADD CONSTRAINT "trx_orders_detail_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "public"."ms_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."affiliate_commision" ADD CONSTRAINT "affiliate_commision_affilate_id_fkey" FOREIGN KEY ("affilate_id") REFERENCES "public"."ms_affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."affiliate_commision" ADD CONSTRAINT "affiliate_commision_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."ms_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
