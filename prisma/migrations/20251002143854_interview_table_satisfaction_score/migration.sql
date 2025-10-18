-- AlterTable
ALTER TABLE `InterviewSession` ADD COLUMN `answeredQuestions` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `satisfactionScore` DOUBLE NULL,
    ADD COLUMN `totalQuestions` INTEGER NOT NULL DEFAULT 0;
