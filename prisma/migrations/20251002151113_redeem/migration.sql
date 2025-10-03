-- CreateTable
CREATE TABLE "public"."ms_voucher_redeem" (
    "id" SERIAL NOT NULL,
    "voucher_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "redeem_code" TEXT,
    "source" TEXT,
    "device_info" TEXT,
    "ip_address" TEXT,
    "order_id" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ms_voucher_redeem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ms_voucher_redeem_user_id_idx" ON "public"."ms_voucher_redeem"("user_id");

-- CreateIndex
CREATE INDEX "ms_voucher_redeem_vendor_id_idx" ON "public"."ms_voucher_redeem"("vendor_id");

-- CreateIndex
CREATE INDEX "ms_voucher_redeem_redeemed_at_idx" ON "public"."ms_voucher_redeem"("redeemed_at");

-- CreateIndex
CREATE UNIQUE INDEX "ms_voucher_redeem_voucher_id_user_id_key" ON "public"."ms_voucher_redeem"("voucher_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ms_voucher_redeem_order_id_key" ON "public"."ms_voucher_redeem"("order_id");

-- AddForeignKey
ALTER TABLE "public"."ms_voucher_redeem" ADD CONSTRAINT "ms_voucher_redeem_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "public"."ms_vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_voucher_redeem" ADD CONSTRAINT "ms_voucher_redeem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ms_voucher_redeem" ADD CONSTRAINT "ms_voucher_redeem_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."ms_vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
