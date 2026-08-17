-- AlterEnum
-- Postgres won't let a newly added enum value be *used* by a later statement in
-- the same transaction, so adding the values is a migration of its own; the
-- column default that uses 'PENDING' lands in the next migration.
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING';
ALTER TYPE "BookingStatus" ADD VALUE 'DECLINED';
