-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProfessionalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConsultationMode" AS ENUM ('ONLINE', 'OFFLINE', 'BOTH');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('TOKEN', 'TIMESLOT', 'BOTH');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "profilePicture" TEXT,
    "phone" VARCHAR(20) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isProfessional" BOOLEAN NOT NULL DEFAULT false,
    "professionalStatus" "ProfessionalStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "professionType" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "about" TEXT,
    "yearsExperience" INTEGER,
    "city" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "consultationMode" "ConsultationMode" NOT NULL DEFAULT 'OFFLINE',
    "baseFee" INTEGER,
    "tags" VARCHAR(50)[],
    "proof" VARCHAR(50),
    "status" "ProfessionalStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "bookingType" "AppointmentType" NOT NULL DEFAULT 'BOTH',
    "tokenLimitPerDay" INTEGER DEFAULT 50,
    "availableDays" VARCHAR(20)[] DEFAULT ARRAY[]::VARCHAR(20)[],
    "startTime" VARCHAR(20),
    "endTime" VARCHAR(20),
    "breakStartTime" VARCHAR(20),
    "breakEndTime" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "appointmentType" "AppointmentType" NOT NULL,
    "tokenNumber" INTEGER,
    "timeSlot" VARCHAR(50),
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedWaitTime" INTEGER,
    "notificationsSent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_professionalStatus_idx" ON "users"("professionalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "professional_categories_slug_key" ON "professional_categories"("slug");

-- CreateIndex
CREATE INDEX "professional_categories_professionType_idx" ON "professional_categories"("professionType");

-- CreateIndex
CREATE INDEX "professional_categories_slug_idx" ON "professional_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_userId_key" ON "professional_profiles"("userId");

-- CreateIndex
CREATE INDEX "professional_profiles_status_idx" ON "professional_profiles"("status");

-- CreateIndex
CREATE INDEX "professional_profiles_city_status_idx" ON "professional_profiles"("city", "status");

-- CreateIndex
CREATE INDEX "professional_profiles_categoryId_status_idx" ON "professional_profiles"("categoryId", "status");

-- CreateIndex
CREATE INDEX "bookings_professionalId_appointmentDate_status_idx" ON "bookings"("professionalId", "appointmentDate", "status");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_tokenNumber_idx" ON "bookings"("tokenNumber");

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "professional_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
