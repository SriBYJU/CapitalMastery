from pathlib import Path


def replace(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old in text:
        text = text.replace(old, new)
        p.write_text(text)
        print(f'updated {path}')
    else:
        print(f'no-op {path}: target already changed or absent')


replace(
    'tests/career-skills-track-audit.mjs',
    "must(worker.includes('{ id: \"career\", title: \"Career Skills Certificate\", track: \"career_skills\"'), 'Enterprise catalog must expose Career Skills Certificate');",
    "must(worker.includes('programCompletions:'), 'Enterprise catalog must separate program completion from the verified credential ladder');\nmust(worker.includes('{ id: \"career\", title: \"Career Skills Program Completion Certificate\", track: \"career_skills\"'), 'Enterprise catalog must expose Career Skills program completion separately');"
)

replace(
    'tests/failure-seeking-round2-audit.mjs',
    "ok(tracks.includes('Complete the realistic server-graded job simulation and earn Career Skills'), 'Career Skills capstone must be explicitly authoritative/server graded');",
    "ok(tracks.includes('Complete the realistic server-graded job simulation and earn the program-completion certificate'), 'Career Skills capstone must remain explicitly authoritative/server graded while using program-completion semantics');"
)

# Dedicated invariant: the Standard 2.0 ladder is exactly five levels. The
# authoritative `career` record remains supported only as program completion.
Path('tests/career-skills-five-level-boundary-audit.mjs').write_text("""import fs from 'node:fs';
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const tracks=fs.readFileSync('training-tracks.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const verify=fs.readFileSync('public-certificate-verify.js','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};
const ladder=worker.match(/credentialLadder: \\[([\\s\\S]*?)\\],\\n          programCompletions:/)?.[1]||'';
const ids=[...ladder.matchAll(/id: \"([^\"]+)\"/g)].map(m=>m[1]);
must(JSON.stringify(ids)===JSON.stringify(['foundations','essentials','applied','role_lab','professional_readiness']),`Expected exactly five Standard 2.0 levels; got ${ids.join(', ')}`);
must(!/id: \"career\"/.test(ladder),'Career program completion must not be a Standard 2.0 ladder level');
must(worker.includes('programCompletions:'),'Worker catalog must expose program completions separately');
must(worker.includes('{ id: \"career\", title: \"Career Skills Program Completion Certificate\"'),'Career Skills completion descriptor missing');
must(tracks.includes('verifiedCredentialCount: 3'),'Career Skills must count three verified credentials');
must(tracks.includes('3 verified Standard 2.0 credentials + 1 program-completion certificate'),'Career Skills UI must state three verified credentials plus completion certificate');
must(tracks.includes('5 Standard 2.0 career credentials'),'Professional Readiness must remain five verified credentials');
must(enterprise.includes('programCompletions?.find'),'Employer UI must resolve program completion separately from credential ladder');
must(verify.includes('not a sixth Standard 2.0 credential'),'Public verification must disclose that Career Skills completion is not a sixth credential');
must(worker.includes("credential_level='career'"),'Legacy/current career completion records must remain compatible');
console.log('CAREER SKILLS FIVE-LEVEL BOUNDARY AUDIT PASS');
""")
