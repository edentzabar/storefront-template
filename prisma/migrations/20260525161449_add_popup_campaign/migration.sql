-- CreateEnum
CREATE TYPE "PopupTrigger" AS ENUM ('delay', 'exit_intent', 'scroll');

-- CreateEnum
CREATE TYPE "PopupFrequency" AS ENUM ('session', 'days', 'once');

-- CreateEnum
CREATE TYPE "PopupAudience" AS ENUM ('all', 'guest', 'registered');

-- CreateEnum
CREATE TYPE "PopupPage" AS ENUM ('all', 'home', 'product', 'category');

-- CreateTable
CREATE TABLE "popup_campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "couponCode" TEXT,
    "triggerType" "PopupTrigger" NOT NULL DEFAULT 'delay',
    "triggerValue" INTEGER NOT NULL DEFAULT 5,
    "frequencyType" "PopupFrequency" NOT NULL DEFAULT 'session',
    "frequencyDays" INTEGER NOT NULL DEFAULT 7,
    "audience" "PopupAudience" NOT NULL DEFAULT 'all',
    "pageTarget" "PopupPage" NOT NULL DEFAULT 'all',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "closes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popup_campaign_pkey" PRIMARY KEY ("id")
);
