from pathlib import Path


def replace(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count:
        p.write_text(text.replace(old, new))
    print(f"{path}: {count} replacement(s) :: {old[:72]}")
    return count


# Learner-facing two-track model.
replace('training-tracks.js', 'verifiedCredentialCount: 4,', 'verifiedCredentialCount: 3,')
replace('training-tracks.js', "'Career Skills Certificate'", "'Career Skills Program Completion Certificate'")
replace('training-tracks.js', "evidenceModel: '4 verified credentials · Career Skills ends at the practical capstone'", "evidenceModel: '3 verified Standard 2.0 credentials + 1 program-completion certificate'")
replace('training-tracks.js', '<span>${t.verifiedCredentialCount} credentials</span>', "<span>${professional?`${t.verifiedCredentialCount} verified credentials`:`${t.verifiedCredentialCount} verified credentials + completion certificate`}</span>")
replace('training-tracks.js', '<span class="cm-track-badge">${t.verifiedCredentialCount} credentials</span>', '<span class="cm-track-badge">${professional?`${t.verifiedCredentialCount} verified credentials`:`${t.verifiedCredentialCount} verified + completion certificate`}</span>')
replace('training-tracks.js', 'Complete the core pathway and practical capstone to earn the Career Skills Certificate. Switch to Professional Readiness later without repeating completed stages.', 'Complete the core pathway and practical capstone to earn the Career Skills Program Completion Certificate. Your three verified milestones carry into Professional Readiness, so upgrading does not repeat completed stages.')
replace('training-tracks.js', "['04','Career Skills Capstone','Complete the realistic server-graded job simulation and earn Career Skills'", "['04','Career Skills Capstone','Complete the realistic server-graded job simulation and earn the program-completion certificate'")
replace('training-tracks.js', "'Four verified credentials. Shorter, still practical.'", "'Three verified credentials + one completion certificate. Shorter, still practical.'")
replace('training-tracks.js', "const copy='Career Skills: 4 credentials · Professional Readiness: 5 credentials';", "const copy='Career Skills: 3 verified + completion certificate · Professional Readiness: 5 verified credentials';")
replace('training-tracks.js', '<article class="card"><div class="cm-track-public-top"><span>CAREER SKILLS</span><b>4 verified credentials</b></div>', '<article class="card"><div class="cm-track-public-top"><span>CAREER SKILLS</span><b>3 verified + completion certificate</b></div>')
replace('training-tracks.js', 'The shorter credential never substitutes for the advanced Role Lab or Professional Readiness credential.', 'The Career Skills completion certificate is not a sixth Standard 2.0 credential and never substitutes for the advanced Role Lab or Professional Readiness credential.')
replace('training-tracks.js', '<strong>4 credentials</strong>', '<strong>3 verified + completion certificate</strong>')

# Employer UI and exports. `career` remains an internal authoritative completion
# record key for backwards compatibility, but it is no longer a V2 ladder level.
replace('enterprise-v2.js', "return catalog?.credentialLadder?.find(c => c.id === id)?.title || String(id || '').replace(/_/g,' ').replace(/\\b\\w/g,m=>m.toUpperCase());", "return catalog?.credentialLadder?.find(c => c.id === id)?.title || catalog?.programCompletions?.find(c => c.id === id)?.title || String(id || '').replace(/_/g,' ').replace(/\\b\\w/g,m=>m.toUpperCase());")
replace('enterprise-v2.js', "copy:'Complete the practical job simulation and earn the Career Certificate.'", "copy:'Complete the practical job simulation and earn the Career Skills Program Completion Certificate.'")
replace('enterprise-v2.js', 'This shorter program is complete when the verified Career Skills Certificate is earned. Role Lab, Professional Final and Professional Readiness are intentionally not required.', 'This shorter program is complete when the Career Skills Program Completion Certificate is earned after the capstone. It sits outside the five-level Standard 2.0 credential ladder; Role Lab, Professional Final and Professional Readiness are intentionally not required.')
replace('enterprise-v2.js', "completionCredential:professional?'professional_readiness':'career'", "completionRecord:professional?'professional_readiness':'career',\n        verifiedCredentialCount:professional?5:3,\n        careerSkillsCompletionCertificate:professional?false:true")

# Worker enterprise catalog: exactly five verified Standard 2.0 levels.
worker_path = Path('v2/worker-v2-phase1-release.js')
worker = worker_path.read_text()
old_ladder = '''          credentialLadder: [
            { id: "foundations", title: "Foundations Certificate", track: "foundations", level: "beginner" },
            { id: "essentials", title: "Essentials Certificate", track: "foundations", level: "beginner" },
            { id: "applied", title: "Applied Skills Certificate", track: "career_skills", level: "applied" },
            { id: "career", title: "Career Skills Certificate", track: "career_skills", level: "applied" },
            { id: "role_lab", title: "Role Lab Certificate", track: "professional", level: "advanced" },
            { id: "professional_readiness", title: "Professional Readiness Certificate", track: "professional", level: "advanced" }
          ],'''
new_ladder = '''          credentialLadder: [
            { id: "foundations", title: "Foundations Credential", track: "career_skills", level: "foundational" },
            { id: "essentials", title: "Essentials Credential", track: "career_skills", level: "foundational" },
            { id: "applied", title: "Applied Skills Credential", track: "career_skills", level: "applied" },
            { id: "role_lab", title: "Role Lab Credential", track: "professional", level: "advanced" },
            { id: "professional_readiness", title: "Professional Readiness Credential", track: "professional", level: "advanced" }
          ],
          programCompletions: [
            { id: "career", title: "Career Skills Program Completion Certificate", track: "career_skills", verifiedCredentialLevel: false, requires: "practical_capstone" }
          ],'''
if old_ladder in worker:
    worker = worker.replace(old_ladder, new_ladder)
    worker_path.write_text(worker)
    print('worker ladder: replaced')
else:
    print('worker ladder: old block not found (already migrated or source changed)')

# Public verification remains authoritative and backwards-compatible, while clearly
# identifying `career` records as program completion instead of a sixth V2 level.
replace('public-certificate-verify.js', "label: 'Career Skills Certificate',", "label: 'Career Skills Program Completion Certificate',")
replace('public-certificate-verify.js', "description: 'for completing the shorter practical Career Skills program, including Foundations, Essentials, Applied Skills and the required role-specific capstone simulation.'", "description: 'for completing the shorter practical Career Skills program after the three verified Standard 2.0 milestones and the required role-specific capstone simulation. This completion certificate is not a sixth Standard 2.0 credential.'")
replace('public-certificate-verify.js', "const isCareer = levelKey === 'career';", "const isProgramCompletion = levelKey === 'career';")
replace('public-certificate-verify.js', "const isFlagship = isCareer || isProfessional;", "const isFlagship = isProfessional;")
replace('public-certificate-verify.js', "${isFlagship ? '<img class=\"cert-seal\" src=\"assets/seal.svg\" alt=\"Capital Mastery seal\">' : ''}", "${(isFlagship || isProgramCompletion) ? '<img class=\"cert-seal\" src=\"assets/seal.svg\" alt=\"Capital Mastery seal\">' : ''}")
replace('public-certificate-verify.js', "This certificate is ${isFlagship ? 'proudly ' : ''}awarded to", "This certificate is ${(isFlagship || isProgramCompletion) ? 'proudly ' : ''}awarded to")

# Update tests that previously asserted the incorrect sixth-level semantics.
replacements = {
    'tests/training-track-architecture-audit.mjs': [
        ("must(js.includes('verifiedCredentialCount: 4'), 'Career Skills must expose four verified credentials');", "must(js.includes('verifiedCredentialCount: 3'), 'Career Skills must expose exactly three verified Standard 2.0 credentials');"),
        ("must(js.includes(\"'Career Skills Certificate'\"), 'Career Skills capstone credential missing');", "must(js.includes(\"'Career Skills Program Completion Certificate'\"), 'Career Skills program-completion certificate missing');"),
        ("must(js.includes('4 verified credentials · Career Skills ends at the practical capstone'), 'Career Skills credential semantics missing');", "must(js.includes('3 verified Standard 2.0 credentials + 1 program-completion certificate'), 'Career Skills credential/completion distinction missing');"),
        ("must(js.includes('Career Skills: 4 credentials · Professional Readiness: 5 credentials'), 'Career directory count correction missing');", "must(js.includes('Career Skills: 3 verified + completion certificate · Professional Readiness: 5 verified credentials'), 'Career directory credential/completion distinction missing');")
    ],
    'tests/public-two-track-positioning-audit.mjs': [
        ("must(js.includes('4 verified credentials'), 'Career Skills public credential count missing');", "must(js.includes('3 verified + completion certificate'), 'Career Skills public credential/completion distinction missing');"),
        ("must(js.includes('shorter credential never substitutes for the advanced Role Lab'), 'Public comparison must preserve advanced credential boundary');", "must(js.includes('completion certificate is not a sixth Standard 2.0 credential'), 'Public comparison must preserve the five-level Standard 2.0 boundary');")
    ],
    'tests/public-credential-hierarchy-audit.mjs': [
        ("must(js.includes(\"label: 'Career Skills Certificate'\"), 'Career Skills certificate must be named explicitly');", "must(js.includes(\"label: 'Career Skills Program Completion Certificate'\"), 'Career Skills program completion certificate must be named explicitly');"),
        ("must(js.includes('shorter practical Career Skills program'), 'Career Skills description must reflect the shorter practical program');", "must(js.includes('not a sixth Standard 2.0 credential'), 'Career Skills completion certificate must be separated from the five-level Standard 2.0 ladder');"),
        ("must(js.includes('const isFlagship = isCareer || isProfessional'), 'Flagship visual treatment must cover both Career Skills and Professional Readiness');", "must(js.includes(\"const isProgramCompletion = levelKey === 'career'\"), 'Career Skills completion records must be typed as program completion');\nmust(js.includes('const isFlagship = isProfessional'), 'Only Professional Readiness is the flagship verified credential');")
    ],
    'tests/career-skills-report-export-audit.mjs': [
        ("must(enterprise.includes(\"completionCredential:professional?'professional_readiness':'career'\"), 'Evidence JSON must identify the correct completion credential');", "must(enterprise.includes(\"completionRecord:professional?'professional_readiness':'career'\"), 'Evidence JSON must identify the authoritative completion record separately');\nmust(enterprise.includes('verifiedCredentialCount:professional?5:3'), 'Evidence JSON must state verified credential count by program');")
    ],
    'tests/two-track-consistency-audit.mjs': [
        ("must(tracks.includes('Four verified credentials. Shorter, still practical.'), 'Career Skills self-directed sequence missing');", "must(tracks.includes('Three verified credentials + one completion certificate. Shorter, still practical.'), 'Career Skills sequence must distinguish verified credentials from completion');"),
        ("must(worker.includes('Career Skills Certificate'), 'Worker credential title must identify Career Skills');", "must(worker.includes('Career Skills Program Completion Certificate'), 'Worker must expose Career Skills program completion separately');\nmust(worker.includes('programCompletions:'), 'Worker catalog must separate program completion from credentialLadder');")
    ]
}
for path, pairs in replacements.items():
    for old, new in pairs:
        replace(path, old, new)

# End-state assertions make this script idempotent and fail closed if the source
# shape drifts materially.
checks = {
    'training-tracks.js': [
        'verifiedCredentialCount: 3',
        '3 verified Standard 2.0 credentials + 1 program-completion certificate',
        '5 Standard 2.0 career credentials'
    ],
    'enterprise-v2.js': [
        'programCompletions?.find',
        'completionRecord:professional?',
        'verifiedCredentialCount:professional?5:3'
    ],
    'v2/worker-v2-phase1-release.js': [
        'programCompletions:',
        'Career Skills Program Completion Certificate'
    ],
    'public-certificate-verify.js': [
        'not a sixth Standard 2.0 credential',
        'const isProgramCompletion'
    ]
}
for path, needles in checks.items():
    text = Path(path).read_text()
    for needle in needles:
        if needle not in text:
            raise SystemExit(f'Desired state missing in {path}: {needle}')

print('Career Skills credential semantics migration complete.')
