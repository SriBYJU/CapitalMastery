import fs from 'node:fs';

const tracks=fs.readFileSync('training-tracks.js','utf8');
const enterprise=fs.readFileSync('enterprise-v2.js','utf8');
const worker=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8');
const css=fs.readFileSync('training-tracks.css','utf8');
const must=(c,m)=>{if(!c)throw new Error(m);};

must(tracks.includes('Five verified credentials. Full role-readiness evidence.'), 'Professional self-directed sequence missing');
must(tracks.includes('Four verified credentials. Shorter, still practical.'), 'Career Skills self-directed sequence missing');
must(tracks.includes('#/role-lab/'), 'Professional self-directed Role Lab route missing');
must(tracks.includes('#/diagnostic/'), 'Professional baseline diagnostic route missing');
must(tracks.includes('Career Skills capstone is part of the shorter program') || tracks.includes('shorter Career Skills capstone'), 'Professional route guard must keep the shorter capstone out of the flagship path');
must(tracks.includes('Role Lab and the Professional Readiness Final are reserved for the advanced program'), 'Career Skills must be blocked from advanced-only routes');
must(css.includes('.cm-track-sequence-grid'), 'Track sequence responsive UI missing');

must(enterprise.includes("assignedProgressSummary(report,a.track)"), 'Assigned progress must use the actual program track');
must(enterprise.includes("track==='career_skills'"), 'Employer surfaces must understand Career Skills');
must(enterprise.includes('Career Skills assignment'), 'Employer reporting must explain the shorter scope');
must(enterprise.includes('CM_TRAINING_TRACKS.setTrack'), 'Assigned program must synchronize the learner UI program level');

must(worker.includes("a.credential_target==='career'"), 'Employer completion must resolve the Career Skills credential target');
must(worker.includes("credential_level='career' AND status='active'"), 'Career Skills completion must recognize a verified portable Career credential');
must(worker.includes('track:a.track'), 'Employer readiness report must expose assignment track');
must(worker.includes('Career Skills Certificate'), 'Worker credential title must identify Career Skills');

console.log('two-track-consistency-audit: PASS');
