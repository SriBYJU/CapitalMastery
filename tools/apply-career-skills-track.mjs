import fs from 'node:fs';

function load(path){ return fs.readFileSync(path,'utf8'); }
function save(path,text){ fs.writeFileSync(path,text); }
function once(text, from, to, label){
  const first=text.indexOf(from);
  if(first<0) throw new Error(`Patch target missing: ${label}`);
  if(text.indexOf(from,first+from.length)>=0) throw new Error(`Patch target is ambiguous: ${label}`);
  return text.slice(0,first)+to+text.slice(first+from.length);
}

const workerPath='v2/worker-v2-phase1-release.js';
let worker=load(workerPath);

worker=once(
  worker,
  'enterpriseEnum(body.programLevel || "professional", ["foundations", "essentials", "professional"], "program level")',
  'enterpriseEnum(body.programLevel || "professional", ["foundations", "essentials", "career_skills", "professional"], "program level")',
  'cohort program-level enum'
);
worker=once(
  worker,
  'enterpriseEnum(body.track || "professional", ["foundations", "professional"], "track")',
  'enterpriseEnum(body.track || "professional", ["foundations", "career_skills", "professional"], "track")',
  'assignment track enum'
);
worker=once(
  worker,
  '["foundations", "essentials", "applied", "role_lab", "professional_readiness"], "credential target")',
  '["foundations", "essentials", "applied", "career", "role_lab", "professional_readiness"], "credential target")',
  'assignment credential-target enum'
);
worker=once(
  worker,
  'if (track === "foundations" && !["foundations", "essentials"].includes(target)) throw new HttpError(400, "Foundations track cannot target a professional credential");',
  'if (track === "foundations" && !["foundations", "essentials"].includes(target)) throw new HttpError(400, "Foundations track cannot target a professional credential");\n            if (track === "career_skills" && target !== "career") throw new HttpError(400, "Career Skills assignments must target the Career Certificate");',
  'Career Skills target validation'
);
worker=once(
  worker,
  '{ id: "applied", title: "Applied Skills Certificate", track: "professional", level: "advanced" },\n            { id: "role_lab", title: "Role Lab Certificate", track: "professional", level: "advanced" },',
  '{ id: "applied", title: "Applied Skills Certificate", track: "career_skills", level: "applied" },\n            { id: "career", title: "Career Skills Certificate", track: "career_skills", level: "applied" },\n            { id: "role_lab", title: "Role Lab Certificate", track: "professional", level: "advanced" },',
  'enterprise credential ladder Career Skills entry'
);
worker=once(
  worker,
  'if (level === "career") {\n    return [\n      "part-1",\n      "part-2",\n      "part-3",\n      "part-4",\n      "part-5",\n      "simulation",\n      "final"\n    ];\n  }',
  'if (level === "career") {\n    return [\n      "part-1",\n      "part-2",\n      "part-3",\n      "part-4",\n      "part-5",\n      "simulation"\n    ];\n  }',
  'legacy Career Certificate eligibility'
);
save(workerPath,worker);

const enterprisePath='enterprise-v2.js';
let enterprise=load(enterprisePath);

enterprise=once(
  enterprise,
  '  professional: [\n      { id:\'foundations-core\'',
  '  career_skills: [\n      { id:\'foundations-core\', title:\'Career Foundations + Technical Core\', copy:\'Learn the role and technical core, then prove the taught fundamentals.\', required:true },\n      { id:\'career-essentials\', title:\'Essentials Mini Case\', copy:\'Apply the core concepts in a short secure case and earn Essentials.\', required:true },\n      { id:\'applied-skills\', title:\'Professional Toolkit + Applied Work\', copy:\'Use role-native workbooks, research, memos and guided practice before independent work.\', required:true },\n      { id:\'career-capstone\', title:\'Career Skills Capstone\', copy:\'Complete the practical job simulation and earn the Career Certificate.\', required:true },\n      { id:\'optional-interview-prep\', title:\'Interview Prep\', copy:\'Optional role-specific recruiting practice that can be hidden for employer cohorts.\', required:false }\n    ],\n    professional: [\n      { id:\'foundations-core\'',
  'Career Skills Standard stages'
);
enterprise=once(
  enterprise,
  '<label><input type="radio" name="track" value="foundations"><b>Foundations</b><small>Beginner-friendly role introduction + Essentials mini case.</small></label><label><input type="radio" name="track" value="professional" checked><b>Professional Readiness</b><small>Diagnostic, technical work, applied skills, Role Lab, final readiness.</small></label>',
  '<label><input type="radio" name="track" value="career_skills"><b>Career Skills</b><small>Shorter practical program: Foundations, Essentials, Applied Skills and a realistic capstone Career Certificate.</small></label><label><input type="radio" name="track" value="professional" checked><b>Professional Readiness</b><small>Advanced program: full technical work, Applied Skills, Role Lab, revisions, final and readiness evidence.</small></label>',
  'Quick Assign two-track choices'
);
enterprise=once(
  enterprise,
  "programLevel:track==='professional'?'professional':'foundations'",
  "programLevel:track==='professional'?'professional':'career_skills'",
  'Quick Assign cohort program level'
);
enterprise=once(
  enterprise,
  "credentialTarget:track==='professional'?'professional_readiness':'essentials'",
  "credentialTarget:track==='professional'?'professional_readiness':'career'",
  'Quick Assign Career Skills target'
);
enterprise=once(
  enterprise,
  "    const applied=activeLevel('applied');\n    const roleCredential=activeLevel('role_lab');",
  "    const applied=activeLevel('applied');\n    const career=activeLevel('career');\n    const roleCredential=activeLevel('role_lab');",
  'assigned-stage Career credential lookup'
);
enterprise=once(
  enterprise,
  "    if(stage.id==='essentials-mini-case'||stage.id==='essentials-assessment') return essentials?{label:'Complete · Essentials earned',tone:'complete'}:{label:diagnostic?'Ready to take':'Locked · baseline first',tone:diagnostic?'ready':'locked'};\n    if(stage.id==='applied-skills') return applied?{label:'Complete · Applied Skills earned',tone:'complete'}:{label:essentials?'Ready to complete':'Locked · Essentials first',tone:essentials?'ready':'locked'};",
  "    if(stage.id==='essentials-mini-case'||stage.id==='essentials-assessment') return essentials?{label:'Complete · Essentials earned',tone:'complete'}:{label:diagnostic?'Ready to take':'Locked · baseline first',tone:diagnostic?'ready':'locked'};\n    if(stage.id==='career-essentials') return essentials?{label:'Complete · Essentials earned',tone:'complete'}:{label:foundations?'Ready to take':'Locked · Foundations first',tone:foundations?'ready':'locked'};\n    if(stage.id==='applied-skills') return applied?{label:'Complete · Applied Skills earned',tone:'complete'}:{label:essentials?'Ready to complete':'Locked · Essentials first',tone:essentials?'ready':'locked'};\n    if(stage.id==='career-capstone') return career?{label:'Complete · Career Certificate earned',tone:'complete'}:{label:applied?'Ready · Open capstone':'Locked · Applied Skills first',tone:applied?'ready':'locked'};",
  'Career Skills assigned-stage evidence states'
);
enterprise=once(
  enterprise,
  "`<a class=\"btn btn-primary\" href=\"#/career/${encodeURIComponent(publicPathId(a.pathwayId))}\">1 · Open Foundations Learning</a><a class=\"btn btn-gold\" href=\"#/v2-assessment/${encodeURIComponent(assessmentKey(a.pathwayId,'essentials'))}?assignment=${encodeURIComponent(a.id)}\">2 · Essentials Mini Case</a><a class=\"btn btn-outline\" href=\"#/skills/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}\">Skill Profile</a>`",
  "`<a class=\"btn btn-primary\" href=\"#/career/${encodeURIComponent(publicPathId(a.pathwayId))}\">1 · Open Foundations + Technical Core</a><a class=\"btn btn-gold\" href=\"#/v2-assessment/${encodeURIComponent(assessmentKey(a.pathwayId,'essentials'))}?assignment=${encodeURIComponent(a.id)}\">2 · Essentials Mini Case</a><a class=\"btn btn-primary\" href=\"#/learn/${encodeURIComponent(publicPathId(a.pathwayId))}/3\">3 · Professional Toolkit</a><a class=\"btn btn-primary\" href=\"#/learn/${encodeURIComponent(publicPathId(a.pathwayId))}/4\">4 · Applied Work</a><a class=\"btn btn-gold\" href=\"#/simulation/${encodeURIComponent(publicPathId(a.pathwayId))}\">5 · Career Skills Capstone</a><a class=\"btn btn-outline\" href=\"#/skills/${encodeURIComponent(a.pathwayId)}?assignment=${encodeURIComponent(a.id)}\">Skill Profile</a>`",
  'Career Skills assigned-program actions'
);
save(enterprisePath,enterprise);

const appPath='app.js';
let app=load(appPath);
app=once(
  app,
  "return [1,2,3,4,5].every(p=>cs.completedParts.includes(p)) && [1,2,3,4].every(q) && Number(cs.simulationKnowledge||0)>=PASS && Number(cs.simulationScore||0)>=PASS && Number(cs.finalScore||0)>=PASS;",
  "return [1,2,3,4,5].every(p=>cs.completedParts.includes(p)) && [1,2,3,4].every(q) && Number(cs.simulationKnowledge||0)>=PASS && Number(cs.simulationScore||0)>=PASS;",
  'local Career Certificate eligibility'
);
app=once(
  app,
  "const description=isCareer?'for demonstrating mastery across required learning, technical assessments, applied work, a graded job simulation, and the Professional Readiness Final under the Capital Mastery Standard.'",
  "const description=isCareer?'for demonstrating mastery across required learning, technical assessments, applied work and a graded Career Skills job simulation under the Capital Mastery Standard.'",
  'Career Certificate description'
);
app=app.replaceAll("type==='career'?', a graded job simulation and a final professional assessment':''","type==='career'?', and a graded Career Skills job simulation':''");
app=app.replaceAll("type==='career'?' and completed a graded job simulation plus final assessment':''","type==='career'?' and completed a graded Career Skills job simulation':''");
app=once(
  app,
  "<p>Every final Career Certificate requires 80%+ on knowledge, simulation and final assessment.</p>",
  "<p>Career Skills Certificates require 80%+ mastery through the practical simulation. Professional Readiness adds the advanced Role Lab, final assessment, complete evidence coverage and critical competency floors.</p>",
  'About credential hierarchy copy'
);
save(appPath,app);

console.log('Career Skills track patch applied successfully.');
