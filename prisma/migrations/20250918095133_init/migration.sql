/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."VoucherStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."VoucherInstanceStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED', 'REFUNDED', 'INVALID');

-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'PAID', 'REVERSED');

-- CreateEnum
CREATE TYPE "public"."PayableStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'PAID', 'REVERSED');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('INITIATED', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."PayeeType" AS ENUM ('VENDOR', 'AFFILIATE');

-- CreateEnum
CREATE TYPE "public"."RedemptionResult" AS ENUM ('SUCCESS', 'FAIL');

-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "phone" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendors" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "kyc_status" "public"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "bank_account" JSONB,
    "settlement_terms" TEXT,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."affiliates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "bank_account" JSONB,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vouchers" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "total_inventory" INTEGER NOT NULL,
    "status" "public"."VoucherStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway" TEXT,
    "txn_id" TEXT,
    "affiliate_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."voucher_instances" (
    "id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "qr_url" TEXT,
    "status" "public"."VoucherInstanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "redeemed_at" TIMESTAMP(3),

    CONSTRAINT "voucher_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."affiliate_commissions" (
    "id" TEXT NOT NULL,
    "affiliate_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."CommissionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendor_payables" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."PayableStatus" NOT NULL DEFAULT 'PENDING',
    "eligible_on" TIMESTAMP(3),

    CONSTRAINT "vendor_payables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payouts" (
    "id" TEXT NOT NULL,
    "payee_type" "public"."PayeeType" NOT NULL,
    "payee_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'INITIATED',
    "external_ref" TEXT,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."redemption_logs" (
    "id" TEXT NOT NULL,
    "voucher_instance_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "result" "public"."RedemptionResult" NOT NULL,
    "meta_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemption_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_owner_user_id_key" ON "public"."vendors"("owner_user_id");

-- CreateIndex
CREATE INDEX "vendors_owner_user_id_idx" ON "public"."vendors"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_user_id_key" ON "public"."affiliates"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_code_key" ON "public"."affiliates"("code");

-- CreateIndex
CREATE INDEX "affiliates_user_id_idx" ON "public"."affiliates"("user_id");

-- CreateIndex
CREATE INDEX "vouchers_vendor_id_idx" ON "public"."vouchers"("vendor_id");

-- CreateIndex
CREATE INDEX "vouchers_start_at_end_at_idx" ON "public"."vouchers"("start_at", "end_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_txn_id_key" ON "public"."orders"("txn_id");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "public"."orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_affiliate_id_idx" ON "public"."orders"("affiliate_id");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "public"."orders"("created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "public"."order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_voucher_id_idx" ON "public"."order_items"("voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_instances_code_key" ON "public"."voucher_instances"("code");

-- CreateIndex
CREATE INDEX "voucher_instances_voucher_id_idx" ON "public"."voucher_instances"("voucher_id");

-- CreateIndex
CREATE INDEX "voucher_instances_order_item_id_idx" ON "public"."voucher_instances"("order_item_id");

-- CreateIndex
CREATE INDEX "voucher_instances_expires_at_idx" ON "public"."voucher_instances"("expires_at");

-- CreateIndex
CREATE INDEX "voucher_instances_code_idx" ON "public"."voucher_instances"("code");

-- CreateIndex
CREATE INDEX "affiliate_commissions_affiliate_id_idx" ON "public"."affiliate_commissions"("affiliate_id");

-- CreateIndex
CREATE INDEX "affiliate_commissions_order_id_idx" ON "public"."affiliate_commissions"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_commissions_affiliate_id_order_id_key" ON "public"."affiliate_commissions"("affiliate_id", "order_id");

-- CreateIndex
CREATE INDEX "vendor_payables_vendor_id_idx" ON "public"."vendor_payables"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_payables_order_id_idx" ON "public"."vendor_payables"("order_id");

-- CreateIndex
CREATE INDEX "vendor_payables_eligible_on_idx" ON "public"."vendor_payables"("eligible_on");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_payables_vendor_id_order_id_key" ON "public"."vendor_payables"("vendor_id", "order_id");

-- CreateIndex
CREATE INDEX "payouts_payee_id_idx" ON "public"."payouts"("payee_id");

-- CreateIndex
CREATE INDEX "redemption_logs_voucher_instance_id_idx" ON "public"."redemption_logs"("voucher_instance_id");

-- CreateIndex
CREATE INDEX "redemption_logs_vendor_id_created_at_idx" ON "public"."redemption_logs"("vendor_id", "created_at");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."affiliates" ADD CONSTRAINT "affiliates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vouchers" ADD CONSTRAINT "vouchers_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."voucher_instances" ADD CONSTRAINT "voucher_instances_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."voucher_instances" ADD CONSTRAINT "voucher_instances_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor_payables" ADD CONSTRAINT "vendor_payables_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor_payables" ADD CONSTRAINT "vendor_payables_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."redemption_logs" ADD CONSTRAINT "redemption_logs_voucher_instance_id_fkey" FOREIGN KEY ("voucher_instance_id") REFERENCES "public"."voucher_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."redemption_logs" ADD CONSTRAINT "redemption_logs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
