-- Capital Mastery Phase 2
-- Expand the original enterprise cohort/assignment CHECK constraints for the
-- Career Skills program while preserving existing rows and foreign-key targets.
--
-- SQLite cannot alter CHECK constraints in place. Rebuild the two parent tables
-- with foreign-key enforcement temporarily disabled, copy every existing row,
-- then restore the canonical table names and indexes.

PRAGMA foreign_keys = OFF;

CREATE TABLE cohorts_phase2 (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pathway_id TEXT NOT NULL,
  program_level TEXT NOT NULL CHECK (program_level IN ('foundations','essentials','career_skills','professional')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','archived')),
  deadline_at TEXT,
  created_by_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

INSERT INTO cohorts_phase2
(id,org_id,name,pathway_id,program_level,status,deadline_at,created_by_uid,created_at,updated_at)
SELECT id,org_id,name,pathway_id,program_level,status,deadline_at,created_by_uid,created_at,updated_at
FROM cohorts;

DROP TABLE cohorts;
ALTER TABLE cohorts_phase2 RENAME TO cohorts;
CREATE INDEX IF NOT EXISTS idx_cohorts_org_status ON cohorts(org_id, status);

CREATE TABLE program_assignments_phase2 (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  cohort_id TEXT NOT NULL,
  pathway_id TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('foundations','career_skills','professional')),
  credential_target TEXT NOT NULL CHECK (credential_target IN ('foundations','essentials','applied','career','role_lab','professional_readiness')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','completed','archived')),
  due_at TEXT,
  curriculum_version TEXT NOT NULL DEFAULT '2.0',
  created_by_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
);

INSERT INTO program_assignments_phase2
(id,org_id,cohort_id,pathway_id,track,credential_target,status,due_at,curriculum_version,created_by_uid,created_at,updated_at)
SELECT id,org_id,cohort_id,pathway_id,track,credential_target,status,due_at,curriculum_version,created_by_uid,created_at,updated_at
FROM program_assignments;

DROP TABLE program_assignments;
ALTER TABLE program_assignments_phase2 RENAME TO program_assignments;
CREATE INDEX IF NOT EXISTS idx_assignments_org_cohort ON program_assignments(org_id, cohort_id, status);

PRAGMA foreign_keys = ON;
