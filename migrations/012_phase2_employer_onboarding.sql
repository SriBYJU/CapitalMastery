PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employer_profiles (
  uid TEXT NOT NULL,
  org_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employer_role TEXT NOT NULL CHECK (employer_role IN ('training_lead','founder_partner','manager','recruiter_hr','other')),
  cohort_size_band TEXT NOT NULL DEFAULT 'unspecified' CHECK (cohort_size_band IN ('unspecified','1_10','11_25','26_50','51_100','100_plus')),
  onboarding_complete INTEGER NOT NULL DEFAULT 1 CHECK (onboarding_complete IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uid, org_id),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_employer_profiles_org ON employer_profiles(org_id, employer_role);
