-- CreateTable
CREATE TABLE `periods` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teachers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `photo` VARCHAR(255) NULL,
    `name` VARCHAR(150) NOT NULL,
    `nip` VARCHAR(50) NULL,
    `nuptk` VARCHAR(50) NULL,
    `nik` VARCHAR(50) NULL,
    `gender` ENUM('L', 'P') NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(30) NULL,
    `main_subject_id` BIGINT NULL,
    `position` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `teacher_id` BIGINT NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_teacher_id_key`(`teacher_id`),
    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_roles_user_id_role_id_key`(`user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `token` TEXT NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `group_name` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subjects_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classrooms` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `grade` VARCHAR(20) NULL,
    `major` VARCHAR(100) NULL,
    `homeroom_teacher_id` BIGINT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instruments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `type` ENUM('ADMINISTRASI', 'PERENCANAAN', 'PELAKSANAAN', 'ATP', 'ASESMEN', 'REFLEKSI', 'LAINNYA') NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `instruments_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instrument_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `instrument_id` BIGINT NOT NULL,
    `category` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `max_score` INTEGER NOT NULL DEFAULT 4,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `instrument_items_instrument_id_code_key`(`instrument_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `score_ranges` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `min_score` DECIMAL(5, 2) NOT NULL,
    `max_score` DECIMAL(5, 2) NOT NULL,
    `status` VARCHAR(100) NOT NULL,
    `color` VARCHAR(30) NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supervisions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `period_id` BIGINT NOT NULL,
    `teacher_id` BIGINT NOT NULL,
    `supervisor_id` BIGINT NOT NULL,
    `instrument_id` BIGINT NOT NULL,
    `subject_id` BIGINT NULL,
    `classroom_id` BIGINT NULL,
    `supervision_type` ENUM('LANGSUNG', 'TERJADWAL') NOT NULL DEFAULT 'LANGSUNG',
    `status` ENUM('TERJADWAL', 'DRAFT', 'SELESAI', 'DIBATALKAN') NOT NULL DEFAULT 'DRAFT',
    `scheduled_date` DATE NULL,
    `scheduled_time` TIME NULL,
    `supervision_date` DATE NULL,
    `location` VARCHAR(150) NULL,
    `initial_note` TEXT NULL,
    `total_score` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `max_score` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `final_score` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `final_status` VARCHAR(100) NULL,
    `strength_note` TEXT NULL,
    `improvement_note` TEXT NULL,
    `general_note` TEXT NULL,
    `recommendation_note` TEXT NULL,
    `conclusion_note` TEXT NULL,
    `submitted_at` DATETIME(3) NULL,
    `created_by` BIGINT NULL,
    `submitted_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `supervisions_period_id_idx`(`period_id`),
    INDEX `supervisions_teacher_id_idx`(`teacher_id`),
    INDEX `supervisions_supervisor_id_idx`(`supervisor_id`),
    INDEX `supervisions_instrument_id_idx`(`instrument_id`),
    INDEX `supervisions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supervision_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `supervision_id` BIGINT NOT NULL,
    `instrument_item_id` BIGINT NOT NULL,
    `item_category` VARCHAR(150) NOT NULL,
    `item_code` VARCHAR(50) NOT NULL,
    `item_description` TEXT NOT NULL,
    `max_score` INTEGER NOT NULL,
    `score` INTEGER NULL,
    `item_status` VARCHAR(100) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `supervision_items_supervision_id_idx`(`supervision_id`),
    UNIQUE INDEX `supervision_items_supervision_id_instrument_item_id_key`(`supervision_id`, `instrument_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_reflections` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `supervision_id` BIGINT NOT NULL,
    `teacher_id` BIGINT NOT NULL,
    `strength_reflection` TEXT NULL,
    `obstacle_reflection` TEXT NULL,
    `improvement_plan` TEXT NULL,
    `support_needed` TEXT NULL,
    `target_date` DATE NULL,
    `status` ENUM('BELUM_DIISI', 'SUDAH_DIISI', 'SUDAH_DIBACA') NOT NULL DEFAULT 'BELUM_DIISI',
    `submitted_at` DATETIME(3) NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teacher_reflections_supervision_id_key`(`supervision_id`),
    INDEX `teacher_reflections_teacher_id_idx`(`teacher_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wa_templates` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `category` ENUM('SUPERVISI', 'HASIL', 'REFLEKSI', 'PENGINGAT') NOT NULL DEFAULT 'SUPERVISI',
    `content` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wa_templates_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wa_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `template_id` BIGINT NULL,
    `supervision_id` BIGINT NULL,
    `teacher_id` BIGINT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `response` TEXT NULL,
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `wa_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_profiles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `npsn` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `province` VARCHAR(100) NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(100) NULL,
    `website` VARCHAR(150) NULL,
    `logo` VARCHAR(255) NULL,
    `principal_name` VARCHAR(150) NULL,
    `principal_nip` VARCHAR(50) NULL,
    `curriculum_name` VARCHAR(150) NULL,
    `curriculum_nip` VARCHAR(50) NULL,
    `report_footer` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_settings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `letterhead_image` VARCHAR(255) NULL,
    `show_logo` BOOLEAN NOT NULL DEFAULT true,
    `show_school_address` BOOLEAN NOT NULL DEFAULT true,
    `show_principal_signature` BOOLEAN NOT NULL DEFAULT true,
    `show_supervisor_signature` BOOLEAN NOT NULL DEFAULT true,
    `show_curriculum_signature` BOOLEAN NOT NULL DEFAULT false,
    `use_qr_validation` BOOLEAN NOT NULL DEFAULT false,
    `document_number_format` VARCHAR(150) NULL,
    `paper_size` ENUM('A4', 'F4') NOT NULL DEFAULT 'A4',
    `orientation` ENUM('PORTRAIT', 'LANDSCAPE') NOT NULL DEFAULT 'PORTRAIT',
    `header_style` ENUM('SIMPLE', 'FORMAL', 'MODERN') NOT NULL DEFAULT 'FORMAL',
    `watermark_text` VARCHAR(150) NULL,
    `footer_text` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_preferences` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `auto_use_active_period` BOOLEAN NOT NULL DEFAULT true,
    `auto_save_assessment` BOOLEAN NOT NULL DEFAULT true,
    `require_note_for_low_score` BOOLEAN NOT NULL DEFAULT true,
    `low_score_threshold` INTEGER NOT NULL DEFAULT 2,
    `default_score_max` INTEGER NOT NULL DEFAULT 4,
    `enable_wa_notification` BOOLEAN NOT NULL DEFAULT true,
    `enable_reflection_reminder` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_main_subject_id_fkey` FOREIGN KEY (`main_subject_id`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classrooms` ADD CONSTRAINT `classrooms_homeroom_teacher_id_fkey` FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instrument_items` ADD CONSTRAINT `instrument_items_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisions` ADD CONSTRAINT `supervisions_period_id_fkey` FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisions` ADD CONSTRAINT `supervisions_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisions` ADD CONSTRAINT `supervisions_supervisor_id_fkey` FOREIGN KEY (`supervisor_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisions` ADD CONSTRAINT `supervisions_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisions` ADD CONSTRAINT `supervisions_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisions` ADD CONSTRAINT `supervisions_classroom_id_fkey` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisions` ADD CONSTRAINT `supervisions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisions` ADD CONSTRAINT `supervisions_submitted_by_fkey` FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervision_items` ADD CONSTRAINT `supervision_items_supervision_id_fkey` FOREIGN KEY (`supervision_id`) REFERENCES `supervisions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervision_items` ADD CONSTRAINT `supervision_items_instrument_item_id_fkey` FOREIGN KEY (`instrument_item_id`) REFERENCES `instrument_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_reflections` ADD CONSTRAINT `teacher_reflections_supervision_id_fkey` FOREIGN KEY (`supervision_id`) REFERENCES `supervisions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_reflections` ADD CONSTRAINT `teacher_reflections_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wa_logs` ADD CONSTRAINT `wa_logs_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `wa_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wa_logs` ADD CONSTRAINT `wa_logs_supervision_id_fkey` FOREIGN KEY (`supervision_id`) REFERENCES `supervisions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wa_logs` ADD CONSTRAINT `wa_logs_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
