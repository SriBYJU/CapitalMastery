PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS manager_reviews (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  learner_uid TEXT NOT NULL,
  pathway_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('readiness','role_lab','assessment','credential','general')),
  artifact_ref TEXT,
  review_status TEXT NOT NULL DEFAULT 'note' CHECK (review_status IN ('note','needs_attention','resolved','commended')),
  rating INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  comment TEXT NOT NULL,
  created_by_uid TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id)
);

CREATE TABLE IF NOT EXISTS enterprise_notifications (
  id TEXT PRIMARY KEY,
  recipient_uid TEXT NOT NULL,
  org_id TEXT NOT NULL,
  assignment_id TEXT,
  category TEXT NOT NULL CHECK (category IN ('deadline','overdue','revision','readiness','completion','manager_review')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','attention','urgent','positive')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_hash TEXT,
  dedupe_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT,
  UNIQUE (recipient_uid, dedupe_key),
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id)
);

CREATE INDEX IF NOT EXISTS idx_manager_reviews_org_assignment ON manager_reviews(org_id,assignment_id,learner_uid,created_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_notifications_recipient ON enterprise_notifications(recipient_uid,status,created_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_notifications_org ON enterprise_notifications(org_id,assignment_id,category);
