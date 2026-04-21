/*
  Warnings:

  - Added the required column `ticket_price` to the `Train` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Train" ADD COLUMN     "ticket_price" DOUBLE PRECISION NOT NULL;
