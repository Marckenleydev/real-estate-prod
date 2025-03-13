-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Highlight" ADD VALUE 'OceanView';
ALTER TYPE "Highlight" ADD VALUE 'GymAccess';
ALTER TYPE "Highlight" ADD VALUE 'CityView';
ALTER TYPE "Highlight" ADD VALUE 'SmartHomeFeatures';
ALTER TYPE "Highlight" ADD VALUE 'Beachfront';
ALTER TYPE "Highlight" ADD VALUE 'PrivatePool';
ALTER TYPE "Highlight" ADD VALUE 'BeachAccess';
ALTER TYPE "Highlight" ADD VALUE 'SwimmingPool';
ALTER TYPE "Highlight" ADD VALUE 'KidFriendly';
ALTER TYPE "Highlight" ADD VALUE 'FitnessCenter';
