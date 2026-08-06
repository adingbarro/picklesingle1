-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Customer" ADD COLUMN "phone" TEXT;
