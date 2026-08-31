(() => {
  'use strict';

  const PASS = 80;
  const CAREER_SKILLS = 'career-skills';
  const PROFESSIONAL = 'professional-readiness';
  const TRACK_PREFIX = 'capitalMasteryTrainingTrackV1:';
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_STATE_KEY = 'capitalMasteryQaStateV2';

  const COURSE_SEQUENCE = Object.freeze({
    [CAREER_SKILLS]: sequence(CAREER_SKILLS,[
      stage('part-1','Foundations learning','learning',null),
      stage('part-1-assessment','Foundations assessment','assessment','part-1'),
      stage('part-2','Essentials learning','learning','part-1-assessment'),
      stage('part-2-assessment','Essentials assessment','assessment','part-2'),
      stage('part-3','Toolkit learning','learning','part-2-assessment'),
      stage('part-3-assessment','Toolkit assessment','assessment','part-3'),
      stage('part-4','Applied Skills learning','learning','part-3-assessment'),
      stage('part-4-assessment','Applied Skills assessment','assessment','part-4'),
      stage('part-5','Capstone briefing','learning','part-4-assessment'),
      stage('part-5-assessment','Capstone knowledge check','assessment','part-5'),
      stage('simulation','Career Skills job simulation','simulation','part-5-assessment')
    ]),
    [PROFESSIONAL]: sequence(PROFESSIONAL,[
      stage('part-1','Foundations learning','learning',null),
      stage('part-1-assessment','Foundations assessment','assessment','part-1'),
      stage('part-2','Essentials learning','learning','part-1-assessment'),
      stage('part-2-assessment','Essentials assessment','assessment','part-2'),
      stage('part-3','Toolkit learning','learning','part-2-assessment'),
      stage('part-3-assessment','Toolkit assessment','assessment','part-3'),
      stage('part-4','Applied Skills learning','learning','part-3-assessment'),
      stage('part-4-assessment','Applied Skills assessment','assessment','part-4'),
      stage('part-5','Role Lab briefing','learning','part-4-assessment'),
      stage('part-5-assessment','Role Lab knowledge check','assessment','part-5'),
      stage('role-lab','Professional Role Lab','role_lab','part-5-assessment'),
      stage('professional-final','Professional Readiness Final','final','role-lab'),
      stage('readiness','Readiness evidence review','readiness','professional-final')
    ])
  });

  function stage(id,name,type,prerequisite){
    return {id,name,type,prerequisite};
  }

  function sequence(track,definitions){
    return Object.freeze(definitions.map((entry,index)=>Object.freeze({
      ...entry,
      track,
      completionSource:entry.type==='learning'?'firestore-local-sync':entry.type==='role_lab'?'d1-role-lab-runs':entry.type==='readiness'?'d1-readiness-evidence':'d1-official-results',
      passThreshold:['assessment','simulation','role_lab','final'].includes(entry.type)?PASS:null,
      nextStageId:definitions[index+1]?.id||null,
      credentialEffect:credentialEffect(track,entry.id)
    })));
  }

  function credentialEffect(track,stageId){
    const effects={
      'part-1-assessment':'foundations',
      'part-2-assessment':'essentials',
      'part-4-assessment':'applied',
      'role-lab':'role_lab',
      'professional-final':'professional_readiness'
    };
    if(track===CAREER_SKILLS&&stageId==='simulation') return 'career_program_completion';
    return effects[stageId]||null;
  }

  function safeParse(raw){
    try { const value=JSON.parse(raw||'null'); return value&&value.version===1?value:null; }
    catch (_) { return null; }
  }

  function readState({qaPreview=false}={}){
    return safeParse(localStorage.getItem(qaPreview?QA_STATE_KEY:STATE_KEY)) || {version:1,careers:{},credentials:[]};
  }

  function selectedTrack(pathway){
    return localStorage.getItem(TRACK_PREFIX+pathway)===CAREER_SKILLS?CAREER_SKILLS:PROFESSIONAL;
  }

  function apiPathway(pathway){
    if(pathway==='quant-finance') return 'quantitative-finance';
    if(['fpa','fp-a','fp&a'].includes(pathway)) return 'fp-and-a';
    return pathway;
  }

  function itemForStage(stageId){
    const part=/^part-(\d+)(?:-assessment)?$/.exec(stageId||'');
    if(part) return `part-${part[1]}`;
    if(stageId==='professional-final') return 'final';
    return stageId;
  }

  function localScore(careerState,itemId){
    if(!careerState) return null;
    if(itemId==='simulation') return finiteOrNull(careerState.simulationScore);
    if(itemId==='final') return finiteOrNull(careerState.finalScore);
    const part=/^part-(\d+)$/.exec(itemId||'');
    if(!part) return null;
    const n=Number(part[1]);
    return finiteOrNull(n===5?careerState.simulationKnowledge:careerState.quizScores?.[n]);
  }

  function finiteOrNull(value){
    if(value===null||value===undefined||value==='') return null;
    const number=Number(value);
    return Number.isFinite(number)?number:null;
  }

  function authoritativeRecord(rows,itemId){
    return (Array.isArray(rows)?rows:[]).find(row=>String(row.item_id||'')===itemId)||null;
  }

  function resultFromRecord(record,source='server'){
    if(!record) return null;
    const score=finiteOrNull(record.best_score??record.score);
    const attempts=Number(record.attempt_count??record.attempts??1);
    const completionFlag=record.completed??record.passed??(record.status==='passed'||record.status==='ready');
    const passed=Number(completionFlag)===1&&Number(score)>=PASS;
    return {score,bestScore:score,attempts:Number.isFinite(attempts)?attempts:1,attempted:true,passed,completed:passed,failed:!passed,reviewAvailable:true,source,attemptId:record.attempt_id??record.id??null,updatedAt:record.updated_at??record.submitted_at??null};
  }

  function v2Record(rows,predicate){
    const matches=(Array.isArray(rows)?rows:[]).filter(predicate);
    if(!matches.length) return null;
    return matches.sort((a,b)=>Number(b.passed)-Number(a.passed)||Number(b.score)-Number(a.score)||String(b.submitted_at||'').localeCompare(String(a.submitted_at||'')))[0];
  }

  function resultFor({stage,pathway,careerState,itemId,authoritativeRows,v2Attempts,roleLabRuns,readinessEvidence,authenticated,qaPreview}){
    if(stage.type==='learning'){
      const part=Number((/^part-(\d+)/.exec(stage.id)||[])[1]);
      const completed=Array.isArray(careerState?.learningComplete)&&careerState.learningComplete.includes(part);
      return {score:null,bestScore:null,attempts:completed?1:0,attempted:completed,passed:completed,completed,failed:false,reviewAvailable:completed,source:qaPreview?'qa-preview':'firestore-local-sync',attemptId:null,updatedAt:null};
    }
    let official=authoritativeRecord(authoritativeRows,itemId);
    if(stage.type==='final') official=v2Record(v2Attempts,row=>String(row.pathway_id||'')===apiPathway(pathway)&&/professional-final$/.test(String(row.assessment_key||'')))||official;
    if(stage.type==='role_lab') official=v2Record(roleLabRuns,row=>String(row.pathway_id||'')===apiPathway(pathway));
    if(stage.type==='readiness'&&readinessEvidence) official={...readinessEvidence,score:readinessEvidence.overall_score??readinessEvidence.score,passed:readinessEvidence.status==='ready'||readinessEvidence.passed,completed:readinessEvidence.status==='ready'||readinessEvidence.passed};
    if(official){
      return resultFromRecord(official,'server');
    }
    if(authenticated&&!qaPreview) return {score:null,bestScore:null,attempts:0,attempted:false,passed:false,completed:false,failed:false,reviewAvailable:false,source:'server',attemptId:null,updatedAt:null};
    const score=localScore(careerState,itemId);
    const attempted=score!==null;
    const passed=Number(score)>=PASS;
    return {score,bestScore:score,attempts:attempted?1:0,attempted,passed,completed:passed,failed:attempted&&!passed,reviewAvailable:attempted,source:qaPreview?'qa-preview':'learner-local',attemptId:null,updatedAt:null};
  }

  function routeFor(pathway,stageId,track=selectedTrack(pathway)){
    const id=encodeURIComponent(pathway);
    const api=encodeURIComponent(apiPathway(pathway));
    const part=/^part-(\d+)(-assessment)?$/.exec(stageId||'');
    if(part) return part[2]?`#/quiz/${id}/${part[1]}`:`#/learn/${id}/${part[1]}`;
    if(stageId==='simulation') return `#/official-simulation/${id}`;
    if(stageId==='role-lab') return `#/role-lab/${api}`;
    if(stageId==='professional-final') {
      const key=apiPathway(pathway)==='investment-banking'?'ib-professional-final':`${apiPathway(pathway)}-professional-final`;
      return `#/v2-assessment/${encodeURIComponent(key)}`;
    }
    if(stageId==='readiness') return `#/readiness/${api}`;
    return `#/career/${id}`;
  }

  function getNextCourseDestination({pathway,currentStage,track=selectedTrack(pathway),assignmentId=''}){
    const sequence=COURSE_SEQUENCE[track]||COURSE_SEQUENCE[PROFESSIONAL];
    const normalized=/^part-\d+$/.test(currentStage||'')?`${currentStage}-assessment`:currentStage;
    const index=sequence.findIndex(entry=>entry.id===normalized);
    const next=index>=0?sequence[index+1]:sequence[0];
    if(!next) return assignmentId?`#/assigned/${encodeURIComponent(assignmentId)}`:`#/career/${encodeURIComponent(pathway)}`;
    const route=routeFor(pathway,next.id,track);
    if(next.id==='simulation'&&assignmentId){
      return `${route}?assignment=${encodeURIComponent(assignmentId)}`;
    }
    return route;
  }

  function resolveLearnerCourseState(pathway,{track=selectedTrack(pathway),authoritativeRows=[],v2Attempts=[],roleLabRuns=[],readinessEvidence=null,assignment=null,credentials=[],authenticated=false,qaPreview=false,state=readState({qaPreview})}={}){
    const careerState=state?.careers?.[pathway]||{};
    const sequence=COURSE_SEQUENCE[track]||COURSE_SEQUENCE[PROFESSIONAL];
    const stages=sequence.map(entry=>{
      const itemId=itemForStage(entry.id);
      const route=routeFor(pathway,entry.id,track);
      const result=resultFor({stage:entry,pathway,careerState,itemId,authoritativeRows,v2Attempts,roleLabRuns,readinessEvidence,authenticated,qaPreview});
      return {...entry,itemId,route,nextRoute:entry.nextStageId?routeFor(pathway,entry.nextStageId,track):(assignment?.id?`#/assigned/${encodeURIComponent(assignment.id)}`:`#/career/${encodeURIComponent(pathway)}`),reviewRoute:result.reviewAvailable?`${route}${route.includes('?')?'&':'?'}review=1`:null,retakeRoute:['assessment','final'].includes(entry.type)?`${route}${route.includes('?')?'&':'?'}retake=1`:null,...result};
    });
    for(let i=0;i<stages.length;i++){
      const current=stages[i];
      const prerequisite=current.prerequisite?stages.find(candidate=>candidate.id===current.prerequisite):null;
      const available=!prerequisite||prerequisite.completed===true;
      if(!available&&current.source!=='server'){
        current.evidenceCompleted=current.completed;
        current.completed=false;
        current.passed=false;
        current.status='locked';
      }else{
        current.status=current.passed?'passed':current.failed?'failed':current.attempted?'in_progress':available?'available':'locked';
      }
      current.missingRequirements=current.status==='locked'&&prerequisite?[prerequisite.name]:[];
      current.lockReason=current.missingRequirements.length?`Complete ${current.missingRequirements.join(', ')} first.`:null;
      Object.freeze(current);
    }
    const next=stages.find(entry=>['available','in_progress','failed'].includes(entry.status));
    const credentialList=Array.isArray(credentials)&&credentials.length?credentials:(Array.isArray(state?.credentials)?state.credentials:[]);
    const earnedCredentials=credentialList.filter(item=>String(item.careerId??item.pathway_id??'')===pathway||String(item.pathway_id??'')===apiPathway(pathway));
    const pathwayComplete=stages.every(entry=>entry.completed===true);
    return Object.freeze({pathway,track,source:authenticated&&!qaPreview?'server':qaPreview?'qa-preview':'learner-local',assignmentState:assignment||null,stages:Object.freeze(stages),nextDestination:next?.route||(assignment?.id?`#/assigned/${encodeURIComponent(assignment.id)}`:`#/career/${encodeURIComponent(pathway)}`),pathwayCompletion:Object.freeze({completed:pathwayComplete,completedStages:stages.filter(entry=>entry.completed).length,totalStages:stages.length}),credentials:Object.freeze(earnedCredentials),readiness:readinessEvidence??careerState.readiness??null});
  }

  function getCourseAccessState({pathway,stageId,...options}){
    const course=resolveLearnerCourseState(pathway,options);
    const stage=course.stages.find(entry=>entry.id===stageId);
    return stage||{status:'locked',missingRequirements:['Unknown course stage'],route:`#/career/${encodeURIComponent(pathway)}`};
  }

  window.CM_COURSE_STATE=Object.freeze({PASS,CAREER_SKILLS,PROFESSIONAL,COURSE_SEQUENCE,selectedTrack,apiPathway,routeFor,getNextCourseDestination,resolveLearnerCourseState,getCourseAccessState});
})();
