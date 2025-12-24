-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProfessionalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConsultationMode" AS ENUM ('ONLINE', 'OFFLINE', 'BOTH');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "passwordHash" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isProfessional" BOOLEAN NOT NULL DEFAULT false,
    "professionalStatus" "ProfessionalStatus" NOT NULL DEFAULT 'NONE',
    "adminNote" TEXT,
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
    "consultationMode" "ConsultationMode" NOT NULL DEFAULT 'ONLINE',
    "baseFee" INTEGER,
    "tags" VARCHAR(50)[],
    "status" "ProfessionalStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_professionalId_scheduledFor_idx" ON "bookings"("professionalId", "scheduledFor");

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "professional_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
