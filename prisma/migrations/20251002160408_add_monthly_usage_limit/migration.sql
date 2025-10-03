-- AlterTable
ALTER TABLE "public"."ms_vouchers" ALTER COLUMN "monthly_usage_limit" DROP NOT NULL,
ALTER COLUMN "monthly_usage_limit" SET DEFAULT 3;
