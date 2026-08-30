import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const migration = fs.readFileSync('migrations/016_phase2_career_skills_track_constraints.sql', 'utf8');

if (!migration.includes("'career_skills'")) throw new Error('Migration does not add career_skills constraints');
if (!migration.includes("'career'")) throw new Error('Migration does not add Career Skills completion target');
if (!/PRAGMA\s+defer_foreign_keys\s*=\s*ON/i.test(migration)) throw new Error('Migration must defer foreign-key checks for the D1 parent-table rebuild');
if (!/PRAGMA\s+defer_foreign_keys\s*=\s*OFF/i.test(migration)) throw new Error('Migration must restore deferred foreign-key checking');
if (/PRAGMA\s+foreign_keys\s*=\s*OFF/i.test(migration)) throw new Error('Migration must not use foreign_keys=OFF; D1 implicit transactions require defer_foreign_keys');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-track-schema-'));
const migrationPath = path.join(temp, 'migration.sql');
fs.writeFileSync(migrationPath, migration);

const python = String.raw`
import sqlite3, sys

migration_path = sys.argv[1]
conn = sqlite3.connect(':memory:')
conn.execute('PRAGMA foreign_keys = ON')
conn.executescript('''
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE cohorts (
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
CREATE TABLE program_assignments (
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
CREATE TABLE cohort_members (
  cohort_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  PRIMARY KEY (cohort_id, uid),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);
CREATE TABLE firm_content (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  assignment_id TEXT,
  pathway_id TEXT NOT NULL,
  title TEXT NOT NULL,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (assignment_id) REFERENCES program_assignments(id)
);
''')
conn.execute("INSERT INTO organizations(id,name) VALUES('org_old','Existing Firm')")
conn.execute("INSERT INTO cohorts(id,org_id,name,pathway_id,program_level,status,created_by_uid) VALUES('coh_old','org_old','Existing Cohort','investment-banking','professional','active','owner')")
conn.execute("INSERT INTO program_assignments(id,org_id,cohort_id,pathway_id,track,credential_target,status,created_by_uid) VALUES('asn_old','org_old','coh_old','investment-banking','professional','professional_readiness','published','owner')")
conn.execute("INSERT INTO cohort_members(cohort_id,org_id,uid) VALUES('coh_old','org_old','learner_old')")
conn.execute("INSERT INTO firm_content(id,org_id,assignment_id,pathway_id,title) VALUES('fc_old','org_old','asn_old','investment-banking','Existing Firm Layer')")
conn.commit()

try:
    conn.execute("INSERT INTO cohorts(id,org_id,name,pathway_id,program_level,status,created_by_uid) VALUES('coh_should_fail','org_old','Bad','investment-banking','career_skills','draft','owner')")
    raise AssertionError('Original cohort CHECK unexpectedly accepted career_skills')
except sqlite3.IntegrityError:
    conn.rollback()

# Cloudflare D1 executes a query/migration inside an implicit transaction. Model
# that explicitly here rather than sqlite3.executescript(), which autocommits and
# would incorrectly reset defer_foreign_keys between statements.
with open(migration_path, 'r', encoding='utf-8') as fh:
    migration_sql = fh.read()
conn.execute('BEGIN')
try:
    for statement in migration_sql.split(';'):
        statement = statement.strip()
        if statement:
            conn.execute(statement)
    conn.commit()
except Exception:
    conn.rollback()
    raise

# Existing data and dependent foreign keys must survive the parent-table rebuild.
assert conn.execute('PRAGMA foreign_keys').fetchone() == (1,)
assert conn.execute("SELECT program_level FROM cohorts WHERE id='coh_old'").fetchone() == ('professional',)
assert conn.execute("SELECT credential_target FROM program_assignments WHERE id='asn_old'").fetchone() == ('professional_readiness',)
assert conn.execute("SELECT assignment_id FROM firm_content WHERE id='fc_old'").fetchone() == ('asn_old',)
assert conn.execute("SELECT cohort_id FROM cohort_members WHERE uid='learner_old'").fetchone() == ('coh_old',)
assert conn.execute('PRAGMA foreign_key_check').fetchall() == []

# The exact Phase 2 values used by Quick Assign must now be accepted.
conn.execute("INSERT INTO cohorts(id,org_id,name,pathway_id,program_level,status,created_by_uid) VALUES('coh_cs','org_old','Career Skills Cohort','private-equity','career_skills','active','owner')")
conn.execute("INSERT INTO program_assignments(id,org_id,cohort_id,pathway_id,track,credential_target,status,created_by_uid) VALUES('asn_cs','org_old','coh_cs','private-equity','career_skills','career','published','owner')")
conn.execute("INSERT INTO cohort_members(cohort_id,org_id,uid) VALUES('coh_cs','org_old','learner_cs')")
conn.execute("INSERT INTO firm_content(id,org_id,assignment_id,pathway_id,title) VALUES('fc_cs','org_old','asn_cs','private-equity','Career Skills Firm Layer')")
conn.commit()
assert conn.execute("SELECT program_level FROM cohorts WHERE id='coh_cs'").fetchone() == ('career_skills',)
assert conn.execute("SELECT track,credential_target FROM program_assignments WHERE id='asn_cs'").fetchone() == ('career_skills','career')
assert conn.execute('PRAGMA foreign_key_check').fetchall() == []
print('SQLITE CAREER SKILLS ENTERPRISE MIGRATION EXECUTION PASS')
`;

const result = spawnSync('python3', ['-c', python, migrationPath], { encoding:'utf8' });
if (result.status !== 0) {
  throw new Error(`Career Skills schema migration execution failed:\n${result.stdout}\n${result.stderr}`);
}
process.stdout.write(result.stdout);
console.log('CAREER SKILLS ENTERPRISE SCHEMA MIGRATION AUDIT PASS: D1-style transaction defers FK checks, preserves existing foreign keys/data, keeps FK enforcement on, and accepts Phase 2 Career Skills rows');
