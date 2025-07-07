-- CreateEnum
CREATE TYPE "RescheduleStatus" AS ENUM ('NONE', 'REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "proposedEndTime" TIMESTAMP(3),
ADD COLUMN     "proposedStartTime" TIMESTAMP(3),
ADD COLUMN     "rescheduleRequestedBy" TEXT,
ADD COLUMN     "rescheduleStatus" "RescheduleStatus" DEFAULT 'NONE';
