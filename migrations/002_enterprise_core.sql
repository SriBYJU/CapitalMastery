PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_members (
  org_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','training_admin','content_manager','manager','viewer','learner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (org_id, uid),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS cohorts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pathway_id TEXT NOT NULL,
  program_level TEXT NOT NULL CHECK (program_level IN ('foundations','essentials','professional')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','archived')),
  deadline_at TEXT,
  created_by_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS organization_invites (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  cohort_id TEXT,
  email_normalized TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('training_admin','content_manager','manager','viewer','learner')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','archived')),
  expires_at TEXT NOT NULL,
  created_by_uid TEXT NOT NULL,
  accepted_by_uid TEXT,
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
);


CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  PRIMARY KEY (cohort_id, uid),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS program_assignments (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  cohort_id TEXT NOT NULL,
  pathway_id TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('foundations','professional')),
  credential_target TEXT NOT NULL CHECK (credential_target IN ('foundations','essentials','applied','role_lab','professional_readiness')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','completed','archived')),
  due_at TEXT,
  curriculum_version TEXT NOT NULL DEFAULT '2.0',
  created_by_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
);

CREATE TABLE IF NOT EXISTS firm_content (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  assignment_id TEXT,
  pathway_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('intro','lesson','resource','exercise','assessment','role_lab_stage','manager_note','case')),
  title TEXT NOT NULL,
  body_json TEXT NOT NULL DEFAULT '{}',
  position_key TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible','hidden','archived')),
  source_standard_content_id TEXT,
  current_version INTEGER NOT NULL DEFAULT 1 CHECK (current_version >= 1),
  created_by_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id)
);

CREATE TABLE IF NOT EXISTS firm_content_versions (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  snapshot_json TEXT NOT NULL,
  created_by_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (content_id, version),
  FOREIGN KEY (content_id) REFERENCES firm_content(id)
);

CREATE TABLE IF NOT EXISTS standard_content_preferences (
  org_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  standard_content_id TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible','hidden')),
  updated_by_uid TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assignment_id, standard_content_id),
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id)
);

CREATE TABLE IF NOT EXISTS competencies (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical_knowledge','analytical_accuracy','professional_judgment','execution','communication','quality_control','risk_awareness','role_readiness')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pathway_competencies (
  pathway_id TEXT NOT NULL,
  competency_id TEXT NOT NULL,
  weight REAL NOT NULL CHECK (weight >= 0 AND weight <= 1),
  minimum_score INTEGER NOT NULL DEFAULT 0 CHECK (minimum_score >= 0 AND minimum_score <= 100),
  critical INTEGER NOT NULL DEFAULT 0 CHECK (critical IN (0,1)),
  PRIMARY KEY (pathway_id, competency_id),
  FOREIGN KEY (competency_id) REFERENCES competencies(id)
);

CREATE TABLE IF NOT EXISTS diagnostic_attempts (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  org_id TEXT,
  cohort_id TEXT,
  assignment_id TEXT,
  pathway_id TEXT NOT NULL,
  version TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  competency_scores_json TEXT NOT NULL DEFAULT '{}',
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id)
);

CREATE TABLE IF NOT EXISTS competency_evidence (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  org_id TEXT,
  assignment_id TEXT,
  pathway_id TEXT NOT NULL,
  competency_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('assessment','diagnostic','applied','role_lab','final','manager_review')),
  source_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  weight REAL NOT NULL DEFAULT 1 CHECK (weight > 0),
  evidence_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id),
  FOREIGN KEY (competency_id) REFERENCES competencies(id)
);

CREATE TABLE IF NOT EXISTS competency_scores (
  uid TEXT NOT NULL,
  org_scope TEXT NOT NULL DEFAULT 'public',
  assignment_scope TEXT NOT NULL DEFAULT 'public',
  pathway_id TEXT NOT NULL,
  competency_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  evidence_count INTEGER NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uid, org_scope, assignment_scope, pathway_id, competency_id),
  FOREIGN KEY (competency_id) REFERENCES competencies(id)
);

CREATE TABLE IF NOT EXISTS readiness_snapshots (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  org_id TEXT,
  cohort_id TEXT,
  assignment_id TEXT,
  pathway_id TEXT NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  status TEXT NOT NULL CHECK (status IN ('developing','near_ready','ready_with_development','ready')),
  competency_scores_json TEXT NOT NULL,
  baseline_score INTEGER,
  improvement INTEGER,
  curriculum_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id)
);

CREATE TABLE IF NOT EXISTS role_lab_runs (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  org_id TEXT,
  cohort_id TEXT,
  assignment_id TEXT,
  pathway_id TEXT NOT NULL,
  lab_key TEXT NOT NULL,
  lab_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','revision_required','passed','archived')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  revision_count INTEGER NOT NULL DEFAULT 0 CHECK (revision_count >= 0),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id)
);

CREATE TABLE IF NOT EXISTS role_lab_submissions (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  attempt_no INTEGER NOT NULL CHECK (attempt_no >= 1),
  response_json TEXT NOT NULL,
  score_json TEXT NOT NULL DEFAULT '{}',
  feedback_json TEXT NOT NULL DEFAULT '{}',
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (run_id, task_id, attempt_no),
  FOREIGN KEY (run_id) REFERENCES role_lab_runs(id)
);

CREATE TABLE IF NOT EXISTS enterprise_audit_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  actor_uid TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_uid ON organization_members(uid, status);
CREATE INDEX IF NOT EXISTS idx_org_invites_org_status ON organization_invites(org_id, status);
CREATE INDEX IF NOT EXISTS idx_cohorts_org_status ON cohorts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_cohort_members_uid ON cohort_members(uid, status);
CREATE INDEX IF NOT EXISTS idx_assignments_org_cohort ON program_assignments(org_id, cohort_id, status);
CREATE INDEX IF NOT EXISTS idx_firm_content_org_assignment ON firm_content(org_id, assignment_id, visibility);
CREATE INDEX IF NOT EXISTS idx_diagnostic_uid_pathway ON diagnostic_attempts(uid, pathway_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_evidence_uid_pathway ON competency_evidence(uid, pathway_id, competency_id);
CREATE INDEX IF NOT EXISTS idx_readiness_uid_pathway ON readiness_snapshots(uid, pathway_id, created_at);
CREATE INDEX IF NOT EXISTS idx_role_lab_uid_pathway ON role_lab_runs(uid, pathway_id, status);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_org ON enterprise_audit_events(org_id, created_at);
