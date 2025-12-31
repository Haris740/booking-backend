/*
  Warnings:

  - You are about to drop the column `notes` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledFor` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `appointmentDate` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appointmentType` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientAge` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientGender` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientName` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientPhone` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('TOKEN', 'TIMESLOT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';

-- DropIndex
DROP INDEX "bookings_professionalId_scheduledFor_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "notes",
DROP COLUMN "scheduledFor",
ADD COLUMN     "appointmentDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "appointmentType" "AppointmentType" NOT NULL,
ADD COLUMN     "disease" VARCHAR(255),
ADD COLUMN     "estimatedWaitTime" INTEGER,
ADD COLUMN     "notificationsSent" JSONB,
ADD COLUMN     "patientAge" INTEGER NOT NULL,
ADD COLUMN     "patientGender" "Gender" NOT NULL,
ADD COLUMN     "patientName" VARCHAR(100) NOT NULL,
ADD COLUMN     "patientPhone" VARCHAR(20) NOT NULL,
ADD COLUMN     "symptoms" TEXT,
ADD COLUMN     "timeSlot" VARCHAR(50),
ADD COLUMN     "tokenNumber" INTEGER;

-- AlterTable
ALTER TABLE "professional_profiles" ADD COLUMN     "availableDays" VARCHAR(20)[] DEFAULT ARRAY[]::VARCHAR(20)[],
ADD COLUMN     "breakEndTime" VARCHAR(20),
ADD COLUMN     "breakStartTime" VARCHAR(20),
ADD COLUMN     "endTime" VARCHAR(20),
ADD COLUMN     "startTime" VARCHAR(20),
ADD COLUMN     "tokenLimitPerDay" INTEGER DEFAULT 50;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "profilePicture" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "bookings_professionalId_appointmentDate_status_idx" ON "bookings"("professionalId", "appointmentDate", "status");

-- CreateIndex
CREATE INDEX "bookings_tokenNumber_idx" ON "bookings"("tokenNumber");
