CREATE TABLE IF NOT EXISTS diagnostic_questions (
  id TEXT PRIMARY KEY,
  pathway_id TEXT NOT NULL,
  version TEXT NOT NULL,
  competency_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  rationale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  UNIQUE(pathway_id, version, position),
  FOREIGN KEY (competency_id) REFERENCES competencies(id)
);

CREATE TABLE IF NOT EXISTS role_lab_definitions (
  lab_key TEXT NOT NULL,
  version TEXT NOT NULL,
  pathway_id TEXT NOT NULL,
  title TEXT NOT NULL,
  role_title TEXT NOT NULL,
  client_name TEXT,
  scenario_json TEXT NOT NULL,
  pass_score INTEGER NOT NULL DEFAULT 80 CHECK (pass_score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (lab_key, version)
);

CREATE TABLE IF NOT EXISTS role_lab_tasks (
  id TEXT PRIMARY KEY,
  lab_key TEXT NOT NULL,
  lab_version TEXT NOT NULL,
  stage_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('numeric_fields','choice_fields','multi_select','written_decision','mixed')),
  brief_json TEXT NOT NULL,
  grading_json TEXT NOT NULL,
  competency_map_json TEXT NOT NULL,
  pass_score INTEGER NOT NULL DEFAULT 70 CHECK (pass_score BETWEEN 0 AND 100),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0,1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  UNIQUE(lab_key, lab_version, stage_no),
  FOREIGN KEY (lab_key, lab_version) REFERENCES role_lab_definitions(lab_key, version)
);

CREATE INDEX IF NOT EXISTS idx_diag_pathway_version ON diagnostic_questions(pathway_id, version, status, position);
CREATE INDEX IF NOT EXISTS idx_role_lab_pathway ON role_lab_definitions(pathway_id, status);
CREATE INDEX IF NOT EXISTS idx_role_lab_tasks_order ON role_lab_tasks(lab_key, lab_version, status, stage_no);
