-- Capital Mastery Phase 2
-- Assignment-scoped completion records are intentionally separate from the
-- Standard 2.0 credentials table. This preserves the five-level verified
-- credential ladder while allowing an employer Career Skills assignment to
-- issue a shareable, server-backed program completion certificate.

CREATE TABLE IF NOT EXISTS program_completion_records (
  completion_id TEXT PRIMARY KEY,
  public_token TEXT NOT NULL UNIQUE,
  uid TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  pathway_id TEXT NOT NULL,
  program_code TEXT NOT NULL CHECK (program_code IN ('career_skills')),
  completion_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  org_id TEXT NOT NULL,
  cohort_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  capstone_score INTEGER NOT NULL CHECK (capstone_score >= 0 AND capstone_score <= 100),
  evidence_summary_json TEXT NOT NULL DEFAULT '{}',
  issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  revocation_reason TEXT,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id),
  UNIQUE(uid, assignment_id, program_code)
);

CREATE INDEX IF NOT EXISTS idx_program_completion_uid_assignment
  ON program_completion_records(uid, assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_program_completion_org_assignment
  ON program_completion_records(org_id, assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_program_completion_pathway
  ON program_completion_records(uid, pathway_id, program_code, status);
