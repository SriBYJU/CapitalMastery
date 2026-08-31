-- Post-submission, owner-scoped review records for legacy/official course items.
-- Correct answers and rationales remain server-side until an attempt exists.
CREATE TABLE IF NOT EXISTS assessment_attempt_reviews (
  attempt_id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  pathway_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed INTEGER NOT NULL CHECK (passed IN (0,1)),
  answers_json TEXT NOT NULL DEFAULT '{}',
  review_json TEXT NOT NULL DEFAULT '[]',
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempt_reviews_owner
  ON assessment_attempt_reviews(uid,pathway_id,item_id,passed,score,submitted_at);
