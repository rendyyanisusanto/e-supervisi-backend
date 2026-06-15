/*
  Warnings:

  - You are about to drop the column `instrument_id` on the `supervisions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `supervisions` DROP FOREIGN KEY `supervisions_instrument_id_fkey`;

-- AlterTable
ALTER TABLE `school_profiles` ADD COLUMN `app_name` VARCHAR(150) NULL DEFAULT 'E-Supervisi SMK',
    ADD COLUMN `app_tagline` VARCHAR(255) NULL DEFAULT 'Aplikasi Supervisi Guru Berbasis Data',
    ADD COLUMN `primary_color` VARCHAR(30) NULL DEFAULT '#0984e3';

-- AlterTable
ALTER TABLE `supervisions` DROP COLUMN `instrument_id`;

-- AlterTable
ALTER TABLE `wa_logs` ADD COLUMN `error_message` TEXT NULL,
    ADD COLUMN `recipient_name` VARCHAR(150) NULL,
    ADD COLUMN `template_code` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `action` VARCHAR(100) NOT NULL,
    `module` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `ip_address` VARCHAR(100) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_module_idx`(`module`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_SupervisionToInstrument` (
    `A` BIGINT NOT NULL,
    `B` BIGINT NOT NULL,

    UNIQUE INDEX `_SupervisionToInstrument_AB_unique`(`A`, `B`),
    INDEX `_SupervisionToInstrument_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `wa_logs_template_code_idx` ON `wa_logs`(`template_code`);

-- CreateIndex
CREATE INDEX `wa_logs_created_at_idx` ON `wa_logs`(`created_at`);

-- AddForeignKey
ALTER TABLE `_SupervisionToInstrument` ADD CONSTRAINT `_SupervisionToInstrument_A_fkey` FOREIGN KEY (`A`) REFERENCES `instruments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SupervisionToInstrument` ADD CONSTRAINT `_SupervisionToInstrument_B_fkey` FOREIGN KEY (`B`) REFERENCES `supervisions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `wa_logs` RENAME INDEX `wa_logs_supervision_id_fkey` TO `wa_logs_supervision_id_idx`;

-- RenameIndex
ALTER TABLE `wa_logs` RENAME INDEX `wa_logs_teacher_id_fkey` TO `wa_logs_teacher_id_idx`;
