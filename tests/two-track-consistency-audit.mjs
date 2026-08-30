import fs from 'node:fs';

const tracks=fs.readFileSync('training-tracks.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const css=fs.readFileSync('training-tracks.css','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};

must(tracks.includes('Five verified credentials. Full role-readiness evidence.'), 'Professional self-directed sequence missing');
must(tracks.includes('Three verified credentials + one completion certificate. Shorter, still practical.'), 'Career Skills sequence must distinguish verified credentials from completion');
must(tracks.includes('#/role-lab/'), 'Professional self-directed Role Lab route missing');
must(tracks.includes('#/diagnostic/'), 'Professional baseline diagnostic route missing');
must(tracks.includes('Career Skills capstone is part of the shorter program') || tracks.includes('shorter Career Skills capstone'), 'Professional route guard must keep the shorter capstone out of the flagship path');
must(tracks.includes('Role Lab and the Professional Readiness Final are reserved for the advanced program'), 'Career Skills must be blocked from advanced-only routes');
must(css.includes('.cm-track-sequence-grid'), 'Track sequence responsive UI missing');

must(enterprise.includes("assignedProgressSummary(report,a.track)"), 'Assigned progress must use the actual program track');
must(enterprise.includes("track==='career_skills'"), 'Employer surfaces must understand Career Skills');
must(enterprise.includes('Career Skills assignment'), 'Employer reporting must explain the shorter scope');
must(enterprise.includes('CM_TRAINING_TRACKS.setTrack'), 'Assigned program must synchronize the learner UI program level');

must(worker.includes("a.credential_target==='career'"), 'Employer completion must resolve the Career Skills program-completion target');
must(worker.includes("program_completion_records WHERE uid=? AND org_id=? AND assignment_id=? AND pathway_id=? AND program_code='career_skills' AND status='active'"), 'Employer Career Skills completion must require exact assignment-scoped program-completion evidence');
must(worker.includes("credential_level='career' AND status='active'"), 'Portable Career Skills certificate compatibility must remain available outside assignment-scoped employer completion');
must(worker.includes('track:a.track'), 'Employer readiness report must expose assignment track');
must(worker.includes('Career Skills Program Completion Certificate'), 'Worker must expose Career Skills program completion separately');
must(worker.includes('programCompletions:'), 'Worker catalog must separate program completion from credentialLadder');
must(worker.includes("recordType:'program_completion'"), 'Assignment-scoped Career Skills proof must identify itself as a program-completion record, not a Standard credential');
must(worker.includes('requiredVerifiedCredentials:3'), 'Career Skills program completion must record exactly three required verified Standard credentials');

console.log('two-track-consistency-audit: PASS');