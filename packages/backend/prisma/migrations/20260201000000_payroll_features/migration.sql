-- AlterTable
ALTER TABLE "users" ADD COLUMN "hourlyRate" DOUBLE PRECISION DEFAULT 0;

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('OPEN', 'LOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('MISSING_OUT', 'MISSING_IN', 'DUPLICATE_IN', 'DUPLICATE_OUT', 'EXCESSIVE_HOURS', 'ZERO_HOURS');

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'OPEN',
    "cutoffDate" TIMESTAMP(3),
    "calculatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_summaries" (
    "id" TEXT NOT NULL,
    "payroll_period_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "totalRegularHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOvertimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shiftCount" INTEGER NOT NULL DEFAULT 0,
    "clockEventsCount" INTEGER NOT NULL DEFAULT 0,
    "hasAnomalies" BOOLEAN NOT NULL DEFAULT false,
    "anomalyCount" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_anomalies" (
    "id" TEXT NOT NULL,
    "payroll_summary_id" TEXT NOT NULL,
    "type" "AnomalyType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "clock_event_id" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtime_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "overtime_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- CreateIndex
CREATE INDEX "payroll_periods_year_month_idx" ON "payroll_periods"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_month_year_key" ON "payroll_periods"("month", "year");

-- CreateIndex
CREATE INDEX "payroll_summaries_user_id_idx" ON "payroll_summaries"("user_id");

-- CreateIndex
CREATE INDEX "payroll_summaries_payroll_period_id_hasAnomalies_idx" ON "payroll_summaries"("payroll_period_id", "hasAnomalies");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_summaries_payroll_period_id_user_id_key" ON "payroll_summaries"("payroll_period_id", "user_id");

-- AddForeignKey
ALTER TABLE "payroll_summaries" ADD CONSTRAINT "payroll_summaries_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_summaries" ADD CONSTRAINT "payroll_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_anomalies" ADD CONSTRAINT "payroll_anomalies_payroll_summary_id_fkey" FOREIGN KEY ("payroll_summary_id") REFERENCES "payroll_summaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
