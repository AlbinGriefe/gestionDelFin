-- CreateTable
CREATE TABLE `achievement_users` (
    `id_achievement_user` INTEGER NOT NULL AUTO_INCREMENT,
    `id_achievement` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `acu_awarded_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `acu_notes` VARCHAR(255) NULL,

    INDEX `idx_achievement_users_user`(`id_user`),
    UNIQUE INDEX `uk_achievement_user`(`id_achievement`, `id_user`),
    PRIMARY KEY (`id_achievement_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievements` (
    `id_achievement` INTEGER NOT NULL AUTO_INCREMENT,
    `avs_name` VARCHAR(100) NOT NULL,
    `avs_description` VARCHAR(255) NOT NULL,
    `avs_icon_url` VARCHAR(512) NULL,
    `avs_criteria` JSON NOT NULL,
    `avs_is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `uk_achievements_name`(`avs_name`),
    PRIMARY KEY (`id_achievement`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_evaluations` (
    `id_ai_evaluation` INTEGER NOT NULL AUTO_INCREMENT,
    `id_person` INTEGER NOT NULL,
    `id_user_reviewer` INTEGER NULL,
    `aie_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `aie_evaluation_criteria` JSON NOT NULL,
    `aie_score` DECIMAL(5, 2) NULL,
    `aie_decision` ENUM('accept', 'decline', 'observe') NOT NULL,
    `aie_user_decision` ENUM('accept', 'decline', 'observe') NULL,
    `aie_user_observation` VARCHAR(255) NULL,
    `aie_model_name` VARCHAR(100) NULL,
    `aie_is_final` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_ai_evaluations_person`(`id_person`),
    INDEX `idx_ai_evaluations_user`(`id_user_reviewer`),
    PRIMARY KEY (`id_ai_evaluation`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_admission_person` (
    `id_application_admission_person` INTEGER NOT NULL AUTO_INCREMENT,
    `id_transfer` INTEGER NOT NULL,
    `id_person` INTEGER NOT NULL,
    `aap_assigned_rations` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `aap_departure_confirmed` BOOLEAN NOT NULL DEFAULT false,
    `aap_arrival_confirmed` BOOLEAN NOT NULL DEFAULT false,
    `aap_returned_to_origin` BOOLEAN NOT NULL DEFAULT false,
    `aap_notes` VARCHAR(255) NULL,

    INDEX `idx_aap_person`(`id_person`),
    UNIQUE INDEX `uk_aap_transfer_person`(`id_transfer`, `id_person`),
    PRIMARY KEY (`id_application_admission_person`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_admission_resources` (
    `id_application_admission_resource` INTEGER NOT NULL AUTO_INCREMENT,
    `id_transfer` INTEGER NOT NULL,
    `id_resource` INTEGER NOT NULL,
    `aar_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `aar_confirmed_leaving` BOOLEAN NOT NULL DEFAULT false,
    `aar_confirmed_arriving` BOOLEAN NOT NULL DEFAULT false,
    `aar_notes` VARCHAR(255) NULL,

    INDEX `idx_aar_resource`(`id_resource`),
    INDEX `idx_aar_transfer`(`id_transfer`),
    PRIMARY KEY (`id_application_admission_resource`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `camps` (
    `id_camp` INTEGER NOT NULL AUTO_INCREMENT,
    `cmp_name` VARCHAR(150) NOT NULL,
    `cmp_location` VARCHAR(255) NOT NULL,
    `cmp_latitude` DECIMAL(10, 7) NULL,
    `cmp_longitude` DECIMAL(10, 7) NULL,
    `cmp_max_capacity` INTEGER NOT NULL DEFAULT 0,
    `cmp_status` ENUM('active', 'destroyed', 'abandoned', 'inactive') NOT NULL DEFAULT 'active',
    `cmp_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `cmp_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_camps_name`(`cmp_name`),
    PRIMARY KEY (`id_camp`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id_event` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NULL,
    `id_camp` INTEGER NULL,
    `evt_entity` VARCHAR(100) NOT NULL,
    `evt_entity_id` INTEGER NULL,
    `evt_action` VARCHAR(100) NOT NULL,
    `evt_old_value` JSON NULL,
    `evt_new_value` JSON NULL,
    `evt_description` VARCHAR(255) NULL,
    `evt_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_events_camp`(`id_camp`),
    INDEX `idx_events_user`(`id_user`),
    PRIMARY KEY (`id_event`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expedition_records` (
    `id_expedition_record` INTEGER NOT NULL AUTO_INCREMENT,
    `id_expedition` INTEGER NOT NULL,
    `id_person` INTEGER NOT NULL,
    `id_resource` INTEGER NULL,
    `exr_role_in_expedition` VARCHAR(100) NULL,
    `exr_rations_assigned` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `exr_resources_found` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `exr_departure_confirmed` BOOLEAN NOT NULL DEFAULT false,
    `exr_return_confirmed` BOOLEAN NOT NULL DEFAULT false,
    `exr_notes` VARCHAR(255) NULL,

    INDEX `idx_exr_expedition`(`id_expedition`),
    INDEX `idx_exr_person`(`id_person`),
    INDEX `idx_exr_resource`(`id_resource`),
    PRIMARY KEY (`id_expedition_record`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expeditions` (
    `id_expedition` INTEGER NOT NULL AUTO_INCREMENT,
    `id_camp` INTEGER NOT NULL,
    `id_created_by_user` INTEGER NOT NULL,
    `exs_name` VARCHAR(100) NOT NULL,
    `exs_leaving_date` DATETIME(0) NOT NULL,
    `exs_estimated_days` INTEGER NOT NULL DEFAULT 1,
    `exs_extra_days` INTEGER NOT NULL DEFAULT 0,
    `exs_arriving_date` DATETIME(0) NULL,
    `exe_state` ENUM('planned', 'in_progress', 'returned', 'failed', 'cancelled') NOT NULL DEFAULT 'planned',
    `exe_resources_used` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `exe_resources_returned` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `exe_notes` VARCHAR(255) NULL,
    `exe_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `id_exploration_zone` INTEGER NULL,

    INDEX `idx_expeditions_camp`(`id_camp`),
    INDEX `idx_expeditions_created_by`(`id_created_by_user`),
    INDEX `idx_expeditions_zone`(`id_exploration_zone`),
    PRIMARY KEY (`id_expedition`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `person_health` (
    `id_person_health` INTEGER NOT NULL AUTO_INCREMENT,
    `phs_name` VARCHAR(100) NOT NULL,
    `phs_description` VARCHAR(255) NULL,
    `phs_can_work` BOOLEAN NOT NULL DEFAULT true,
    `phs_is_terminal` BOOLEAN NOT NULL DEFAULT false,
    `phs_is_active_status` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `uk_person_health_name`(`phs_name`),
    PRIMARY KEY (`id_person_health`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `person_health_records` (
    `id_person_health_record` INTEGER NOT NULL AUTO_INCREMENT,
    `id_person` INTEGER NOT NULL,
    `id_person_health` INTEGER NOT NULL,
    `phr_start_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `phr_end_date` DATETIME(0) NULL,
    `phr_is_current` BOOLEAN NOT NULL DEFAULT true,
    `phr_notes` VARCHAR(255) NULL,
    `phr_recorded_by_user_id` INTEGER NULL,

    INDEX `idx_phr_health`(`id_person_health`),
    INDEX `idx_phr_person`(`id_person`),
    INDEX `idx_phr_user`(`phr_recorded_by_user_id`),
    PRIMARY KEY (`id_person_health_record`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `person_records` (
    `id_person_record` INTEGER NOT NULL AUTO_INCREMENT,
    `id_person` INTEGER NOT NULL,
    `id_user` INTEGER NULL,
    `prr_event_type` ENUM('created', 'updated', 'accepted', 'rejected', 'profession_changed', 'health_changed', 'camp_changed', 'inactivated', 'reactivated', 'admission_evaluated', 'stats_changed', 'level_up') NOT NULL,
    `prr_old_value` JSON NULL,
    `prr_new_value` JSON NULL,
    `prr_notes` VARCHAR(255) NULL,
    `prr_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_prr_person`(`id_person`),
    INDEX `idx_prr_user`(`id_user`),
    PRIMARY KEY (`id_person_record`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `persons` (
    `id_person` INTEGER NOT NULL AUTO_INCREMENT,
    `id_camp` INTEGER NOT NULL,
    `id_profession` INTEGER NULL,
    `id_person_health` INTEGER NULL,
    `id_profile_template` INTEGER NULL,
    `prn_name` VARCHAR(100) NOT NULL,
    `prn_lastname` VARCHAR(100) NOT NULL,
    `prn_identifier` VARCHAR(40) NOT NULL,
    `prn_birth_date` DATE NULL,
    `prn_document_number` VARCHAR(100) NULL,
    `prn_profile_description` TEXT NOT NULL,
    `prn_admission_status` ENUM('pending', 'under_review', 'observe', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    `prn_is_active` BOOLEAN NOT NULL DEFAULT true,
    `prn_admission_notes` VARCHAR(255) NULL,
    `prn_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `prn_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_persons_identifier`(`prn_identifier`),
    INDEX `idx_persons_camp`(`id_camp`),
    INDEX `idx_persons_health`(`id_person_health`),
    INDEX `idx_persons_profession`(`id_profession`),
    INDEX `idx_persons_profile_template`(`id_profile_template`),
    INDEX `idx_persons_admission_status`(`prn_admission_status`),
    PRIMARY KEY (`id_person`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `professions` (
    `id_profession` INTEGER NOT NULL AUTO_INCREMENT,
    `pfs_name` VARCHAR(100) NOT NULL,
    `pfs_description` VARCHAR(255) NOT NULL,
    `pfs_collects_resources` BOOLEAN NOT NULL DEFAULT false,
    `pfs_food_generated_per_day` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `pfs_water_generated_per_day` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `pfs_can_expedition` BOOLEAN NOT NULL DEFAULT false,
    `pfs_can_transfer` BOOLEAN NOT NULL DEFAULT false,
    `pfs_production_penalty` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `pfs_valuable_bonus_pp` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `pfs_transfer_bonus_pp` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `pfs_extra_food_chance_pp` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `pfs_extra_food_min` INTEGER NOT NULL DEFAULT 0,
    `pfs_extra_food_max` INTEGER NOT NULL DEFAULT 0,
    `pfs_healing_food_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `pfs_healing_amount` INTEGER NOT NULL DEFAULT 0,
    `id_camp` INTEGER NULL,
    `pfs_is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `uk_professions_name`(`pfs_name`),
    INDEX `idx_professions_camp`(`id_camp`),
    PRIMARY KEY (`id_profession`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_templates` (
    `id_profile_template` INTEGER NOT NULL AUTO_INCREMENT,
    `id_expected_profession` INTEGER NULL,
    `pft_description` TEXT NOT NULL,
    `pft_signals` JSON NOT NULL,
    `pft_is_active` BOOLEAN NOT NULL DEFAULT true,
    `pft_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_profile_templates_profession`(`id_expected_profession`),
    PRIMARY KEY (`id_profile_template`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `person_stats` (
    `id_person_stat` INTEGER NOT NULL AUTO_INCREMENT,
    `id_person` INTEGER NOT NULL,
    `pst_health` INTEGER NOT NULL,
    `pst_max_health` INTEGER NOT NULL,
    `pst_strength` INTEGER NOT NULL,
    `pst_satiety` INTEGER NOT NULL,
    `pst_hydration` INTEGER NOT NULL,
    `pst_luck` INTEGER NOT NULL,
    `pst_level` INTEGER NOT NULL DEFAULT 1,
    `pst_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_person_stats_person`(`id_person`),
    PRIMARY KEY (`id_person_stat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `person_progressions` (
    `id_person_progression` INTEGER NOT NULL AUTO_INCREMENT,
    `id_person` INTEGER NOT NULL,
    `ppg_source_type` ENUM('daily_assignment', 'expedition', 'transfer', 'care') NOT NULL,
    `ppg_reference_key` VARCHAR(160) NOT NULL,
    `ppg_previous_level` INTEGER NOT NULL,
    `ppg_new_level` INTEGER NOT NULL,
    `ppg_stats_before` JSON NOT NULL,
    `ppg_stats_after` JSON NOT NULL,
    `ppg_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_person_progressions_person`(`id_person`),
    UNIQUE INDEX `uk_person_progressions_reference`(`id_person`, `ppg_reference_key`),
    PRIMARY KEY (`id_person_progression`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admission_evaluations` (
    `id_admission_evaluation` INTEGER NOT NULL AUTO_INCREMENT,
    `id_person` INTEGER NOT NULL,
    `id_user_reviewer` INTEGER NULL,
    `ade_provider` VARCHAR(50) NOT NULL,
    `ade_model_name` VARCHAR(100) NULL,
    `ade_confidence` DECIMAL(5, 4) NOT NULL,
    `ade_decision` ENUM('accept', 'observe', 'reject') NOT NULL,
    `ade_reasons` JSON NOT NULL,
    `ade_input_snapshot` JSON NOT NULL,
    `ade_raw_response` JSON NULL,
    `ade_user_decision` ENUM('accept', 'observe', 'reject') NULL,
    `ade_user_observation` VARCHAR(255) NULL,
    `ade_is_final` BOOLEAN NOT NULL DEFAULT false,
    `ade_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_admission_evaluations_person`(`id_person`),
    INDEX `idx_admission_evaluations_reviewer`(`id_user_reviewer`),
    PRIMARY KEY (`id_admission_evaluation`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profession_recommendations` (
    `id_profession_recommendation` INTEGER NOT NULL AUTO_INCREMENT,
    `id_person` INTEGER NOT NULL,
    `id_recommended_profession` INTEGER NOT NULL,
    `id_selected_profession` INTEGER NULL,
    `id_user_reviewer` INTEGER NULL,
    `pfr_provider` VARCHAR(50) NOT NULL,
    `pfr_model_name` VARCHAR(100) NULL,
    `pfr_confidence` DECIMAL(5, 4) NOT NULL,
    `pfr_reasons` JSON NOT NULL,
    `pfr_alternatives` JSON NOT NULL,
    `pfr_input_snapshot` JSON NOT NULL,
    `pfr_raw_response` JSON NULL,
    `pfr_user_observation` VARCHAR(255) NULL,
    `pfr_is_final` BOOLEAN NOT NULL DEFAULT false,
    `pfr_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_profession_recommendations_person`(`id_person`),
    INDEX `idx_profession_recommendations_recommended`(`id_recommended_profession`),
    INDEX `idx_profession_recommendations_selected`(`id_selected_profession`),
    PRIMARY KEY (`id_profession_recommendation`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `camp_operational_rules` (
    `id_camp_operational_rule` INTEGER NOT NULL AUTO_INCREMENT,
    `id_camp` INTEGER NOT NULL,
    `cor_admission_rules` JSON NOT NULL,
    `cor_expedition_success` DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
    `cor_transfer_success` DECIMAL(5, 2) NOT NULL DEFAULT 75.00,
    `cor_disease_probability` DECIMAL(5, 2) NOT NULL DEFAULT 25.00,
    `cor_valuable_probability` DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
    `cor_disease_threshold` DECIMAL(5, 2) NOT NULL DEFAULT 25.00,
    `cor_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_camp_operational_rules_camp`(`id_camp`),
    PRIMARY KEY (`id_camp_operational_rule`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_assignments` (
    `id_daily_assignment` INTEGER NOT NULL AUTO_INCREMENT,
    `id_camp` INTEGER NOT NULL,
    `id_person` INTEGER NOT NULL,
    `das_date` DATE NOT NULL,
    `das_task` ENUM('food_production', 'water_production', 'camp_support') NOT NULL,
    `das_is_automatic` BOOLEAN NOT NULL DEFAULT false,
    `das_is_compatible` BOOLEAN NOT NULL DEFAULT true,
    `das_was_successful` BOOLEAN NULL,
    `das_result` JSON NULL,
    `das_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_daily_assignments_camp_date`(`id_camp`, `das_date`),
    UNIQUE INDEX `uk_daily_assignments_person_date`(`id_person`, `das_date`),
    PRIMARY KEY (`id_daily_assignment`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `care_actions` (
    `id_care_action` INTEGER NOT NULL AUTO_INCREMENT,
    `id_camp` INTEGER NOT NULL,
    `id_doctor` INTEGER NOT NULL,
    `id_patient` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `cra_food_cost` DECIMAL(10, 2) NOT NULL,
    `cra_health_before` INTEGER NOT NULL,
    `cra_health_after` INTEGER NOT NULL,
    `cra_removed_sick` BOOLEAN NOT NULL DEFAULT false,
    `cra_notes` VARCHAR(255) NULL,
    `cra_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_care_actions_camp`(`id_camp`),
    INDEX `idx_care_actions_doctor`(`id_doctor`),
    INDEX `idx_care_actions_patient`(`id_patient`),
    PRIMARY KEY (`id_care_action`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `narrative_events` (
    `id_narrative_event` INTEGER NOT NULL AUTO_INCREMENT,
    `id_camp` INTEGER NOT NULL,
    `id_user` INTEGER NULL,
    `nre_type` ENUM('disease', 'scarcity', 'zombie_attack', 'valuable_resources', 'traveler_loss') NOT NULL,
    `nre_status` ENUM('generated', 'applied', 'resolved') NOT NULL DEFAULT 'applied',
    `nre_source_type` VARCHAR(50) NOT NULL,
    `nre_reference_id` INTEGER NULL,
    `nre_probability` DECIMAL(5, 2) NULL,
    `nre_roll` DECIMAL(5, 2) NULL,
    `nre_participants` JSON NOT NULL,
    `nre_effects` JSON NOT NULL,
    `nre_description` VARCHAR(255) NOT NULL,
    `nre_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_narrative_events_camp_date`(`id_camp`, `nre_created_at`),
    INDEX `idx_narrative_events_reference`(`nre_source_type`, `nre_reference_id`),
    PRIMARY KEY (`id_narrative_event`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exploration_zones` (
    `id_exploration_zone` INTEGER NOT NULL AUTO_INCREMENT,
    `id_camp` INTEGER NOT NULL,
    `exz_name` VARCHAR(120) NOT NULL,
    `exz_description` VARCHAR(255) NULL,
    `exz_latitude` DECIMAL(10, 7) NULL,
    `exz_longitude` DECIMAL(10, 7) NULL,
    `exz_risk` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    `exz_is_active` BOOLEAN NOT NULL DEFAULT true,
    `exz_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_exploration_zones_camp`(`id_camp`),
    UNIQUE INDEX `uk_exploration_zones_camp_name`(`id_camp`, `exz_name`),
    PRIMARY KEY (`id_exploration_zone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resource_types` (
    `id_resource_type` INTEGER NOT NULL AUTO_INCREMENT,
    `rst_name` VARCHAR(100) NOT NULL,
    `rst_is_priority` BOOLEAN NOT NULL DEFAULT false,
    `rst_description` VARCHAR(255) NULL,

    UNIQUE INDEX `uk_resource_types_name`(`rst_name`),
    PRIMARY KEY (`id_resource_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resources` (
    `id_resource` INTEGER NOT NULL AUTO_INCREMENT,
    `rss_name` VARCHAR(100) NOT NULL,
    `id_resource_type` INTEGER NOT NULL,
    `rss_unit` VARCHAR(30) NOT NULL DEFAULT 'unit',
    `rss_is_rationable` BOOLEAN NOT NULL DEFAULT false,
    `rss_is_active` BOOLEAN NOT NULL DEFAULT true,
    `rss_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_resources_name`(`rss_name`),
    INDEX `idx_resources_type`(`id_resource_type`),
    PRIMARY KEY (`id_resource`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resources_movements` (
    `id_resource_movement` INTEGER NOT NULL AUTO_INCREMENT,
    `id_resource` INTEGER NOT NULL,
    `id_camp` INTEGER NOT NULL,
    `id_user` INTEGER NULL,
    `id_person` INTEGER NULL,
    `rsm_type` ENUM('entry', 'adjustment', 'daily_production', 'expedition_out', 'expedition_return', 'transfer_out', 'transfer_in', 'ration') NOT NULL,
    `rsm_quantity` DECIMAL(12, 2) NOT NULL,
    `rsm_reason_for_movement` VARCHAR(255) NOT NULL,
    `rsm_reference_type` ENUM('manual', 'transfer', 'expedition', 'person', 'system', 'ration') NOT NULL DEFAULT 'manual',
    `id_reference` INTEGER NULL,
    `rsm_movement_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_rsm_camp`(`id_camp`),
    INDEX `idx_rsm_person`(`id_person`),
    INDEX `idx_rsm_resource`(`id_resource`),
    INDEX `idx_rsm_user`(`id_user`),
    PRIMARY KEY (`id_resource_movement`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id_role` INTEGER NOT NULL AUTO_INCREMENT,
    `rls_name` VARCHAR(100) NOT NULL,
    `rls_description` VARCHAR(255) NOT NULL,
    `rls_is_system_role` BOOLEAN NOT NULL DEFAULT true,
    `rls_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_roles_name`(`rls_name`),
    PRIMARY KEY (`id_role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `storage` (
    `id_storage` INTEGER NOT NULL AUTO_INCREMENT,
    `id_camp` INTEGER NOT NULL,
    `id_resource` INTEGER NOT NULL,
    `stg_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `stg_min_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `stg_max_quantity` DECIMAL(12, 2) NULL,
    `stg_last_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_storage_resource`(`id_resource`),
    UNIQUE INDEX `uk_storage_camp_resource`(`id_camp`, `id_resource`),
    PRIMARY KEY (`id_storage`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `storage_records` (
    `id_storage_record` INTEGER NOT NULL AUTO_INCREMENT,
    `id_storage` INTEGER NOT NULL,
    `id_user` INTEGER NULL,
    `str_previous_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `str_new_quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `str_reason` VARCHAR(255) NOT NULL,
    `str_is_below_minimum` BOOLEAN NOT NULL DEFAULT false,
    `str_recorded_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_storage_records_storage`(`id_storage`),
    INDEX `idx_storage_records_user`(`id_user`),
    PRIMARY KEY (`id_storage_record`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id_system_setting` INTEGER NOT NULL AUTO_INCREMENT,
    `sts_key` VARCHAR(100) NOT NULL,
    `sts_value` VARCHAR(255) NOT NULL,
    `sts_value_type` ENUM('string', 'integer', 'decimal', 'boolean', 'json') NOT NULL DEFAULT 'string',
    `sts_description` VARCHAR(255) NULL,
    `sts_is_public` BOOLEAN NOT NULL DEFAULT false,
    `sts_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_system_settings_key`(`sts_key`),
    PRIMARY KEY (`id_system_setting`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transfers` (
    `id_transfer` INTEGER NOT NULL AUTO_INCREMENT,
    `id_origin_camp` INTEGER NOT NULL,
    `id_destiny_camp` INTEGER NOT NULL,
    `id_requested_by_user` INTEGER NOT NULL,
    `id_accepted_by_user` INTEGER NULL,
    `id_approved_origin_by_user` INTEGER NULL,
    `id_approved_destiny_by_user` INTEGER NULL,
    `tfs_type` ENUM('resources', 'people', 'mixed') NOT NULL,
    `tfs_state` ENUM('pending', 'accepted', 'declined', 'scheduled', 'in_transit', 'delivered', 'returned', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'pending',
    `tfs_requested_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tfs_accepted_request_date` DATETIME(0) NULL,
    `tfs_shipment_date` DATETIME(0) NULL,
    `tfs_arrival_date` DATETIME(0) NULL,
    `tfs_return_date` DATETIME(0) NULL,
    `tfs_comments` VARCHAR(512) NULL,

    INDEX `idx_transfers_accepted_by`(`id_accepted_by_user`),
    INDEX `idx_transfers_approved_destiny_by`(`id_approved_destiny_by_user`),
    INDEX `idx_transfers_approved_origin_by`(`id_approved_origin_by_user`),
    INDEX `idx_transfers_destiny_camp`(`id_destiny_camp`),
    INDEX `idx_transfers_origin_camp`(`id_origin_camp`),
    INDEX `idx_transfers_requested_by`(`id_requested_by_user`),
    PRIMARY KEY (`id_transfer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id_user_session` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `id_camp` INTEGER NOT NULL,
    `uss_token` VARCHAR(512) NOT NULL,
    `uss_ip` VARCHAR(100) NOT NULL,
    `uss_login` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `uss_last_update` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `uss_expired_session` DATETIME(0) NOT NULL,
    `uss_is_expired` BOOLEAN NOT NULL DEFAULT false,
    `uss_sign_out_reason` ENUM('manual', 'timeout', 'forced', 'camp_change', 'security') NOT NULL DEFAULT 'manual',

    UNIQUE INDEX `uk_user_sessions_token`(`uss_token`),
    INDEX `idx_user_sessions_camp`(`id_camp`),
    INDEX `idx_user_sessions_user`(`id_user`),
    PRIMARY KEY (`id_user_session`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_camp_memberships` (
    `id_user_camp_membership` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `id_camp` INTEGER NOT NULL,
    `ucm_is_active` BOOLEAN NOT NULL DEFAULT true,
    `ucm_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_camp_memberships_camp`(`id_camp`),
    UNIQUE INDEX `uk_user_camp_membership`(`id_user`, `id_camp`),
    PRIMARY KEY (`id_user_camp_membership`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id_user` INTEGER NOT NULL AUTO_INCREMENT,
    `id_person` INTEGER NULL,
    `id_role` INTEGER NOT NULL,
    `id_camp` INTEGER NOT NULL,
    `usr_username` VARCHAR(70) NOT NULL,
    `usr_email` VARCHAR(150) NULL,
    `usr_password` VARCHAR(255) NOT NULL,
    `usr_is_active` BOOLEAN NOT NULL DEFAULT true,
    `usr_last_login_at` DATETIME(0) NULL,
    `usr_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `usr_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_users_username`(`usr_username`),
    UNIQUE INDEX `uk_users_email`(`usr_email`),
    INDEX `idx_users_camp`(`id_camp`),
    INDEX `idx_users_person`(`id_person`),
    INDEX `idx_users_role`(`id_role`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `achievement_users` ADD CONSTRAINT `fk_achievement_users_achievement` FOREIGN KEY (`id_achievement`) REFERENCES `achievements`(`id_achievement`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achievement_users` ADD CONSTRAINT `fk_achievement_users_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_evaluations` ADD CONSTRAINT `fk_ai_evaluations_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_evaluations` ADD CONSTRAINT `fk_ai_evaluations_user` FOREIGN KEY (`id_user_reviewer`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_admission_person` ADD CONSTRAINT `fk_aap_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_admission_person` ADD CONSTRAINT `fk_aap_transfer` FOREIGN KEY (`id_transfer`) REFERENCES `transfers`(`id_transfer`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_admission_resources` ADD CONSTRAINT `fk_aar_resource` FOREIGN KEY (`id_resource`) REFERENCES `resources`(`id_resource`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_admission_resources` ADD CONSTRAINT `fk_aar_transfer` FOREIGN KEY (`id_transfer`) REFERENCES `transfers`(`id_transfer`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `fk_events_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `fk_events_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedition_records` ADD CONSTRAINT `fk_exr_expedition` FOREIGN KEY (`id_expedition`) REFERENCES `expeditions`(`id_expedition`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedition_records` ADD CONSTRAINT `fk_exr_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expedition_records` ADD CONSTRAINT `fk_exr_resource` FOREIGN KEY (`id_resource`) REFERENCES `resources`(`id_resource`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expeditions` ADD CONSTRAINT `fk_expeditions_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expeditions` ADD CONSTRAINT `fk_expeditions_zone` FOREIGN KEY (`id_exploration_zone`) REFERENCES `exploration_zones`(`id_exploration_zone`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expeditions` ADD CONSTRAINT `fk_expeditions_created_by` FOREIGN KEY (`id_created_by_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_health_records` ADD CONSTRAINT `fk_phr_health` FOREIGN KEY (`id_person_health`) REFERENCES `person_health`(`id_person_health`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_health_records` ADD CONSTRAINT `fk_phr_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_health_records` ADD CONSTRAINT `fk_phr_user` FOREIGN KEY (`phr_recorded_by_user_id`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_records` ADD CONSTRAINT `fk_prr_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_records` ADD CONSTRAINT `fk_prr_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persons` ADD CONSTRAINT `fk_persons_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persons` ADD CONSTRAINT `fk_persons_health` FOREIGN KEY (`id_person_health`) REFERENCES `person_health`(`id_person_health`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persons` ADD CONSTRAINT `fk_persons_profession` FOREIGN KEY (`id_profession`) REFERENCES `professions`(`id_profession`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persons` ADD CONSTRAINT `fk_persons_profile_template` FOREIGN KEY (`id_profile_template`) REFERENCES `profile_templates`(`id_profile_template`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `professions` ADD CONSTRAINT `fk_professions_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_templates` ADD CONSTRAINT `fk_profile_templates_profession` FOREIGN KEY (`id_expected_profession`) REFERENCES `professions`(`id_profession`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_stats` ADD CONSTRAINT `fk_person_stats_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `person_progressions` ADD CONSTRAINT `fk_person_progressions_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admission_evaluations` ADD CONSTRAINT `fk_admission_evaluations_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admission_evaluations` ADD CONSTRAINT `fk_admission_evaluations_reviewer` FOREIGN KEY (`id_user_reviewer`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profession_recommendations` ADD CONSTRAINT `fk_profession_recommendations_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profession_recommendations` ADD CONSTRAINT `fk_profession_recommendations_recommended` FOREIGN KEY (`id_recommended_profession`) REFERENCES `professions`(`id_profession`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profession_recommendations` ADD CONSTRAINT `fk_profession_recommendations_selected` FOREIGN KEY (`id_selected_profession`) REFERENCES `professions`(`id_profession`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profession_recommendations` ADD CONSTRAINT `fk_profession_recommendations_reviewer` FOREIGN KEY (`id_user_reviewer`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camp_operational_rules` ADD CONSTRAINT `fk_camp_operational_rules_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_assignments` ADD CONSTRAINT `fk_daily_assignments_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_assignments` ADD CONSTRAINT `fk_daily_assignments_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `care_actions` ADD CONSTRAINT `fk_care_actions_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `care_actions` ADD CONSTRAINT `fk_care_actions_doctor` FOREIGN KEY (`id_doctor`) REFERENCES `persons`(`id_person`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `care_actions` ADD CONSTRAINT `fk_care_actions_patient` FOREIGN KEY (`id_patient`) REFERENCES `persons`(`id_person`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `care_actions` ADD CONSTRAINT `fk_care_actions_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `narrative_events` ADD CONSTRAINT `fk_narrative_events_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `narrative_events` ADD CONSTRAINT `fk_narrative_events_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exploration_zones` ADD CONSTRAINT `fk_exploration_zones_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `fk_resources_resource_type` FOREIGN KEY (`id_resource_type`) REFERENCES `resource_types`(`id_resource_type`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources_movements` ADD CONSTRAINT `fk_rsm_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources_movements` ADD CONSTRAINT `fk_rsm_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources_movements` ADD CONSTRAINT `fk_rsm_resource` FOREIGN KEY (`id_resource`) REFERENCES `resources`(`id_resource`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources_movements` ADD CONSTRAINT `fk_rsm_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage` ADD CONSTRAINT `fk_storage_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage` ADD CONSTRAINT `fk_storage_resource` FOREIGN KEY (`id_resource`) REFERENCES `resources`(`id_resource`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage_records` ADD CONSTRAINT `fk_storage_records_storage` FOREIGN KEY (`id_storage`) REFERENCES `storage`(`id_storage`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `storage_records` ADD CONSTRAINT `fk_storage_records_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `fk_transfers_accepted_by` FOREIGN KEY (`id_accepted_by_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `fk_transfers_approved_destiny_by` FOREIGN KEY (`id_approved_destiny_by_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `fk_transfers_approved_origin_by` FOREIGN KEY (`id_approved_origin_by_user`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `fk_transfers_destiny_camp` FOREIGN KEY (`id_destiny_camp`) REFERENCES `camps`(`id_camp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `fk_transfers_origin_camp` FOREIGN KEY (`id_origin_camp`) REFERENCES `camps`(`id_camp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `fk_transfers_requested_by` FOREIGN KEY (`id_requested_by_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `fk_user_sessions_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_camp_memberships` ADD CONSTRAINT `fk_user_camp_memberships_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_camp_memberships` ADD CONSTRAINT `fk_user_camp_memberships_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_camp` FOREIGN KEY (`id_camp`) REFERENCES `camps`(`id_camp`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_person` FOREIGN KEY (`id_person`) REFERENCES `persons`(`id_person`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`id_role`) REFERENCES `roles`(`id_role`) ON DELETE RESTRICT ON UPDATE CASCADE;
