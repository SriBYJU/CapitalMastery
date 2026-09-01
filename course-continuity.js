(() => {
  'use strict';

  const API = window.CAPITAL_MASTERY_API_URL;
  const STATE_KEY = 'capitalMasteryLocalStateV1';
  const QA_KEY = 'capitalMasteryQaPreviewV1';
  const TRACK_PREFIX = 'capitalMasteryTrainingTrackV1:';
  const CAREER_SKILLS = 'career-skills';
  const PASS = 80;
  const progressCache = new Map();
  const progressInflight = new Map();

  function esc(v='') {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function parsedRoute() {
    const hash = String(location.hash || '#/');
    const [path, query=''] = hash.replace(/^#\/?/,'').split('?');
    const p = path.split('/').filter(Boolean);
    return { root:p[0] || '', pathway:p[1] ? safeDecode(p[1]) : '', rawPart:p[2] || '', query:new URLSearchParams(query), parts:p };
  }

  function safeDecode(v='') { try { return decodeURIComponent(String(v)); } catch (_) { return ''; } }

  function readState() {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      return s && s.version === 1 ? s : null;
    } catch (_) { return null; }
  }

  function qaMode() {
    return window.CM_AUTH?.ready === true && window.CM_AUTH?.isAdmin === true && localStorage.getItem(QA_KEY) === 'true';
  }

  function itemIdForPart(part) { return `part-${Number(part)}`; }

  function localBest(pathway, itemId) {
    const cs = readState()?.careers?.[pathway];
    if (!cs) return 0;
    if (itemId === 'final') return Number(cs.finalScore || 0);
    if (itemId === 'simulation') return Number(cs.simulationScore || 0);
    const m = /^part-(\d+)$/.exec(itemId || '');
    if (!m) return 0;
    const part = Number(m[1]);
    return part === 5 ? Number(cs.simulationKnowledge || 0) : Number(cs.quizScores?.[part] || 0);
  }

  function learningMarked(pathway, part) {
    const list = readState()?.careers?.[pathway]?.learningComplete;
    return Array.isArray(list) && list.includes(Number(part));
  }

  function selectedTrack(pathway) {
    const raw = localStorage.getItem(TRACK_PREFIX + pathway);
    return raw === CAREER_SKILLS ? CAREER_SKILLS : 'professional-readiness';
  }

  function continueHref(pathway, part) {
    if(window.CM_COURSE_STATE?.getNextCourseDestination){
      return window.CM_COURSE_STATE.getNextCourseDestination({pathway,currentStage:`part-${Number(part)}`,track:selectedTrack(pathway)});
    }
    const id = encodeURIComponent(pathway);
    if (part === 1) return `#/learn/${id}/2`;
    if (part === 2) return `#/achievement/${id}/foundations`;
    if (part === 3) return `#/learn/${id}/4`;
    if (part === 4) return `#/achievement/${id}/applied`;
    if (part === 5) return selectedTrack(pathway) === CAREER_SKILLS ? `#/official-simulation/${id}` : `#/role-lab/${encodeURIComponent(pathway==='quant-finance'?'quantitative-finance':pathway)}`;
    return `#/career/${id}`;
  }

  async function authToken() {
    return window.CM_AUTH?.getIdToken ? await window.CM_AUTH.getIdToken() : null;
  }

  async function progressRows(pathway, force=false) {
    if (!pathway || !API || !window.CM_AUTH?.user) return [];
    const cached = progressCache.get(pathway);
    if (!force && cached && Date.now() - cached.at < 15000) return cached.rows;
    if (!force && progressInflight.has(pathway)) return progressInflight.get(pathway);
    const request = (async () => {
      try {
        const token = await authToken();
        if (!token) return [];
        const response = await fetch(`${API}/progress/${encodeURIComponent(pathway)}`, { headers:{Authorization:`Bearer ${token}`} });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(data.progress)) return [];
        progressCache.set(pathway,{at:Date.now(),rows:data.progress});
        return data.progress;
      } catch (_) { return []; }
      finally { progressInflight.delete(pathway); }
    })();
    progressInflight.set(pathway, request);
    return request;
  }

  function rowBest(rows,itemId) {
    const row = (rows || []).find(x => String(x.item_id || '') === itemId);
    if (!row || Number(row.completed) !== 1) return 0;
    return Number(row.best_score || 0);
  }

  function mirrorAuthoritativePass(pathway,itemId,best) {
    if (Number(best) < PASS) return;
    const state = readState();
    if (!state) return;
    state.careers ||= {};
    state.careers[pathway] ||= {learningComplete:[],completedParts:[],quizScores:{},simulationKnowledge:null,simulationScore:null,finalScore:null,applied:{},simResponses:{},readiness:null};
    const cs = state.careers[pathway];
    cs.learningComplete = Array.isArray(cs.learningComplete) ? cs.learningComplete : [];
    cs.completedParts = Array.isArray(cs.completedParts) ? cs.completedParts : [];
    cs.quizScores ||= {};
    const partMatch = /^part-(\d+)$/.exec(itemId || '');
    if (partMatch) {
      const part = Number(partMatch[1]);
      if (!cs.learningComplete.includes(part)) cs.learningComplete.push(part);
      if (part <= 4) {
        cs.quizScores[part] = Math.max(Number(cs.quizScores[part] || 0), Number(best));
        if (!cs.completedParts.includes(part)) cs.completedParts.push(part);
      } else if (part === 5) {
        cs.simulationKnowledge = Math.max(Number(cs.simulationKnowledge || 0), Number(best));
      }
    } else if (itemId === 'simulation') {
      cs.simulationScore = Math.max(Number(cs.simulationScore || 0), Number(best));
      if (!cs.completedParts.includes(5)) cs.completedParts.push(5);
    } else if (itemId === 'final') {
      cs.finalScore = Math.max(Number(cs.finalScore || 0), Number(best));
    }
    localStorage.setItem(STATE_KEY,JSON.stringify(state));
    const uid = window.CM_AUTH?.user?.uid;
    if (uid) {
      state.profile ||= {};
      state.profile.accountUid = uid;
      localStorage.setItem(`capitalMasteryUserStateV1:${uid}`,JSON.stringify(state));
    }
    window.CM?.refreshLocalState?.();
  }

  async function authoritativeBest(pathway,itemId,{force=false}={}) {
    const local = localBest(pathway,itemId);
    if (local >= PASS) return local;
    const rows = await progressRows(pathway,force);
    const best = Math.max(local,rowBest(rows,itemId));
    if (best >= PASS) mirrorAuthoritativePass(pathway,itemId,best);
    return best;
  }

  function retakeHref(pathway,part) {
    return `#/quiz/${encodeURIComponent(pathway)}/${part}?retake=1&attempt=${Date.now()}`;
  }

  function renderSavedPass(pathway,part,best) {
    const r = parsedRoute();
    if (r.root !== 'quiz' || r.pathway !== pathway || Number(r.rawPart) !== Number(part) || r.query.get('retake') === '1') return;
    const main = document.querySelector('#app main#main');
    if (!main) return;
    if (main.querySelector('.cm-server-assessment-review')) return;
    const current = main.querySelector('.cm-assessment-review');
    if (current && Number(current.dataset.best || 0) >= Number(best || 0)) return;
    main.innerHTML = `<section class="section"><div class="container" style="max-width:860px"><div class="card cm-assessment-review cm-continuity-review passed" data-best="${Number(best)}"><div class="eyebrow">SAVED PASS · READ-ONLY REVIEW</div><div class="cm-result-score">${Number(best)}%</div><h1 class="serif">Assessment already passed.</h1><p>Your passed attempt is final and preserved. This route can only show Review now; it cannot create another attempt or lower your result.</p><div class="cm-result-actions"><a class="btn btn-gold" data-cm-pass-continue href="${esc(continueHref(pathway,part))}">Continue to next stage →</a><a class="btn btn-soft" href="#/learn/${encodeURIComponent(pathway)}/${part}">Review learning</a></div></div></div></section>`;
  }

  function applyLessonPass(pathway,part,best) {
    const r = parsedRoute();
    if (r.root !== 'learn' || r.pathway !== pathway || Number(r.rawPart) !== Number(part) || best < PASS) return;
    const actions = document.querySelector('#app main#main .lesson-actions');
    if (!actions) return;
    const quiz = actions.querySelector(`a[href^="#/quiz/${CSS.escape(pathway)}/${part}"]`) || actions.querySelector('a[href*="#/quiz/"]');
    if (!quiz) return;
    quiz.dataset.cmPassedAssessment = 'true';
    quiz.dataset.cmBestScore = String(best);
    quiz.href = continueHref(pathway,part);
    quiz.classList.remove('btn-primary');
    quiz.classList.add('btn-gold');
    quiz.textContent = `Continue — assessment already passed · ${Number(best)}% →`;
    let review = actions.querySelector('[data-cm-review-passed]');
    if (!review) {
      review = document.createElement('a');
      review.className = 'btn btn-soft';
      review.dataset.cmReviewPassed = 'true';
      actions.appendChild(review);
    }
    review.href = `#/quiz/${encodeURIComponent(pathway)}/${part}`;
    review.textContent = part === 5 ? 'Review passed knowledge check' : 'Review passed assessment';
    let status = actions.parentElement?.querySelector('.cm-lesson-pass-status');
    if (!status && actions.parentElement) {
      status = document.createElement('div');
      status.className = 'cm-lesson-pass-status';
      actions.parentElement.insertBefore(status,actions);
    }
    if (status) status.innerHTML = `<strong>✓ Assessment complete</strong><span>Best score ${Number(best)}% · Reviewing this lesson will not make you retake it.</span>`;
  }

  async function hydrateLessonPass() {
    const r = parsedRoute();
    if (r.root !== 'learn' || !r.pathway) return;
    const part = Number(r.rawPart);
    if (!Number.isFinite(part) || part < 1 || part > 5) return;
    const immediate = localBest(r.pathway,itemIdForPart(part));
    if (immediate >= PASS) applyLessonPass(r.pathway,part,immediate);
    const best = await authoritativeBest(r.pathway,itemIdForPart(part));
    if (best >= PASS) applyLessonPass(r.pathway,part,best);
  }

  async function hydrateAssessmentReview() {
    const r = parsedRoute();
    if (r.root !== 'quiz' || !r.pathway || r.query.get('retake') === '1' || qaMode()) return;
    const part = Number(r.rawPart);
    if (!Number.isFinite(part) || part < 1 || part > 5) return;
    const immediate = localBest(r.pathway,itemIdForPart(part));
    if (immediate >= PASS) renderSavedPass(r.pathway,part,immediate);
    const best = await authoritativeBest(r.pathway,itemIdForPart(part));
    if (best >= PASS) renderSavedPass(r.pathway,part,best);
  }

  async function enforceDirectQuizGate() {
    const r = parsedRoute();
    if (r.root !== 'quiz' || !r.pathway || !r.rawPart || qaMode() || !window.CM_AUTH?.ready || !window.CM_AUTH?.user || r.query.get('retake') === '1') return false;
    const part = Number(r.rawPart);
    if (!Number.isFinite(part) || part < 1 || part > 5 || learningMarked(r.pathway,part) || localBest(r.pathway,itemIdForPart(part)) >= PASS) return false;
    const best = await authoritativeBest(r.pathway,itemIdForPart(part));
    const latest = parsedRoute();
    if (latest.root !== 'quiz' || latest.pathway !== r.pathway || Number(latest.rawPart) !== part || latest.query.get('retake') === '1') return false;
    if (best >= PASS) { renderSavedPass(r.pathway,part,best); return false; }
    // Keep the route visible as a read-only look-ahead. app.js and the secure
    // renderer own the locked preview, so no questions or inputs are exposed.
    return true;
  }

  function secureRetryNavigation(pathway,part) {
    const href = retakeHref(pathway,part);
    history.pushState({cmCourseRetake:true},'',href);
    progressCache.delete(pathway);
    if (typeof window.CM_LIVE_ROUTE === 'function') {
      window.CM_LIVE_ROUTE();
    } else {
      location.reload();
    }
  }

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a');
    if (!link) return;
    const r = parsedRoute();
    if (r.root === 'learn' && r.pathway) {
      const part = Number(r.rawPart);
      const quizHref = link.getAttribute('href') || '';
      const isReviewPassed = link.matches('[data-cm-review-passed]');
      if (!isReviewPassed && /^#\/quiz\//.test(quizHref) && Number.isFinite(part)) {
        event.preventDefault(); event.stopImmediatePropagation();
        authoritativeBest(r.pathway,itemIdForPart(part)).then(best => {
          location.hash = best >= PASS ? continueHref(r.pathway,part) : quizHref;
        });
        return;
      }
    }
    if (r.root !== 'quiz' || !r.pathway) return;
    const part = Number(r.rawPart);
    const failed = !!link.closest('.cm-result.failed,.quiz-result .fail') && /Try Again/i.test(link.textContent || '');
    if (!failed) return;
    event.preventDefault(); event.stopImmediatePropagation();
    secureRetryNavigation(r.pathway,part);
  }, true);

  function refreshPolicyCopy() {
    const {root} = parsedRoute();
    if (!['privacy','terms','disclaimer','credential-policy'].includes(root)) return;
    const card = document.querySelector('main#main .card');
    if (!card || card.dataset.cmPolicyUpdated === '1') return;
    card.dataset.cmPolicyUpdated = '1';
    const first = card.querySelector(':scope > p');
    if (root === 'privacy' && first) first.textContent = 'Capital Mastery uses account information, learning progress, assessment results, and credential records to provide signed-in learning, cross-device progress, secure grading, and credential verification. Public verification is designed not to expose a learner’s Firebase UID or email.';
    if (root === 'terms' && first) first.textContent = 'Capital Mastery is an educational platform. Users may not misrepresent credentials, interfere with assessment integrity, impersonate another learner, or misuse verification records.';
  }

  function enhance() {
    refreshPolicyCopy();
    hydrateLessonPass();
    hydrateAssessmentReview();
    enforceDirectQuizGate();
  }

  window.CM_COURSE_CONTINUITY = { localBest, authoritativeBest, continueHref, renderSavedPass, resolveLearnerCourseState:window.CM_COURSE_STATE?.resolveLearnerCourseState, getCourseAccessState:window.CM_COURSE_STATE?.getCourseAccessState };
  window.addEventListener('hashchange', () => setTimeout(enhance, 20));
  window.addEventListener('popstate', () => setTimeout(enhance, 20));
  document.addEventListener('cm-auth-changed', () => { progressCache.clear(); setTimeout(enhance, 40); });
  document.addEventListener('cm-progress-updated', () => { progressCache.clear(); setTimeout(enhance, 20); });
  window.addEventListener('pagehide', () => { window.CM_SYNC?.flush?.().catch(() => {}); });

  const observer = new MutationObserver(() => { clearTimeout(observer._cmTimer); observer._cmTimer=setTimeout(enhance,15); });
  observer.observe(document.documentElement, { childList:true, subtree:true });

  const style = document.createElement('style');
  style.id = 'cm-course-continuity-styles';
  style.textContent = `
    .cm-lesson-pass-status{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;margin:16px 0 8px;border:1px solid #bad7c8;background:#edf8f1;border-radius:12px;color:#245b43}.cm-lesson-pass-status span{font-size:.86rem}.cm-continuity-review{text-align:center;padding:34px}.cm-continuity-review .cm-result-score{font-family:Georgia,"Times New Roman",serif;font-size:5rem;line-height:1;color:var(--navy);margin:12px 0}.cm-continuity-review .cm-result-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}
    @media(max-width:680px){.cm-lesson-pass-status{display:grid}.cm-continuity-review .cm-result-actions{display:grid}.cm-continuity-review .btn{width:100%}}
  `;
  if (!document.getElementById(style.id)) document.head.appendChild(style);
  enhance();
})();
