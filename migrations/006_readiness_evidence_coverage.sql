ALTER TABLE readiness_snapshots ADD COLUMN evidence_coverage REAL NOT NULL DEFAULT 0;
ALTER TABLE readiness_snapshots ADD COLUMN evidence_phase TEXT NOT NULL DEFAULT 'baseline';
CREATE INDEX IF NOT EXISTS idx_readiness_org_latest ON readiness_snapshots(org_id, uid, created_at);
