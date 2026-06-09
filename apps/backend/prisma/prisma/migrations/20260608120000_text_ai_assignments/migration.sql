-- Text-based admission, profession recommendation, person stats, and narrative operations.
-- This migration preserves legacy ai_evaluations rows as read-only audit history.

ALTER TABLE `professions`
  ADD COLUMN `pfs_can_expedition` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `pfs_can_transfer` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `pfs_production_penalty` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `pfs_valuable_bonus_pp` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `pfs_transfer_bonus_pp` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `pfs_extra_food_chance_pp` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `pfs_extra_food_min` INT NOT NULL DEFAULT 0,
  ADD COLUMN `pfs_extra_food_max` INT NOT NULL DEFAULT 0,
  ADD COLUMN `pfs_healing_food_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `pfs_healing_amount` INT NOT NULL DEFAULT 0;

CREATE TABLE `profile_templates` (
  `id_profile_template` INT NOT NULL AUTO_INCREMENT,
  `id_expected_profession` INT NULL,
  `pft_description` TEXT NOT NULL,
  `pft_signals` JSON NOT NULL,
  `pft_is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `pft_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_profile_template`),
  INDEX `idx_profile_templates_profession` (`id_expected_profession`),
  CONSTRAINT `fk_profile_templates_profession`
    FOREIGN KEY (`id_expected_profession`) REFERENCES `professions` (`id_profession`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `persons`
  ADD COLUMN `id_profile_template` INT NULL,
  ADD COLUMN `prn_profile_description` TEXT NULL,
  ADD COLUMN `prn_admission_status`
    ENUM('pending', 'under_review', 'observe', 'accepted', 'rejected')
    NOT NULL DEFAULT 'pending';

UPDATE `persons`
SET
  `prn_profile_description` = CONCAT(
    'Perfil pendiente de completar para ',
    `prn_name`,
    ' ',
    `prn_lastname`,
    '.'
  ),
  `prn_admission_status` = CASE
    WHEN `prn_is_accepted` = TRUE THEN 'accepted'
    ELSE 'pending'
  END;

ALTER TABLE `persons`
  MODIFY COLUMN `id_profession` INT NULL,
  MODIFY COLUMN `prn_profile_description` TEXT NOT NULL,
  DROP COLUMN `prn_photo_url`,
  DROP COLUMN `prn_identification_card_url`,
  DROP COLUMN `prn_is_accepted`,
  ADD INDEX `idx_persons_profile_template` (`id_profile_template`),
  ADD INDEX `idx_persons_admission_status` (`prn_admission_status`),
  ADD CONSTRAINT `fk_persons_profile_template`
    FOREIGN KEY (`id_profile_template`) REFERENCES `profile_templates` (`id_profile_template`);

CREATE TABLE `person_stats` (
  `id_person_stat` INT NOT NULL AUTO_INCREMENT,
  `id_person` INT NOT NULL,
  `pst_health` INT NOT NULL,
  `pst_max_health` INT NOT NULL,
  `pst_strength` INT NOT NULL,
  `pst_satiety` INT NOT NULL,
  `pst_hydration` INT NOT NULL,
  `pst_luck` INT NOT NULL,
  `pst_level` INT NOT NULL DEFAULT 1,
  `pst_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_person_stat`),
  UNIQUE INDEX `uk_person_stats_person` (`id_person`),
  CONSTRAINT `fk_person_stats_person`
    FOREIGN KEY (`id_person`) REFERENCES `persons` (`id_person`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `person_stats` (
  `id_person`,
  `pst_health`,
  `pst_max_health`,
  `pst_strength`,
  `pst_satiety`,
  `pst_hydration`,
  `pst_luck`,
  `pst_level`
)
SELECT
  `id_person`,
  10,
  10,
  10,
  10,
  10,
  10,
  1
FROM `persons`;

CREATE TABLE `person_progressions` (
  `id_person_progression` INT NOT NULL AUTO_INCREMENT,
  `id_person` INT NOT NULL,
  `ppg_source_type` ENUM('daily_assignment', 'expedition', 'transfer', 'care') NOT NULL,
  `ppg_reference_key` VARCHAR(160) NOT NULL,
  `ppg_previous_level` INT NOT NULL,
  `ppg_new_level` INT NOT NULL,
  `ppg_stats_before` JSON NOT NULL,
  `ppg_stats_after` JSON NOT NULL,
  `ppg_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_person_progression`),
  UNIQUE INDEX `uk_person_progressions_reference` (`id_person`, `ppg_reference_key`),
  INDEX `idx_person_progressions_person` (`id_person`),
  CONSTRAINT `fk_person_progressions_person`
    FOREIGN KEY (`id_person`) REFERENCES `persons` (`id_person`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admission_evaluations` (
  `id_admission_evaluation` INT NOT NULL AUTO_INCREMENT,
  `id_person` INT NOT NULL,
  `id_user_reviewer` INT NULL,
  `ade_provider` VARCHAR(50) NOT NULL,
  `ade_model_name` VARCHAR(100) NULL,
  `ade_confidence` DECIMAL(5, 4) NOT NULL,
  `ade_decision` ENUM('accept', 'observe', 'reject') NOT NULL,
  `ade_reasons` JSON NOT NULL,
  `ade_input_snapshot` JSON NOT NULL,
  `ade_raw_response` JSON NULL,
  `ade_user_decision` ENUM('accept', 'observe', 'reject') NULL,
  `ade_user_observation` VARCHAR(255) NULL,
  `ade_is_final` BOOLEAN NOT NULL DEFAULT FALSE,
  `ade_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_admission_evaluation`),
  INDEX `idx_admission_evaluations_person` (`id_person`),
  INDEX `idx_admission_evaluations_reviewer` (`id_user_reviewer`),
  CONSTRAINT `fk_admission_evaluations_person`
    FOREIGN KEY (`id_person`) REFERENCES `persons` (`id_person`) ON DELETE CASCADE,
  CONSTRAINT `fk_admission_evaluations_reviewer`
    FOREIGN KEY (`id_user_reviewer`) REFERENCES `users` (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `profession_recommendations` (
  `id_profession_recommendation` INT NOT NULL AUTO_INCREMENT,
  `id_person` INT NOT NULL,
  `id_recommended_profession` INT NOT NULL,
  `id_selected_profession` INT NULL,
  `id_user_reviewer` INT NULL,
  `pfr_provider` VARCHAR(50) NOT NULL,
  `pfr_model_name` VARCHAR(100) NULL,
  `pfr_confidence` DECIMAL(5, 4) NOT NULL,
  `pfr_reasons` JSON NOT NULL,
  `pfr_alternatives` JSON NOT NULL,
  `pfr_input_snapshot` JSON NOT NULL,
  `pfr_raw_response` JSON NULL,
  `pfr_user_observation` VARCHAR(255) NULL,
  `pfr_is_final` BOOLEAN NOT NULL DEFAULT FALSE,
  `pfr_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_profession_recommendation`),
  INDEX `idx_profession_recommendations_person` (`id_person`),
  INDEX `idx_profession_recommendations_recommended` (`id_recommended_profession`),
  INDEX `idx_profession_recommendations_selected` (`id_selected_profession`),
  INDEX `idx_profession_recommendations_reviewer` (`id_user_reviewer`),
  CONSTRAINT `fk_profession_recommendations_person`
    FOREIGN KEY (`id_person`) REFERENCES `persons` (`id_person`) ON DELETE CASCADE,
  CONSTRAINT `fk_profession_recommendations_recommended`
    FOREIGN KEY (`id_recommended_profession`) REFERENCES `professions` (`id_profession`),
  CONSTRAINT `fk_profession_recommendations_selected`
    FOREIGN KEY (`id_selected_profession`) REFERENCES `professions` (`id_profession`),
  CONSTRAINT `fk_profession_recommendations_reviewer`
    FOREIGN KEY (`id_user_reviewer`) REFERENCES `users` (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `camp_operational_rules` (
  `id_camp_operational_rule` INT NOT NULL AUTO_INCREMENT,
  `id_camp` INT NOT NULL,
  `cor_admission_rules` JSON NOT NULL,
  `cor_expedition_success` DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
  `cor_transfer_success` DECIMAL(5, 2) NOT NULL DEFAULT 75.00,
  `cor_disease_probability` DECIMAL(5, 2) NOT NULL DEFAULT 25.00,
  `cor_valuable_probability` DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  `cor_disease_threshold` DECIMAL(5, 2) NOT NULL DEFAULT 25.00,
  `cor_updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_camp_operational_rule`),
  UNIQUE INDEX `uk_camp_operational_rules_camp` (`id_camp`),
  CONSTRAINT `fk_camp_operational_rules_camp`
    FOREIGN KEY (`id_camp`) REFERENCES `camps` (`id_camp`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `camp_operational_rules` (
  `id_camp`,
  `cor_admission_rules`
)
SELECT
  `id_camp`,
  JSON_OBJECT(
    'minimumHealth', 1,
    'requireProfileDescription', TRUE,
    'rejectInactiveCamp', TRUE,
    'requireAvailableCapacity', TRUE
  )
FROM `camps`;

CREATE TABLE `daily_assignments` (
  `id_daily_assignment` INT NOT NULL AUTO_INCREMENT,
  `id_camp` INT NOT NULL,
  `id_person` INT NOT NULL,
  `das_date` DATE NOT NULL,
  `das_task` ENUM('food_production', 'water_production', 'camp_support') NOT NULL,
  `das_is_automatic` BOOLEAN NOT NULL DEFAULT FALSE,
  `das_is_compatible` BOOLEAN NOT NULL DEFAULT TRUE,
  `das_was_successful` BOOLEAN NULL,
  `das_result` JSON NULL,
  `das_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_daily_assignment`),
  UNIQUE INDEX `uk_daily_assignments_person_date` (`id_person`, `das_date`),
  INDEX `idx_daily_assignments_camp_date` (`id_camp`, `das_date`),
  CONSTRAINT `fk_daily_assignments_camp`
    FOREIGN KEY (`id_camp`) REFERENCES `camps` (`id_camp`) ON DELETE CASCADE,
  CONSTRAINT `fk_daily_assignments_person`
    FOREIGN KEY (`id_person`) REFERENCES `persons` (`id_person`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `care_actions` (
  `id_care_action` INT NOT NULL AUTO_INCREMENT,
  `id_camp` INT NOT NULL,
  `id_doctor` INT NOT NULL,
  `id_patient` INT NOT NULL,
  `id_user` INT NOT NULL,
  `cra_food_cost` DECIMAL(10, 2) NOT NULL,
  `cra_health_before` INT NOT NULL,
  `cra_health_after` INT NOT NULL,
  `cra_removed_sick` BOOLEAN NOT NULL DEFAULT FALSE,
  `cra_notes` VARCHAR(255) NULL,
  `cra_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_care_action`),
  INDEX `idx_care_actions_camp` (`id_camp`),
  INDEX `idx_care_actions_doctor` (`id_doctor`),
  INDEX `idx_care_actions_patient` (`id_patient`),
  INDEX `idx_care_actions_user` (`id_user`),
  CONSTRAINT `fk_care_actions_camp`
    FOREIGN KEY (`id_camp`) REFERENCES `camps` (`id_camp`),
  CONSTRAINT `fk_care_actions_doctor`
    FOREIGN KEY (`id_doctor`) REFERENCES `persons` (`id_person`),
  CONSTRAINT `fk_care_actions_patient`
    FOREIGN KEY (`id_patient`) REFERENCES `persons` (`id_person`),
  CONSTRAINT `fk_care_actions_user`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `narrative_events` (
  `id_narrative_event` INT NOT NULL AUTO_INCREMENT,
  `id_camp` INT NOT NULL,
  `id_user` INT NULL,
  `nre_type` ENUM('disease', 'scarcity', 'zombie_attack', 'valuable_resources', 'traveler_loss') NOT NULL,
  `nre_status` ENUM('generated', 'applied', 'resolved') NOT NULL DEFAULT 'applied',
  `nre_source_type` VARCHAR(50) NOT NULL,
  `nre_reference_id` INT NULL,
  `nre_probability` DECIMAL(5, 2) NULL,
  `nre_roll` DECIMAL(5, 2) NULL,
  `nre_participants` JSON NOT NULL,
  `nre_effects` JSON NOT NULL,
  `nre_description` VARCHAR(255) NOT NULL,
  `nre_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_narrative_event`),
  INDEX `idx_narrative_events_camp_date` (`id_camp`, `nre_created_at`),
  INDEX `idx_narrative_events_reference` (`nre_source_type`, `nre_reference_id`),
  INDEX `idx_narrative_events_user` (`id_user`),
  CONSTRAINT `fk_narrative_events_camp`
    FOREIGN KEY (`id_camp`) REFERENCES `camps` (`id_camp`) ON DELETE CASCADE,
  CONSTRAINT `fk_narrative_events_user`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `exploration_zones` (
  `id_exploration_zone` INT NOT NULL AUTO_INCREMENT,
  `id_camp` INT NOT NULL,
  `exz_name` VARCHAR(120) NOT NULL,
  `exz_description` VARCHAR(255) NULL,
  `exz_latitude` DECIMAL(10, 7) NULL,
  `exz_longitude` DECIMAL(10, 7) NULL,
  `exz_risk` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `exz_is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `exz_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_exploration_zone`),
  UNIQUE INDEX `uk_exploration_zones_camp_name` (`id_camp`, `exz_name`),
  INDEX `idx_exploration_zones_camp` (`id_camp`),
  CONSTRAINT `fk_exploration_zones_camp`
    FOREIGN KEY (`id_camp`) REFERENCES `camps` (`id_camp`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `expeditions`
  ADD COLUMN `id_exploration_zone` INT NULL,
  ADD INDEX `idx_expeditions_zone` (`id_exploration_zone`),
  ADD CONSTRAINT `fk_expeditions_zone`
    FOREIGN KEY (`id_exploration_zone`) REFERENCES `exploration_zones` (`id_exploration_zone`);

ALTER TABLE `person_records`
  MODIFY COLUMN `prr_event_type`
    ENUM(
      'created',
      'updated',
      'accepted',
      'rejected',
      'profession_changed',
      'health_changed',
      'camp_changed',
      'inactivated',
      'reactivated',
      'admission_evaluated',
      'stats_changed',
      'level_up'
    ) NOT NULL;

ALTER TABLE `transfers`
  MODIFY COLUMN `tfs_state`
    ENUM(
      'pending',
      'accepted',
      'declined',
      'scheduled',
      'in_transit',
      'delivered',
      'returned',
      'completed',
      'cancelled',
      'failed'
    ) NOT NULL DEFAULT 'pending';
