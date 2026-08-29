ALTER TABLE credentials ADD COLUMN standard_version TEXT NOT NULL DEFAULT '1.0-legacy';
ALTER TABLE credentials ADD COLUMN credential_definition_id TEXT;
ALTER TABLE credentials ADD COLUMN org_id TEXT;
ALTER TABLE credentials ADD COLUMN assignment_id TEXT;
ALTER TABLE credentials ADD COLUMN evidence_summary_json TEXT NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS credential_definitions (
  id TEXT PRIMARY KEY,
  pathway_id TEXT NOT NULL,
  credential_level TEXT NOT NULL,
  standard_version TEXT NOT NULL,
  title TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('foundations','professional','legacy')),
  learner_level TEXT NOT NULL CHECK (learner_level IN ('beginner','intermediate','advanced','legacy')),
  description TEXT NOT NULL,
  requirements_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pathway_id, credential_level, standard_version)
);

CREATE TABLE IF NOT EXISTS credential_evidence_items (
  id TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('credential','assessment','role_lab','readiness','competency_profile','curriculum')),
  evidence_ref TEXT,
  title TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credential_id) REFERENCES credentials(credential_id)
);

CREATE INDEX IF NOT EXISTS idx_credential_defs_pathway ON credential_definitions(pathway_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_credential_evidence_credential ON credential_evidence_items(credential_id, created_at);
CREATE INDEX IF NOT EXISTS idx_credentials_v2_context ON credentials(uid, pathway_id, credential_level, standard_version, status);

INSERT OR REPLACE INTO credential_definitions
(id,pathway_id,credential_level,standard_version,title,track,learner_level,description,requirements_json,sort_order,status) VALUES
('ib-foundations-recognized-v2','investment-banking','foundations','2.0','Investment Banking Foundations Certificate','foundations','beginner','Beginner credential recognizing mastery of the existing Capital Mastery Investment Banking foundations curriculum.','{"recognizes_existing_level":"foundations","minimum_mastery":80,"required_standard_content":["foundations-core","foundations-assessment"]}',10,'active'),
('ib-essentials-v2','investment-banking','essentials','2.0','Investment Banking Essentials Certificate','foundations','beginner','Applied beginner credential earned after Foundations plus a guided Investment Banking essentials case.','{"requires_credentials":["foundations"],"requires_assessment":{"key":"ib-essentials-case","minimum":75}}',20,'active'),
('ib-applied-recognized-v2','investment-banking','applied','2.0','Investment Banking Applied Skills Certificate','professional','intermediate','Technical/applied credential recognizing completion of the existing deeper Capital Mastery Investment Banking applied curriculum.','{"recognizes_existing_level":"applied","minimum_mastery":80,"required_standard_content":["technical-core","applied-skills"]}',30,'active'),
('ib-role-lab-v2','investment-banking','role_lab','2.0','Investment Banking Role Lab Certificate','professional','advanced','Evidence-backed credential for completing the Project Northstar M&A analyst workflow at the required standard.','{"requires_role_lab":{"key":"ib-project-northstar","version":"2.0","minimum":80}}',40,'active'),
('ib-professional-readiness-v2','investment-banking','professional_readiness','2.0','Investment Banking Professional Readiness Certificate','professional','advanced','Flagship readiness credential requiring technical preparation, realistic analyst work, final assessment evidence, competency floors and overall readiness.','{"requires_credentials":["foundations","essentials","applied","role_lab"],"requires_assessment":{"key":"ib-professional-final","minimum":80},"requires_readiness":{"minimum":80,"evidence_coverage":1.0,"critical_floors":true}}',50,'active');
