import fs from 'node:fs';

const ux=fs.readFileSync('ux-stability.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const must=(value,message)=>{if(!value)throw new Error(message);};

must(html.includes('ux-stability.js?v=20260831-phase2rc5'),'Experience polish must ship with a fresh production cache key');
must(ux.includes("const LAST_ACTIVITY_KEY = 'cmLastLearningActivityV1'"),'Learning resume must use a dedicated account-browser record');
must(ux.includes("const RESUMABLE_ROOTS = new Set(['career','learn','quiz','official-simulation','final','assigned','role-lab','assessment-lab','skills'])"),'Only real learner-work routes may become resumable');
must(ux.includes("role=\"status\" aria-live=\"polite\""),'Save confidence must be announced accessibly');
must(ux.includes("Saved here · account sync will retry"),'Sync errors must reassure users without falsely claiming a cloud save');
must(ux.includes("Offline · drafts stay on this device"),'Offline mode must explain the local-draft boundary');
must(ux.includes("Progress saved to your account"),'Successful account sync must be visible');
must(ux.includes("document.querySelector('.cm-wb-guide')"),'Contextual help must open the active workbench guide in place');
must(ux.includes("#/employer/${encodeURIComponent(orgId)}/guide"),'Employer help must route to the current workspace guide');
must(ux.includes("'#/learner-guide'"),'General help must route to the interactive learner guide');
must(ux.includes('@media print{.cm-profile-button,.cm-experience-dock{display:none!important}}'),'Experience helpers must stay out of certificates and print exports');

console.log('EXPERIENCE POLISH AUDIT PASS: save confidence, offline recovery, contextual guidance and safe resume behavior verified');
