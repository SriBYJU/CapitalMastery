const FIREBASE_JWKS =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

const PASS_SCORE = 80;
const MAX_BODY_BYTES = 60000;
const MAX_ATTEMPTS_10_MIN = 10;

const OFFICIAL_ITEMS = [
  "part-1",
  "part-2",
  "part-3",
  "part-4",
  "part-5",
  "simulation",
  "final"
];

const ITEM_TYPES = {
  "part-1": "knowledge",
  "part-2": "knowledge",
  "part-3": "knowledge",
  "part-4": "knowledge",
  "part-5": "knowledge",
  simulation: "simulation",
  final: "final"
};

const PREREQUISITES = {
  "part-1": [],
  "part-2": ["part-1"],
  "part-3": ["part-1", "part-2"],
  "part-4": ["part-1", "part-2", "part-3"],
  "part-5": ["part-1", "part-2", "part-3", "part-4"],
  simulation: ["part-1", "part-2", "part-3", "part-4", "part-5"],
  final: [
    "part-1",
    "part-2",
    "part-3",
    "part-4",
    "part-5",
    "simulation"
  ]
};

const PATHWAYS = {
  "investment-banking": {
    id: "investment-banking",
    code: "IB",
    title: "Investment Banking",
    role: "Investment Banking Analyst",
    track: "M&A Advisory",
    group: "Deals",
    purpose:
      "Advise companies on transactions, valuation, financing, and strategic decisions.",
    focus:
      "Evaluate a transaction using valuation, diligence, financial analysis, and deal logic.",
    risk: "valuation, diligence, financing, and execution risk",
    concepts: [
      "Enterprise Value",
      "Comparable Companies",
      "Precedent Transactions",
      "DCF"
    ],
    deliverables: [
      "valuation analysis",
      "transaction model",
      "buyer or target materials",
      "deal recommendation"
    ],
    simulation: "Project Northstar",
    simKeywords: [
      "valuation",
      "diligence",
      "risk",
      "cash",
      "debt",
      "synergy",
      "assumption",
      "recommendation"
    ]
  },

  "private-equity": {
    id: "private-equity",
    code: "PE",
    title: "Private Equity",
    role: "Private Equity Analyst",
    group: "Investing",
    purpose:
      "Evaluate businesses for acquisition and determine whether risk-adjusted ownership returns are attractive.",
    focus:
      "Underwrite an acquisition using operating performance, leverage, cash flow, and exit assumptions.",
    risk: "leverage, cash-flow, operational, and exit risk",
    concepts: ["LBO", "IRR", "MOIC", "Debt Schedule"],
    deliverables: [
      "LBO model",
      "investment committee memo",
      "diligence analysis",
      "value-creation plan"
    ],
    simulation: "Project Redwood",
    simKeywords: [
      "cash flow",
      "debt",
      "leverage",
      "exit",
      "margin",
      "diligence",
      "risk",
      "return"
    ]
  },

  "venture-capital": {
    id: "venture-capital",
    code: "VC",
    title: "Venture Capital",
    role: "Venture Capital Investment Analyst",
    group: "Investing",
    purpose:
      "Evaluate early-stage companies, markets, teams, growth economics, and investment potential.",
    focus:
      "Assess startup quality through market size, growth, unit economics, runway, and investment risk.",
    risk: "product-market-fit, financing, growth-quality, and execution risk",
    concepts: ["TAM", "CAC", "LTV", "Runway"],
    deliverables: [
      "investment memo",
      "market-sizing analysis",
      "unit-economics analysis",
      "cap-table review"
    ],
    simulation: "Project Spark",
    simKeywords: [
      "retention",
      "unit economics",
      "runway",
      "market",
      "growth",
      "team",
      "risk",
      "valuation"
    ]
  },

  "equity-research": {
    id: "equity-research",
    code: "ER",
    title: "Equity Research",
    role: "Equity Research Associate",
    group: "Markets",
    purpose:
      "Analyze public companies and form evidence-based investment views, estimates, and valuations.",
    focus:
      "Connect financial results, expectations, catalysts, valuation, and risks into an investment thesis.",
    risk: "estimate, thesis, catalyst, and valuation risk",
    concepts: ["Catalyst", "Price Target", "Comparable Companies", "DCF"],
    deliverables: [
      "earnings note",
      "financial model",
      "valuation summary",
      "research recommendation"
    ],
    simulation: "Project Signal",
    simKeywords: [
      "guidance",
      "revenue",
      "margin",
      "estimate",
      "valuation",
      "catalyst",
      "risk",
      "thesis"
    ]
  },

  "asset-management": {
    id: "asset-management",
    code: "AM",
    title: "Asset Management",
    role: "Investment Research Analyst",
    group: "Investing",
    purpose:
      "Research investments and construct portfolios consistent with objectives, risk, and constraints.",
    focus:
      "Balance expected return, diversification, liquidity, portfolio risk, and client objectives.",
    risk: "concentration, liquidity, market, and portfolio-construction risk",
    concepts: ["Asset Allocation", "Duration", "Alpha", "Rebalancing"],
    deliverables: [
      "portfolio recommendation",
      "performance attribution",
      "risk review",
      "investment research memo"
    ],
    simulation: "Project Compass",
    simKeywords: [
      "allocation",
      "risk",
      "liquidity",
      "benchmark",
      "diversification",
      "return",
      "constraint",
      "portfolio"
    ]
  },

  "hedge-funds": {
    id: "hedge-funds",
    code: "HF",
    title: "Hedge Funds",
    role: "Investment Analyst",
    group: "Investing",
    purpose:
      "Develop differentiated investment theses and manage positions within portfolio risk constraints.",
    focus:
      "Evaluate catalysts, valuation, asymmetry, sizing, liquidity, and evidence that could invalidate a thesis.",
    risk: "drawdown, liquidity, short-squeeze, thesis, and sizing risk",
    concepts: ["Alpha", "Catalyst", "Drawdown", "Liquidity"],
    deliverables: [
      "long-short thesis",
      "position-sizing analysis",
      "catalyst review",
      "portfolio-risk monitor"
    ],
    simulation: "Project Meridian",
    simKeywords: [
      "catalyst",
      "valuation",
      "risk",
      "upside",
      "downside",
      "liquidity",
      "thesis",
      "position"
    ]
  },

  "sales-trading": {
    id: "sales-trading",
    code: "ST",
    title: "Sales & Trading",
    role: "Sales Analyst / Trading Analyst",
    group: "Markets",
    purpose:
      "Serve clients and execute market transactions while managing price, liquidity, and market risk.",
    focus:
      "Balance execution quality, client objectives, liquidity, spread, volatility, and position risk.",
    risk: "market-impact, liquidity, volatility, and execution risk",
    concepts: ["Bid-Ask Spread", "Liquidity", "Duration", "Hedge"],
    deliverables: [
      "execution plan",
      "client trade idea",
      "market update",
      "position-risk review"
    ],
    simulation: "Project Pulse",
    simKeywords: [
      "liquidity",
      "spread",
      "size",
      "execution",
      "market impact",
      "volatility",
      "client",
      "risk"
    ]
  },

  "quantitative-finance": {
    id: "quantitative-finance",
    code: "QF",
    title: "Quantitative Finance",
    role: "Quantitative Analyst",
    group: "Markets",
    purpose:
      "Use data, mathematics, and statistical models to research and evaluate financial signals and strategies.",
    focus:
      "Test models using clean data, realistic assumptions, out-of-sample validation, and implementation costs.",
    risk: "overfitting, data, model, bias, and implementation risk",
    concepts: [
      "Out-of-Sample Validation",
      "Overfitting",
      "Transaction Costs",
      "Look-Ahead Bias"
    ],
    deliverables: [
      "research backtest",
      "validation report",
      "data-quality review",
      "model-risk memo"
    ],
    simulation: "Project Vector",
    simKeywords: [
      "out-of-sample",
      "cost",
      "bias",
      "turnover",
      "validation",
      "data",
      "robust",
      "risk"
    ]
  },

  "private-credit": {
    id: "private-credit",
    code: "PC",
    title: "Private Credit",
    role: "Private Credit Investment Analyst",
    group: "Deals",
    purpose:
      "Evaluate borrowers and structure loans with sufficient repayment capacity and downside protection.",
    focus:
      "Underwrite debt using leverage, cash flow, coverage, covenants, liquidity, and recovery considerations.",
    risk: "default, leverage, liquidity, covenant, and recovery risk",
    concepts: ["Covenant", "Debt Capacity", "PD", "LGD"],
    deliverables: [
      "credit memo",
      "debt schedule",
      "downside case",
      "covenant analysis"
    ],
    simulation: "Project Anchor",
    simKeywords: [
      "cash flow",
      "leverage",
      "coverage",
      "covenant",
      "liquidity",
      "downside",
      "repayment",
      "risk"
    ]
  },

  "corporate-banking": {
    id: "corporate-banking",
    code: "CB",
    title: "Corporate Banking",
    role: "Corporate Banking / Credit Analyst",
    group: "Clients & Risk",
    purpose:
      "Provide lending and banking solutions while protecting the bank from unacceptable credit risk.",
    focus:
      "Evaluate borrower quality, debt capacity, liquidity, relationship economics, and facility structure.",
    risk: "credit, leverage, liquidity, and relationship risk",
    concepts: ["Debt Capacity", "Working Capital", "Liquidity", "Covenant"],
    deliverables: [
      "credit recommendation",
      "facility analysis",
      "relationship review",
      "borrower-risk assessment"
    ],
    simulation: "Project Bridge",
    simKeywords: [
      "credit",
      "liquidity",
      "leverage",
      "coverage",
      "relationship",
      "facility",
      "condition",
      "risk"
    ]
  },

  "corporate-development": {
    id: "corporate-development",
    code: "CD",
    title: "Corporate Development",
    role: "Corporate Development Analyst",
    group: "Corporate Finance",
    purpose:
      "Evaluate acquisitions, partnerships, and strategic investments for a corporation.",
    focus:
      "Connect strategic fit, valuation, synergies, integration, and transaction economics.",
    risk: "valuation, synergy, integration, and strategic-execution risk",
    concepts: ["Synergies", "DCF", "Precedent Transactions", "Accretion / Dilution"],
    deliverables: [
      "acquisition model",
      "strategic-fit analysis",
      "deal recommendation",
      "integration-risk review"
    ],
    simulation: "Project Horizon",
    simKeywords: [
      "synergy",
      "valuation",
      "integration",
      "strategy",
      "risk",
      "return",
      "assumption",
      "recommendation"
    ]
  },

  "fp-and-a": {
    id: "fp-and-a",
    code: "FPA",
    title: "FP&A",
    role: "FP&A Analyst",
    group: "Corporate Finance",
    purpose:
      "Help management understand performance, plan future results, and make financially informed decisions.",
    focus:
      "Explain business drivers through forecasting, budgeting, KPIs, and variance analysis.",
    risk: "forecast, assumption, operating-performance, and planning risk",
    concepts: ["Variance Analysis", "Rolling Forecast", "KPI", "Working Capital"],
    deliverables: [
      "budget-versus-actual analysis",
      "rolling forecast",
      "management dashboard",
      "financial decision memo"
    ],
    simulation: "Project Forecast",
    simKeywords: [
      "variance",
      "forecast",
      "budget",
      "driver",
      "margin",
      "kpi",
      "assumption",
      "recommendation"
    ]
  },

  treasury: {
    id: "treasury",
    code: "TR",
    title: "Treasury",
    role: "Treasury Analyst",
    group: "Corporate Finance",
    purpose:
      "Manage corporate liquidity, funding, cash, and financial-market exposures.",
    focus:
      "Forecast cash and evaluate liquidity, financing, foreign-exchange, and hedging decisions.",
    risk: "liquidity, funding, FX, interest-rate, and counterparty risk",
    concepts: ["Cash Forecast", "FX Exposure", "Hedge", "Liquidity"],
    deliverables: [
      "cash forecast",
      "liquidity report",
      "hedging analysis",
      "funding recommendation"
    ],
    simulation: "Project Liquidity",
    simKeywords: [
      "cash",
      "liquidity",
      "funding",
      "fx",
      "hedge",
      "exposure",
      "forecast",
      "risk"
    ]
  },

  "wealth-management": {
    id: "wealth-management",
    code: "WM",
    title: "Wealth Management",
    role: "Wealth Management Analyst",
    group: "Clients & Risk",
    purpose:
      "Help clients pursue financial objectives through suitable investment and portfolio decisions.",
    focus:
      "Match portfolio construction with client objectives, constraints, liquidity, and risk tolerance.",
    risk: "suitability, concentration, liquidity, and market risk",
    concepts: ["Risk Tolerance", "Asset Allocation", "Rebalancing", "Liquidity"],
    deliverables: [
      "client portfolio review",
      "asset-allocation recommendation",
      "investment proposal",
      "risk-and-suitability analysis"
    ],
    simulation: "Project Client",
    simKeywords: [
      "client",
      "risk",
      "allocation",
      "liquidity",
      "objective",
      "constraint",
      "diversification",
      "portfolio"
    ]
  },

  "risk-management": {
    id: "risk-management",
    code: "RM",
    title: "Risk Management",
    role: "Financial Risk Analyst",
    group: "Clients & Risk",
    purpose:
      "Identify, measure, monitor, and communicate financial risks that could harm an organization.",
    focus:
      "Assess exposures using risk measures, stress scenarios, controls, limits, and escalation.",
    risk: "market, credit, liquidity, model, and concentration risk",
    concepts: ["VaR", "Stress Test", "PD", "Liquidity"],
    deliverables: [
      "risk report",
      "stress-test analysis",
      "limit review",
      "risk-escalation memo"
    ],
    simulation: "Project Shield",
    simKeywords: [
      "risk",
      "exposure",
      "stress",
      "limit",
      "liquidity",
      "scenario",
      "control",
      "escalation"
    ]
  },

  "real-estate-finance": {
    id: "real-estate-finance",
    code: "REF",
    title: "Real Estate Finance",
    role: "Real Estate Financial Analyst",
    group: "Assets",
    purpose:
      "Evaluate real-estate investments, property cash flows, financing, valuation, and returns.",
    focus:
      "Underwrite a property using income, valuation, debt, cash flow, and downside assumptions.",
    risk: "occupancy, valuation, refinancing, interest-rate, and property cash-flow risk",
    concepts: ["NOI", "Cap Rate", "LTV", "DSCR"],
    deliverables: [
      "property underwriting model",
      "cash-flow forecast",
      "debt-sizing analysis",
      "investment memo"
    ],
    simulation: "Project Property",
    simKeywords: [
      "noi",
      "occupancy",
      "cap rate",
      "debt",
      "cash flow",
      "valuation",
      "downside",
      "risk"
    ]
  }
};

const PATHWAY_ALIASES = {
  fpa: "fp-and-a",
  "fp-a": "fp-and-a",
  "fp&a": "fp-and-a",
  "quant-finance": "quantitative-finance",
  quant: "quantitative-finance"
};

const ALL_PATHWAYS = Object.values(PATHWAYS);

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(env)
        });
      }

      const origin = request.headers.get("Origin");

      if (origin && !allowedOriginList(env).includes(origin)) {
        throw new HttpError(403, "Origin not allowed");
      }

      // --------------------------------------------------
      // HEALTH
      // --------------------------------------------------

      if (request.method === "GET" && url.pathname === "/health") {
        await env.DB.prepare("SELECT 1 AS ok").first();

        return json(
          {
            ok: true,
            service: "capital-mastery-api",
            database: true,
            firebaseProject: env.FIREBASE_PROJECT_ID,
            backendVersion: "2.0",
            pathways: ALL_PATHWAYS.length,
            masteryScore: PASS_SCORE
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // PUBLIC CATALOG
      // No answers are exposed.
      // --------------------------------------------------

      if (request.method === "GET" && url.pathname === "/catalog") {
        return json(
          {
            ok: true,
            masteryScore: PASS_SCORE,
            items: OFFICIAL_ITEMS,
            pathways: ALL_PATHWAYS.map(p => ({
              id: p.id,
              title: p.title,
              role: p.role,
              certificates: credentialTitles(p)
            }))
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // FIREBASE AUTH CHECK
      // --------------------------------------------------

      if (request.method === "POST" && url.pathname === "/auth-check") {
        const user = await requireUser(request, env);

        return json(
          {
            ok: true,
            authenticated: true,
            uid: user.sub,
            isAdmin: user.sub === env.ADMIN_UID
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // SELF-SERVICE ACCOUNT + PERSONAL DATA DELETION
      // Shared employer records are retained only after creator IDs are pseudonymized.
      // --------------------------------------------------

      if (request.method === "POST" && url.pathname === "/account/delete-data") {
        const user = await requireUser(request, env);
        if (user.sub === env.ADMIN_UID) throw new HttpError(409, "The platform administrator account cannot be deleted from self-service settings");

        const soleOwnerRows = await env.DB.prepare(`
          SELECT o.id,o.name
          FROM organization_members m
          JOIN organizations o ON o.id=m.org_id
          WHERE m.uid=? AND m.role='owner' AND m.status='active' AND o.status='active'
            AND NOT EXISTS (
              SELECT 1 FROM organization_members m2
              WHERE m2.org_id=m.org_id AND m2.uid<>? AND m2.role='owner' AND m2.status='active'
            )
          ORDER BY o.name
        `).bind(user.sub,user.sub).all();
        const soleOwnerOrgs=soleOwnerRows.results||[];
        if(soleOwnerOrgs.length){
          throw new HttpError(409,`Transfer ownership before deleting this account: ${soleOwnerOrgs.map(x=>x.name).join(', ')}`);
        }

        const email=String(user.email||'').trim().toLowerCase();
        const markerUid='deleted_user';
        await env.DB.batch([
          env.DB.prepare(`DELETE FROM credential_evidence_items WHERE credential_id IN (SELECT credential_id FROM credentials WHERE uid=?)`).bind(user.sub),
          env.DB.prepare(`DELETE FROM credential_events WHERE credential_id IN (SELECT credential_id FROM credentials WHERE uid=?)`).bind(user.sub),
          env.DB.prepare(`DELETE FROM role_lab_submissions WHERE run_id IN (SELECT id FROM role_lab_runs WHERE uid=?)`).bind(user.sub),
          env.DB.prepare(`DELETE FROM manager_reviews WHERE learner_uid=? OR created_by_uid=?`).bind(user.sub,user.sub),
          env.DB.prepare(`DELETE FROM enterprise_notifications WHERE recipient_uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM v2_assessment_attempts WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM diagnostic_attempts WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM competency_evidence WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM competency_scores WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM readiness_snapshots WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM role_lab_runs WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM credentials WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM assessment_attempts WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM official_progress WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM request_log WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM cohort_members WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM employer_profiles WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`DELETE FROM organization_invites WHERE accepted_by_uid=? OR (?<>'' AND email_normalized=?)`).bind(user.sub,email,email),
          env.DB.prepare(`DELETE FROM organization_members WHERE uid=?`).bind(user.sub),
          env.DB.prepare(`UPDATE organization_invites SET created_by_uid=? WHERE created_by_uid=?`).bind(markerUid,user.sub),
          env.DB.prepare(`UPDATE standard_content_preferences SET updated_by_uid=? WHERE updated_by_uid=?`).bind(markerUid,user.sub),
          env.DB.prepare(`UPDATE firm_content_versions SET created_by_uid=? WHERE created_by_uid=?`).bind(markerUid,user.sub),
          env.DB.prepare(`UPDATE firm_content SET created_by_uid=? WHERE created_by_uid=?`).bind(markerUid,user.sub),
          env.DB.prepare(`UPDATE cohorts SET created_by_uid=? WHERE created_by_uid=?`).bind(markerUid,user.sub),
          env.DB.prepare(`UPDATE program_assignments SET created_by_uid=? WHERE created_by_uid=?`).bind(markerUid,user.sub),
          env.DB.prepare(`UPDATE organizations SET created_by_uid=? WHERE created_by_uid=?`).bind(markerUid,user.sub),
          env.DB.prepare(`UPDATE enterprise_audit_events SET actor_uid=? WHERE actor_uid=?`).bind(markerUid,user.sub),
          env.DB.prepare(`UPDATE credential_events SET actor_uid=? WHERE actor_uid=?`).bind(markerUid,user.sub)
        ]);
        return json({ok:true,personalDataDeleted:true,sharedEmployerRecordsPseudonymized:true},200,env);
      }

      // --------------------------------------------------
      // ADMIN AUTH CHECK
      // --------------------------------------------------

      if (request.method === "GET" && url.pathname === "/admin/check") {
        const user = await requireAdmin(request, env);

        return json(
          {
            ok: true,
            admin: true,
            uid: user.sub
          },
          200,
          env
        );
      }

      const parts = url.pathname.split("/").filter(Boolean);

      if (request.method === "GET" && url.pathname === "/enterprise/admin/demo") {
        const admin=await requireAdmin(request,env);
        const rows=await env.DB.prepare(`SELECT o.id,o.name,o.created_at,COUNT(DISTINCT cm.uid) AS learners,COUNT(DISTINCT a.id) AS assignments FROM organizations o LEFT JOIN cohort_members cm ON cm.org_id=o.id LEFT JOIN program_assignments a ON a.org_id=o.id WHERE o.id LIKE 'demo_org_%' GROUP BY o.id,o.name,o.created_at ORDER BY o.created_at DESC`).all();
        return json({ok:true,synthetic:true,demos:rows.results||[],presets:DEMO_PRESETS},200,env);
      }
      if (request.method === "POST" && url.pathname === "/enterprise/admin/demo/create") {
        const admin=await requireAdmin(request,env); const body=await readJson(request); const demo=await createEnterpriseDemo(env,admin,body);
        return json({ok:true,demo},201,env);
      }
      if (request.method === "POST" && url.pathname === "/enterprise/admin/demo/reset") {
        const admin=await requireAdmin(request,env); const result=await resetEnterpriseDemos(env,admin);
        return json({ok:true,synthetic:true,...result},200,env);
      }
      if (request.method === "GET" && parts[0]==='enterprise' && parts[1]==='admin' && parts[2]==='demo' && parts[3] && parts[4]==='learners' && parts.length===5) {
        await requireAdmin(request,env); const orgId=cleanId(parts[3]); if(!orgId.startsWith('demo_org_')) throw new HttpError(400,'Synthetic demo organization required');
        const rows=await env.DB.prepare(`SELECT cm.uid,MAX(i.email_normalized) AS email,MAX(cr.holder_name) AS holder_name FROM cohort_members cm LEFT JOIN organization_invites i ON i.org_id=cm.org_id AND i.accepted_by_uid=cm.uid LEFT JOIN credentials cr ON cr.uid=cm.uid AND cr.org_id=cm.org_id WHERE cm.org_id=? GROUP BY cm.uid ORDER BY COALESCE(MAX(cr.holder_name),MAX(i.email_normalized),cm.uid)`).bind(orgId).all();
        return json({ok:true,synthetic:true,orgId,learners:rows.results||[]},200,env);
      }
      if (request.method === "POST" && url.pathname === "/enterprise/admin/demo/learner-state") {
        const admin=await requireAdmin(request,env); const body=await readJson(request); const result=await setEnterpriseDemoLearnerState(env,admin,body); return json({ok:true,synthetic:true,...result},200,env);
      }
      if (request.method === "GET" && url.pathname === "/enterprise/admin/demo/permission-matrix") {
        await requireAdmin(request,env); return json({ok:true,roles:ENTERPRISE_PERMISSION_LAB,actions:[...new Set(Object.values(ENTERPRISE_PERMISSION_LAB).flat())]},200,env);
      }

      // --------------------------------------------------
      // CONTEXTUAL INVITATION PREVIEW (token-holder only)
      // --------------------------------------------------
      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "invites" && parts[2] === "preview" && parts.length === 4) {
        const token = cleanString(decodeURIComponent(parts[3] || ''), 500);
        if (!token) throw new HttpError(400, "Invitation token required");
        const tokenHash = await sha256Hex(token);
        const invite = await env.DB.prepare(`
          SELECT i.status,i.expires_at,i.role,o.name AS organization_name,c.name AS cohort_name,c.pathway_id
          FROM organization_invites i
          JOIN organizations o ON o.id=i.org_id
          LEFT JOIN cohorts c ON c.id=i.cohort_id
          WHERE i.token_hash=? LIMIT 1
        `).bind(tokenHash).first();
        if (!invite || invite.status !== 'pending') throw new HttpError(404, "Invitation is unavailable");
        if (Date.parse(invite.expires_at) <= Date.now()) throw new HttpError(410, "Invitation has expired");
        const pathway = invite.pathway_id ? getPathway(invite.pathway_id) : null;
        return json({ok:true,invite:{organizationName:invite.organization_name,cohortName:invite.cohort_name||null,pathwayId:pathway?.id||null,pathwayTitle:pathway?.title||null,role:invite.role,expiresAt:invite.expires_at}},200,env);
      }

      // --------------------------------------------------
      // GET OFFICIAL ASSESSMENT
      //
      // GET /assessment/:pathway/:item
      // --------------------------------------------------

      if (
        request.method === "GET" &&
        parts[0] === "assessment" &&
        parts.length === 3
      ) {
        const user = await requireUser(request, env);
        const pathway = getPathway(parts[1]);
        const itemId = validateItem(parts[2]);

        await enforcePrerequisites(
          env,
          user.sub,
          pathway.id,
          itemId
        );

        const assessment = buildAssessment(pathway, itemId);

        return json(
          {
            ok: true,
            pathway: {
              id: pathway.id,
              title: pathway.title,
              role: pathway.role
            },
            itemId,
            itemType: assessment.itemType,
            masteryScore: PASS_SCORE,
            questionCount: assessment.questions.length,
            questions: assessment.questions.map(publicQuestion),
            writingPrompt: assessment.writingPrompt || null,
            simulationProfile: assessment.simulationProfile || null,
            assessmentVersion: assessment.version || "1.0"
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // SUBMIT OFFICIAL ASSESSMENT
      //
      // POST /assessment/submit
      // --------------------------------------------------

      if (
        request.method === "POST" &&
        url.pathname === "/assessment/submit"
      ) {
        const user = await requireUser(request, env);
        const body = await readJson(request);

        const pathway = getPathway(body.pathwayId);
        const itemId = validateItem(body.itemId);

        await enforcePrerequisites(
          env,
          user.sub,
          pathway.id,
          itemId
        );

        await enforceAttemptLimit(
          env,
          user.sub,
          pathway.id,
          itemId
        );

        const assessment = buildAssessment(pathway, itemId);

        const result = gradeAssessment(
          assessment,
          body.answers,
          body.writing
        );

        const passed = result.score >= PASS_SCORE;

        await recordOfficialAttempt(
          env,
          user.sub,
          pathway.id,
          itemId,
          assessment.itemType,
          result.score,
          passed
        );

        let issuedCredentials = [];

        if (passed) {
          issuedCredentials = await issueEligibleCredentials(
            env,
            user,
            pathway
          );
        }

        return json(
          {
            ok: true,
            pathwayId: pathway.id,
            itemId,
            score: result.score,
            passed,
            masteryScore: PASS_SCORE,
            objectiveCorrect: result.correct,
            objectiveTotal: result.total,
            writingScore: result.writingScore,
            issuedCredentials,
            nextEligibleCertificates:
              await credentialEligibilitySummary(
                env,
                user.sub,
                pathway
              )
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // OFFICIAL PROGRESS
      //
      // GET /progress/:pathway
      // --------------------------------------------------

      if (
        request.method === "GET" &&
        parts[0] === "progress" &&
        parts.length === 2
      ) {
        const user = await requireUser(request, env);
        const pathway = getPathway(parts[1]);

        const result = await env.DB
          .prepare(`
            SELECT
              item_id,
              item_type,
              best_score,
              completed,
              completed_at,
              updated_at
            FROM official_progress
            WHERE uid = ?
              AND pathway_id = ?
            ORDER BY item_id
          `)
          .bind(user.sub, pathway.id)
          .all();

        return json(
          {
            ok: true,
            pathway: {
              id: pathway.id,
              title: pathway.title
            },
            progress: result.results || [],
            credentials:
              await credentialEligibilitySummary(
                env,
                user.sub,
                pathway
              )
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // RECHECK AUTOMATIC CREDENTIAL ELIGIBILITY
      //
      // POST /credentials/refresh
      // --------------------------------------------------

      if (
        request.method === "POST" &&
        url.pathname === "/credentials/refresh"
      ) {
        const user = await requireUser(request, env);
        const body = await readJson(request);
        const pathway = getPathway(body.pathwayId);

        const issued = await issueEligibleCredentials(
          env,
          user,
          pathway
        );

        return json(
          {
            ok: true,
            issuedCredentials: issued,
            eligibility:
              await credentialEligibilitySummary(
                env,
                user.sub,
                pathway
              )
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // CURRENT USER CREDENTIALS
      //
      // GET /credentials/me
      // --------------------------------------------------

      if (
        request.method === "GET" &&
        url.pathname === "/credentials/me"
      ) {
        const user = await requireUser(request, env);

        const result = await env.DB
          .prepare(`
            SELECT
              credential_id,
              public_token,
              pathway_id,
              credential_level,
              credential_title,
              holder_name,
              status,
              issued_at,
              revoked_at,
              revocation_reason,
              reissued_from_id,
              reissued_to_id
            FROM credentials
            WHERE uid = ?
            ORDER BY issued_at DESC
          `)
          .bind(user.sub)
          .all();

        return json(
          {
            ok: true,
            credentials: result.results || []
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // PUBLIC CREDENTIAL VERIFICATION
      //
      // GET /verify/:token
      // --------------------------------------------------

      if (
        request.method === "GET" &&
        parts[0] === "verify" &&
        parts.length === 2
      ) {
        const publicToken = decodeURIComponent(parts[1]);

        if (!publicToken || publicToken.length > 200) {
          throw new HttpError(
            400,
            "Invalid credential token"
          );
        }

        const credential = await env.DB
          .prepare(`
            SELECT
              credential_id,
              public_token,
              holder_name,
              pathway_id,
              credential_level,
              credential_title,
              status,
              issued_at,
              revoked_at
            FROM credentials
            WHERE public_token = ? AND credential_id NOT LIKE 'DEMO-%'
            LIMIT 1
          `)
          .bind(publicToken)
          .first();

        if (!credential) {
          return json(
            {
              ok: false,
              valid: false,
              error: "Credential not found"
            },
            404,
            env
          );
        }

        return json(
          {
            ok: true,
            valid: credential.status === "active",
            credential: {
              credentialId: credential.credential_id,
              holderName: credential.holder_name,
              pathwayId: credential.pathway_id,
              level: credential.credential_level,
              title: credential.credential_title,
              status: credential.status,
              issuedAt: credential.issued_at,
              revokedAt: credential.revoked_at || null
            }
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // ADMIN REVOKE
      //
      // POST /admin/credentials/:id/revoke
      // --------------------------------------------------

      if (
        request.method === "POST" &&
        parts[0] === "admin" &&
        parts[1] === "credentials" &&
        parts.length === 4 &&
        parts[3] === "revoke"
      ) {
        const admin = await requireAdmin(request, env);
        const credentialId = cleanId(parts[2]);
        const body = await readJson(request);

        const reason = cleanString(
          body.reason || "Administrative revocation",
          250
        );

        const credential = await env.DB
          .prepare(`
            SELECT *
            FROM credentials
            WHERE credential_id = ?
            LIMIT 1
          `)
          .bind(credentialId)
          .first();

        if (!credential) {
          throw new HttpError(
            404,
            "Credential not found"
          );
        }

        if (credential.status !== "active") {
          throw new HttpError(
            409,
            "Only an active credential can be revoked"
          );
        }

        const eventId = crypto.randomUUID();
        const auditId = crypto.randomUUID();

        await env.DB.batch([
          env.DB
            .prepare(`
              UPDATE credentials
              SET
                status = 'revoked',
                revoked_at = CURRENT_TIMESTAMP,
                revocation_reason = ?
              WHERE credential_id = ?
                AND status = 'active'
            `)
            .bind(reason, credentialId),

          env.DB
            .prepare(`
              INSERT INTO credential_events
              (
                id,
                credential_id,
                event_type,
                actor_uid,
                details
              )
              VALUES (?, ?, 'revoked', ?, ?)
            `)
            .bind(
              eventId,
              credentialId,
              admin.sub,
              JSON.stringify({ reason })
            ),

          env.DB
            .prepare(`
              INSERT INTO admin_audit
              (
                id,
                admin_uid,
                action,
                target_uid,
                credential_id,
                details
              )
              VALUES (?, ?, 'credential_revoked', ?, ?, ?)
            `)
            .bind(
              auditId,
              admin.sub,
              credential.uid,
              credentialId,
              JSON.stringify({ reason })
            )
        ]);

        return json(
          {
            ok: true,
            credentialId,
            status: "revoked"
          },
          200,
          env
        );
      }

      // --------------------------------------------------
      // ADMIN REISSUE
      //
      // POST /admin/credentials/:id/reissue
      // --------------------------------------------------

      if (
        request.method === "POST" &&
        parts[0] === "admin" &&
        parts[1] === "credentials" &&
        parts.length === 4 &&
        parts[3] === "reissue"
      ) {
        const admin = await requireAdmin(request, env);
        const credentialId = cleanId(parts[2]);

        const oldCredential = await env.DB
          .prepare(`
            SELECT *
            FROM credentials
            WHERE credential_id = ?
            LIMIT 1
          `)
          .bind(credentialId)
          .first();

        if (!oldCredential) {
          throw new HttpError(
            404,
            "Credential not found"
          );
        }

        if (oldCredential.status === "reissued") {
          throw new HttpError(
            409,
            "Credential has already been reissued"
          );
        }

        const pathway = getPathway(
          oldCredential.pathway_id
        );

        const newCredential =
          makeCredentialRecord(
            oldCredential.uid,
            oldCredential.holder_name,
            pathway,
            oldCredential.credential_level,
            oldCredential.credential_id
          );

        const eventOld = crypto.randomUUID();
        const eventNew = crypto.randomUUID();
        const auditId = crypto.randomUUID();

        await env.DB.batch([
          env.DB
            .prepare(`
              UPDATE credentials
              SET
                status = 'reissued',
                reissued_to_id = ?
              WHERE credential_id = ?
            `)
            .bind(
              newCredential.credentialId,
              oldCredential.credential_id
            ),

          env.DB
            .prepare(`
              INSERT INTO credentials
              (
                credential_id,
                public_token,
                uid,
                holder_name,
                pathway_id,
                credential_level,
                credential_title,
                status,
                reissued_from_id
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
            `)
            .bind(
              newCredential.credentialId,
              newCredential.publicToken,
              oldCredential.uid,
              oldCredential.holder_name,
              pathway.id,
              oldCredential.credential_level,
              newCredential.title,
              oldCredential.credential_id
            ),

          env.DB
            .prepare(`
              INSERT INTO credential_events
              (
                id,
                credential_id,
                event_type,
                actor_uid,
                details
              )
              VALUES (?, ?, 'reissued_from', ?, ?)
            `)
            .bind(
              eventOld,
              oldCredential.credential_id,
              admin.sub,
              JSON.stringify({
                reissuedTo:
                  newCredential.credentialId
              })
            ),

          env.DB
            .prepare(`
              INSERT INTO credential_events
              (
                id,
                credential_id,
                event_type,
                actor_uid,
                details
              )
              VALUES (?, ?, 'issued_replacement', ?, ?)
            `)
            .bind(
              eventNew,
              newCredential.credentialId,
              admin.sub,
              JSON.stringify({
                reissuedFrom:
                  oldCredential.credential_id
              })
            ),

          env.DB
            .prepare(`
              INSERT INTO admin_audit
              (
                id,
                admin_uid,
                action,
                target_uid,
                credential_id,
                details
              )
              VALUES (?, ?, 'credential_reissued', ?, ?, ?)
            `)
            .bind(
              auditId,
              admin.sub,
              oldCredential.uid,
              newCredential.credentialId,
              JSON.stringify({
                oldCredentialId:
                  oldCredential.credential_id
              })
            )
        ]);

        return json(
          {
            ok: true,
            oldCredentialId:
              oldCredential.credential_id,
            newCredential: {
              credentialId:
                newCredential.credentialId,
              publicToken:
                newCredential.publicToken,
              title: newCredential.title,
              status: "active"
            }
          },
          200,
          env
        );
      }

      // ==================================================
      // CAPITAL MASTERY V2 — ENTERPRISE CORE
      // ==================================================

      if (request.method === "GET" && url.pathname === "/enterprise/me") {
        const user = await requireUser(request, env);
        const memberships = await env.DB.prepare(`
          SELECT o.id, o.slug, o.name, o.status, m.role, m.status AS membership_status
          FROM organization_members m
          JOIN organizations o ON o.id = m.org_id
          WHERE m.uid = ? AND m.status = 'active' AND o.status = 'active'
          ORDER BY o.name
        `).bind(user.sub).all();
        const profiles = await env.DB.prepare(`SELECT org_id,full_name,employer_role,cohort_size_band,onboarding_complete FROM employer_profiles WHERE uid=?`).bind(user.sub).all();
        return json({ ok: true, organizations: memberships.results || [], employerProfiles: profiles.results || [] }, 200, env);
      }

      if (request.method === "POST" && url.pathname === "/enterprise/employer-onboarding") {
        const user = await requireUser(request, env);
        const body = await readJson(request);
        const fullName = cleanString(body.fullName || user.name || '', 120);
        const companyName = cleanString(body.companyName, 120);
        const employerRole = enterpriseEnum(body.employerRole || 'other',['training_lead','founder_partner','manager','recruiter_hr','other'],'employer role');
        const cohortSizeBand = enterpriseEnum(body.cohortSizeBand || 'unspecified',['unspecified','1_10','11_25','26_50','51_100','100_plus'],'cohort size');
        if (fullName.length < 2) throw new HttpError(400,'Full name is required');
        if (companyName.length < 2) throw new HttpError(400,'Company / firm name is required');
        const id = `org_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
        const slug = `${slugifyEnterprise(companyName).slice(0,42)}-${id.slice(-6)}`;
        await env.DB.batch([
          env.DB.prepare(`INSERT INTO organizations (id,slug,name,created_by_uid) VALUES (?,?,?,?)`).bind(id,slug,companyName,user.sub),
          env.DB.prepare(`INSERT INTO organization_members (org_id,uid,role) VALUES (?,?,'owner')`).bind(id,user.sub),
          env.DB.prepare(`INSERT INTO employer_profiles (uid,org_id,full_name,employer_role,cohort_size_band,onboarding_complete) VALUES (?,?,?,?,?,1)`).bind(user.sub,id,fullName,employerRole,cohortSizeBand),
          enterpriseAuditStatement(env,id,user.sub,'employer.onboarding_completed','organization',id,{companyName,employerRole,cohortSizeBand})
        ]);
        return json({ok:true,organization:{id,slug,name:companyName,role:'owner'},profile:{fullName,employerRole,cohortSizeBand,onboardingComplete:true}},201,env);
      }

      if (request.method === "POST" && url.pathname === "/enterprise/organizations") {
        const user = await requireUser(request, env);
        const body = await readJson(request);
        const name = cleanString(body.name, 120);
        if (name.length < 2) throw new HttpError(400, "Organization name is required");
        const id = `org_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
        const slug = `${slugifyEnterprise(body.slug || name).slice(0, 42)}-${id.slice(-6)}`;
        await env.DB.batch([
          env.DB.prepare(`INSERT INTO organizations (id, slug, name, created_by_uid) VALUES (?, ?, ?, ?)`).bind(id, slug, name, user.sub),
          env.DB.prepare(`INSERT INTO organization_members (org_id, uid, role) VALUES (?, ?, 'owner')`).bind(id, user.sub),
          enterpriseAuditStatement(env, id, user.sub, "organization.created", "organization", id, { name, slug })
        ]);
        return json({ ok: true, organization: { id, slug, name, role: "owner" } }, 201, env);
      }

      if (parts[0] === "enterprise" && parts[1] === "organizations" && parts.length >= 3) {
        const user = await requireUser(request, env);
        const orgId = cleanId(parts[2]);
        const membership = await requireOrgMember(env, user.sub, orgId);

        if (request.method === "GET" && parts.length === 3) {
          const org = await env.DB.prepare(`SELECT id, slug, name, status, created_at, updated_at FROM organizations WHERE id = ?`).bind(orgId).first();
          return json({ ok: true, organization: org, membership: { role: membership.role } }, 200, env);
        }

        if (request.method === "GET" && parts.length === 4 && parts[3] === "dashboard") {
          await requireOrgRole(env, user.sub, orgId, ENTERPRISE_EMPLOYER_ROLES);
          const [cohorts, assignments, learners, readiness] = await Promise.all([
            env.DB.prepare(`SELECT COUNT(*) AS n FROM cohorts WHERE org_id = ? AND status != 'archived'`).bind(orgId).first(),
            env.DB.prepare(`SELECT COUNT(*) AS n FROM program_assignments WHERE org_id = ? AND status != 'archived'`).bind(orgId).first(),
            env.DB.prepare(`SELECT COUNT(DISTINCT uid) AS n FROM cohort_members WHERE org_id = ? AND status = 'active'`).bind(orgId).first(),
            env.DB.prepare(`
              SELECT ROUND(AVG(rs.overall_score),1) AS avg_score, COUNT(*) AS n
              FROM readiness_snapshots rs
              WHERE rs.org_id = ? AND rs.evidence_coverage >= 0.6
                AND rs.rowid = (
                  SELECT r2.rowid FROM readiness_snapshots r2
                  WHERE r2.org_id = rs.org_id AND r2.uid = rs.uid
                  ORDER BY datetime(r2.created_at) DESC, r2.rowid DESC LIMIT 1
                )
            `).bind(orgId).first()
          ]);
          return json({ ok: true, summary: { cohorts: Number(cohorts?.n || 0), assignments: Number(assignments?.n || 0), learners: Number(learners?.n || 0), averageReadiness: readiness?.avg_score == null ? null : Number(readiness.avg_score), readinessSnapshots: Number(readiness?.n || 0) } }, 200, env);
        }

        if (parts.length === 4 && parts[3] === "cohorts") {
          if (request.method === "GET") {
            await requireOrgRole(env, user.sub, orgId, ENTERPRISE_EMPLOYER_ROLES);
            const rows = await env.DB.prepare(`SELECT id, name, pathway_id, program_level, status, deadline_at, created_at, updated_at FROM cohorts WHERE org_id = ? ORDER BY created_at DESC`).bind(orgId).all();
            return json({ ok: true, cohorts: rows.results || [] }, 200, env);
          }
          if (request.method === "POST") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
            const body = await readJson(request);
            const pathway = getPathway(body.pathwayId);
            const name = cleanString(body.name, 120);
            if (name.length < 2) throw new HttpError(400, "Cohort name is required");
            const level = enterpriseEnum(body.programLevel || "professional", ["foundations", "essentials", "professional"], "program level");
            const deadline = optionalIsoDate(body.deadlineAt);
            const id = `coh_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
            await env.DB.batch([
              env.DB.prepare(`INSERT INTO cohorts (id, org_id, name, pathway_id, program_level, deadline_at, created_by_uid) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, orgId, name, pathway.id, level, deadline, user.sub),
              enterpriseAuditStatement(env, orgId, user.sub, "cohort.created", "cohort", id, { name, pathwayId: pathway.id, programLevel: level, deadlineAt: deadline })
            ]);
            return json({ ok: true, cohort: { id, name, pathwayId: pathway.id, programLevel: level, deadlineAt: deadline, status: "draft" } }, 201, env);
          }
        }

        if (parts.length === 4 && parts[3] === "invites") {
          if (request.method === "GET") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
            const rows = await env.DB.prepare(`SELECT id, cohort_id, email_normalized, role, status, expires_at, accepted_at, created_at FROM organization_invites WHERE org_id = ? ORDER BY created_at DESC LIMIT 200`).bind(orgId).all();
            return json({ ok: true, invites: rows.results || [] }, 200, env);
          }
          if (request.method === "POST") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
            const body = await readJson(request);
            const email = normalizeEnterpriseEmail(body.email);
            const role = enterpriseEnum(body.role || "learner", ["training_admin", "content_manager", "manager", "viewer", "learner"], "role");
            let cohortId = null;
            if (body.cohortId) {
              cohortId = cleanId(body.cohortId);
              const cohort = await env.DB.prepare(`SELECT id FROM cohorts WHERE id = ? AND org_id = ? AND status != 'archived'`).bind(cohortId, orgId).first();
              if (!cohort) throw new HttpError(404, "Cohort not found");
            }
            const days = Math.max(1, Math.min(30, Number(body.expiresDays || 7)));
            const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
            const token = randomToken(32);
            const tokenHash = await sha256Hex(token);
            const id = `inv_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
            await env.DB.batch([
              env.DB.prepare(`INSERT INTO organization_invites (id, org_id, cohort_id, email_normalized, token_hash, role, expires_at, created_by_uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, orgId, cohortId, email, tokenHash, role, expiresAt, user.sub),
              enterpriseAuditStatement(env, orgId, user.sub, "invite.created", "invite", id, { cohortId, email, role, expiresAt })
            ]);
            return json({ ok: true, invite: { id, cohortId, email, role, expiresAt, token } }, 201, env);
          }
        }

        if (parts.length === 4 && parts[3] === "assignments") {
          if (request.method === "GET") {
            await requireOrgRole(env, user.sub, orgId, ENTERPRISE_EMPLOYER_ROLES);
            const rows = await env.DB.prepare(`SELECT id, cohort_id, pathway_id, track, credential_target, status, due_at, curriculum_version, created_at, updated_at FROM program_assignments WHERE org_id = ? ORDER BY created_at DESC`).bind(orgId).all();
            return json({ ok: true, assignments: rows.results || [] }, 200, env);
          }
          if (request.method === "POST") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
            const body = await readJson(request);
            const cohortId = cleanId(body.cohortId);
            const cohort = await env.DB.prepare(`SELECT id, pathway_id FROM cohorts WHERE id = ? AND org_id = ? AND status != 'archived'`).bind(cohortId, orgId).first();
            if (!cohort) throw new HttpError(404, "Cohort not found");
            const pathway = getPathway(body.pathwayId || cohort.pathway_id);
            if (cohort.pathway_id !== pathway.id) throw new HttpError(409, "Assignment pathway must match cohort pathway");
            const track = enterpriseEnum(body.track || "professional", ["foundations", "professional"], "track");
            const target = enterpriseEnum(body.credentialTarget || (track === "professional" ? "professional_readiness" : "essentials"), ["foundations", "essentials", "applied", "role_lab", "professional_readiness"], "credential target");
            if (track === "foundations" && !["foundations", "essentials"].includes(target)) throw new HttpError(400, "Foundations track cannot target a professional credential");
            const dueAt = optionalIsoDate(body.dueAt);
            const id = `asn_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
            await env.DB.batch([
              env.DB.prepare(`INSERT INTO program_assignments (id, org_id, cohort_id, pathway_id, track, credential_target, due_at, created_by_uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, orgId, cohortId, pathway.id, track, target, dueAt, user.sub),
              enterpriseAuditStatement(env, orgId, user.sub, "assignment.created", "assignment", id, { cohortId, pathwayId: pathway.id, track, credentialTarget: target, dueAt })
            ]);
            return json({ ok: true, assignment: { id, cohortId, pathwayId: pathway.id, track, credentialTarget: target, dueAt, status: "draft", curriculumVersion: "2.0" } }, 201, env);
          }
        }

        if (parts.length === 4 && parts[3] === "firm-content") {
          if (request.method === "GET") {
            await requireOrgRole(env, user.sub, orgId, ENTERPRISE_EMPLOYER_ROLES);
            const assignmentId = url.searchParams.get("assignmentId");
            const rows = assignmentId
              ? await env.DB.prepare(`SELECT * FROM firm_content WHERE org_id = ? AND assignment_id = ? ORDER BY position_key, created_at`).bind(orgId, cleanId(assignmentId)).all()
              : await env.DB.prepare(`SELECT * FROM firm_content WHERE org_id = ? ORDER BY updated_at DESC LIMIT 300`).bind(orgId).all();
            return json({ ok: true, content: (rows.results || []).map(enterpriseFirmContentPublic) }, 200, env);
          }
          if (request.method === "POST") {
            await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin", "content_manager"]);
            const body = await readJson(request);
            const pathway = getPathway(body.pathwayId);
            const assignmentId = body.assignmentId ? cleanId(body.assignmentId) : null;
            if (assignmentId) {
              const a = await env.DB.prepare(`SELECT id FROM program_assignments WHERE id = ? AND org_id = ?`).bind(assignmentId, orgId).first();
              if (!a) throw new HttpError(404, "Assignment not found");
            }
            const type = enterpriseEnum(body.contentType || "lesson", ["intro", "lesson", "resource", "exercise", "assessment", "role_lab_stage", "manager_note", "case"], "content type");
            const title = cleanString(body.title, 160);
            if (title.length < 2) throw new HttpError(400, "Content title is required");
            const bodyJson = safeEnterpriseJson(body.body || {}, 18000);
            const positionKey = cleanString(body.positionKey || `z-${Date.now()}`, 100);
            const sourceId = body.sourceStandardContentId ? cleanString(body.sourceStandardContentId, 150) : null;
            const id = `cnt_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
            const snapshot = JSON.stringify({ title, body: JSON.parse(bodyJson), positionKey, visibility: "visible", contentType: type, sourceStandardContentId: sourceId });
            await env.DB.batch([
              env.DB.prepare(`INSERT INTO firm_content (id, org_id, assignment_id, pathway_id, content_type, title, body_json, position_key, source_standard_content_id, created_by_uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, orgId, assignmentId, pathway.id, type, title, bodyJson, positionKey, sourceId, user.sub),
              env.DB.prepare(`INSERT INTO firm_content_versions (id, content_id, version, snapshot_json, created_by_uid) VALUES (?, ?, 1, ?, ?)`).bind(crypto.randomUUID(), id, snapshot, user.sub),
              enterpriseAuditStatement(env, orgId, user.sub, "firm_content.created", "firm_content", id, { assignmentId, pathwayId: pathway.id, contentType: type, title })
            ]);
            return json({ ok: true, content: { id, assignmentId, pathwayId: pathway.id, contentType: type, title, positionKey, visibility: "visible", currentVersion: 1 } }, 201, env);
          }
        }

        if (parts.length === 5 && parts[3] === "firm-content" && parts[4] === "reorder" && request.method === "POST") {
          await requireOrgRole(env,user.sub,orgId,['owner','training_admin','content_manager']); const body=await readJson(request); const assignmentId=cleanId(body.assignmentId); const order=Array.isArray(body.order)?body.order.map(cleanId):[];
          if(!order.length||order.length>300||new Set(order).size!==order.length) throw new HttpError(400,'A unique content order is required');
          const rows=(await env.DB.prepare(`SELECT * FROM firm_content WHERE org_id=? AND assignment_id=? ORDER BY position_key,created_at`).bind(orgId,assignmentId).all()).results||[]; const ids=rows.map(x=>x.id);
          if(ids.length!==order.length||ids.some(id=>!order.includes(id))) throw new HttpError(409,'Reorder must include every Firm Layer item in the selected assignment');
          const byId=new Map(rows.map(x=>[x.id,x])); const statements=[];
          order.forEach((id,index)=>{const x=byId.get(id),positionKey=`firm-${String(index+1).padStart(4,'0')}`,nextVersion=Number(x.current_version||1)+1,snapshot=JSON.stringify({title:x.title,body:v2ParseJson(x.body_json,{}),positionKey,visibility:x.visibility,contentType:x.content_type,sourceStandardContentId:x.source_standard_content_id});statements.push(env.DB.prepare(`UPDATE firm_content SET position_key=?,current_version=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND org_id=?`).bind(positionKey,nextVersion,id,orgId),env.DB.prepare(`INSERT INTO firm_content_versions (id,content_id,version,snapshot_json,created_by_uid) VALUES (?,?,?,?,?)`).bind(crypto.randomUUID(),id,nextVersion,snapshot,user.sub));});
          statements.push(enterpriseAuditStatement(env,orgId,user.sub,'firm_content.reordered','assignment',assignmentId,{order})); await env.DB.batch(statements); return json({ok:true,assignmentId,order},200,env);
        }

        if (parts.length === 6 && parts[3] === "firm-content" && parts[5] === "versions" && request.method === "GET") {
          await requireOrgRole(env,user.sub,orgId,ENTERPRISE_EMPLOYER_ROLES); const contentId=cleanId(parts[4]);
          const existing=await env.DB.prepare(`SELECT id,title,current_version FROM firm_content WHERE id=? AND org_id=? LIMIT 1`).bind(contentId,orgId).first(); if(!existing) throw new HttpError(404,'Firm content not found');
          const rows=await env.DB.prepare(`SELECT id,version,snapshot_json,created_by_uid,created_at FROM firm_content_versions WHERE content_id=? ORDER BY version DESC`).bind(contentId).all();
          return json({ok:true,content:{id:existing.id,title:existing.title,currentVersion:Number(existing.current_version||1)},versions:(rows.results||[]).map(v=>({id:v.id,version:Number(v.version),snapshot:v2ParseJson(v.snapshot_json,{}),createdByUid:v.created_by_uid,createdAt:v.created_at}))},200,env);
        }

        if (parts.length === 5 && parts[3] === "firm-content" && request.method === "PATCH") {
          await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin", "content_manager"]);
          const contentId = cleanId(parts[4]);
          const existing = await env.DB.prepare(`SELECT * FROM firm_content WHERE id = ? AND org_id = ?`).bind(contentId, orgId).first();
          if (!existing) throw new HttpError(404, "Firm content not found");
          const body = await readJson(request);
          const title = body.title === undefined ? existing.title : cleanString(body.title, 160);
          const bodyJson = body.body === undefined ? existing.body_json : safeEnterpriseJson(body.body, 18000);
          const positionKey = body.positionKey === undefined ? existing.position_key : cleanString(body.positionKey, 100);
          const visibility = body.visibility === undefined ? existing.visibility : enterpriseEnum(body.visibility, ["visible", "hidden", "archived"], "visibility");
          const nextVersion = Number(existing.current_version || 1) + 1;
          const snapshot = JSON.stringify({ title, body: JSON.parse(bodyJson), positionKey, visibility, contentType: existing.content_type, sourceStandardContentId: existing.source_standard_content_id });
          await env.DB.batch([
            env.DB.prepare(`UPDATE firm_content SET title = ?, body_json = ?, position_key = ?, visibility = ?, current_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND org_id = ?`).bind(title, bodyJson, positionKey, visibility, nextVersion, contentId, orgId),
            env.DB.prepare(`INSERT INTO firm_content_versions (id, content_id, version, snapshot_json, created_by_uid) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), contentId, nextVersion, snapshot, user.sub),
            enterpriseAuditStatement(env, orgId, user.sub, "firm_content.updated", "firm_content", contentId, { visibility, version: nextVersion })
          ]);
          return json({ ok: true, content: { id: contentId, title, positionKey, visibility, currentVersion: nextVersion } }, 200, env);
        }
      }

      if (request.method === "POST" && url.pathname === "/enterprise/invites/accept") {
        const user = await requireUser(request, env);
        const body = await readJson(request);
        const token = cleanString(body.token, 200);
        if (!token) throw new HttpError(400, "Invite token is required");
        const tokenHash = await sha256Hex(token);
        const invite = await env.DB.prepare(`SELECT * FROM organization_invites WHERE token_hash = ? AND status = 'pending' LIMIT 1`).bind(tokenHash).first();
        if (!invite) throw new HttpError(404, "Invite not found or no longer active");
        if (Date.parse(invite.expires_at) <= Date.now()) {
          await env.DB.prepare(`UPDATE organization_invites SET status = 'expired' WHERE id = ?`).bind(invite.id).run();
          throw new HttpError(410, "Invite expired");
        }
        const userEmail = normalizeEnterpriseEmail(user.email || "", true);
        if (userEmail && userEmail !== invite.email_normalized) throw new HttpError(403, "This invite was issued to a different email address");
        const statements = [
          env.DB.prepare(`INSERT INTO organization_members (org_id, uid, role, status) VALUES (?, ?, ?, 'active') ON CONFLICT(org_id, uid) DO UPDATE SET status='active', updated_at=CURRENT_TIMESTAMP`).bind(invite.org_id, user.sub, invite.role),
          env.DB.prepare(`UPDATE organization_invites SET status='accepted', accepted_by_uid=?, accepted_at=CURRENT_TIMESTAMP WHERE id=?`).bind(user.sub, invite.id),
          enterpriseAuditStatement(env, invite.org_id, user.sub, "invite.accepted", "invite", invite.id, { cohortId: invite.cohort_id, role: invite.role })
        ];
        if (invite.cohort_id) {
          statements.push(env.DB.prepare(`INSERT INTO cohort_members (cohort_id, org_id, uid, status) VALUES (?, ?, ?, 'active') ON CONFLICT(cohort_id, uid) DO UPDATE SET status='active'`).bind(invite.cohort_id, invite.org_id, user.sub));
        }
        await env.DB.batch(statements);
        return json({ ok: true, organizationId: invite.org_id, cohortId: invite.cohort_id || null, role: invite.role }, 200, env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "competencies" && parts.length === 3) {
        await requireUser(request, env);
        const pathway = getPathway(parts[2]);
        const rows = await env.DB.prepare(`
          SELECT c.id, c.code, c.name, c.category, c.description, pc.weight, pc.minimum_score, pc.critical
          FROM pathway_competencies pc JOIN competencies c ON c.id = pc.competency_id
          WHERE pc.pathway_id = ? AND c.status = 'active'
          ORDER BY pc.weight DESC, c.name
        `).bind(pathway.id).all();
        return json({ ok: true, pathway: { id: pathway.id, title: pathway.title }, competencies: rows.results || [] }, 200, env);
      }

      // ==================================================
      // CAPITAL MASTERY V2 — ASSIGNMENT LIFECYCLE + LEARNER VIEW
      // ==================================================

      if (request.method === "GET" && url.pathname === "/enterprise/catalog") {
        return json({
          ok: true,
          version: "2.0",
          credentialLadder: [
            { id: "foundations", title: "Foundations Certificate", track: "foundations", level: "beginner" },
            { id: "essentials", title: "Essentials Certificate", track: "foundations", level: "beginner" },
            { id: "applied", title: "Applied Skills Certificate", track: "professional", level: "advanced" },
            { id: "role_lab", title: "Role Lab Certificate", track: "professional", level: "advanced" },
            { id: "professional_readiness", title: "Professional Readiness Certificate", track: "professional", level: "advanced" }
          ],
          pathways: ALL_PATHWAYS.map(p => ({ id: p.id, code: p.code, title: p.title, role: p.role, group: p.group, purpose: p.purpose, focus: p.focus, simulation: p.simulation }))
        }, 200, env);
      }

      if (request.method === "GET" && url.pathname === "/enterprise/learner/assignments") {
        const user = await requireUser(request, env);
        const rows = await env.DB.prepare(`
          SELECT
            a.id AS assignment_id,
            a.pathway_id,
            a.track,
            a.credential_target,
            a.status AS assignment_status,
            a.due_at,
            a.curriculum_version,
            c.id AS cohort_id,
            c.name AS cohort_name,
            c.status AS cohort_status,
            o.id AS org_id,
            o.name AS org_name
          FROM cohort_members cm
          JOIN cohorts c ON c.id = cm.cohort_id AND c.org_id = cm.org_id
          JOIN organizations o ON o.id = cm.org_id
          JOIN program_assignments a ON a.cohort_id = c.id AND a.org_id = c.org_id
          WHERE cm.uid = ?
            AND cm.status = 'active'
            AND c.status IN ('active','completed')
            AND o.status = 'active'
            AND a.status IN ('published','completed')
          ORDER BY COALESCE(a.due_at, '9999-12-31T23:59:59Z'), a.created_at DESC
        `).bind(user.sub).all();
        return json({ ok: true, assignments: rows.results || [] }, 200, env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "learner" && parts[2] === "assignments" && parts.length === 4) {
        const user = await requireUser(request, env);
        const assignmentId = cleanId(parts[3]);
        const assignment = await env.DB.prepare(`
          SELECT a.*, c.name AS cohort_name, c.status AS cohort_status, o.name AS org_name
          FROM program_assignments a
          JOIN cohorts c ON c.id = a.cohort_id AND c.org_id = a.org_id
          JOIN organizations o ON o.id = a.org_id
          JOIN cohort_members cm ON cm.cohort_id = c.id AND cm.org_id = c.org_id
          WHERE a.id = ? AND cm.uid = ? AND cm.status = 'active'
          LIMIT 1
        `).bind(assignmentId, user.sub).first();
        if (!assignment || !["published", "completed"].includes(assignment.status)) throw new HttpError(404, "Assigned program not found");
        const firmRows = await env.DB.prepare(`
          SELECT * FROM firm_content
          WHERE org_id = ? AND assignment_id = ? AND visibility = 'visible'
          ORDER BY position_key, created_at
        `).bind(assignment.org_id, assignment.id).all();
        const prefs = await env.DB.prepare(`
          SELECT standard_content_id, visibility FROM standard_content_preferences
          WHERE org_id = ? AND assignment_id = ?
        `).bind(assignment.org_id, assignment.id).all();
        return json({
          ok: true,
          assignment: {
            id: assignment.id,
            organizationId: assignment.org_id,
            organizationName: assignment.org_name,
            cohortId: assignment.cohort_id,
            cohortName: assignment.cohort_name,
            pathwayId: assignment.pathway_id,
            track: assignment.track,
            credentialTarget: assignment.credential_target,
            status: assignment.status,
            dueAt: assignment.due_at,
            curriculumVersion: assignment.curriculum_version
          },
          firmContent: (firmRows.results || []).map(enterpriseFirmContentPublic),
          standardPreferences: prefs.results || []
        }, 200, env);
      }

      if (parts[0] === "enterprise" && parts[1] === "organizations" && parts.length === 5 && parts[3] === "assignments" && request.method === "PATCH") {
        const user = await requireUser(request, env);
        const orgId = cleanId(parts[2]);
        await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
        const assignmentId = cleanId(parts[4]);
        const existing = await env.DB.prepare(`SELECT * FROM program_assignments WHERE id = ? AND org_id = ? LIMIT 1`).bind(assignmentId, orgId).first();
        if (!existing) throw new HttpError(404, "Assignment not found");
        const body = await readJson(request);
        const status = body.status === undefined ? existing.status : enterpriseEnum(body.status, ["draft", "published", "completed", "archived"], "assignment status");
        const dueAt = body.dueAt === undefined ? existing.due_at : optionalIsoDate(body.dueAt);
        await env.DB.batch([
          env.DB.prepare(`UPDATE program_assignments SET status = ?, due_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND org_id = ?`).bind(status, dueAt, assignmentId, orgId),
          enterpriseAuditStatement(env, orgId, user.sub, "assignment.updated", "assignment", assignmentId, { status, dueAt })
        ]);
        return json({ ok: true, assignment: { id: assignmentId, status, dueAt } }, 200, env);
      }

      if (parts[0] === "enterprise" && parts[1] === "organizations" && parts.length === 5 && parts[3] === "cohorts" && request.method === "PATCH") {
        const user = await requireUser(request, env);
        const orgId = cleanId(parts[2]);
        await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin"]);
        const cohortId = cleanId(parts[4]);
        const existing = await env.DB.prepare(`SELECT * FROM cohorts WHERE id = ? AND org_id = ? LIMIT 1`).bind(cohortId, orgId).first();
        if (!existing) throw new HttpError(404, "Cohort not found");
        const body = await readJson(request);
        const status = body.status === undefined ? existing.status : enterpriseEnum(body.status, ["draft", "active", "completed", "archived"], "cohort status");
        const deadlineAt = body.deadlineAt === undefined ? existing.deadline_at : optionalIsoDate(body.deadlineAt);
        await env.DB.batch([
          env.DB.prepare(`UPDATE cohorts SET status = ?, deadline_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND org_id = ?`).bind(status, deadlineAt, cohortId, orgId),
          enterpriseAuditStatement(env, orgId, user.sub, "cohort.updated", "cohort", cohortId, { status, deadlineAt })
        ]);
        return json({ ok: true, cohort: { id: cohortId, status, deadlineAt } }, 200, env);
      }

      if (parts[0] === "enterprise" && parts[1] === "organizations" && parts.length === 6 && parts[3] === "assignments" && parts[5] === "standard-visibility" && request.method === "PATCH") {
        const user = await requireUser(request, env);
        const orgId = cleanId(parts[2]);
        await requireOrgRole(env, user.sub, orgId, ["owner", "training_admin", "content_manager"]);
        const assignmentId = cleanId(parts[4]);
        const assignment = await env.DB.prepare(`SELECT id FROM program_assignments WHERE id = ? AND org_id = ? LIMIT 1`).bind(assignmentId, orgId).first();
        if (!assignment) throw new HttpError(404, "Assignment not found");
        const body = await readJson(request);
        const standardContentId = cleanString(body.standardContentId, 150);
        if (!standardContentId) throw new HttpError(400, "Standard content ID is required");
        const visibility = enterpriseEnum(body.visibility || "visible", ["visible", "hidden"], "visibility");
        if (visibility === "hidden" && ENTERPRISE_REQUIRED_STANDARD_CONTENT.has(standardContentId)) {
          throw new HttpError(409, "Required Capital Mastery Standard content cannot be hidden");
        }
        await env.DB.batch([
          env.DB.prepare(`
            INSERT INTO standard_content_preferences (org_id, assignment_id, standard_content_id, visibility, updated_by_uid)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(assignment_id, standard_content_id)
            DO UPDATE SET visibility=excluded.visibility, updated_by_uid=excluded.updated_by_uid, updated_at=CURRENT_TIMESTAMP
          `).bind(orgId, assignmentId, standardContentId, visibility, user.sub),
          enterpriseAuditStatement(env, orgId, user.sub, "standard_content.visibility_changed", "standard_content", standardContentId, { assignmentId, visibility })
        ]);
        return json({ ok: true, standardContentId, visibility }, 200, env);
      }

      // ==================================================
      // CAPITAL MASTERY V2 — DIAGNOSTIC + COMPETENCY + ROLE LAB ENGINE
      // ==================================================

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "diagnostic" && parts.length === 3) {
        const user = await requireUser(request, env);
        const pathway = getPathway(parts[2]);
        const rows = await env.DB.prepare(`SELECT * FROM diagnostic_questions WHERE pathway_id=? AND version='2.0' AND status='active' ORDER BY position`).bind(pathway.id).all();
        const diagnosticRows=(rows.results||[]).length?(rows.results||[]):v2DynamicDiagnosticQuestions(pathway);
        if (!diagnosticRows.length) throw new HttpError(404, "Diagnostic not available yet");
        return json({ ok:true, pathway:{id:pathway.id,title:pathway.title}, version:'2.0', credentialWeight:0, questions:diagnosticRows.map(v2PublicDiagnosticQuestion), note:'The diagnostic measures your starting point and does not count against credential eligibility.' },200,env);
      }

      if (request.method === "POST" && url.pathname === "/enterprise/diagnostic/submit") {
        const user = await requireUser(request, env);
        const body = await readJson(request);
        const pathway = getPathway(body.pathwayId);
        const assignmentId = body.assignmentId ? cleanId(body.assignmentId) : null;
        await v2EnforceDiagnosticRate(env,user.sub,pathway.id,assignmentId);
        let orgId=null, cohortId=null, curriculumVersion='2.0';
        if (assignmentId) {
          const a=await v2RequireAssignmentAccess(env,user.sub,assignmentId,pathway.id);
          if (a.accessRole==='learner' && !['published','completed'].includes(a.status)) throw new HttpError(403,'Assignment is not active');
          orgId=a.org_id; cohortId=a.cohort_id; curriculumVersion=a.curriculum_version || '2.0';
        }
        const qRes=await env.DB.prepare(`SELECT * FROM diagnostic_questions WHERE pathway_id=? AND version='2.0' AND status='active' ORDER BY position`).bind(pathway.id).all();
        const qs=(qRes.results||[]).length?(qRes.results||[]):v2DynamicDiagnosticQuestions(pathway); if(!qs.length) throw new HttpError(404,'Diagnostic not available yet');
        const answers=body.answers && typeof body.answers==='object' ? body.answers : {};
        let correct=0;
        const byComp={};
        const details=[];
        for(const q of qs){
          const submitted=String(answers[q.id]??''); const ok=submitted===String(q.correct_answer); if(ok) correct++;
          (byComp[q.competency_id] ||= []).push(ok?100:0);
          details.push({id:q.id,correct:ok,rationale:ok?q.rationale:undefined});
        }
        const score=Math.round((correct/qs.length)*100);
        const attemptId=`dia_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
        const compScores=Object.fromEntries(Object.entries(byComp).map(([k,v])=>[k,Math.round(v.reduce((a,b)=>a+b,0)/v.length)]));
        const statements=[env.DB.prepare(`INSERT INTO diagnostic_attempts (id,uid,org_id,cohort_id,assignment_id,pathway_id,version,score,competency_scores_json) VALUES (?,?,?,?,?,?,?,?,?)`).bind(attemptId,user.sub,orgId,cohortId,assignmentId,pathway.id,'2.0',score,JSON.stringify(compScores))];
        const evidenceIds=[];
        const scope=assignmentId||'public';
        for(const [competencyId,cScore] of Object.entries(compScores)){
          const eid=`evi_${(await sha256Hex(`diagnostic|${user.sub}|${scope}|${pathway.id}|2.0|${competencyId}`)).slice(0,28)}`; evidenceIds.push([competencyId,eid]);
          statements.push(env.DB.prepare(`
            INSERT INTO competency_evidence (id,uid,org_id,assignment_id,pathway_id,competency_id,source_type,source_id,score,weight,evidence_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id, score=excluded.score, weight=excluded.weight, evidence_json=excluded.evidence_json
          `).bind(eid,user.sub,orgId,assignmentId,pathway.id,competencyId,'diagnostic',attemptId,cScore,0.25,JSON.stringify({diagnosticVersion:'2.0',baselineOnly:true})));
        }
        await env.DB.batch(statements);
        for(const [competencyId] of evidenceIds) await v2RecomputeCompetency(env,{uid:user.sub,orgId,assignmentId,pathwayId:pathway.id,competencyId});
        const readiness=await v2CreateReadinessSnapshot(env,{uid:user.sub,orgId,cohortId,assignmentId,pathwayId:pathway.id,curriculumVersion});
        return json({ok:true,attemptId,score,correct,total:qs.length,competencyScores:compScores,readiness,note:'Diagnostic score is baseline-only and has 0% credential weight.'},200,env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "learner" && parts[2] === "skills" && parts.length === 4) {
        const user=await requireUser(request,env); const pathway=getPathway(parts[3]);
        const assignmentId=url.searchParams.get('assignmentId') ? cleanId(url.searchParams.get('assignmentId')) : null;
        let orgId=null, cohortId=null;
        if(assignmentId){const a=await v2RequireAssignmentAccess(env,user.sub,assignmentId,pathway.id);orgId=a.org_id;cohortId=a.cohort_id;}
        const orgScope=orgId||'public', assignmentScope=assignmentId||'public';
        const rows=await env.DB.prepare(`SELECT cs.competency_id,cs.score,cs.evidence_count,c.name,c.category,pc.weight,pc.minimum_score,pc.critical FROM competency_scores cs JOIN competencies c ON c.id=cs.competency_id JOIN pathway_competencies pc ON pc.pathway_id=cs.pathway_id AND pc.competency_id=cs.competency_id WHERE cs.uid=? AND cs.org_scope=? AND cs.assignment_scope=? AND cs.pathway_id=? ORDER BY pc.weight DESC,c.name`).bind(user.sub,orgScope,assignmentScope,pathway.id).all();
        const latest=await env.DB.prepare(`SELECT * FROM readiness_snapshots WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY created_at DESC LIMIT 1`).bind(user.sub,pathway.id,assignmentScope).first();
        return json({ok:true,pathway:{id:pathway.id,title:pathway.title},assignmentId,competencies:rows.results||[],readiness:latest?{overallScore:Number(latest.overall_score),status:latest.status,baselineScore:latest.baseline_score==null?null:Number(latest.baseline_score),improvement:latest.improvement==null?null:Number(latest.improvement),evidenceCoverage:Math.round(Number(latest.evidence_coverage||0)*100),evidencePhase:latest.evidence_phase||'baseline',createdAt:latest.created_at}:null},200,env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "role-labs" && parts.length === 3) {
        await requireUser(request,env); const pathway=getPathway(parts[2]);
        const rows=await env.DB.prepare(`SELECT lab_key,version,pathway_id,title,role_title,client_name,scenario_json,pass_score FROM role_lab_definitions WHERE pathway_id=? AND status='active' ORDER BY version DESC`).bind(pathway.id).all();
        let labRows=rows.results||[]; if(!labRows.length){const dyn=v2DynamicLab(pathway);if(dyn)labRows=[dyn.definition];}
        return json({ok:true,labs:labRows.map(r=>({labKey:r.lab_key,version:r.version,pathwayId:r.pathway_id,title:r.title,roleTitle:r.role_title,clientName:r.client_name,scenario:v2ParseJson(r.scenario_json,{}),passScore:Number(r.pass_score)}))},200,env);
      }

      if (request.method === "POST" && parts[0] === "enterprise" && parts[1] === "role-labs" && parts[3] === "start" && parts.length === 4) {
        const user=await requireUser(request,env); const labKey=cleanId(parts[2]); const body=await readJson(request);
        let lab=await env.DB.prepare(`SELECT * FROM role_lab_definitions WHERE lab_key=? AND status='active' ORDER BY version DESC LIMIT 1`).bind(labKey).first();
        if(!lab){const dyn=v2DynamicLabByKey(labKey);lab=dyn?.definition||null;} if(!lab) throw new HttpError(404,'Role Lab not found');
        const assignmentId=body.assignmentId?cleanId(body.assignmentId):null; let orgId=null,cohortId=null;
        if(assignmentId){const a=await v2RequireAssignmentAccess(env,user.sub,assignmentId,lab.pathway_id); if(a.accessRole==='learner'&&!['published','completed'].includes(a.status)) throw new HttpError(403,'Assignment is not active'); orgId=a.org_id;cohortId=a.cohort_id;}
        const essentials=await v2ActiveCredential(env,user.sub,lab.pathway_id,'essentials');
        if(!essentials) throw new HttpError(409,'Earn the Essentials Certificate before starting the Role Lab');
        const applied=await v2ActiveCredential(env,user.sub,lab.pathway_id,'applied');
        if(!applied) throw new HttpError(409,'Earn the Applied Skills Certificate before starting the Role Lab');
        if(assignmentId){const baseline=await env.DB.prepare(`SELECT id FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND assignment_id=? ORDER BY submitted_at ASC LIMIT 1`).bind(user.sub,lab.pathway_id,assignmentId).first(); if(!baseline) throw new HttpError(409,'Complete the assigned baseline diagnostic before starting the Role Lab');}
        const existing=await env.DB.prepare(`SELECT * FROM role_lab_runs WHERE uid=? AND lab_key=? AND lab_version=? AND COALESCE(assignment_id,'public')=? AND status IN ('in_progress','revision_required','submitted') ORDER BY started_at DESC LIMIT 1`).bind(user.sub,lab.lab_key,lab.version,assignmentId||'public').first();
        if(existing) return json({ok:true,runId:existing.id,resumed:true},200,env);
        const runId=`run_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
        await env.DB.prepare(`INSERT INTO role_lab_runs (id,uid,org_id,cohort_id,assignment_id,pathway_id,lab_key,lab_version,status) VALUES (?,?,?,?,?,?,?,?,?)`).bind(runId,user.sub,orgId,cohortId,assignmentId,lab.pathway_id,lab.lab_key,lab.version,'in_progress').run();
        return json({ok:true,runId,resumed:false},201,env);
      }

      if (request.method === "GET" && parts[0] === "enterprise" && parts[1] === "role-lab-runs" && parts.length === 3) {
        const user=await requireUser(request,env); const runId=cleanId(parts[2]); const run=await env.DB.prepare(`SELECT * FROM role_lab_runs WHERE id=? AND uid=? LIMIT 1`).bind(runId,user.sub).first(); if(!run) throw new HttpError(404,'Role Lab run not found');
        let lab=await env.DB.prepare(`SELECT * FROM role_lab_definitions WHERE lab_key=? AND version=?`).bind(run.lab_key,run.lab_version).first(); if(!lab){const dyn=v2DynamicLabByKey(run.lab_key);lab=dyn?.definition||null;} if(!lab) throw new HttpError(404,'Role Lab definition unavailable'); const state=await v2RunState(env,run);
        const completed=state.latest.map(s=>({taskId:s.task_id,attemptNo:Number(s.attempt_no),score:Number(v2ParseJson(s.score_json,{}).score||0),feedback:v2ParseJson(s.feedback_json,{})}));
        return json({ok:true,run:{id:run.id,status:run.status,pathwayId:run.pathway_id,labKey:run.lab_key,labVersion:run.lab_version,assignmentId:run.assignment_id,startedAt:run.started_at,score:run.score==null?state.overall:Number(run.score)},lab:{title:lab.title,roleTitle:lab.role_title,clientName:lab.client_name,scenario:v2ParseJson(lab.scenario_json,{}),passScore:Number(lab.pass_score)},currentTask:state.current?v2PublicLabTask(state.current):null,completed,overallScore:state.overall,complete:state.complete},200,env);
      }

      if (request.method === "POST" && parts[0] === "enterprise" && parts[1] === "role-lab-runs" && parts[3] === "submit" && parts.length === 4) {
        const user=await requireUser(request,env); const runId=cleanId(parts[2]); const run=await env.DB.prepare(`SELECT * FROM role_lab_runs WHERE id=? AND uid=? LIMIT 1`).bind(runId,user.sub).first(); if(!run) throw new HttpError(404,'Role Lab run not found'); if(run.status==='passed'||run.status==='archived') throw new HttpError(409,'Role Lab run is closed');
        const state=await v2RunState(env,run); if(!state.current) throw new HttpError(409,'No Role Lab task is currently open');
        const body=await readJson(request); const taskId=cleanId(body.taskId); if(taskId!==state.current.id) throw new HttpError(409,'Complete the current Role Lab task before moving ahead');
        const prior=await env.DB.prepare(`SELECT MAX(attempt_no) AS n FROM role_lab_submissions WHERE run_id=? AND task_id=?`).bind(runId,taskId).first(); const attemptNo=Number(prior?.n||0)+1; if(attemptNo>Number(state.current.max_attempts)) throw new HttpError(409,'Maximum attempts reached for this task');
        const response=body.response&&typeof body.response==='object'?body.response:{}; const grading=v2ParseJson(state.current.grading_json,{}); const result=v2GradeRules(grading,response); const passedTask=result.score>=Number(state.current.pass_score); const feedback={messages:result.feedback,breakdown:result.breakdown,passed:passedTask,managerNote:passedTask?'Work accepted. Continue to the next desk task.':'Revision required. Fix the issues below and resubmit before continuing.'};
        const subId=`sub_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`; await env.DB.prepare(`INSERT INTO role_lab_submissions (id,run_id,task_id,attempt_no,response_json,score_json,feedback_json) VALUES (?,?,?,?,?,?,?)`).bind(subId,runId,taskId,attemptNo,JSON.stringify(response),JSON.stringify({score:result.score,earned:result.earned,possible:result.possible}),JSON.stringify(feedback)).run();
        if(passedTask){
          const cmap=v2ParseJson(state.current.competency_map_json,{}); const statements=[]; const comps=[];
          for(const [competencyId,mapWeight] of Object.entries(cmap)){const scope=run.assignment_id||'public';const eid=`evi_${(await sha256Hex(`role_lab|${user.sub}|${scope}|${run.lab_key}|${run.lab_version}|${taskId}|${competencyId}`)).slice(0,28)}`;comps.push(competencyId);statements.push(env.DB.prepare(`
            INSERT INTO competency_evidence (id,uid,org_id,assignment_id,pathway_id,competency_id,source_type,source_id,score,weight,evidence_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
              source_id=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.source_id ELSE competency_evidence.source_id END,
              score=MAX(competency_evidence.score, excluded.score),
              weight=excluded.weight,
              evidence_json=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.evidence_json ELSE competency_evidence.evidence_json END
          `).bind(eid,user.sub,run.org_id,run.assignment_id,run.pathway_id,competencyId,'role_lab',subId,result.score,Math.max(0.25,1.5*Number(mapWeight||1)),JSON.stringify({labKey:run.lab_key,taskId,attemptNo,breakdown:result.breakdown})));}
          if(statements.length) await env.DB.batch(statements); for(const competencyId of comps) await v2RecomputeCompetency(env,{uid:user.sub,orgId:run.org_id,assignmentId:run.assignment_id,pathwayId:run.pathway_id,competencyId});
        }
        const nextState=await v2RunState(env,run); let runStatus=passedTask?'in_progress':'revision_required'; let finalScore=null;
        if(nextState.complete){runStatus='passed';finalScore=nextState.overall;await env.DB.prepare(`UPDATE role_lab_runs SET status='passed',score=?,submitted_at=CURRENT_TIMESTAMP,completed_at=CURRENT_TIMESTAMP WHERE id=?`).bind(finalScore,runId).run();}
        else await env.DB.prepare(`UPDATE role_lab_runs SET status=?,revision_count=revision_count+?,submitted_at=CURRENT_TIMESTAMP WHERE id=?`).bind(runStatus,passedTask?0:1,runId).run();
        const readiness=passedTask?await v2CreateReadinessSnapshot(env,{uid:user.sub,orgId:run.org_id,cohortId:run.cohort_id,assignmentId:run.assignment_id,pathwayId:run.pathway_id,curriculumVersion:'2.0'}):null;
        let issuedCredentials=[];
        if(nextState.complete){const pathway=getPathway(run.pathway_id);const refreshed=await v2RefreshCredentials(env,{user,pathway,orgId:run.org_id,assignmentId:run.assignment_id});issuedCredentials=refreshed.filter(x=>x.issued).map(x=>x.credential);}
        return json({ok:true,submissionId:subId,taskId,attemptNo,score:result.score,passed:passedTask,feedback,runStatus,overallScore:nextState.overall,complete:nextState.complete,readiness,issuedCredentials,nextTask:nextState.current?v2PublicLabTask(nextState.current):null},200,env);
      }

      // ==================================================
      // CAPITAL MASTERY ACADEMY — CROSS-CAREER EVIDENCE ROLLUPS
      // ==================================================
      if (request.method === 'GET' && url.pathname === '/enterprise/academy/catalog') {
        return json({ok:true,standardVersion:'2.0-academy',awards:ACADEMY_AWARDS.map(x=>({id:x.id,pathwayId:x.pathwayId,level:x.level,title:x.title,kind:x.kind||'academy',required:x.required||null,pool:x.pool||null,minimum:x.minimum||null})),note:'Academy credentials are evidence roll-ups of authoritative Capital Mastery career credentials; they are not separate professional licenses or employer endorsements.'},200,env);
      }
      if (request.method === 'GET' && url.pathname === '/enterprise/academy/me') {
        const user=await requireUser(request,env); const state=await academyCredentialState(env,user.sub);
        const statuses=ACADEMY_AWARDS.map(def=>{const eligibility=academyEligibility(def,state);const credential=state.rows.find(x=>x.pathway_id===def.pathwayId&&x.credential_level===def.level)||null;return {definition:{id:def.id,pathwayId:def.pathwayId,level:def.level,title:def.title},eligible:eligibility.eligible,summary:eligibility.summary,missing:eligibility.missing,credential:credential?academySafeCredential(credential):null,supporting:eligibility.supporting.map(academySafeCredential)};});
        return json({ok:true,statuses},200,env);
      }
      if (request.method === 'POST' && url.pathname === '/enterprise/academy/refresh') {
        const user=await requireUser(request,env); const results=await academyRefresh(env,user); return json({ok:true,results:results.map(x=>({definition:x.definition,eligible:x.eligibility.eligible,summary:x.eligibility.summary,missing:x.eligibility.missing,issued:x.issued===true,existing:x.existing===true,credential:x.credential?{credentialId:x.credential.credential_id||x.credential.credentialId,publicToken:x.credential.public_token||x.credential.publicToken,title:x.credential.credential_title||x.credential.title,level:x.credential.credential_level||x.credential.level,pathwayId:x.credential.pathway_id||x.credential.pathwayId,status:x.credential.status}:null}))},200,env);
      }

      // ==================================================
      // CAPITAL MASTERY V2 — ASSESSMENTS + CREDENTIAL EVIDENCE
      // ==================================================

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'assessments' && parts.length === 3) {
        const user=await requireUser(request,env);
        const key=cleanId(parts[2]);
        let assessment=await env.DB.prepare(`SELECT * FROM v2_assessment_definitions WHERE assessment_key=? AND status='active' ORDER BY version DESC LIMIT 1`).bind(key).first();
        let dynamic=null; if(!assessment){dynamic=v2DynamicAssessmentFromKey(key);assessment=dynamic?.definition||null;}
        if(!assessment) throw new HttpError(404,'Assessment not available');
        const assignmentId=url.searchParams.get('assignmentId')?cleanId(url.searchParams.get('assignmentId')):null;
        await v2AssessmentAccess(env,user,assessment,assignmentId);
        const qres=dynamic?{results:dynamic.questions}:await env.DB.prepare(`SELECT * FROM v2_assessment_questions WHERE assessment_key=? AND assessment_version=? AND status='active' ORDER BY position`).bind(assessment.assessment_key,assessment.version).all();
        return json({ok:true,assessment:{key:assessment.assessment_key,version:assessment.version,pathwayId:assessment.pathway_id,stage:assessment.stage,title:assessment.title,description:assessment.description,scenario:v2ParseJson(assessment.scenario_json,{}),passScore:Number(assessment.pass_score)},questions:(qres.results||[]).map(v2PublicAssessmentQuestion)},200,env);
      }

      if (request.method === 'POST' && parts[0] === 'enterprise' && parts[1] === 'assessments' && parts[3] === 'submit' && parts.length === 4) {
        const user=await requireUser(request,env);
        const key=cleanId(parts[2]);
        let assessment=await env.DB.prepare(`SELECT * FROM v2_assessment_definitions WHERE assessment_key=? AND status='active' ORDER BY version DESC LIMIT 1`).bind(key).first();
        let dynamic=null; if(!assessment){dynamic=v2DynamicAssessmentFromKey(key);assessment=dynamic?.definition||null;}
        if(!assessment) throw new HttpError(404,'Assessment not available');
        const body=await readJson(request);
        const assignmentId=body.assignmentId?cleanId(body.assignmentId):null;
        await v2EnforceAssessmentRate(env,user.sub,assessment.pathway_id,assessment.assessment_key,assignmentId);
        const access=await v2AssessmentAccess(env,user,assessment,assignmentId);
        const answers=body.answers&&typeof body.answers==='object'&&!Array.isArray(body.answers)?body.answers:{};
        const result=await v2GradeAssessment(env,{user,assessment,answers,assignmentId,orgId:access.orgId,cohortId:access.cohortId,curriculumVersion:access.curriculumVersion,dynamicQuestions:dynamic?.questions||null});
        const pathway=getPathway(assessment.pathway_id);
        const refreshed=result.passed?await v2RefreshCredentials(env,{user,pathway,orgId:access.orgId,assignmentId}):[];
        return json({ok:true,assessmentKey:key,version:assessment.version,passScore:Number(assessment.pass_score),...result,issuedCredentials:refreshed.filter(x=>x.issued).map(x=>x.credential),credentialRefresh:refreshed.map(x=>({level:x.level,issued:x.issued===true,eligible:x.eligible===true,missing:x.missing||x.eligibility?.missing||[]}))},200,env);
      }

      if (request.method === 'POST' && url.pathname === '/enterprise/credentials/refresh') {
        const user=await requireUser(request,env);
        const body=await readJson(request);
        const pathway=getPathway(body.pathwayId);
        const assignmentId=body.assignmentId?cleanId(body.assignmentId):null;
        let orgId=null;
        if(assignmentId){const a=await v2RequireAssignmentAccess(env,user.sub,assignmentId,pathway.id);orgId=a.org_id;}
        const refreshed=await v2RefreshCredentials(env,{user,pathway,orgId,assignmentId});
        return json({ok:true,pathwayId:pathway.id,results:refreshed.map(x=>({level:x.level,issued:x.issued===true,existing:x.existing===true,eligible:x.eligible===true,missing:x.missing||x.eligibility?.missing||[],credential:x.credential?{credentialId:x.credential.credential_id||x.credential.credentialId,title:x.credential.credential_title||x.credential.title,status:x.credential.status,standardVersion:x.credential.standard_version||x.credential.standardVersion||null}:null}))},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'credentials' && parts[2] === 'definitions' && parts.length === 4) {
        await requireUser(request,env);
        const pathway=getPathway(parts[3]);
        const rows=await env.DB.prepare(`SELECT id,credential_level,standard_version,title,track,learner_level,description,requirements_json,sort_order,status FROM credential_definitions WHERE pathway_id=? AND status='active' ORDER BY sort_order`).bind(pathway.id).all();
        return json({ok:true,pathway:{id:pathway.id,title:pathway.title},definitions:(rows.results||[]).map(r=>({id:r.id,level:r.credential_level,standardVersion:r.standard_version,title:r.title,track:r.track,learnerLevel:r.learner_level,description:r.description,requirements:v2ParseJson(r.requirements_json,{}),sortOrder:Number(r.sort_order)}))},200,env);
      }

      if (request.method === 'GET' && url.pathname === '/enterprise/credentials/me') {
        const user=await requireUser(request,env);
        const rows=await env.DB.prepare(`
          SELECT credential_id,public_token,pathway_id,credential_level,credential_title,holder_name,status,issued_at,revoked_at,revocation_reason,reissued_from_id,reissued_to_id,standard_version,credential_definition_id,org_id,assignment_id,evidence_summary_json
          FROM credentials WHERE uid=? ORDER BY issued_at DESC
        `).bind(user.sub).all();
        return json({ok:true,credentials:(rows.results||[]).map(r=>({...r,evidence_summary:v2ParseJson(r.evidence_summary_json,{})}))},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'credentials' && parts.length === 4 && parts[3] === 'evidence') {
        const user=await requireUser(request,env);
        const credentialId=cleanId(parts[2]);
        const credential=await env.DB.prepare(`SELECT * FROM credentials WHERE credential_id=? LIMIT 1`).bind(credentialId).first();
        if(!credential) throw new HttpError(404,'Credential not found');
        let allowed=credential.uid===user.sub;
        if(!allowed && credential.org_id){try{await requireOrgRole(env,user.sub,credential.org_id,ENTERPRISE_EMPLOYER_ROLES);allowed=true;}catch{}}
        if(!allowed && user.sub===env.ADMIN_UID) allowed=true;
        if(!allowed) throw new HttpError(403,'Credential evidence access required');
        const evidence=await env.DB.prepare(`SELECT id,evidence_type,evidence_ref,title,evidence_json,created_at FROM credential_evidence_items WHERE credential_id=? ORDER BY created_at,id`).bind(credentialId).all();
        return json({ok:true,credential:{credentialId:credential.credential_id,title:credential.credential_title,pathwayId:credential.pathway_id,level:credential.credential_level,status:credential.status,standardVersion:credential.standard_version,issuedAt:credential.issued_at,assignmentId:credential.assignment_id||null,orgId:credential.org_id||null},evidence:(evidence.results||[]).map(x=>({id:x.id,type:x.evidence_type,ref:x.evidence_ref,title:x.title,data:v2ParseJson(x.evidence_json,{}),createdAt:x.created_at}))},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'verify' && parts.length === 3) {
        const publicToken=cleanString(parts[2],200);
        const credential=await env.DB.prepare(`SELECT credential_id,public_token,holder_name,pathway_id,credential_level,credential_title,status,issued_at,revoked_at,standard_version,credential_definition_id,evidence_summary_json FROM credentials WHERE public_token=? AND credential_id NOT LIKE 'DEMO-%' LIMIT 1`).bind(publicToken).first();
        if(!credential) return json({ok:false,valid:false,error:'Credential not found'},404,env);
        const definition=credential.credential_definition_id?await env.DB.prepare(`SELECT description,requirements_json,track,learner_level FROM credential_definitions WHERE id=? LIMIT 1`).bind(credential.credential_definition_id).first():null;
        const items=await env.DB.prepare(`SELECT evidence_type,title,evidence_json FROM credential_evidence_items WHERE credential_id=? AND evidence_type IN ('credential','assessment','role_lab','readiness','competency_profile','curriculum') ORDER BY created_at,id`).bind(credential.credential_id).all();
        const publicEvidence=(items.results||[]).map(x=>{
          const data=v2ParseJson(x.evidence_json,{});
          if(x.evidence_type==='competency_profile') return {type:x.evidence_type,title:x.title,competencies:(data.competencies||[]).map(c=>({name:c.name,category:c.category,score:Number(c.score),minimumScore:Number(c.minimum_score||0),critical:Number(c.critical)===1,evidenceCount:Number(c.evidence_count||0)}))};
          if(x.evidence_type==='readiness') return {type:x.evidence_type,title:x.title,overallScore:data.overallScore,status:data.status,evidenceCoverage:data.evidenceCoverage,criticalFloorsMet:data.criticalFloorsMet,improvement:data.improvement};
          if(x.evidence_type==='assessment') return {type:x.evidence_type,title:x.title,key:data.key,version:data.version,score:data.score,passed:data.passed,submittedAt:data.submittedAt};
          if(x.evidence_type==='role_lab') return {type:x.evidence_type,title:x.title,key:data.key,version:data.version,score:data.score,completedAt:data.completedAt};
          if(x.evidence_type==='credential') return {type:x.evidence_type,title:x.title,credentialId:data.credentialId,pathwayId:data.pathwayId,level:data.level,issuedAt:data.issuedAt};
          return {type:x.evidence_type,title:x.title,standardVersion:credential.standard_version};
        });
        return json({ok:true,valid:credential.status==='active',credential:{credentialId:credential.credential_id,holderName:credential.holder_name,pathwayId:credential.pathway_id,level:credential.credential_level,title:credential.credential_title,status:credential.status,issuedAt:credential.issued_at,revokedAt:credential.revoked_at||null,standardVersion:credential.standard_version||'1.0-legacy',description:definition?.description||null,track:definition?.track||'legacy',learnerLevel:definition?.learner_level||'legacy'},evidence:publicEvidence},200,env);
      }

      // ==================================================
      // CAPITAL MASTERY V2 — MANAGER REVIEWS + NOTIFICATIONS
      // ==================================================
      if (request.method === 'POST' && url.pathname === '/enterprise/notifications/refresh') {
        const user=await requireUser(request,env); const result=await refreshEnterpriseNotifications(env,user); return json({ok:true,...result},200,env);
      }
      if (request.method === 'GET' && url.pathname === '/enterprise/notifications') {
        const user=await requireUser(request,env); await refreshEnterpriseNotifications(env,user);
        const rows=await env.DB.prepare(`SELECT id,org_id,assignment_id,category,severity,title,body,action_hash,status,created_at,updated_at FROM enterprise_notifications WHERE recipient_uid=? AND status!='archived' ORDER BY CASE severity WHEN 'urgent' THEN 0 WHEN 'attention' THEN 1 WHEN 'positive' THEN 2 ELSE 3 END, created_at DESC LIMIT 100`).bind(user.sub).all();
        return json({ok:true,notifications:(rows.results||[]).map(x=>({id:x.id,orgId:x.org_id,assignmentId:x.assignment_id,category:x.category,severity:x.severity,title:x.title,body:x.body,actionHash:x.action_hash,status:x.status,createdAt:x.created_at,updatedAt:x.updated_at}))},200,env);
      }
      if (request.method === 'PATCH' && parts[0]==='enterprise' && parts[1]==='notifications' && parts.length===3) {
        const user=await requireUser(request,env); const id=cleanId(parts[2]); const body=await readJson(request); const status=enterpriseEnum(body.status||'read',['read','archived'],'notification status');
        const result=await env.DB.prepare(`UPDATE enterprise_notifications SET status=?,read_at=CASE WHEN ?='read' THEN CURRENT_TIMESTAMP ELSE read_at END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND recipient_uid=?`).bind(status,status,id,user.sub).run();
        if(!Number(result.meta?.changes||0)) throw new HttpError(404,'Notification not found'); return json({ok:true,id,status},200,env);
      }

      if (request.method === 'GET' && parts[0]==='enterprise' && parts[1]==='organizations' && parts[3]==='reviews' && parts.length===4) {
        const user=await requireUser(request,env),orgId=cleanId(parts[2]); await requireOrgRole(env,user.sub,orgId,ENTERPRISE_EMPLOYER_ROLES);
        const assignmentId=url.searchParams.get('assignmentId')?cleanId(url.searchParams.get('assignmentId')):null; const learnerUid=url.searchParams.get('learnerUid')?cleanString(url.searchParams.get('learnerUid'),180):null;
        let sql=`SELECT * FROM manager_reviews WHERE org_id=?`, binds=[orgId]; if(assignmentId){sql+=' AND assignment_id=?';binds.push(assignmentId);} if(learnerUid){sql+=' AND learner_uid=?';binds.push(learnerUid);} sql+=' ORDER BY created_at DESC LIMIT 200';
        const rows=await env.DB.prepare(sql).bind(...binds).all(); return json({ok:true,reviews:(rows.results||[]).map(managerReviewPublic)},200,env);
      }
      if (request.method === 'POST' && parts[0]==='enterprise' && parts[1]==='organizations' && parts[3]==='reviews' && parts.length===4) {
        const user=await requireUser(request,env),orgId=cleanId(parts[2]); await requireOrgRole(env,user.sub,orgId,['owner','training_admin','manager']); const body=await readJson(request);
        const assignmentId=cleanId(body.assignmentId),learnerUid=cleanString(body.learnerUid,180),artifactType=enterpriseEnum(body.artifactType||'general',['readiness','role_lab','assessment','credential','general'],'artifact type'),reviewStatus=enterpriseEnum(body.reviewStatus||'note',['note','needs_attention','resolved','commended'],'review status'),comment=cleanString(body.comment,2400),artifactRef=body.artifactRef?cleanString(body.artifactRef,180):null; const rating=body.rating==null?null:Number(body.rating);
        if(comment.length<3) throw new HttpError(400,'Review comment is required'); if(rating!=null&&(!Number.isInteger(rating)||rating<1||rating>5)) throw new HttpError(400,'Rating must be 1–5');
        const a=await env.DB.prepare(`SELECT a.pathway_id,a.cohort_id FROM program_assignments a JOIN cohort_members cm ON cm.cohort_id=a.cohort_id AND cm.org_id=a.org_id WHERE a.id=? AND a.org_id=? AND cm.uid=? LIMIT 1`).bind(assignmentId,orgId,learnerUid).first(); if(!a) throw new HttpError(404,'Learner assignment not found');
        const id=`review_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`; const noteId=`note_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
        await env.DB.batch([
          env.DB.prepare(`INSERT INTO manager_reviews (id,org_id,assignment_id,learner_uid,pathway_id,artifact_type,artifact_ref,review_status,rating,comment,created_by_uid) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(id,orgId,assignmentId,learnerUid,a.pathway_id,artifactType,artifactRef,reviewStatus,rating,comment,user.sub),
          env.DB.prepare(`INSERT INTO enterprise_notifications (id,recipient_uid,org_id,assignment_id,category,severity,title,body,action_hash,dedupe_key,status) VALUES (?,?,?,?,?,?,?,?,?,?,'unread') ON CONFLICT(recipient_uid,dedupe_key) DO UPDATE SET severity=excluded.severity,title=excluded.title,body=excluded.body,action_hash=excluded.action_hash,status='unread',updated_at=CURRENT_TIMESTAMP`).bind(noteId,learnerUid,orgId,assignmentId,'manager_review',reviewStatus==='needs_attention'?'attention':reviewStatus==='commended'?'positive':'info','New manager review',comment,`#/readiness/${encodeURIComponent(a.pathway_id)}?assignment=${encodeURIComponent(assignmentId)}`,`manager_review:${id}`),
          enterpriseAuditStatement(env,orgId,user.sub,'manager_review.created','manager_review',id,{assignmentId,learnerUid,artifactType,reviewStatus,rating})
        ]);
        return json({ok:true,review:{id,orgId,assignmentId,learnerUid,pathwayId:a.pathway_id,artifactType,artifactRef,reviewStatus,rating,comment,createdByUid:user.sub}},201,env);
      }
      if (request.method === 'PATCH' && parts[0]==='enterprise' && parts[1]==='organizations' && parts[3]==='reviews' && parts[4] && parts.length===5) {
        const user=await requireUser(request,env),orgId=cleanId(parts[2]),id=cleanId(parts[4]); await requireOrgRole(env,user.sub,orgId,['owner','training_admin','manager']); const existing=await env.DB.prepare(`SELECT * FROM manager_reviews WHERE id=? AND org_id=?`).bind(id,orgId).first(); if(!existing) throw new HttpError(404,'Manager review not found'); const body=await readJson(request);
        const reviewStatus=body.reviewStatus===undefined?existing.review_status:enterpriseEnum(body.reviewStatus,['note','needs_attention','resolved','commended'],'review status'), comment=body.comment===undefined?existing.comment:cleanString(body.comment,2400), rating=body.rating===undefined?existing.rating:(body.rating==null?null:Number(body.rating));
        if(rating!=null&&(!Number.isInteger(rating)||rating<1||rating>5)) throw new HttpError(400,'Rating must be 1–5');
        await env.DB.batch([env.DB.prepare(`UPDATE manager_reviews SET review_status=?,rating=?,comment=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND org_id=?`).bind(reviewStatus,rating,comment,id,orgId),enterpriseAuditStatement(env,orgId,user.sub,'manager_review.updated','manager_review',id,{reviewStatus,rating})]); return json({ok:true,review:{id,reviewStatus,rating,comment}},200,env);
      }

      // ==================================================
      // CAPITAL MASTERY V2 — EMPLOYER + LEARNER REPORTING
      // ==================================================

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'organizations' && parts[3] === 'members' && parts.length === 4) {
        const user=await requireUser(request,env); const orgId=cleanId(parts[2]);
        await requireOrgRole(env,user.sub,orgId,ENTERPRISE_EMPLOYER_ROLES);
        const rows=await env.DB.prepare(`
          SELECT m.uid,m.role,m.status,m.joined_at AS created_at,m.updated_at,
                 MAX(i.email_normalized) AS email,
                 MAX(c.holder_name) AS holder_name
          FROM organization_members m
          LEFT JOIN organization_invites i ON i.org_id=m.org_id AND i.accepted_by_uid=m.uid
          LEFT JOIN credentials c ON c.uid=m.uid
          WHERE m.org_id=?
          GROUP BY m.uid,m.role,m.status,m.joined_at,m.updated_at
          ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'training_admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'content_manager' THEN 3 WHEN 'viewer' THEN 4 ELSE 5 END, COALESCE(MAX(c.holder_name),MAX(i.email_normalized),m.uid)
        `).bind(orgId).all();
        return json({ok:true,members:(rows.results||[]).map(r=>({uid:r.uid,role:r.role,status:r.status,email:r.email||null,name:r.holder_name||null,createdAt:r.created_at,updatedAt:r.updated_at}))},200,env);
      }

      if (request.method === 'PATCH' && parts[0] === 'enterprise' && parts[1] === 'organizations' && parts[3] === 'members' && parts.length === 5) {
        const user=await requireUser(request,env); const orgId=cleanId(parts[2]); const targetUid=cleanString(parts[4],160);
        await requireOrgRole(env,user.sub,orgId,['owner','training_admin']);
        const target=await env.DB.prepare(`SELECT * FROM organization_members WHERE org_id=? AND uid=? LIMIT 1`).bind(orgId,targetUid).first();
        if(!target) throw new HttpError(404,'Organization member not found');
        const body=await readJson(request);
        const role=body.role===undefined?target.role:enterpriseEnum(body.role,['owner','training_admin','content_manager','manager','viewer','learner'],'role');
        const status=body.status===undefined?target.status:enterpriseEnum(body.status,['active','archived'],'member status');
        if(target.role==='owner' && (role!=='owner'||status!=='active')){
          const owners=await env.DB.prepare(`SELECT COUNT(*) AS n FROM organization_members WHERE org_id=? AND role='owner' AND status='active'`).bind(orgId).first();
          if(Number(owners?.n||0)<=1) throw new HttpError(409,'The organization must keep at least one active owner');
        }
        if(user.sub!==targetUid && (role==='owner'||target.role==='owner')) await requireOrgRole(env,user.sub,orgId,['owner']);
        await env.DB.batch([
          env.DB.prepare(`UPDATE organization_members SET role=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE org_id=? AND uid=?`).bind(role,status,orgId,targetUid),
          enterpriseAuditStatement(env,orgId,user.sub,'member.updated','organization_member',targetUid,{previousRole:target.role,role,previousStatus:target.status,status})
        ]);
        return json({ok:true,member:{uid:targetUid,role,status}},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'organizations' && parts[3] === 'readiness-report' && parts.length === 4) {
        const user=await requireUser(request,env); const orgId=cleanId(parts[2]);
        await requireOrgRole(env,user.sub,orgId,ENTERPRISE_EMPLOYER_ROLES);
        const assignmentId=url.searchParams.get('assignmentId')?cleanId(url.searchParams.get('assignmentId')):null;
        let assignment=null;
        if(assignmentId){assignment=await env.DB.prepare(`SELECT a.*,c.name AS cohort_name FROM program_assignments a JOIN cohorts c ON c.id=a.cohort_id WHERE a.id=? AND a.org_id=? LIMIT 1`).bind(assignmentId,orgId).first();if(!assignment) throw new HttpError(404,'Assignment not found');}
        const assignments=assignment?[assignment]:(await env.DB.prepare(`SELECT a.*,c.name AS cohort_name FROM program_assignments a JOIN cohorts c ON c.id=a.cohort_id WHERE a.org_id=? AND a.status!='archived' ORDER BY a.created_at DESC`).bind(orgId).all()).results||[];
        const reportAssignments=[];
        for(const a of assignments){
          const learners=(await env.DB.prepare(`
            SELECT cm.uid,
                   MAX(i.email_normalized) AS email,
                   MAX(cr.holder_name) AS holder_name
            FROM cohort_members cm
            LEFT JOIN organization_invites i ON i.org_id=cm.org_id AND i.cohort_id=cm.cohort_id AND i.accepted_by_uid=cm.uid
            LEFT JOIN credentials cr ON cr.uid=cm.uid
            WHERE cm.org_id=? AND cm.cohort_id=? AND cm.status='active'
            GROUP BY cm.uid ORDER BY COALESCE(MAX(cr.holder_name),MAX(i.email_normalized),cm.uid)
          `).bind(orgId,a.cohort_id).all()).results||[];
          const learnerRows=[];
          for(const l of learners){
            const readiness=await env.DB.prepare(`SELECT * FROM readiness_snapshots WHERE uid=? AND assignment_id=? ORDER BY created_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const diagnostic=await env.DB.prepare(`SELECT score,submitted_at FROM diagnostic_attempts WHERE uid=? AND assignment_id=? ORDER BY submitted_at ASC LIMIT 1`).bind(l.uid,a.id).first();
            const lab=await env.DB.prepare(`SELECT id,status,score,revision_count,completed_at FROM role_lab_runs WHERE uid=? AND assignment_id=? ORDER BY started_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const final=await env.DB.prepare(`SELECT va.score,va.passed,va.submitted_at FROM v2_assessment_attempts va LEFT JOIN v2_assessment_definitions vd ON vd.assessment_key=va.assessment_key AND vd.version=va.assessment_version WHERE va.uid=? AND va.assignment_id=? AND (vd.stage='final' OR va.assessment_key LIKE '%professional-final') ORDER BY va.score DESC,va.submitted_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const readinessCredential=await env.DB.prepare(`SELECT credential_id,status,issued_at FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' ORDER BY issued_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const managerReview=await env.DB.prepare(`SELECT * FROM manager_reviews WHERE org_id=? AND assignment_id=? AND learner_uid=? ORDER BY created_at DESC LIMIT 1`).bind(orgId,a.id,l.uid).first();
            const due=a.due_at?Date.parse(a.due_at):null;
            const complete=!!(readinessCredential&&readinessCredential.status==='active');
            learnerRows.push({uid:l.uid,name:l.holder_name||null,email:l.email||null,diagnostic:diagnostic?{score:Number(diagnostic.score),submittedAt:diagnostic.submitted_at}:null,readiness:readiness?{overallScore:Number(readiness.overall_score),status:readiness.status,baselineScore:readiness.baseline_score==null?null:Number(readiness.baseline_score),improvement:readiness.improvement==null?null:Number(readiness.improvement),evidenceCoverage:Math.round(Number(readiness.evidence_coverage||0)*100),evidencePhase:readiness.evidence_phase,competencies:v2ParseJson(readiness.competency_scores_json,{})}:null,roleLab:lab?{id:lab.id,status:lab.status,score:lab.score==null?null:Number(lab.score),revisions:Number(lab.revision_count||0),completedAt:lab.completed_at}:null,final:final?{score:Number(final.score),passed:Number(final.passed)===1,submittedAt:final.submitted_at}:null,credential:readinessCredential?{credentialId:readinessCredential.credential_id,status:readinessCredential.status,issuedAt:readinessCredential.issued_at}:null,managerReview:managerReview?managerReviewPublic(managerReview):null,complete,overdue:!!(due&&due<Date.now()&&!complete)});
          }
          const latestScores={};
          for(const l of learnerRows){for(const [cid,c] of Object.entries(l.readiness?.competencies||{})){if(c?.score==null)continue;(latestScores[cid] ||= {name:c.name,scores:[],minimum:Number(c.minimum||0),critical:c.critical===true}).scores.push(Number(c.score));}}
          const competencySummary=Object.entries(latestScores).map(([competencyId,v])=>({competencyId,name:v.name,averageScore:Math.round(v.scores.reduce((x,y)=>x+y,0)/v.scores.length),learnersMeasured:v.scores.length,minimumScore:v.minimum,critical:v.critical})).sort((x,y)=>x.averageScore-y.averageScore);
          const readinessMeasured=learnerRows.filter(x=>x.readiness);
          reportAssignments.push({assignment:{id:a.id,cohortId:a.cohort_id,cohortName:a.cohort_name,pathwayId:a.pathway_id,credentialTarget:a.credential_target,status:a.status,dueAt:a.due_at,curriculumVersion:a.curriculum_version},summary:{learners:learnerRows.length,measured:readinessMeasured.length,completed:learnerRows.filter(x=>x.complete).length,overdue:learnerRows.filter(x=>x.overdue).length,averageReadiness:readinessMeasured.length?Math.round(readinessMeasured.reduce((s,x)=>s+Number(x.readiness.overallScore||0),0)/readinessMeasured.length):null,averageImprovement:readinessMeasured.filter(x=>x.readiness.improvement!=null).length?Math.round(readinessMeasured.filter(x=>x.readiness.improvement!=null).reduce((s,x)=>s+Number(x.readiness.improvement||0),0)/readinessMeasured.filter(x=>x.readiness.improvement!=null).length):null},competencies:competencySummary,learners:learnerRows});
        }
        return json({ok:true,orgId,generatedAt:new Date().toISOString(),assignments:reportAssignments},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'learner' && parts[2] === 'readiness-report' && parts.length === 4) {
        const user=await requireUser(request,env); const pathway=getPathway(parts[3]);
        const assignmentId=url.searchParams.get('assignmentId')?cleanId(url.searchParams.get('assignmentId')):null;
        let assignment=null,orgId=null;
        if(assignmentId){assignment=await v2RequireAssignmentAccess(env,user.sub,assignmentId,pathway.id);orgId=assignment.org_id;}
        const skillsScope=assignmentId||'public';
        const readiness=await v2LatestReadiness(env,user.sub,pathway.id,assignmentId);
        const skills=(await env.DB.prepare(`SELECT cs.competency_id,cs.score,cs.evidence_count,c.name,c.category,pc.weight,pc.minimum_score,pc.critical FROM competency_scores cs JOIN competencies c ON c.id=cs.competency_id JOIN pathway_competencies pc ON pc.pathway_id=cs.pathway_id AND pc.competency_id=cs.competency_id WHERE cs.uid=? AND cs.assignment_scope=? AND cs.pathway_id=? ORDER BY pc.weight DESC,c.name`).bind(user.sub,skillsScope,pathway.id).all()).results||[];
        const credentials=(await env.DB.prepare(`SELECT credential_id,public_token,credential_level,credential_title,status,standard_version,issued_at,assignment_id FROM credentials WHERE uid=? AND pathway_id=? ORDER BY issued_at`).bind(user.sub,pathway.id).all()).results||[];
        const diagnostic=await env.DB.prepare(`SELECT score,submitted_at FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY submitted_at ASC LIMIT 1`).bind(user.sub,pathway.id,skillsScope).first();
        const lab=await env.DB.prepare(`SELECT id,lab_key,lab_version,status,score,revision_count,completed_at FROM role_lab_runs WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY started_at DESC LIMIT 1`).bind(user.sub,pathway.id,skillsScope).first();
        const finalAssessment=await env.DB.prepare(`SELECT va.assessment_key,va.assessment_version,va.score,va.passed,va.submitted_at FROM v2_assessment_attempts va LEFT JOIN v2_assessment_definitions vd ON vd.assessment_key=va.assessment_key AND vd.version=va.assessment_version WHERE va.uid=? AND va.pathway_id=? AND COALESCE(va.assignment_id,'public')=? AND (vd.stage='final' OR va.assessment_key LIKE '%professional-final') ORDER BY va.score DESC,va.submitted_at DESC LIMIT 1`).bind(user.sub,pathway.id,skillsScope).first();
        return json({ok:true,generatedAt:new Date().toISOString(),pathway:{id:pathway.id,title:pathway.title,role:pathway.role},assignment:assignment?{id:assignment.id,orgId,cohortId:assignment.cohort_id,dueAt:assignment.due_at,curriculumVersion:assignment.curriculum_version}:null,diagnostic:diagnostic?{score:Number(diagnostic.score),submittedAt:diagnostic.submitted_at}:null,readiness:readiness?{overallScore:Number(readiness.overall_score),status:readiness.status,baselineScore:readiness.baseline_score==null?null:Number(readiness.baseline_score),improvement:readiness.improvement==null?null:Number(readiness.improvement),evidenceCoverage:Math.round(Number(readiness.evidence_coverage||0)*100),evidencePhase:readiness.evidence_phase,createdAt:readiness.created_at}:null,competencies:skills.map(s=>({id:s.competency_id,name:s.name,category:s.category,score:Number(s.score),evidenceCount:Number(s.evidence_count||0),weight:Number(s.weight||0),minimumScore:Number(s.minimum_score||0),critical:Number(s.critical)===1})),roleLab:lab?{id:lab.id,key:lab.lab_key,version:lab.lab_version,status:lab.status,score:lab.score==null?null:Number(lab.score),revisions:Number(lab.revision_count||0),completedAt:lab.completed_at}:null,finalAssessment:finalAssessment?{key:finalAssessment.assessment_key,version:finalAssessment.assessment_version,score:Number(finalAssessment.score),passed:Number(finalAssessment.passed)===1,submittedAt:finalAssessment.submitted_at}:null,credentials:credentials.map(c=>({credentialId:c.credential_id,publicToken:c.public_token,level:c.credential_level,title:c.credential_title,status:c.status,standardVersion:c.standard_version,issuedAt:c.issued_at,assignmentId:c.assignment_id||null}))},200,env);
      }

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'organizations' && parts[3] === 'audit' && parts.length === 4) {
        const user=await requireUser(request,env); const orgId=cleanId(parts[2]);
        await requireOrgRole(env,user.sub,orgId,['owner','training_admin']);
        const rawLimit=Number(url.searchParams.get('limit')||100); const limit=Math.max(1,Math.min(200,Number.isFinite(rawLimit)?Math.floor(rawLimit):100));
        const rows=await env.DB.prepare(`SELECT id,actor_uid,action,target_type,target_id,details_json,created_at FROM enterprise_audit_events WHERE org_id=? ORDER BY created_at DESC LIMIT ?`).bind(orgId,limit).all();
        return json({ok:true,orgId,events:(rows.results||[]).map(x=>({id:x.id,actorUid:x.actor_uid,action:x.action,targetType:x.target_type,targetId:x.target_id,details:v2ParseJson(x.details_json,{}),createdAt:x.created_at}))},200,env);
      }

      if (request.method === 'GET' && url.pathname === '/enterprise/me/export') {
        const user=await requireUser(request,env);
        const [memberships,cohorts,credentials,diagnostics,scores,readiness,labs,assessments]=await Promise.all([
          env.DB.prepare(`SELECT m.org_id,o.name AS org_name,m.role,m.status,m.joined_at AS created_at,m.updated_at FROM organization_members m JOIN organizations o ON o.id=m.org_id WHERE m.uid=? ORDER BY o.name`).bind(user.sub).all(),
          env.DB.prepare(`SELECT cm.org_id,cm.cohort_id,c.name AS cohort_name,c.pathway_id,c.program_level,c.deadline_at,cm.status FROM cohort_members cm JOIN cohorts c ON c.id=cm.cohort_id WHERE cm.uid=? ORDER BY c.created_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT credential_id,pathway_id,credential_level,credential_title,status,standard_version,issued_at,revoked_at,org_id,assignment_id FROM credentials WHERE uid=? ORDER BY issued_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT id,org_id,cohort_id,assignment_id,pathway_id,version,score,submitted_at FROM diagnostic_attempts WHERE uid=? ORDER BY submitted_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT assignment_scope,pathway_id,competency_id,score,evidence_count,updated_at FROM competency_scores WHERE uid=? ORDER BY updated_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT id,org_id,cohort_id,assignment_id,pathway_id,overall_score,status,baseline_score,improvement,evidence_coverage,evidence_phase,curriculum_version,created_at FROM readiness_snapshots WHERE uid=? ORDER BY created_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT id,org_id,cohort_id,assignment_id,pathway_id,lab_key,lab_version,status,score,revision_count,started_at,completed_at FROM role_lab_runs WHERE uid=? ORDER BY started_at DESC`).bind(user.sub).all(),
          env.DB.prepare(`SELECT id,org_id,cohort_id,assignment_id,pathway_id,assessment_key,assessment_version,score,passed,submitted_at FROM v2_assessment_attempts WHERE uid=? ORDER BY submitted_at DESC`).bind(user.sub).all()
        ]);
        return json({ok:true,generatedAt:new Date().toISOString(),formatVersion:'1.0',account:{uid:user.sub,email:user.email||null,name:user.name||null},enterprise:{memberships:memberships.results||[],cohorts:cohorts.results||[],credentials:credentials.results||[],diagnostics:diagnostics.results||[],competencyScores:scores.results||[],readinessSnapshots:readiness.results||[],roleLabRuns:labs.results||[],assessmentAttempts:assessments.results||[]},note:'Assessment answer content and server-side answer keys are intentionally excluded from this export.'},200,env);
      }


      throw new HttpError(404, "Endpoint not found");
    } catch (error) {
      console.error(error);

      const status =
        error instanceof HttpError
          ? error.status
          : 500;

      return json(
        {
          ok: false,
          error:
            status === 500
              ? "Internal server error"
              : error.message
        },
        status,
        env
      );
    }
  }
};


// ======================================================
// PATHWAYS
// ======================================================

function getPathway(rawId) {
  const incoming = cleanString(rawId, 80)
    .toLowerCase();

  const canonical =
    PATHWAY_ALIASES[incoming] || incoming;

  const pathway = PATHWAYS[canonical];

  if (!pathway) {
    throw new HttpError(
      404,
      "Unknown Capital Mastery pathway"
    );
  }

  return pathway;
}

function validateItem(rawItem) {
  const item = cleanString(rawItem, 40);

  if (!OFFICIAL_ITEMS.includes(item)) {
    throw new HttpError(
      400,
      "Unknown assessment item"
    );
  }

  return item;
}


// ======================================================
// AUTHENTICATION
// ======================================================

async function requireUser(request, env) {
  const authorization =
    request.headers.get("Authorization");

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    throw new HttpError(
      401,
      "Authentication required"
    );
  }

  const token =
    authorization.substring(7).trim();

  try {
    return await verifyFirebaseIdToken(
      token,
      env.FIREBASE_PROJECT_ID
    );
  } catch (error) {
    console.error(
      "Firebase token verification failed:",
      error
    );

    throw new HttpError(
      401,
      "Invalid or expired authentication"
    );
  }
}


const DEMO_PRESETS = ['new_cohort','mixed_cohort','completed_cohort','weak_modeling','overdue_cohort','revision_cycle'];
const DEMO_NAMES = ['Avery Morgan','Jordan Lee','Maya Patel','Ethan Brooks','Sofia Rivera','Noah Bennett','Chloe Kim','Liam Carter','Priya Shah','Lucas Nguyen','Mia Thompson','Owen Garcia','Nora Williams','Leo Martinez','Zoe Robinson','Arjun Mehta','Ella Davis','Henry Clark','Ivy Chen','Caleb Wilson','Nina Foster','Ryan Park','Grace Evans','Theo Adams','Layla Reed','Julian Scott','Emma Turner','Aiden Lewis','Sana Khan','Miles Cooper'];

function demoSlugPart(value='demo') { return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,36) || 'demo'; }
function demoUid(orgId,index,name){ return `demo_uid_${orgId.slice(-8)}_${String(index+1).padStart(2,'0')}_${demoSlugPart(name).replace(/-/g,'_')}`; }
function demoEmail(name,index){ return `${demoSlugPart(name).replace(/-/g,'.')}.${index+1}@demo.invalid`; }
function demoCompetencies(overall, weakModeling=false) {
  const base=Math.max(45,Math.min(98,Number(overall||0)));
  const rows=[
    ['demo_finance','Financial analysis',Math.min(100,base+2),75,true],
    ['demo_modeling','Modeling & tool accuracy',weakModeling?62:Math.max(40,base-3),75,true],
    ['demo_research','Research & source discipline',Math.min(100,base+1),70,false],
    ['demo_judgment','Professional judgment',Math.max(40,base-1),70,false],
    ['demo_quality','Quality control',weakModeling?66:base,75,true],
    ['demo_comm','Communication',Math.min(100,base+3),70,false]
  ];
  return Object.fromEntries(rows.map(([id,name,score,minimum,critical])=>[id,{name,score,minimum,critical,evidenceCount:score?4:0}]));
}
function demoProfile(preset,index,size) {
  if(preset==='new_cohort') return {stage:'new',baseline:null,readiness:null,evidence:0,roleLab:null,revisions:0,final:null,complete:false};
  if(preset==='completed_cohort') { const score=86+(index%10); return {stage:'ready',baseline:68+(index%12),readiness:score,evidence:100,roleLab:84+(index%13),revisions:index%3===0?1:0,final:86+(index%12),complete:true}; }
  if(preset==='weak_modeling') { const score=76+(index%8); return {stage:index%4===0?'revision':'rolelab',baseline:70+(index%10),readiness:score,evidence:80,roleLab:68+(index%9),revisions:2+(index%2),final:index%3===0?null:82+(index%8),complete:false,weakModeling:true}; }
  if(preset==='overdue_cohort') { const score=60+(index%18); return {stage:index%3===0?'new':index%3===1?'baseline':'rolelab',baseline:index%3===0?null:score,readiness:index%3===0?null:score+4,evidence:index%3===0?0:index%3===1?25:70,roleLab:index%3===2?72+(index%6):null,revisions:index%3===2?1:0,final:null,complete:false}; }
  if(preset==='revision_cycle') { const score=72+(index%12); return {stage:'revision',baseline:70+(index%8),readiness:score,evidence:90,roleLab:70+(index%9),revisions:2+(index%3),final:null,complete:false}; }
  const pattern=index%6;
  if(pattern===0) return {stage:'new',baseline:null,readiness:null,evidence:0,roleLab:null,revisions:0,final:null,complete:false};
  if(pattern===1) return {stage:'baseline',baseline:58+(index%10),readiness:60+(index%8),evidence:20,roleLab:null,revisions:0,final:null,complete:false};
  if(pattern===2) return {stage:'learning',baseline:67+(index%10),readiness:72+(index%8),evidence:45,roleLab:null,revisions:0,final:null,complete:false};
  if(pattern===3) return {stage:'revision',baseline:72,readiness:76,evidence:80,roleLab:72,revisions:2,final:null,complete:false};
  if(pattern===4) return {stage:'final',baseline:75,readiness:84,evidence:95,roleLab:86,revisions:1,final:82,complete:false};
  return {stage:'ready',baseline:76,readiness:90+(index%6),evidence:100,roleLab:91,revisions:0,final:92,complete:true};
}

function demoStateProfile(state) {
  if(state==='new') return {baseline:null,readiness:null,evidence:0,roleLab:null,revisions:0,final:null,complete:false};
  if(state==='baseline') return {baseline:68,readiness:68,evidence:20,roleLab:null,revisions:0,final:null,complete:false};
  if(state==='learning') return {baseline:70,readiness:74,evidence:45,roleLab:null,revisions:0,final:null,complete:false};
  if(state==='revision') return {baseline:72,readiness:77,evidence:82,roleLab:71,revisions:2,final:null,complete:false};
  if(state==='final') return {baseline:74,readiness:84,evidence:95,roleLab:86,revisions:1,final:83,complete:false};
  if(state==='ready') return {baseline:76,readiness:91,evidence:100,roleLab:92,revisions:0,final:94,complete:true};
  throw new HttpError(400,'Unknown demo learner state');
}
const ENTERPRISE_PERMISSION_LAB = {
  owner:['workspace.manage','cohort.manage','assignment.manage','content.manage','member.manage','report.view','audit.view'],
  training_admin:['cohort.manage','assignment.manage','member.invite','report.view','audit.view'],
  content_manager:['content.manage','report.view'],
  manager:['report.view'],
  viewer:['report.view'],
  learner:['own_training.view','own_work.submit','own_report.view']
};

async function setEnterpriseDemoLearnerState(env, admin, body={}) {
  const orgId=cleanId(body.orgId), uid=cleanString(body.uid,180), state=cleanString(body.state,40);
  if(!orgId.startsWith('demo_org_')||!uid.startsWith('demo_uid_')) throw new HttpError(400,'Only synthetic demo learners can be changed');
  const row=await env.DB.prepare(`SELECT cm.uid,c.pathway_id,a.id AS assignment_id,c.id AS cohort_id FROM cohort_members cm JOIN cohorts c ON c.id=cm.cohort_id JOIN program_assignments a ON a.cohort_id=c.id AND a.org_id=c.org_id WHERE cm.org_id=? AND cm.uid=? LIMIT 1`).bind(orgId,uid).first();
  if(!row) throw new HttpError(404,'Synthetic learner not found');
  const pathway=getPathway(row.pathway_id); const p=demoStateProfile(state); const comps=demoCompetencies(p.readiness||p.baseline||55,state==='revision'); const tag=crypto.randomUUID().replace(/-/g,'').slice(0,8);
  const oldCreds=(await env.DB.prepare(`SELECT credential_id FROM credentials WHERE org_id=? AND uid=?`).bind(orgId,uid).all()).results||[];
  const statements=[];
  for(const c of oldCreds){statements.push(env.DB.prepare(`DELETE FROM credential_evidence_items WHERE credential_id=?`).bind(c.credential_id),env.DB.prepare(`DELETE FROM credential_events WHERE credential_id=?`).bind(c.credential_id));}
  statements.push(
    env.DB.prepare(`DELETE FROM credentials WHERE org_id=? AND uid=?`).bind(orgId,uid),
    env.DB.prepare(`DELETE FROM role_lab_submissions WHERE run_id IN (SELECT id FROM role_lab_runs WHERE org_id=? AND uid=?)`).bind(orgId,uid),
    env.DB.prepare(`DELETE FROM role_lab_runs WHERE org_id=? AND uid=?`).bind(orgId,uid),
    env.DB.prepare(`DELETE FROM v2_assessment_attempts WHERE org_id=? AND uid=?`).bind(orgId,uid),
    env.DB.prepare(`DELETE FROM diagnostic_attempts WHERE org_id=? AND uid=?`).bind(orgId,uid),
    env.DB.prepare(`DELETE FROM competency_evidence WHERE org_id=? AND uid=?`).bind(orgId,uid),
    env.DB.prepare(`DELETE FROM competency_scores WHERE uid=? AND org_scope=?`).bind(uid,orgId),
    env.DB.prepare(`DELETE FROM readiness_snapshots WHERE org_id=? AND uid=?`).bind(orgId,uid)
  );
  if(p.baseline!=null) statements.push(env.DB.prepare(`INSERT INTO diagnostic_attempts (id,uid,org_id,cohort_id,assignment_id,pathway_id,version,score,competency_scores_json) VALUES (?,?,?,?,?,?, '2.0',?,?)`).bind(`demo_diag_${tag}`,uid,orgId,row.cohort_id,row.assignment_id,pathway.id,p.baseline,JSON.stringify(comps)));
  if(p.readiness!=null) statements.push(env.DB.prepare(`INSERT INTO readiness_snapshots (id,uid,org_id,cohort_id,assignment_id,pathway_id,overall_score,status,competency_scores_json,baseline_score,improvement,curriculum_version,evidence_coverage,evidence_phase) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(`demo_ready_${tag}`,uid,orgId,row.cohort_id,row.assignment_id,pathway.id,p.readiness,p.complete?'ready':p.readiness>=85?'ready_with_development':p.readiness>=75?'near_ready':'developing',JSON.stringify(comps),p.baseline,p.readiness-p.baseline,'2.0',p.evidence/100,p.evidence>=100?'final_evidence':p.evidence>=70?'role_lab_evidence':p.evidence>0?'applied_evidence':'baseline'));
  if(p.roleLab!=null) statements.push(env.DB.prepare(`INSERT INTO role_lab_runs (id,uid,org_id,cohort_id,assignment_id,pathway_id,lab_key,lab_version,status,score,revision_count,submitted_at,completed_at) VALUES (?,?,?,?,?,?,?, '2.0',?,?,?,?,?)`).bind(`demo_lab_${tag}`,uid,orgId,row.cohort_id,row.assignment_id,pathway.id,v2CareerRoleLabKey(pathway.id),p.complete?'passed':p.revisions>0?'revision_required':'in_progress',p.roleLab,p.revisions,new Date().toISOString(),p.complete?new Date().toISOString():null));
  if(p.final!=null) statements.push(env.DB.prepare(`INSERT INTO v2_assessment_attempts (id,uid,org_id,cohort_id,assignment_id,pathway_id,assessment_key,assessment_version,score,passed,answers_json,result_json) VALUES (?,?,?,?,?,?,?, '2.0',?,?, '{}','{}')`).bind(`demo_final_${tag}`,uid,orgId,row.cohort_id,row.assignment_id,pathway.id,v2CareerAssessmentKey(pathway.id,'final'),p.final,p.final>=80?1:0));
  if(p.complete) statements.push(env.DB.prepare(`INSERT INTO credentials (credential_id,public_token,uid,holder_name,pathway_id,credential_level,credential_title,status,standard_version,credential_definition_id,org_id,assignment_id,evidence_summary_json) VALUES (?,?,?,?,?,'professional_readiness',?,'active','2.0',?,?,?,'{}')`).bind(`DEMO-${pathway.code}-${tag}`,`demo_verify_${tag}`,uid,'Synthetic Learner',pathway.id,`${pathway.title} Professional Readiness Certificate`,null,orgId,row.assignment_id));
  statements.push(enterpriseAuditStatement(env,orgId,admin.sub,'demo.learner_state_changed','demo_learner',uid,{state,synthetic:true}));
  await env.DB.batch(statements); return {orgId,uid,state,pathwayId:pathway.id};
}


async function createEnterpriseDemo(env, admin, body={}) {
  const preset=DEMO_PRESETS.includes(body.preset)?body.preset:'mixed_cohort';
  const size=Math.max(3,Math.min(30,Number(body.size||12)));
  const pathway=getPathway(body.pathwayId||'investment-banking');
  const stamp=crypto.randomUUID().replace(/-/g,'').slice(0,10);
  const orgId=`demo_org_${stamp}`, cohortId=`demo_cohort_${stamp}`, assignmentId=`demo_assignment_${stamp}`;
  const due = new Date(Date.now() + (preset==='overdue_cohort'?-3:30)*86400000).toISOString();
  const orgName=`[DEMO] ${pathway.title} · ${preset.replace(/_/g,' ')}`;
  const statements=[
    env.DB.prepare(`INSERT INTO organizations (id,slug,name,status,created_by_uid) VALUES (?,?,?,'active',?)`).bind(orgId,`demo-${stamp}`,orgName,admin.sub),
    env.DB.prepare(`INSERT INTO organization_members (org_id,uid,role,status) VALUES (?,?,'owner','active')`).bind(orgId,admin.sub),
    env.DB.prepare(`INSERT INTO cohorts (id,org_id,name,pathway_id,program_level,status,deadline_at,created_by_uid) VALUES (?,?,?,?, 'professional','active',?,?)`).bind(cohortId,orgId,`Synthetic ${pathway.title} Cohort`,pathway.id,due,admin.sub),
    env.DB.prepare(`INSERT INTO program_assignments (id,org_id,cohort_id,pathway_id,track,credential_target,status,due_at,curriculum_version,created_by_uid) VALUES (?,?,?,?, 'professional','professional_readiness','published',?,'2.0',?)`).bind(assignmentId,orgId,cohortId,pathway.id,due,admin.sub),
    enterpriseAuditStatement(env,orgId,admin.sub,'demo.created','organization',orgId,{synthetic:true,preset,size,pathwayId:pathway.id})
  ];
  for(let i=0;i<size;i++){
    const name=DEMO_NAMES[i%DEMO_NAMES.length], uid=demoUid(orgId,i,name), email=demoEmail(name,i), invId=`demo_inv_${stamp}_${i}`, token=`demo_token_${stamp}_${i}`;
    const p=demoProfile(preset,i,size); const comps=demoCompetencies(p.readiness||p.baseline||55,p.weakModeling===true);
    statements.push(
      env.DB.prepare(`INSERT INTO organization_invites (id,org_id,cohort_id,email_normalized,token_hash,role,status,expires_at,created_by_uid,accepted_by_uid,accepted_at) VALUES (?,?,?,?,?,'learner','accepted',datetime('now','+365 days'),?,?,CURRENT_TIMESTAMP)`).bind(invId,orgId,cohortId,email,token,admin.sub,uid),
      env.DB.prepare(`INSERT INTO cohort_members (cohort_id,org_id,uid,status) VALUES (?,?,?,'active')`).bind(cohortId,orgId,uid)
    );
    if(p.baseline!=null) statements.push(env.DB.prepare(`INSERT INTO diagnostic_attempts (id,uid,org_id,cohort_id,assignment_id,pathway_id,version,score,competency_scores_json) VALUES (?,?,?,?,?,?, '2.0',?,?)`).bind(`demo_diag_${stamp}_${i}`,uid,orgId,cohortId,assignmentId,pathway.id,p.baseline,JSON.stringify(comps)));
    if(p.readiness!=null) statements.push(env.DB.prepare(`INSERT INTO readiness_snapshots (id,uid,org_id,cohort_id,assignment_id,pathway_id,overall_score,status,competency_scores_json,baseline_score,improvement,curriculum_version,evidence_coverage,evidence_phase) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(`demo_ready_${stamp}_${i}`,uid,orgId,cohortId,assignmentId,pathway.id,p.readiness,p.complete?'ready':p.readiness>=85?'ready_with_development':p.readiness>=75?'near_ready':'developing',JSON.stringify(comps),p.baseline,p.baseline==null?null:p.readiness-p.baseline,'2.0',Number(p.evidence||0)/100,p.evidence>=100?'final_evidence':p.evidence>=70?'role_lab_evidence':p.evidence>0?'applied_evidence':'baseline'));
    if(p.roleLab!=null) statements.push(env.DB.prepare(`INSERT INTO role_lab_runs (id,uid,org_id,cohort_id,assignment_id,pathway_id,lab_key,lab_version,status,score,revision_count,submitted_at,completed_at) VALUES (?,?,?,?,?,?,?, '2.0',?,?,?,?,?)`).bind(`demo_lab_${stamp}_${i}`,uid,orgId,cohortId,assignmentId,pathway.id,pathway.id==='investment-banking'?'ib-project-northstar':`demo-${pathway.id}-role-lab`,p.complete?'passed':p.revisions>0?'revision_required':'in_progress',p.roleLab,p.revisions,new Date().toISOString(),p.complete?new Date().toISOString():null));
    if(p.final!=null) statements.push(env.DB.prepare(`INSERT INTO v2_assessment_attempts (id,uid,org_id,cohort_id,assignment_id,pathway_id,assessment_key,assessment_version,score,passed,answers_json,result_json) VALUES (?,?,?,?,?,?,?, '2.0',?,?, '{}','{}')`).bind(`demo_final_${stamp}_${i}`,uid,orgId,cohortId,assignmentId,pathway.id,pathway.id==='investment-banking'?'ib-professional-final':`demo-${pathway.id}-professional-final`,p.final,p.final>=80?1:0));
    if(p.complete){
      statements.push(env.DB.prepare(`INSERT INTO credentials (credential_id,public_token,uid,holder_name,pathway_id,credential_level,credential_title,status,standard_version,credential_definition_id,org_id,assignment_id,evidence_summary_json) VALUES (?,?,?,?,?,'professional_readiness',?,'active','2.0',?,?,?,'{}')`).bind(`DEMO-${pathway.code||'CM'}-${stamp}-${i}`,`demo_verify_${stamp}_${i}`,uid,name,pathway.id,`${pathway.title} Professional Readiness Certificate`,pathway.id==='investment-banking'?'ib-professional-readiness-v2':null,orgId,assignmentId));
    }
  }
  await env.DB.batch(statements);
  return {orgId,cohortId,assignmentId,preset,size,pathway:{id:pathway.id,title:pathway.title},name:orgName,synthetic:true};
}

async function resetEnterpriseDemos(env, admin) {
  const orgs=(await env.DB.prepare(`SELECT id FROM organizations WHERE id LIKE 'demo_org_%'`).all()).results||[];
  if(!orgs.length) return {deletedOrganizations:0};
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM credential_evidence_items WHERE credential_id IN (SELECT credential_id FROM credentials WHERE org_id LIKE 'demo_org_%')`),
    env.DB.prepare(`DELETE FROM credential_events WHERE credential_id IN (SELECT credential_id FROM credentials WHERE org_id LIKE 'demo_org_%')`),
    env.DB.prepare(`DELETE FROM credentials WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM role_lab_submissions WHERE run_id IN (SELECT id FROM role_lab_runs WHERE org_id LIKE 'demo_org_%')`),
    env.DB.prepare(`DELETE FROM role_lab_runs WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM v2_assessment_attempts WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM diagnostic_attempts WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM competency_evidence WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM readiness_snapshots WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM standard_content_preferences WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM firm_content_versions WHERE content_id IN (SELECT id FROM firm_content WHERE org_id LIKE 'demo_org_%')`),
    env.DB.prepare(`DELETE FROM firm_content WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM organization_invites WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM cohort_members WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM program_assignments WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM cohorts WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM enterprise_audit_events WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM organization_members WHERE org_id LIKE 'demo_org_%'`),
    env.DB.prepare(`DELETE FROM organizations WHERE id LIKE 'demo_org_%'`)
  ]);
  return {deletedOrganizations:orgs.length};
}

async function requireAdmin(request, env) {
  const user = await requireUser(request, env);

  if (user.sub !== env.ADMIN_UID) {
    throw new HttpError(
      403,
      "Administrator access required"
    );
  }

  return user;
}

async function verifyFirebaseIdToken(
  token,
  projectId
) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid Firebase token");
  }

  const [
    encodedHeader,
    encodedPayload,
    encodedSignature
  ] = parts;

  const header = JSON.parse(
    decodeBase64UrlText(encodedHeader)
  );

  const payload = JSON.parse(
    decodeBase64UrlText(encodedPayload)
  );

  if (header.alg !== "RS256") {
    throw new Error(
      "Invalid token algorithm"
    );
  }

  if (!header.kid) {
    throw new Error(
      "Token signing key missing"
    );
  }

  const keyResponse = await fetch(
    FIREBASE_JWKS,
    {
      cf: {
        cacheEverything: true,
        cacheTtl: 3600
      }
    }
  );

  if (!keyResponse.ok) {
    throw new Error(
      "Unable to load Firebase keys"
    );
  }

  const keySet =
    await keyResponse.json();

  const jwk = keySet.keys?.find(
    key => key.kid === header.kid
  );

  if (!jwk) {
    throw new Error(
      "Firebase signing key not found"
    );
  }

  const cryptoKey =
    await crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256"
      },
      false,
      ["verify"]
    );

  const signedData =
    new TextEncoder().encode(
      `${encodedHeader}.${encodedPayload}`
    );

  const signature =
    decodeBase64UrlBytes(
      encodedSignature
    );

  const validSignature =
    await crypto.subtle.verify(
      {
        name: "RSASSA-PKCS1-v1_5"
      },
      cryptoKey,
      signature,
      signedData
    );

  if (!validSignature) {
    throw new Error(
      "Invalid token signature"
    );
  }

  const now =
    Math.floor(Date.now() / 1000);

  if (
    !payload.exp ||
    payload.exp <= now
  ) {
    throw new Error("Token expired");
  }

  if (
    !payload.iat ||
    payload.iat > now + 300
  ) {
    throw new Error(
      "Invalid token issue time"
    );
  }

  if (
    payload.auth_time &&
    payload.auth_time > now + 300
  ) {
    throw new Error(
      "Invalid authentication time"
    );
  }

  if (payload.aud !== projectId) {
    throw new Error(
      "Invalid token audience"
    );
  }

  if (
    payload.iss !==
    `https://securetoken.google.com/${projectId}`
  ) {
    throw new Error(
      "Invalid token issuer"
    );
  }

  if (
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.sub.length > 128
  ) {
    throw new Error(
      "Invalid Firebase UID"
    );
  }

  return payload;
}


// ======================================================
// OFFICIAL ASSESSMENT GENERATION
// ======================================================



function simNum(id,label,answer,tolerance,unit,section,instruction,cell='') { return {id,type:'numeric',prompt:label,answer,tolerance,unit,workProduct:{section,label,cell,instruction}}; }
function simText(id,label,keywords,minHits,minWords,section,instruction) { return {id,type:'text',prompt:label,keywords,minHits,minWords,workProduct:{section,label,instruction}}; }

const CAREER_WORKBENCHES = {
  'private-equity': {
    project:'Project Harbor', role:'Private Equity Analyst — Buyout Investing', reviewer:'Elena Torres · Vice President', client:'Harbor Industrial Services', deadline:'Investment Committee pre-read · tomorrow 9:00 AM',
    objective:'Build the first-pass LBO return case, stress the downside and prepare an IC recommendation.',
    files:[
      {id:'cim',name:'01_Harbor_CIM.xlsx',type:'CIM',label:'Operating case',rows:[['Metric','LTM'],['Revenue','$420m'],['EBITDA','$80m'],['EBITDA margin','19.0%'],['Top customer','28% of revenue']]},
      {id:'terms',name:'02_Entry_Assumptions.xlsx',type:'Excel',label:'Entry case',rows:[['Entry EV / EBITDA','10.0x'],['Debt financing','$400m'],['Sponsor equity','Balance of purchase EV'],['Entry fees','Ignored for this simplified case']]},
      {id:'exit',name:'03_Exit_Case.xlsx',type:'Excel',label:'Exit case',rows:[['Year-5 EBITDA','$100m'],['Exit multiple','10.0x'],['Debt at exit','$250m'],['Downside EBITDA','$90m'],['Downside exit multiple','9.0x'],['Downside debt at exit','$300m']]}
    ],
    tasks:[
      simNum('pe-entry-equity','Sponsor equity required at entry',400,.25,'$m','model','Calculate purchase enterprise value, then subtract acquisition debt.','B14'),
      simNum('pe-exit-equity','Base-case exit equity value',750,.5,'$m','returns','Calculate exit EV and subtract debt remaining at exit.','F24'),
      simNum('pe-moic','Base-case MOIC',1.875,.01,'x','returns','Exit equity value divided by sponsor equity invested.','F26'),
      simNum('pe-downside-moic','Downside MOIC',1.275,.01,'x','downside','Use downside EBITDA, exit multiple and debt at exit.','H26'),
      simText('pe-diligence','Priority diligence note',['customer','contract','concentration','renew','revenue'],2,18,'diligence','Write the diligence issue you would put at the top of the IC tracker and explain why it can change underwriting.')
    ],
    writingPrompt:'Draft the IC pre-read recommendation. State invest / continue diligence / pass, cite base and downside returns, identify the most important diligence issue, and name the next analysis you want completed.'
  },
  'venture-capital': {
    project:'Project Beacon', role:'Venture Capital Investment Analyst — Early Stage', reviewer:'Rina Shah · Principal', client:'Beacon AI', deadline:'Partner meeting · 4:00 PM',
    objective:'Pressure-test market size, financing dilution and retention before writing an invest/pass memo.',
    files:[
      {id:'deck',name:'01_Beacon_Founder_Deck.pdf',type:'Deck',label:'Founder materials',rows:[['ARR','$12m'],['YoY growth','80%'],['Gross margin','75%'],['Cash','$15m'],['Monthly burn','$1.0m']]},
      {id:'market',name:'02_Market_Build.xlsx',type:'Excel',label:'Bottom-up TAM',rows:[['Target customers','8,000'],['Average annual contract','$50k']]},
      {id:'cap',name:'03_Cap_Table.xlsx',type:'Excel',label:'Series A',rows:[['Pre-money value','$40m'],['New money','$10m'],['Founders pre-round ownership','60%']]},
      {id:'cohort',name:'04_Retention_Cohorts.xlsx',type:'Excel',label:'Retention',rows:[['Month','M0','M6','M12'],['2025 Q1','100%','82%','69%'],['2025 Q2','100%','80%','66%']]}
    ],
    tasks:[
      simNum('vc-tam','Bottom-up TAM',400,.5,'$m','market','Customers × annual contract value.','D12'),
      simNum('vc-runway','Current cash runway',15,.05,'months','model','Cash divided by monthly burn.','E18'),
      simNum('vc-investor','New investor post-money ownership',20,.05,'%','cap-table','New money divided by post-money valuation.','F11'),
      simNum('vc-founder','Founder ownership after the round',48,.05,'%','cap-table','Apply the round dilution to founder pre-round ownership.','F15'),
      simText('vc-retention','Retention risk note',['retention','cohort','decline','66','69','churn'],2,18,'diligence','Explain the retention pattern you would challenge with the founder before relying on the growth plan.')
    ],
    writingPrompt:'Write the partner memo recommendation: invest / continue diligence / pass. Cite TAM, runway, dilution and retention evidence, identify the biggest unresolved risk, and name the next diligence step.'
  },
  'equity-research': {
    project:'Project Signal', role:'Equity Research Associate — Software', reviewer:'Marcus Reed · Senior Analyst', client:'Orion Software', deadline:'Earnings flash · 45 minutes after call',
    objective:'Update estimates after earnings, refresh valuation and draft a concise research-note conclusion.',
    files:[
      {id:'earnings',name:'01_Q2_Earnings_Release.pdf',type:'Filing',label:'Quarter results',rows:[['Revenue','$505m'],['Consensus revenue','$500m'],['EPS','$2.10'],['Consensus EPS','$2.00']]},
      {id:'guide',name:'02_Management_Guidance.xlsx',type:'Excel',label:'New guidance',rows:[['FY revenue guidance','$2,080m'],['Prior FY revenue estimate','$2,000m'],['New FY EPS estimate','$2.40']]},
      {id:'valuation',name:'03_Valuation.xlsx',type:'Excel',label:'Price target',rows:[['Selected P/E','18.0x'],['New FY EPS','$2.40']]}
    ],
    tasks:[
      simNum('er-rev-beat','Quarterly revenue beat',1,.02,'%','earnings','Actual revenue versus consensus.','D9'),
      simNum('er-eps-beat','Quarterly EPS beat',5,.02,'%','earnings','Actual EPS versus consensus.','D10'),
      simNum('er-guide-revision','FY revenue estimate revision',4,.02,'%','estimates','New guidance relative to prior estimate.','G18'),
      simNum('er-pt','Updated price target',43.2,.05,'$/share','valuation','Selected P/E multiple × new FY EPS.','J24'),
      simText('er-quality','Earnings-quality note',['guidance','revenue','eps','quality','margin','cash'],2,18,'note','Explain whether the headline beat alone is enough to change the thesis and what quality check you would make.')
    ],
    writingPrompt:'Draft the earnings flash conclusion for the senior analyst: what changed, updated price target, thesis/catalyst implication, one material risk, and your rating recommendation.'
  },
  'asset-management': {
    project:'Project Allocation', role:'Investment Research Analyst — Multi-Asset', reviewer:'Claire Benson · Portfolio Manager', client:'Balanced Growth Portfolio', deadline:'Rebalance meeting · 2:00 PM',
    objective:'Measure concentration, rebalance to policy targets and explain the portfolio decision.',
    files:[
      {id:'holdings',name:'01_Portfolio_Holdings.xlsx',type:'Portfolio',label:'Current holdings',rows:[['Asset','Weight','Quarter return'],['US Equity','65%','8%'],['Bonds','25%','1%'],['Cash','10%','0%']]},
      {id:'policy',name:'02_Target_Allocation.xlsx',type:'Policy',label:'Target',rows:[['US Equity','60%'],['Bonds','30%'],['Cash','10%'],['Portfolio value','$10m']]}
    ],
    tasks:[
      simNum('am-equity-dollar','Current US equity exposure',6.5,.01,'$m','portfolio','Portfolio value × current equity weight.','C8'),
      simNum('am-equity-trim','Equity amount to trim to target',.5,.01,'$m','rebalance','Current equity dollars less target equity dollars.','F12'),
      simNum('am-bond-add','Bond amount to add to target',.5,.01,'$m','rebalance','Target bond dollars less current bond dollars.','F13'),
      simNum('am-equity-contrib','US equity return contribution',5.2,.02,'%','attribution','Weight × return contribution.','H9'),
      simText('am-risk','Concentration note',['equity','65','60','concentration','target','rebalance'],2,18,'review','Explain why the current portfolio needs a rebalance beyond simply saying equities rose.')
    ],
    writingPrompt:'Prepare the PM recommendation: hold / rebalance / change target. Cite concentration and attribution evidence, explain the proposed trades, and identify one portfolio risk to monitor.'
  },
  'hedge-funds': {
    project:'Project Variant', role:'Public-Markets Investment Analyst — Long/Short Equity', reviewer:'David Kim · Portfolio Manager', client:'Variant Opportunities Fund', deadline:'Morning risk meeting · 8:30 AM',
    objective:'Quantify position impact, pressure-test the downside and write a catalyst-driven position recommendation.',
    files:[
      {id:'book',name:'01_Position_Book.xlsx',type:'Portfolio',label:'Positions',rows:[['Position','Book weight','Scenario move'],['Long Alpha','5%','+20%'],['Short Beta','4%','+15% adverse move']]},
      {id:'case',name:'02_Thesis_Cases.xlsx',type:'Excel',label:'Cases',rows:[['Alpha base value','$60'],['Alpha current price','$50'],['Alpha downside','$42'],['Beta current price','$30']]},
      {id:'events',name:'03_Catalyst_Calendar.xlsx',type:'Calendar',label:'Catalysts',rows:[['Alpha product launch','30 days'],['Beta earnings','12 days'],['Beta short interest','High']]}
    ],
    tasks:[
      simNum('hf-long-impact','Long Alpha portfolio contribution in upside case',1,.02,'%','pnl','Position weight × upside return.','D10'),
      simNum('hf-short-loss','Short Beta portfolio loss if stock rises 15%',-.6,.02,'%','pnl','Short position loses weight × adverse stock move. Enter a negative number.','D11'),
      simNum('hf-alpha-upside','Alpha price upside to base value',20,.05,'%','valuation','Base value relative to current price.','G16'),
      simNum('hf-alpha-downside','Alpha downside to downside case',-16,.05,'%','risk','Downside value relative to current price. Enter a negative number.','G17'),
      simText('hf-variant','Variant-perception statement',['market','expects','variant','catalyst','misprice','thesis'],2,20,'thesis','State what the market appears to expect and what your differentiated view is.')
    ],
    writingPrompt:'Send the PM a position recommendation: add / hold / trim / exit. Cite upside/downside, catalyst timing, short-specific or liquidity risk, and what evidence would invalidate the thesis.'
  },
  'sales-trading': {
    project:'Project Pulse', role:'Sales & Trading Analyst — Markets', reviewer:'Alex Morgan · Desk VP', client:'Institutional Client A', deadline:'Client follow-up · 15 minutes',
    objective:'Read the market, quantify execution/risk and send concise client-ready market color.',
    files:[
      {id:'market',name:'01_Live_Market_Snapshot.csv',type:'Market',label:'Quote',rows:[['Instrument','Bid','Ask','Size'],['XYZ Corp','99.80','100.20','250k x 180k']]},
      {id:'risk',name:'02_Desk_Risk.xlsx',type:'Risk',label:'Limits',rows:[['Current position','$6.5m'],['Desk limit','$10m'],['Client order','$2.0m']]},
      {id:'tape',name:'03_Market_Color.txt',type:'Feed',label:'Context',rows:[['Volatility','Rising'],['Liquidity','Thinner than normal'],['Catalyst','Macro data in 25 minutes']]}
    ],
    tasks:[
      simNum('st-mid','Quoted midpoint',100,.01,'price','market','Average bid and ask.','Q1'),
      simNum('st-spread','Bid/ask spread',.4,.01,'price','market','Ask minus bid.','Q2'),
      simNum('st-util-before','Current limit utilization',65,.05,'%','risk','Current desk position divided by limit.','R7'),
      simNum('st-util-after','Limit utilization if full client order is warehoused',85,.05,'%','risk','Current position plus order divided by limit.','R8'),
      simText('st-execution','Execution plan',['limit','liquidity','volatility','size','risk','market'],2,18,'execution','Describe how thinner liquidity and the upcoming macro catalyst should affect execution approach.')
    ],
    writingPrompt:'Write the client follow-up: current market level/spread, execution consideration, one risk from the upcoming catalyst, and the next action you recommend. Do not promise execution or certainty.'
  },
  'quantitative-finance': {
    project:'Project Vector', role:'Quantitative Analyst — Systematic Research', reviewer:'Nadia Chen · Quant Research Lead', client:'Systematic Equity Research', deadline:'Research review · tomorrow',
    objective:'Audit a backtest, quantify net performance and write an out-of-sample research conclusion.',
    files:[
      {id:'data',name:'01_signal_dataset.parquet',type:'Data',label:'Dataset',rows:[['Rows','10,000'],['Train','6,000'],['Validation','2,000'],['Test','2,000']]},
      {id:'backtest',name:'02_backtest_results.csv',type:'Backtest',label:'Results',rows:[['Gross annual return','12.0%'],['Annual trading costs','2.5%'],['Annual volatility','10.0%'],['Test-set return','6.0%']]},
      {id:'audit',name:'03_research_notes.md',type:'Notebook',label:'Audit',rows:[['Finding','Feature normalization used full-sample mean before split'],['Finding','Hyperparameters tuned on validation set'],['Finding','Test set touched once at final review']]}
    ],
    tasks:[
      simNum('q-train','Training-set share of observations',60,.01,'%','data','Train rows divided by total rows.','cell_1'),
      simNum('q-test','Test-set share of observations',20,.01,'%','data','Test rows divided by total rows.','cell_2'),
      simNum('q-net','Net annual return after trading costs',9.5,.02,'%','backtest','Gross annual return less annual trading costs.','cell_3'),
      simNum('q-gross-sharpe','Simplified gross Sharpe (return / volatility)',1.2,.01,'x','backtest','Gross annual return divided by annual volatility.','cell_4'),
      simText('q-bias','Research-bias finding',['full-sample','normalization','look-ahead','leakage','split','mean'],2,18,'audit','Identify the most serious research-process issue and why it contaminates the backtest.')
    ],
    writingPrompt:'Write the research-review conclusion: whether the signal is ready for further validation, what the net/out-of-sample evidence says, the key bias found, and the next robustness test you require.'
  },
  'private-credit': {
    project:'Project Granite', role:'Private Credit Investment Analyst — Direct Lending', reviewer:'Morgan Ellis · Investment Director', client:'Granite Services', deadline:'Credit Committee · tomorrow 11:00 AM',
    objective:'Underwrite leverage, coverage, downside protection and repayment capacity before a credit recommendation.',
    files:[
      {id:'financials',name:'01_Granite_Financials.xlsx',type:'Excel',label:'Borrower financials',rows:[['LTM EBITDA','$60m'],['Total debt','$300m'],['Cash interest','$30m'],['Annual FCF before debt paydown','$35m']]},
      {id:'downside',name:'02_Downside_Case.xlsx',type:'Excel',label:'Downside',rows:[['Downside EBITDA','$45m'],['Debt after 1 year','$280m']]},
      {id:'terms',name:'03_Draft_Term_Sheet.pdf',type:'Debt',label:'Terms',rows:[['Max leverage covenant','6.0x'],['Minimum interest coverage','1.5x']]}
    ],
    tasks:[
      simNum('pc-leverage','LTM gross leverage',5,.01,'x','credit','Total debt divided by LTM EBITDA.','E10'),
      simNum('pc-coverage','Interest coverage',2,.01,'x','credit','EBITDA divided by cash interest.','E11'),
      simNum('pc-downside-lev','Downside leverage after one year',6.222,.02,'x','downside','Downside debt divided by downside EBITDA.','H14'),
      simNum('pc-covenant','Downside leverage covenant headroom',-.222,.02,'x','downside','Covenant limit less downside leverage. Negative means breach.','H15'),
      simText('pc-risk','Primary credit risk / mitigant note',['leverage','covenant','cash flow','repayment','downside','customer'],2,18,'memo','State the primary downside risk and one structure/condition that would improve lender protection.')
    ],
    writingPrompt:'Draft the Credit Committee recommendation: approve / approve with conditions / decline. Cite leverage, coverage and downside covenant outcome, then state key risks, mitigants and required conditions.'
  },
  'corporate-banking': {
    project:'Project Meridian', role:'Corporate Banking / Credit Analyst', reviewer:'Taylor Brooks · Credit Officer', client:'Meridian Manufacturing', deadline:'Credit approval package · 3:00 PM',
    objective:'Spread the borrower, assess debt capacity and prepare a concise approval recommendation.',
    files:[
      {id:'spread',name:'01_Meridian_Credit_Spread.xlsx',type:'Excel',label:'Borrower spread',rows:[['Revenue','$900m'],['EBITDA','$120m'],['Total debt','$420m'],['Cash interest','$42m'],['Proposed acquisition debt','$120m']]},
      {id:'terms',name:'02_Facility_Request.pdf',type:'Loan',label:'Request',rows:[['Facility','5-year term loan'],['Use','Acquisition funding'],['Pro forma debt','$540m']]}
    ],
    tasks:[
      simNum('cb-current-lev','Current leverage',3.5,.01,'x','spread','Current debt divided by EBITDA.','D12'),
      simNum('cb-current-cov','Current interest coverage',2.857,.02,'x','spread','EBITDA divided by cash interest.','D13'),
      simNum('cb-proforma-lev','Pro forma leverage after acquisition debt',4.5,.01,'x','structure','Pro forma debt divided by EBITDA.','F18'),
      simNum('cb-debt-cap','Debt capacity at 4.0x leverage',480,.5,'$m','structure','Maximum debt at 4.0x EBITDA.','F19'),
      simText('cb-monitor','Monitoring / covenant note',['leverage','covenant','acquisition','cash flow','monitor','coverage'],2,18,'memo','State the most important ongoing monitoring item and covenant/structure consideration.')
    ],
    writingPrompt:'Write the credit-approval recommendation for the Credit Officer: support / support with conditions / decline. Cite current and pro forma leverage, debt capacity, key risk and proposed covenant/monitoring action.'
  },
  'corporate-development': {
    project:'Project Horizon', role:'Corporate Development Analyst — Strategy & M&A', reviewer:'Samantha Lee · VP Corporate Development', client:'Horizon Software', deadline:'Executive review · tomorrow',
    objective:'Value the target, quantify synergies and prepare a go/no-go recommendation.',
    files:[
      {id:'target',name:'01_Target_Financials.xlsx',type:'Excel',label:'Target',rows:[['Target EBITDA','$50m'],['Standalone value multiple','10.0x'],['Target debt','$40m'],['Target cash','$10m']]},
      {id:'synergy',name:'02_Synergy_Build.xlsx',type:'Excel',label:'Synergies',rows:[['Run-rate cost synergies','$12m'],['Probability-adjusted realization','75%'],['One-time implementation cost','$15m']]},
      {id:'strategy',name:'03_Strategy_Screen.pptx',type:'Deck',label:'Strategic fit',rows:[['Customer overlap','High'],['Product adjacency','High'],['Integration complexity','Medium']]}
    ],
    tasks:[
      simNum('cd-ev','Standalone target enterprise value',500,.5,'$m','valuation','Target EBITDA × standalone multiple.','D10'),
      simNum('cd-equity','Standalone target equity value',470,.5,'$m','valuation','Enterprise value less debt plus cash.','D11'),
      simNum('cd-riskadj-syn','Probability-adjusted run-rate synergies',9,.05,'$m','synergy','Run-rate synergies × realization probability.','G15'),
      simNum('cd-synergy-value','Illustrative synergy value at 10.0x',90,.5,'$m','synergy','Probability-adjusted synergies × selected multiple.','G16'),
      simText('cd-integration','Integration risk note',['integration','customer','product','execution','synergy','cost'],2,18,'diligence','Identify the integration issue most likely to change the synergy case or strategic recommendation.')
    ],
    writingPrompt:'Prepare the executive go/no-go note: recommendation, standalone value, probability-adjusted synergy value, strategic rationale, biggest integration risk, and next diligence step.'
  },
  'fp-and-a': {
    project:'Project Compass', role:'FP&A Analyst — Corporate Finance', reviewer:'Jordan Ellis · FP&A Director', client:'Operating Leadership Team', deadline:'Forecast review · 1:00 PM',
    objective:'Build a forecast update, explain variance drivers and prepare CFO-ready commentary.',
    files:[
      {id:'actual',name:'01_Monthly_Actuals.xlsx',type:'ERP',label:'Actuals',rows:[['Revenue actual','$48m'],['Revenue budget','$50m'],['Headcount actual','480'],['Headcount plan','500'],['Opex actual','$22m'],['Opex budget','$21m']]},
      {id:'drivers',name:'02_Revenue_Drivers.xlsx',type:'Excel',label:'Drivers',rows:[['Volume variance','-$1.2m'],['Price variance','+$0.4m'],['Mix variance','-$1.2m']]},
      {id:'forecast',name:'03_Reforecast.xlsx',type:'Planning',label:'Forecast',rows:[['Prior FY revenue','$600m'],['Updated run-rate reduction','$18m']]}
    ],
    tasks:[
      simNum('fpa-rev-var','Revenue variance vs budget',-2,.01,'$m','variance','Actual revenue less budget. Enter negative for miss.','D9'),
      simNum('fpa-rev-var-pct','Revenue variance vs budget',-4,.02,'%','variance','Revenue variance divided by budget.','D10'),
      simNum('fpa-opex-var','Opex variance vs budget',1,.01,'$m','variance','Actual Opex less budget. Positive means overspend.','D11'),
      simNum('fpa-reforecast','Updated FY revenue forecast',582,.25,'$m','forecast','Prior FY forecast less updated run-rate reduction.','G17'),
      simText('fpa-comment','Variance commentary',['volume','price','mix','headcount','opex','forecast'],2,22,'commentary','Explain the revenue miss by drivers and connect it to the reforecast / cost picture.')
    ],
    writingPrompt:'Draft the CFO forecast commentary: actual vs budget, key price/volume/mix drivers, updated full-year outlook, cost/headcount observation, and management action to watch.'
  },
  'treasury': {
    project:'Project Liquidity', role:'Treasury Analyst — Corporate Treasury', reviewer:'Dana Morris · Assistant Treasurer', client:'Global Treasury', deadline:'Daily liquidity call · 10:30 AM',
    objective:'Consolidate cash, identify the low point, quantify the funding gap and recommend a treasury action.',
    files:[
      {id:'banks',name:'01_Bank_Balances.csv',type:'Bank',label:'Cash position',rows:[['Bank A','$18m'],['Bank B','$12m'],['Bank C','$5m'],['Restricted cash','$4m']]},
      {id:'forecast',name:'02_13_Week_Cash_Forecast.xlsx',type:'TMS',label:'Liquidity forecast',rows:[['Opening usable cash','$31m'],['Minimum projected usable cash','$8m'],['Minimum liquidity policy','$15m']]},
      {id:'fx',name:'03_FX_Exposure.xlsx',type:'FX',label:'Exposure',rows:[['EUR receivable','€10m'],['Hedge ratio target','70%']]}
    ],
    tasks:[
      simNum('tr-total-cash','Total bank cash',35,.01,'$m','cash','Sum bank balances before restricted-cash adjustment.','C8'),
      simNum('tr-usable-cash','Usable opening cash',31,.01,'$m','cash','Total cash less restricted cash.','C9'),
      simNum('tr-gap','Projected liquidity gap vs policy minimum',7,.01,'$m','liquidity','Policy minimum less projected low point.','F14'),
      simNum('tr-hedge','EUR amount to hedge at target ratio',7,.01,'€m','fx','Exposure × hedge ratio target.','H18'),
      simText('tr-funding','Funding / liquidity recommendation',['revolver','liquidity','cash','timing','fund','forecast','buffer'],2,18,'recommendation','Recommend how treasury should cover the projected gap while preserving a policy buffer.')
    ],
    writingPrompt:'Prepare the Assistant Treasurer update: current usable cash, projected low point and gap, funding recommendation, FX hedge action, and the main forecast assumption to monitor.'
  },
  'wealth-management': {
    project:'Project Legacy', role:'Wealth Management Analyst / Advisor Associate', reviewer:'Rachel Ford · Senior Advisor', client:'Synthetic Client Household', deadline:'Client review · tomorrow',
    objective:'Translate client constraints into an allocation and a clear client-ready recommendation.',
    files:[
      {id:'profile',name:'01_Client_Discovery.pdf',type:'CRM',label:'Client profile',rows:[['Investable assets','$5.0m'],['Near-term liquidity need','$0.5m'],['Employer stock','$1.5m'],['Risk tolerance','Moderate']]},
      {id:'policy',name:'02_Target_Allocation.xlsx',type:'Planning',label:'Target after reserve',rows:[['Equity','55%'],['Fixed income','35%'],['Cash','10%']]}
    ],
    tasks:[
      simNum('wm-longterm','Long-term investable assets after liquidity reserve',4.5,.01,'$m','plan','Investable assets less near-term liquidity need.','C10'),
      simNum('wm-equity-target','Target equity dollars',2.475,.01,'$m','allocation','Long-term assets × 55% equity target.','F13'),
      simNum('wm-fixed-target','Target fixed-income dollars',1.575,.01,'$m','allocation','Long-term assets × 35% fixed-income target.','F14'),
      simNum('wm-employer-conc','Employer-stock concentration of total assets',30,.02,'%','risk','Employer stock divided by total investable assets.','H10'),
      simText('wm-client','Client explanation',['liquidity','concentration','employer stock','rebalance','risk','tax'],2,20,'client','Explain why the allocation should address liquidity and employer-stock concentration without sounding alarmist.')
    ],
    writingPrompt:'Draft the client-review recommendation: reserve liquidity, target allocation, concentration concern, implementation/rebalancing approach, and one question to confirm before making changes.'
  },
  'risk-management': {
    project:'Project Shield', role:'Financial Risk Analyst — Market & Enterprise Risk', reviewer:'Alicia Grant · Risk Manager', client:'Trading Business', deadline:'Risk escalation · 30 minutes',
    objective:'Measure limit usage, quantify stress loss and prepare an escalation with a concrete action.',
    files:[
      {id:'limits',name:'01_Risk_Limits.csv',type:'Risk',label:'Limits',rows:[['VaR usage','$8m'],['VaR limit','$10m'],['Counterparty exposure','$120m'],['Counterparty limit','$100m']]},
      {id:'stress',name:'02_Stress_Scenarios.xlsx',type:'Scenario',label:'Stress',rows:[['Rates +150 bps','-$14m'],['Equities -15%','-$11m'],['Combined stress','-$22m']]}
    ],
    tasks:[
      simNum('rm-var-util','VaR limit utilization',80,.02,'%','limits','VaR usage divided by VaR limit.','D8'),
      simNum('rm-cp-util','Counterparty limit utilization',120,.02,'%','limits','Counterparty exposure divided by counterparty limit.','D9'),
      simNum('rm-breach','Counterparty limit breach amount',20,.01,'$m','limits','Exposure less limit.','D10'),
      simNum('rm-combined','Combined stress loss magnitude',22,.01,'$m','stress','Report the absolute magnitude of combined stress loss.','F14'),
      simText('rm-escalate','Risk escalation action',['breach','reduce','hedge','limit','counterparty','escalate'],2,18,'escalation','State the breach, why it matters, and the immediate action you would recommend to the risk manager.')
    ],
    writingPrompt:'Write the risk escalation: current limit usage, breach amount, stress result, immediate action, and what additional information/approval is required. Avoid implying VaR is a maximum possible loss.'
  },
  'real-estate-finance': {
    project:'Project Skyline', role:'Real Estate Financial Analyst — Acquisitions', reviewer:'Michael Chen · Acquisitions VP', client:'Skyline Multifamily', deadline:'Investment Committee · tomorrow',
    objective:'Underwrite NOI, value, debt service and downside before recommending a bid.',
    files:[
      {id:'rentroll',name:'01_Rent_Roll.xlsx',type:'Rent Roll',label:'Property operations',rows:[['Gross potential rent','$12.0m'],['Occupancy','95%'],['Other income','$0.8m'],['Operating expenses','$4.0m']]},
      {id:'market',name:'02_Market_Valuation.xlsx',type:'Comps',label:'Market',rows:[['Selected cap rate','5.0%'],['Debt amount','$100m'],['Interest rate','6.0%'],['Annual principal amortization','$1.5m']]}
    ],
    tasks:[
      simNum('re-effective-rent','Effective rental revenue',11.4,.01,'$m','property','Gross potential rent × occupancy.','D10'),
      simNum('re-noi','Net operating income',8.2,.01,'$m','property','Effective rent + other income − operating expenses.','D12'),
      simNum('re-value','Value at selected cap rate',164,.25,'$m','valuation','NOI divided by cap rate.','G16'),
      simNum('re-dscr','DSCR',1.093,.01,'x','debt','NOI divided by annual interest plus principal amortization.','H18'),
      simText('re-risk','Property risk note',['occupancy','rent','lease','interest','dscr','cap rate'],2,18,'diligence','Identify the operating or financing assumption most likely to change bid value and why.')
    ],
    writingPrompt:'Draft the IC recommendation: bid / continue diligence / pass. Cite NOI, cap-rate value and DSCR, identify the key downside assumption, and state the financing or diligence action required.'
  }
};


const V2_CAREER_COMPETENCY_IDS = {"private-equity":["cmp_private_equity_underwriting","cmp_private_equity_debt","cmp_private_equity_returns","cmp_private_equity_diligence","cmp_private_equity_judgment","cmp_private_equity_quality"],"venture-capital":["cmp_venture_capital_market","cmp_venture_capital_unit","cmp_venture_capital_cap","cmp_venture_capital_diligence","cmp_venture_capital_judgment","cmp_venture_capital_memo"],"equity-research":["cmp_equity_research_model","cmp_equity_research_earnings","cmp_equity_research_valuation","cmp_equity_research_thesis","cmp_equity_research_sources","cmp_equity_research_note"],"asset-management":["cmp_asset_management_research","cmp_asset_management_portfolio","cmp_asset_management_risk","cmp_asset_management_attribution","cmp_asset_management_rebalance","cmp_asset_management_pm"],"hedge-funds":["cmp_hedge_funds_variant","cmp_hedge_funds_model","cmp_hedge_funds_catalyst","cmp_hedge_funds_risk","cmp_hedge_funds_sizing","cmp_hedge_funds_pm"],"sales-trading":["cmp_sales_trading_market","cmp_sales_trading_execution","cmp_sales_trading_risk","cmp_sales_trading_analysis","cmp_sales_trading_client","cmp_sales_trading_review"],"quantitative-finance":["cmp_quantitative_finance_data","cmp_quantitative_finance_research","cmp_quantitative_finance_backtest","cmp_quantitative_finance_implementation","cmp_quantitative_finance_risk","cmp_quantitative_finance_writeup"],"private-credit":["cmp_private_credit_spread","cmp_private_credit_leverage","cmp_private_credit_structure","cmp_private_credit_downside","cmp_private_credit_judgment","cmp_private_credit_memo"],"corporate-banking":["cmp_corporate_banking_spread","cmp_corporate_banking_credit","cmp_corporate_banking_facility","cmp_corporate_banking_covenant","cmp_corporate_banking_economics","cmp_corporate_banking_approval"],"corporate-development":["cmp_corporate_development_strategy","cmp_corporate_development_valuation","cmp_corporate_development_synergy","cmp_corporate_development_diligence","cmp_corporate_development_integration","cmp_corporate_development_exec"],"fp-and-a":["cmp_fp_and_a_actuals","cmp_fp_and_a_forecast","cmp_fp_and_a_variance","cmp_fp_and_a_scenario","cmp_fp_and_a_kpi","cmp_fp_and_a_commentary"],"treasury":["cmp_treasury_cash","cmp_treasury_liquidity","cmp_treasury_funding","cmp_treasury_market","cmp_treasury_policy","cmp_treasury_update"],"wealth-management":["cmp_wealth_management_discovery","cmp_wealth_management_suitability","cmp_wealth_management_allocation","cmp_wealth_management_portfolio","cmp_wealth_management_implementation","cmp_wealth_management_client"],"risk-management":["cmp_risk_management_exposure","cmp_risk_management_var","cmp_risk_management_stress","cmp_risk_management_concentration","cmp_risk_management_limits","cmp_risk_management_challenge"],"real-estate-finance":["cmp_real_estate_finance_rent","cmp_real_estate_finance_noi","cmp_real_estate_finance_valuation","cmp_real_estate_finance_debt","cmp_real_estate_finance_risk","cmp_real_estate_finance_memo"]};

function v2PublicPathwayId(pathwayId) { return pathwayId === 'quantitative-finance' ? 'quant-finance' : pathwayId; }
function v2CareerAssessmentKey(pathwayId, stage) {
  if (pathwayId === 'investment-banking') return stage === 'essentials' ? 'ib-essentials-case' : 'ib-professional-final';
  return `${pathwayId}-${stage === 'essentials' ? 'essentials-case' : 'professional-final'}`;
}
function v2CareerRoleLabKey(pathwayId) { return pathwayId === 'investment-banking' ? 'ib-project-northstar' : `cm2-${pathwayId}-role-lab`; }
function v2CareerCompetencies(pathwayId) { return V2_CAREER_COMPETENCY_IDS[pathwayId] || []; }

function v2DynamicDiagnosticQuestions(pathway) {
  if (pathway.id === 'investment-banking') return [];
  const comps=v2CareerCompetencies(pathway.id); if(!comps.length) return [];
  const bank=stageQuestions(pathway,2).filter(q=>q.type==='mc').slice(0,8);
  return bank.map((q,i)=>({
    id:`dyn-${pathway.code.toLowerCase()}-diag-${i+1}`, pathway_id:pathway.id, version:'2.0', competency_id:comps[i%comps.length], position:i+1,
    prompt:q.prompt, options_json:JSON.stringify(q.options||[]), correct_answer:q.answer,
    rationale:`This baseline item checks ${pathway.title} readiness before professional evidence is collected.`, status:'active'
  }));
}

function v2DynamicAssessment(pathway, stage) {
  if(pathway.id==='investment-banking') return null;
  const wb=CAREER_WORKBENCHES[pathway.id]; const comps=v2CareerCompetencies(pathway.id); if(!wb||!comps.length) return null;
  const key=v2CareerAssessmentKey(pathway.id,stage); const isFinal=stage==='final';
  const numeric=wb.tasks.filter(t=>t.type==='numeric').slice(0,isFinal?4:2).map((t,i)=>({
    id:`dyn-${pathway.code.toLowerCase()}-${stage}-n${i+1}`,assessment_key:key,assessment_version:'2.0',position:i+1,competency_id:comps[i%comps.length],prompt:t.prompt,
    options_json:'[]',correct_answer:String(t.answer),rationale:t.workProduct?.instruction||'Calculate the requested professional output.',weight:isFinal?2:1,status:'active',question_type:'numeric',tolerance:Number(t.tolerance||0),unit:t.unit||''
  }));
  const bank=stageQuestions(pathway,isFinal?4:2).filter(q=>q.type==='mc').slice(0,isFinal?6:5);
  const mc=bank.map((q,i)=>({
    id:`dyn-${pathway.code.toLowerCase()}-${stage}-m${i+1}`,assessment_key:key,assessment_version:'2.0',position:numeric.length+i+1,competency_id:comps[(numeric.length+i)%comps.length],prompt:q.prompt,
    options_json:JSON.stringify(q.options||[]),correct_answer:q.answer,rationale:`Correct application of ${pathway.title} workflow and professional judgment.`,weight:1,status:'active',question_type:'mc',tolerance:0,unit:''
  }));
  const files=wb.files||[];
  return {definition:{assessment_key:key,version:'2.0',pathway_id:pathway.id,stage,title:`${pathway.title} ${isFinal?'Professional Readiness Final':'Essentials Mini Case'}`,description:isFinal?`Comprehensive ${pathway.role} readiness check combining calculations, workflow judgment and quality control.`:`Guided beginner case that checks the core calculations and workflow needed before advanced ${pathway.title} work.`,scenario_json:JSON.stringify({project:wb.project,objective:wb.objective,files,note:'All companies, people and data are synthetic training materials.'}),pass_score:isFinal?80:75,status:'active'},questions:[...numeric,...mc]};
}
function v2DynamicAssessmentFromKey(key) {
  for(const pathway of ALL_PATHWAYS) {
    if(pathway.id==='investment-banking') continue;
    if(key===v2CareerAssessmentKey(pathway.id,'essentials')) return v2DynamicAssessment(pathway,'essentials');
    if(key===v2CareerAssessmentKey(pathway.id,'final')) return v2DynamicAssessment(pathway,'final');
  }
  return null;
}

function v2DynamicLab(pathway) {
  if(pathway.id==='investment-banking') return null;
  const wb=CAREER_WORKBENCHES[pathway.id]; const comps=v2CareerCompetencies(pathway.id); if(!wb||!comps.length) return null;
  const labKey=v2CareerRoleLabKey(pathway.id);
  const tasks=[]; let stageNo=1;
  for(const t of wb.tasks) {
    const cid=comps[(stageNo-1)%comps.length];
    if(t.type==='numeric') {
      tasks.push({id:`${pathway.code.toLowerCase()}rl${stageNo}`,lab_key:labKey,lab_version:'2.0',stage_no:stageNo,title:t.prompt,task_type:'numeric_fields',brief_json:JSON.stringify({timestamp:`Stage ${stageNo}`,from:wb.reviewer,message:t.workProduct?.instruction||'Complete the requested work product.',fileName:wb.files?.[Math.min(stageNo-1,(wb.files?.length||1)-1)]?.name||`${wb.project}_Workpaper.xlsx`,deliverable:t.workProduct?.section||'Analysis',fields:[{id:t.id,label:t.prompt,type:'number',suffix:t.unit||''}]}),grading_json:JSON.stringify({rules:[{field:t.id,type:'numeric',expected:Number(t.answer),tolerance:Number(t.tolerance||0),points:100,feedback:t.workProduct?.instruction||'Recheck the workpaper calculation.'}]}),competency_map_json:JSON.stringify({[cid]:1}),pass_score:70,max_attempts:3,required:1,status:'active'});
    } else {
      tasks.push({id:`${pathway.code.toLowerCase()}rl${stageNo}`,lab_key:labKey,lab_version:'2.0',stage_no:stageNo,title:t.prompt,task_type:'written_decision',brief_json:JSON.stringify({timestamp:`Stage ${stageNo}`,from:wb.reviewer,message:t.workProduct?.instruction||'Write the requested analysis note.',fileName:wb.files?.[Math.min(stageNo-1,(wb.files?.length||1)-1)]?.name||`${wb.project}_Notes.docx`,deliverable:t.workProduct?.section||'Analysis note',fields:[{id:t.id,label:t.prompt,type:'textarea',maxLength:1800}]}),grading_json:JSON.stringify({rules:[{field:t.id,type:'text_evidence',points:100,min_chars:Math.max(120,Number(t.minWords||18)*5),evidence_groups:(t.keywords||[]).slice(0,6).map(k=>[k]),feedback:'Connect the work product to specific case evidence, risk and decision relevance.'}]}),competency_map_json:JSON.stringify({[cid]:1}),pass_score:70,max_attempts:3,required:1,status:'active'});
    }
    stageNo++;
  }
  const finalCid=comps[(stageNo-1)%comps.length];
  tasks.push({id:`${pathway.code.toLowerCase()}rl${stageNo}`,lab_key:labKey,lab_version:'2.0',stage_no:stageNo,title:'Send the manager your final recommendation',task_type:'written_decision',brief_json:JSON.stringify({timestamp:'Final review',from:wb.reviewer,message:'Send the decision-ready conclusion using the work you completed in the case.',fileName:`${wb.project.replace(/\s+/g,'_')}_Manager_Update.docx`,deliverable:'Manager recommendation',fields:[{id:'recommendation',label:'Manager recommendation',type:'textarea',maxLength:2400}]}),grading_json:JSON.stringify({rules:[{field:'recommendation',type:'text_evidence',points:100,min_chars:220,evidence_groups:[['recommend','proceed','approve','invest','hold','trim','pass','decline','rebalance'],['risk','downside','constraint','uncertain','assumption'],['because','evidence','analysis','model','forecast','valuation','liquidity','return'],['next','diligence','monitor','review','action','test']],feedback:'State a decision, cite case evidence, identify material risk and name the next action.'}]}),competency_map_json:JSON.stringify({[finalCid]:1}),pass_score:70,max_attempts:3,required:1,status:'active'});
  return {definition:{lab_key:labKey,version:'2.0',pathway_id:pathway.id,title:`${wb.project} — ${pathway.title} Professional Role Lab`,role_title:pathway.role,client_name:wb.client,scenario_json:JSON.stringify({project:wb.project,desk:pathway.title,reviewer:wb.reviewer,client:wb.client,deadline:wb.deadline,context:wb.objective,files:wb.files,workflow:tasks.map(x=>x.title),note:'Synthetic training case. No proprietary employer information is used.'}),pass_score:80,status:'active'},tasks};
}
function v2DynamicLabByKey(key) { for(const p of ALL_PATHWAYS){if(p.id!=='investment-banking'&&v2CareerRoleLabKey(p.id)===key)return v2DynamicLab(p);} return null; }

function buildCareerWorkbenchSimulation(pathway) {
  const b=CAREER_WORKBENCHES[pathway.id]; if(!b) return null;
  return {
    version:'2.0-workbench', itemType:'simulation', questions:b.tasks, writingPrompt:b.writingPrompt,
    simulationProfile:{kind:'career-workbench-v2',project:b.project,role:b.role,reviewer:b.reviewer,client:b.client,deadline:b.deadline,objective:b.objective,files:b.files,workflow:[...new Set(b.tasks.map(x=>x.workProduct.section))]}
  };
}

function buildInvestmentBankingSimulation(pathway) {
  const questions = [
    {
      id: "ib-sim-ev",
      type: "numeric",
      prompt: "Implied enterprise value",
      answer: 850,
      tolerance: 0.25,
      unit: "$m",
      workProduct: { section:"model", label:"Enterprise Value", cell:"G12", instruction:"Bridge equity value to enterprise value using debt and cash from the capitalization file." }
    },
    {
      id: "ib-sim-multiple",
      type: "numeric",
      prompt: "Implied EV / LTM EBITDA",
      answer: 10.625,
      tolerance: 0.03,
      unit: "x",
      workProduct: { section:"model", label:"EV / LTM EBITDA", cell:"G13", instruction:"Calculate the headline transaction multiple using LTM EBITDA." }
    },
    {
      id: "ib-sim-comps-median",
      type: "numeric",
      prompt: "Median NTM EV / EBITDA for the selected peer set",
      answer: 10.25,
      tolerance: 0.03,
      unit: "x",
      workProduct: { section:"valuation", label:"Selected peer median", cell:"D18", instruction:"Calculate each peer's NTM EV / EBITDA and use the median of the defensible four-company peer set." }
    },
    {
      id: "ib-sim-implied-equity",
      type: "numeric",
      prompt: "Equity value implied by the selected trading multiple",
      answer: 840,
      tolerance: 0.5,
      unit: "$m",
      workProduct: { section:"valuation", label:"Implied Equity Value", cell:"D21", instruction:"Apply the selected 10.25x multiple to Orion NTM EBITDA, then bridge enterprise value to equity value." }
    },
    {
      id: "ib-sim-revised-revenue",
      type: "numeric",
      prompt: "Revised Year 1 revenue after management's update",
      answer: 456,
      tolerance: 0.25,
      unit: "$m",
      workProduct: { section:"update", label:"Year 1 Revenue", cell:"F27", instruction:"Update the forecast using the new management guidance before refreshing the valuation outputs." }
    },
    {
      id: "ib-sim-qa",
      type: "choice",
      prompt: "Model QA finding that must be corrected before senior review",
      answer: "Cash is being subtracted in the EV-to-equity bridge instead of added",
      options: [
        "Cash is being subtracted in the EV-to-equity bridge instead of added",
        "The model uses a blue font for one assumption cell",
        "The EBITDA margin is displayed to one decimal place",
        "The file name includes today's date"
      ],
      workProduct: { section:"qa", label:"Material QA finding", instruction:"Review the planted model-check findings and escalate the one that changes valuation." }
    },
    {
      id: "ib-sim-revised-equity",
      type: "numeric",
      prompt: "Revised equity value after the management update",
      answer: 793.875,
      tolerance: 0.75,
      unit: "$m",
      workProduct: { section:"update", label:"Revised Equity Value", cell:"D31", instruction:"Refresh valuation using revised NTM EBITDA of $83.5m at the same 10.25x selected multiple, then bridge to equity value." }
    }
  ];
  return {
    version: "2.0-workbench",
    itemType: "simulation",
    questions,
    writingPrompt: "Draft the email you would send to your Associate. State whether Northstar should continue diligence on Orion, cite the most decision-relevant valuation evidence, explain the impact of the new management guidance, identify at least two material risks or diligence items, and state the next step you recommend.",
    simulationProfile: {
      kind: "ib-deal-workbench-v2",
      project: "Project Northstar",
      role: "Investment Banking Analyst — M&A Advisory",
      desk: "M&A Advisory",
      associate: "Maya Chen, Associate",
      vp: "Daniel Brooks, Vice President",
      client: "Northstar Technologies",
      target: "Orion Systems",
      deadline: "5:30 PM — same day",
      objective: "Update the buy-side valuation materials and send the Associate a defensible recommendation before the VP review.",
      inbox: [
        { time:"9:08 AM", from:"Maya Chen · Associate", subject:"Northstar / Orion — valuation refresh before VP review", body:"Please update the transaction snapshot, trading comps output and recommendation using the attached capitalization, forecast and peer files. Check the model carefully before you send anything up. I need your revised output before 5:30 PM." },
        { time:"2:17 PM", from:"Maya Chen · Associate", subject:"NEW INFO — management guidance changed", body:"Orion just lowered Year 1 revenue guidance by 5% from the $480m case. Update the forecast and every dependent valuation output. Flag what changed and whether it affects our recommendation." }
      ],
      files: [
        { id:"cap", name:"01_Orion_Capitalization.xlsx", type:"Excel", label:"Capitalization", rows:[["Diluted shares","40.0m"],["Offer price / share","$19.75"],["Equity value","$790m"],["Debt","$95m"],["Cash","$35m"]] },
        { id:"forecast", name:"02_Orion_Management_Forecast.xlsx", type:"Excel", label:"Forecast", rows:[["LTM Revenue","$445m"],["LTM EBITDA","$80m"],["NTM Revenue — initial","$480m"],["NTM EBITDA — initial","$88m"],["NTM EBITDA — revised","$83.5m"]] },
        { id:"comps", name:"03_Trading_Comps.xlsx", type:"Excel", label:"Trading comps", rows:[["Peer","Enterprise Value","NTM EBITDA","Business fit"],["Aster Cloud","$1,020m","$100m","High"],["Beacon Software","$1,240m","$120m","High"],["Cobalt Systems","$820m","$80m","High"],["Delta Apps","$1,075m","$100m","High"],["Mega Hardware","$4,800m","$240m","Low — hardware-heavy"]] },
        { id:"qa", name:"04_Model_Check_Notes.txt", type:"QA", label:"Model check", rows:[["Check","Observation"],["EV bridge","Formula currently subtracts cash"],["Share count","Matches capitalization file"],["Units","All model outputs in $m"],["Sensitivity","Updates when selected multiple changes"]] },
        { id:"process", name:"05_Diligence_Request_List.pdf", type:"PDF", label:"Diligence", rows:[["Priority","Request"],["High","Top-10 customer revenue and renewal dates"],["High","Revenue bridge: recurring vs services"],["High","Synergy build and one-time implementation costs"],["Medium","Employee retention / key technical staff"]] }
      ],
      workflow: [
        { id:"model", title:"1 · Transaction Model", subtitle:"Build the EV bridge and headline transaction multiple." },
        { id:"valuation", title:"2 · Trading Comps", subtitle:"Calculate the defensible peer median and implied equity value." },
        { id:"update", title:"3 · Management Update", subtitle:"Revise the forecast and dependent valuation output after new information arrives." },
        { id:"qa", title:"4 · Model QA", subtitle:"Find the material model issue before senior review." },
        { id:"email", title:"5 · Associate Email", subtitle:"Send a decision-useful recommendation with evidence, risks and next step." }
      ]
    }
  };
}

function buildAssessment(pathway, itemId) {
  if (
    itemId.startsWith("part-")
  ) {
    const stage =
      Number(itemId.split("-")[1]);

    return {
      itemType: "knowledge",
      questions:
        stageQuestions(pathway, stage)
    };
  }

  if (itemId === "simulation") {
    if (pathway.id === "investment-banking") return buildInvestmentBankingSimulation(pathway);
    const workbench = buildCareerWorkbenchSimulation(pathway);
    if (workbench) return workbench;
    const bank = stageQuestions(pathway, 5);
    return {
      version: "1.0",
      itemType: "simulation",
      questions: bank.slice(0, 7),
      writingPrompt:
        `You are acting as a ${pathway.role}. ` +
        `Write a concise recommendation for ${pathway.simulation}. ` +
        `Use evidence, state at least one material risk or assumption, ` +
        `make a clear decision, and identify a next step.`
    };
  }

  if (itemId === "final") {
    const finalQuestions = [];

    for (
      let stage = 1;
      stage <= 5;
      stage++
    ) {
      const bank =
        stageQuestions(pathway, stage);

      [0, 2, 4, 8].forEach(
        (index, finalIndex) => {
          const source = bank[index];

          finalQuestions.push({
            ...source,
            id:
              `final-s${stage}-q${finalIndex + 1}`
          });
        }
      );
    }

    return {
      itemType: "final",
      questions: finalQuestions
    };
  }

  throw new HttpError(
    400,
    "Invalid assessment"
  );
}

function stageQuestions(p, stage) {
  if (p.id === "investment-banking" && [2,3,4].includes(stage)) {
    return ibAppliedStageQuestions(stage);
  }
  if (p.id !== "investment-banking" && [3,4].includes(stage)) {
    const mixed = careerAppliedStageQuestions(p, stage);
    if (mixed) return mixed;
  }

  const otherRoles =
    otherValues(p, "role", 3);

  const otherPurposes =
    otherValues(p, "purpose", 3);

  const otherFocus =
    otherValues(p, "focus", 3);

  const otherRisks =
    otherValues(p, "risk", 3);

  const otherConcepts =
    otherArrayValues(
      p,
      "concepts",
      12
    );

  const otherDeliverables =
    otherArrayValues(
      p,
      "deliverables",
      12
    );

  if (stage === 1) {
    return [
      question(
        "p1-q1",
        `Which entry-level role is the Capital Mastery ${p.title} pathway designed to prepare a learner for?`,
        p.role,
        otherRoles
      ),

      question(
        "p1-q2",
        `Which statement best describes the purpose of ${p.title}?`,
        p.purpose,
        otherPurposes
      ),

      question(
        "p1-q3",
        `Which activity most closely reflects the work of a ${p.role}?`,
        p.focus,
        otherFocus
      ),

      question(
        "p1-q4",
        `Which finance-career group best fits ${p.title}?`,
        p.group,
        [
          "Unrelated consumer services",
          "Graphic design",
          "Personal tax preparation"
        ]
      ),

      question(
        "p1-q5",
        `Which concept belongs directly in the ${p.title} learning pathway?`,
        p.concepts[0],
        otherConcepts
      ),

      question(
        "p1-q6",
        `Which work product is appropriate for a ${p.role}?`,
        p.deliverables[0],
        otherDeliverables
      ),

      question(
        "p1-q7",
        "Before beginning an unfamiliar professional assignment, what should you identify first?",
        "The decision, requested deliverable, key evidence, and material assumptions",
        [
          "The most attractive formatting style",
          "Only the most optimistic outcome",
          "A conclusion before reviewing evidence"
        ]
      ),

      question(
        "p1-q8",
        "If the requested deliverable or scope is unclear, what is the strongest professional response?",
        "Clarify the objective and expectations before performing material analysis",
        [
          "Guess what the manager wanted and submit it",
          "Ignore the ambiguity",
          "Choose the easiest possible deliverable"
        ]
      ),

      question(
        "p1-q9",
        `Which risk category deserves particular attention in ${p.title}?`,
        p.risk,
        otherRisks
      ),

      question(
        "p1-q10",
        "Which behavior best demonstrates professional judgment?",
        "Separate facts, assumptions, risks, and recommendation",
        [
          "Present only evidence supporting the preferred answer",
          "Hide uncertainty from the reviewer",
          "Treat every model output as a fact"
        ]
      )
    ];
  }

  if (stage === 2) {
    return [
      question(
        "p2-q1",
        `Which technical concept is part of the ${p.title} core?`,
        p.concepts[0],
        otherConcepts
      ),

      question(
        "p2-q2",
        `Which additional concept belongs in the ${p.title} technical toolkit?`,
        p.concepts[1],
        rotate(otherConcepts, 2)
      ),

      question(
        "p2-q3",
        `Which concept would a ${p.role} reasonably be expected to understand?`,
        p.concepts[2],
        rotate(otherConcepts, 4)
      ),

      question(
        "p2-q4",
        `Which item is most relevant to technical work in ${p.title}?`,
        p.concepts[3],
        rotate(otherConcepts, 6)
      ),

      question(
        "p2-q5",
        "A model changes significantly when one assumption moves slightly. What should the analyst do?",
        "Test sensitivities and explain which assumptions drive the conclusion",
        [
          "Hide the sensitivity because it weakens confidence",
          "Freeze the first output permanently",
          "Replace the assumption with the most optimistic value"
        ]
      ),

      question(
        "p2-q6",
        "What is the strongest source practice for financial analysis?",
        "Use authoritative, current evidence and document its source and period",
        [
          "Use the first unsourced number found online",
          "Mix periods if the numbers look reasonable",
          "Treat simulated data as verified real-world data"
        ]
      ),

      question(
        "p2-q7",
        "New information materially changes an input used in the analysis. What should happen?",
        "Update the affected assumptions, rerun the analysis, and reassess the recommendation",
        [
          "Keep the original answer because it was already calculated",
          "Remove the new information",
          "Change formatting but keep the old calculation"
        ]
      ),

      question(
        "p2-q8",
        "What is the best way to interpret a financial model?",
        "As a structured decision tool whose output depends on evidence and assumptions",
        [
          "As a guaranteed prediction",
          "As a substitute for professional judgment",
          "As proof that the most optimistic case will occur"
        ]
      ),

      question(
        "p2-q9",
        "Before comparing financial figures, what should be checked?",
        "Definitions, units, periods, sources, and calculation consistency",
        [
          "Only whether both numbers are positive",
          "Only the number of decimal places",
          "Whether the larger number supports the preferred conclusion"
        ]
      ),

      question(
        "p2-q10",
        "Why is a downside or stress case useful?",
        "It tests whether the recommendation remains defensible under weaker conditions",
        [
          "It guarantees the base case is correct",
          "It removes the need for assumptions",
          "It should always be deleted before senior review"
        ]
      )
    ];
  }

  if (stage === 3) {
    return [
      question(
        "p3-q1",
        `Which deliverable belongs in the ${p.title} professional toolkit?`,
        p.deliverables[0],
        otherDeliverables
      ),

      question(
        "p3-q2",
        `Which additional work product is relevant to a ${p.role}?`,
        p.deliverables[1],
        rotate(otherDeliverables, 2)
      ),

      question(
        "p3-q3",
        `Which deliverable would reasonably support decision-making in ${p.title}?`,
        p.deliverables[2],
        rotate(otherDeliverables, 4)
      ),

      question(
        "p3-q4",
        `Which work product is most aligned with ${p.title}?`,
        p.deliverables[3],
        rotate(otherDeliverables, 6)
      ),

      question(
        "p3-q5",
        "What is the strongest pre-submission review habit?",
        "Check calculations, sources, assumptions, logic, and presentation",
        [
          "Submit immediately after the first calculation",
          "Remove every downside case",
          "Skip review if the spreadsheet opens correctly"
        ]
      ),

      question(
        "p3-q6",
        "What makes a professional recommendation decision-useful?",
        "It connects evidence and analysis to a clear conclusion, risks, and next steps",
        [
          "It contains as many technical words as possible",
          "It avoids stating a recommendation",
          "It includes only positive information"
        ]
      ),

      question(
        "p3-q7",
        "How should material assumptions be handled?",
        "Document them clearly and test their effect on the conclusion",
        [
          "Hide them from the reviewer",
          "Treat them as verified facts",
          "Change them until the desired answer appears"
        ]
      ),

      question(
        "p3-q8",
        "What is the best way to distinguish facts from judgment?",
        "Label sourced evidence, assumptions, interpretation, and recommendation separately",
        [
          "Present every statement as a fact",
          "Avoid recording sources",
          "Remove uncertainty from the analysis"
        ]
      ),

      question(
        "p3-q9",
        "A reviewer cannot reproduce one of your key calculations. What should you do?",
        "Trace the calculation, inputs, and logic until the result is reproducible",
        [
          "Tell the reviewer to trust the output",
          "Replace it with a screenshot",
          "Delete the calculation from the deliverable"
        ]
      ),

      question(
        "p3-q10",
        "When should a junior analyst escalate an issue?",
        "When a material uncertainty, error, risk, or decision exceeds the analyst's authority or information",
        [
          "Never",
          "Only after the final deliverable has been sent externally",
          "Only when the issue improves the recommendation"
        ]
      )
    ];
  }

  if (stage === 4) {
    return [
      question(
        "p4-q1",
        `Which applied assignment best represents ${p.title}?`,
        p.deliverables[0],
        otherDeliverables
      ),

      question(
        "p4-q2",
        `A manager asks you to apply ${p.concepts[0]} in a real assignment. What should you do first?`,
        "Confirm the decision objective, required inputs, assumptions, and expected output",
        [
          "Start with a conclusion and work backward",
          "Use unsourced assumptions",
          "Skip the requested methodology"
        ]
      ),

      question(
        "p4-q3",
        "Two reliable sources disagree materially. What is the strongest response?",
        "Investigate definitions and timing, document the difference, and explain its impact",
        [
          "Use whichever number creates the better result",
          "Average the numbers without checking why they differ",
          "Delete both sources"
        ]
      ),

      question(
        "p4-q4",
        "A manager identifies a material assumption error after your first submission. What should you do?",
        "Correct it, rerun affected analysis, quantify the impact, and resubmit",
        [
          "Change formatting only",
          "Ignore it if the conclusion is unchanged",
          "Delete the manager's comment"
        ]
      ),

      question(
        "p4-q5",
        `Which concern is especially relevant when applying judgment in ${p.title}?`,
        p.risk,
        otherRisks
      ),

      question(
        "p4-q6",
        "Your analysis supports a recommendation but the downside case is meaningfully worse. What should the final output do?",
        "State the recommendation while clearly presenting the downside and conditions that could change the decision",
        [
          "Delete the downside case",
          "Present the upside as guaranteed",
          "Avoid making any recommendation"
        ]
      ),

      question(
        "p4-q7",
        "What should happen if a key calculation cannot be independently checked?",
        "Do not rely on it until the inputs, formula, and logic can be validated",
        [
          "Use it anyway if the answer looks reasonable",
          "Round it until it matches expectations",
          "Hide the formula"
        ]
      ),

      question(
        "p4-q8",
        "What is strongest evidence of applied mastery?",
        "A defensible work product that links correct analysis to professional judgment",
        [
          "Finishing the assignment quickly regardless of errors",
          "Using the longest spreadsheet",
          "Copying a sample answer without checking assumptions"
        ]
      ),

      question(
        "p4-q9",
        `Which activity best represents applied work for a ${p.role}?`,
        p.focus,
        otherFocus
      ),

      question(
        "p4-q10",
        "When revising professional work, what should be preserved?",
        "An audit trail of material assumptions, changes, and reasoning",
        [
          "Only the final number",
          "No record of earlier assumptions",
          "Only comments that support the final conclusion"
        ]
      )
    ];
  }

  if (stage === 5) {
    return [
      question(
        "p5-q1",
        `Before beginning ${p.simulation}, what is the strongest first step?`,
        "Identify the decision, deliverables, key evidence, and highest-risk assumptions",
        [
          "Choose the recommendation before reading the case",
          "Begin formatting the final certificate",
          "Ignore the assignment brief"
        ]
      ),

      question(
        "p5-q2",
        `Which technical concept is particularly relevant to ${p.simulation}?`,
        p.concepts[0],
        otherConcepts
      ),

      question(
        "p5-q3",
        `Which deliverable could reasonably appear in ${p.simulation}?`,
        p.deliverables[0],
        otherDeliverables
      ),

      question(
        "p5-q4",
        "New information materially changes the case midway through the simulation. What should you do?",
        "Update the affected analysis and reconsider the recommendation",
        [
          "Freeze the original answer",
          "Hide the new information",
          "Automatically choose the optimistic case"
        ]
      ),

      question(
        "p5-q5",
        `Which risk should be explicitly considered in a ${p.title} simulation?`,
        p.risk,
        otherRisks
      ),

      question(
        "p5-q6",
        "What should a strong final recommendation include?",
        "Decision, supporting evidence, assumptions, material risks, and next steps",
        [
          "Only the final number",
          "Only evidence supporting the recommendation",
          "No discussion of uncertainty"
        ]
      ),

      question(
        "p5-q7",
        "How should simulated case data be treated?",
        "Use it for the exercise while clearly distinguishing simulated information from verified real-world data",
        [
          "Present it publicly as actual company data",
          "Assume it is audited",
          "Remove all data labels"
        ]
      ),

      question(
        "p5-q8",
        "What should happen before submitting the simulation?",
        "Recheck calculations, sources, assumptions, logic, and written recommendation",
        [
          "Submit immediately when one answer looks correct",
          "Remove all risk discussion",
          "Skip review because the exercise is simulated"
        ]
      ),

      question(
        "p5-q9",
        `Which activity best represents the role of a ${p.role}?`,
        p.focus,
        otherFocus
      ),

      question(
        "p5-q10",
        "What most clearly demonstrates mastery in a professional simulation?",
        "Producing a defensible answer while responding correctly to evidence, uncertainty, and review",
        [
          "Memorizing the wording of one answer",
          "Finishing faster than every other learner",
          "Avoiding revisions"
        ]
      )
    ];
  }

  throw new HttpError(
    400,
    "Invalid pathway stage"
  );
}


function careerWorkbenchSourceTable(workbench) {
  const table = [["Source", "Metric / line", "Value / detail"]];
  for (const file of (workbench?.files || [])) {
    for (const row of (file.rows || [])) {
      if (!Array.isArray(row) || !row.length) continue;
      const metric = String(row[0] ?? "");
      const detail = row.slice(1).map(v => String(v ?? "")).join(" · ");
      table.push([String(file.label || file.name || "Case file"), metric, detail]);
    }
  }
  return table.slice(0, 28);
}

function careerAppliedStageQuestions(pathway, stage) {
  const wb = CAREER_WORKBENCHES[pathway.id];
  if (!wb) return null;
  const numeric = (wb.tasks || []).filter(t => t.type === 'numeric').slice(0, 3);
  const written = (wb.tasks || []).find(t => t.type === 'text');
  if (numeric.length < 3 || !written) return null;
  const sourceTable = careerWorkbenchSourceTable(wb);
  const prefix = `p${stage}`;
  const questions = numeric.map((t, i) => numericQuestion(
    `${prefix}-work-${i+1}`,
    t.prompt,
    t.answer,
    t.tolerance,
    `${wb.project} · ${wb.role}. Use the synthetic source packet below and show the same calculation discipline taught in the Professional Toolkit.`,
    sourceTable,
    t.unit || ''
  ));
  questions.push({
    id: `${prefix}-work-note`,
    type: 'text',
    prompt: written.prompt,
    context: `${wb.project} · Write the short professional note you would place in the workpaper or send to ${wb.reviewer}.`,
    table: sourceTable,
    keywords: written.keywords || [],
    minHits: Number(written.minHits || 2),
    minWords: Math.max(18, Number(written.minWords || 18)),
    answer: null
  });
  const common = stage === 3 ? [
    contextualQuestion(`${prefix}-q5`, 'A reviewer cannot reproduce one of your key outputs. What should you do?', 'Trace the source, input, formula and assumption until the output is reproducible', ['Tell the reviewer to trust the number','Replace the workpaper with a screenshot','Remove the output from the deliverable'], `You are preparing ${wb.project} for ${wb.reviewer}.`),
    contextualQuestion(`${prefix}-q6`, 'Which source practice is strongest before a number enters a professional work product?', 'Record the authoritative source, period, units and any adjustment or assumption', ['Use the first number that looks reasonable','Mix periods if the values are close','Remove source notes to make the file cleaner'], `The work may be reviewed or updated by another analyst.`),
    contextualQuestion(`${prefix}-q7`, 'A material assumption changes after your first build. What should happen?', 'Update the affected inputs, rerun dependent outputs and explain what changed', ['Freeze the original output','Change only the written conclusion','Hide the new information until the final exam'], `New information arrives while you are working on ${wb.project}.`),
    contextualQuestion(`${prefix}-q8`, 'What is the strongest pre-submission quality-control habit?', 'Reconcile sources, units, calculations, assumptions, checks and presentation before senior review', ['Submit as soon as the first result appears','Delete downside or exception cases','Assume the manager will find any errors'], `Your work is about to go to ${wb.reviewer}.`),
    contextualQuestion(`${prefix}-q9`, `Which deliverable is most consistent with the ${pathway.title} role being trained?`, pathway.deliverables[0], otherArrayValues(pathway,'deliverables',3), wb.objective),
    contextualQuestion(`${prefix}-q10`, 'What makes a junior work product decision-useful?', 'It connects sourced evidence and correct analysis to a conclusion, risk and next step', ['It contains the most formulas possible','It avoids stating a recommendation','It shows only evidence supporting the preferred answer'], `The reviewer needs to understand what the analysis means, not just the number.`)
  ] : [
    contextualQuestion(`${prefix}-q5`, 'A manager identifies a material error after your first submission. What is the strongest response?', 'Correct it, rerun every affected output, quantify the impact and resubmit with a clear change note', ['Change formatting only','Ignore it if the recommendation is unchanged','Delete the manager comment'], `This is a revision cycle inside ${wb.project}.`),
    contextualQuestion(`${prefix}-q6`, 'Two reliable sources disagree materially. What should the analyst do?', 'Reconcile definitions and timing, document the difference and explain its impact on the analysis', ['Use whichever number produces the preferred result','Average them without investigating','Delete both sources'], `The discrepancy could change a decision.`),
    contextualQuestion(`${prefix}-q7`, 'A downside or stress case is materially weaker than the base case. What should the final work product do?', 'State the recommendation while clearly showing the downside, assumptions and conditions that could change it', ['Delete the downside case','Present the base case as guaranteed','Avoid making any recommendation'], wb.objective),
    contextualQuestion(`${prefix}-q8`, 'What is strongest evidence of applied mastery?', 'A reproducible work product that links correct analysis, source discipline, judgment and professional communication', ['Completing the page quickly','Using the longest workpaper','Copying a sample answer without checking assumptions'], `Capital Mastery is measuring whether the learner can transfer the taught workflow into independent work.`),
    contextualQuestion(`${prefix}-q9`, `Which risk deserves explicit attention in ${pathway.title} applied work?`, pathway.risk, otherValues(pathway,'risk',3), wb.objective),
    contextualQuestion(`${prefix}-q10`, 'What should be preserved when professional work is revised?', 'An audit trail of material assumptions, changes, sources and reasoning', ['Only the final number','No record of prior assumptions','Only comments that support the final conclusion'], `The work may be reviewed later by a manager or another analyst.`)
  ];
  return [...questions, ...common];
}

function numericQuestion(id, prompt, answer, tolerance, context = '', table = null, unit = '') {
  return {
    id,
    type: "numeric",
    prompt,
    context,
    table,
    unit,
    tolerance: Number(tolerance || 0),
    answer: Number(answer)
  };
}

function contextualQuestion(id, prompt, correct, wrongs, context = '', table = null) {
  return {
    ...question(id, prompt, correct, wrongs),
    context,
    table
  };
}

function ibAppliedStageQuestions(stage) {
  if (stage === 2) return [
    numericQuestion('ib-p2-q1','Calculate EBIT ($m).',70,0.1,'TargetCo reports EBITDA of $90m and D&A of $20m.',[['Metric','Value'],['EBITDA','$90m'],['D&A','$20m']],'$m'),
    numericQuestion('ib-p2-q2','Calculate normalized EBITDA ($m).',90,0.1,'Reported EBITDA is $84m. A $6m restructuring charge is genuinely one-time; recurring stock compensation stays in operating expense.',[['Reported EBITDA','$84m'],['One-time restructuring charge','$6m'],['Recurring stock compensation','$3m']],'$m'),
    numericQuestion('ib-p2-q3','Calculate implied equity value ($m).',995,0.2,'A target is valued at 9.0x NTM EBITDA. Bridge enterprise value to equity value.',[['NTM EBITDA','$120m'],['Selected EV / EBITDA','9.0x'],['Debt','$140m'],['Cash','$55m']],'$m'),
    numericQuestion('ib-p2-q4','Calculate the median EV / EBITDA multiple (x).',9,0.05,'Calculate each peer multiple first.',[['Peer','Enterprise Value','NTM EBITDA'],['Alpha','$960m','$120m'],['Beta','$1,350m','$150m'],['Gamma','$1,100m','$100m']],'x'),
    numericQuestion('ib-p2-q5','Calculate Gordon Growth terminal value ($m).',1716.67,1.0,'Use Year-5 FCF × (1+g) ÷ (WACC−g).',[['Year-5 FCF','$100m'],['WACC','9.0%'],['Terminal growth','3.0%']],'$m'),
    contextualQuestion('ib-p2-q6','Which source is strongest for audited historical revenue and debt?','The company’s latest 10-K / annual report',['An unsourced finance blog','A social media post','A stale search-result snippet'],'You are spreading historical financials for a live pitch model.'),
    contextualQuestion('ib-p2-q7','A 50 bps increase in WACC materially lowers DCF value. What should the analyst do?','Show the sensitivity and explain that valuation is meaningfully assumption-sensitive',['Hide the sensitivity','Keep only the most optimistic case','Change WACC until the valuation matches comps'],'The senior banker asks why the DCF range is wide.'),
    numericQuestion('ib-p2-q8','Calculate transaction EV / LTM EBITDA (x).',14.5,0.05,'The buyer offers $26/share for 40m diluted shares and assumes $120m of net debt. LTM EBITDA is $80m.',null,'x'),
    contextualQuestion('ib-p2-q9','Before comparing two EBITDA figures, what should be checked first?','Period, definition, adjustments, units and source',['Only whether both numbers are positive','Only the decimal places','Whether the larger number supports the pitch'],'One peer uses reported LTM EBITDA while another data source shows adjusted NTM EBITDA.'),
    contextualQuestion('ib-p2-q10','Why run a downside case?','To test whether the recommendation remains defensible under weaker assumptions',['To guarantee the base case','To remove the need for judgment','To create a more optimistic answer'],'The Associate asks how the valuation holds up if revenue growth slows.')
  ];
  if (stage === 3) return [
    contextualQuestion('ib-p3-q1','Which Excel modeling habit is strongest?','Reference a clearly labeled assumption cell instead of hard-coding the same number into multiple formulas',['Type the assumption into every formula','Hide assumption cells','Paste values over formulas before review'],'You are building a model that will be updated repeatedly.'),
    contextualQuestion('ib-p3-q2','Which source should you use for a newly announced material acquisition?','The company’s 8-K / current filing and transaction announcement',['An unsourced web snippet','A two-year-old annual report only','A forum post'],'The deal was announced this morning and the pitchbook needs an updated transaction summary.'),
    numericQuestion('ib-p3-q3','Calculate implied price per share ($).',24.875,0.02,'Use the comp multiple and bridge EV to equity value.',[['NTM EBITDA','$120m'],['Selected EV / EBITDA','9.5x'],['Debt','$180m'],['Cash','$35m'],['Diluted shares','40m']],'$/share'),
    numericQuestion('ib-p3-q4','How much new equity financing is required ($m)?',375,0.1,'Balance Sources & Uses.',[['Uses','Amount'],['Equity purchase price','$900m'],['Debt refinanced','$150m'],['Fees','$25m'],['Sources','Amount'],['Buyer cash','$300m'],['New debt','$400m']],'$m'),
    contextualQuestion('ib-p3-q5','Which issue should stop a model from being sent to an Associate?','Equity value subtracts cash instead of adding it',['Footnote dates are consistent','Sensitivity table responds correctly','Formatting follows the template'],'You are running a pre-submission model check.'),
    contextualQuestion('ib-p3-q6','What makes a valuation-slide headline useful?','It states the decision-relevant takeaway supported by the page',['It only says “Valuation”','It repeats the company name','It uses as many finance terms as possible'],'Trading comps imply $22–27/share; DCF implies $25–31/share; offer is $26/share.'),
    numericQuestion('ib-p3-q7','Calculate the offer premium (%).',30,0.05,'Use offer price relative to unaffected share price.',[['Unaffected share price','$20'],['Offer price','$26']],'%'),
    contextualQuestion('ib-p3-q8','What is the strongest version-control behavior?','Create a new controlled version, preserve the prior working file and keep model/deck outputs synchronized',['Overwrite the only working model','Rename files FINAL_REALFINAL','Update the deck without updating linked model outputs'],'You have received four Associate comments on v07.'),
    numericQuestion('ib-p3-q9','Calculate total transaction uses ($m).',1075,0.1,'Add purchase price, refinanced debt and fees.',[['Equity purchase price','$900m'],['Debt refinanced','$150m'],['Fees','$25m']],'$m'),
    contextualQuestion('ib-p3-q10','When should a junior analyst escalate an issue?','When a material error, uncertainty or decision exceeds the analyst’s information or authority',['Never','Only after client materials are sent','Only if it makes the recommendation look better'],'A key source conflicts with the current model assumption.')
  ];
  return [
    numericQuestion('ib-p4-q1','Calculate purchase enterprise value ($m).',1125,0.1,'Buyer offers $26/share for 40m diluted shares and assumes $85m target net debt.',null,'$m'),
    numericQuestion('ib-p4-q2','Calculate EPS accretion / dilution (%).',6,0.05,'Buyer standalone EPS is $4.00 and pro forma EPS is $4.24.',null,'%'),
    contextualQuestion('ib-p4-q3','Which diligence issue should be escalated first?','Top customer is 34% of revenue and its contract expires next year',['The company logo is blue','The deck uses 16:9 slides','The office lease renews in eight years with immaterial cost'],'You are reviewing the data room before updating valuation and the client recommendation.'),
    contextualQuestion('ib-p4-q4','An Associate identifies a material share-count error. What should happen?','Correct the share count, rerun every affected output, quantify the impact and update linked materials',['Fix only the displayed price/share','Ignore it if the recommendation is unchanged','Delete the comment'],'The error affects comps, DCF price/share and the summary slide.'),
    numericQuestion('ib-p4-q5','Calculate transaction EV / EBITDA (x).',10.5,0.05,'Equity purchase price is $900m, target net debt is $150m and LTM EBITDA is $100m.',null,'x'),
    contextualQuestion('ib-p4-q6','Management lowers next-year revenue guidance. What is the strongest response?','Update the forecast and all dependent valuation/transaction outputs, then reassess the recommendation',['Keep the original model because work already started','Update only the slide headline','Ignore the change until after the pitch'],'The update arrives midway through the assignment.'),
    numericQuestion('ib-p4-q7','Calculate equity value ($m) from enterprise value.',875,0.1,'Bridge EV to equity value.',[['Enterprise value','$1,000m'],['Debt','$180m'],['Cash','$55m']],'$m'),
    contextualQuestion('ib-p4-q8','What is strongest evidence of applied mastery?','A reproducible work product that links correct analysis, sourced evidence and professional judgment',['Finishing first','Using the longest spreadsheet','Copying a sample output'],'Your work is being reviewed as if it were going to a senior banker.'),
    contextualQuestion('ib-p4-q9','A precedent transaction is three years old and occurred in a very different market. What should you do?','Use it only with context or exclude it if it is no longer decision-relevant',['Use it because it has the highest multiple','Treat every precedent equally','Hide the announcement date'],'You are defending the selected precedent range.'),
    contextualQuestion('ib-p4-q10','What should the final analyst email contain?','Concise conclusion, key evidence, material risks/changes, and the requested next step',['Every calculation in the model','Only the final number','No recommendation until asked twice'],'You are sending the revised valuation to your Associate before client review.')
  ];
}

function question(
  id,
  prompt,
  correct,
  wrongs
) {
  const options =
    buildOptions(correct, wrongs, id);

  return {
    id,
    type: "mc",
    prompt,
    options,
    answer: correct
  };
}

function buildOptions(
  correct,
  wrongs,
  seed
) {
  const cleaned = [
    correct,
    ...(wrongs || [])
  ]
    .map(v => String(v).trim())
    .filter(Boolean);

  const unique = [
    ...new Set(cleaned)
  ].filter(
    value => value !== correct
  );

  const fallback = [
    "Use unsupported assumptions without review",
    "Ignore material risks and uncertainty",
    "Choose the most optimistic answer regardless of evidence",
    "Skip source and calculation checks"
  ];

  const wrongThree = [];

  for (
    const value of [...unique, ...fallback]
  ) {
    if (
      value !== correct &&
      !wrongThree.includes(value)
    ) {
      wrongThree.push(value);
    }

    if (wrongThree.length === 3) break;
  }

  const array = [
    correct,
    ...wrongThree
  ];

  const offset =
    Math.abs(hashString(seed)) %
    array.length;

  return rotate(array, offset);
}

function publicQuestion(q) {
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: q.options || null,
    context: q.context || null,
    table: Array.isArray(q.table) ? q.table : null,
    unit: q.unit || null,
    workProduct: q.workProduct || null
  };
}

function otherValues(
  current,
  field,
  count
) {
  const values = [];

  for (const pathway of ALL_PATHWAYS) {
    if (pathway.id === current.id) continue;

    const value = pathway[field];

    if (
      value &&
      !values.includes(value)
    ) {
      values.push(value);
    }
  }

  return values.slice(0, count);
}

function otherArrayValues(
  current,
  field,
  count
) {
  const values = [];

  for (const pathway of ALL_PATHWAYS) {
    if (pathway.id === current.id) continue;

    const entries =
      Array.isArray(pathway[field])
        ? pathway[field]
        : [];

    for (const value of entries) {
      if (
        !current[field].includes(value) &&
        !values.includes(value)
      ) {
        values.push(value);
      }

      if (values.length >= count) {
        return values;
      }
    }
  }

  return values;
}


// ======================================================
// GRADING
// ======================================================

function gradeAssessment(
  assessment,
  rawAnswers,
  rawWriting
) {
  const answers =
    rawAnswers &&
    typeof rawAnswers === "object" &&
    !Array.isArray(rawAnswers)
      ? rawAnswers
      : {};

  let correct = 0;

  for (
    const q of assessment.questions
  ) {
    const submitted =
      answers[q.id];

    if (q.type === "numeric") {
      const value = Number(submitted);
      if (Number.isFinite(value) && Math.abs(value - Number(q.answer)) <= Number(q.tolerance || 0)) {
        correct++;
      }
    } else if (q.type === "text") {
      const text=cleanString(submitted||"",3000).toLowerCase();
      const words=text.split(/\s+/).filter(Boolean);
      const hits=(q.keywords||[]).filter(k=>text.includes(String(k).toLowerCase())).length;
      if(words.length>=Number(q.minWords||12) && hits>=Number(q.minHits||1)) correct++;
    } else if (
      typeof submitted === "string" &&
      submitted === q.answer
    ) {
      correct++;
    }
  }

  const total =
    assessment.questions.length;

  if (
    assessment.itemType !==
    "simulation"
  ) {
    const score =
      total > 0
        ? Math.round(
            (correct / total) * 100
          )
        : 0;

    return {
      score,
      correct,
      total,
      writingScore: null
    };
  }

  // Simulation:
  // 7 objective questions = 70 points
  // written recommendation = 30 points

  const objectiveScore =
    Math.round(
      (correct / total) * 70
    );

  const writingScore =
    gradeWriting(
      rawWriting,
      assessment
    );

  return {
    score: Math.min(
      100,
      objectiveScore + writingScore
    ),
    correct,
    total,
    writingScore
  };
}

function gradeWriting(
  rawWriting,
  assessment
) {
  const text =
    cleanString(rawWriting || "", 5000);

  if (!text) return 0;

  const words =
    text
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const lower =
    text.toLowerCase();

  if (assessment.version === "2.0-workbench" && assessment.simulationProfile?.kind === "ib-deal-workbench-v2") {
    let points = 0;
    const wc = words.length;
    if (wc >= 55) points += 3;
    if (wc >= 85) points += 2;
    if (/\b(recommend|proceed|continue diligence|do not proceed|pause|decline)\b/i.test(text)) points += 4;
    const valuationSignals = ["10.25", "793", "794", "840", "equity value", "multiple", "valuation"];
    points += Math.min(6, valuationSignals.filter(x => lower.includes(x)).length * 2);
    if (/\b(guidance|revised|update|revenue)\b/i.test(text) && /\b(5%|456|83.5|lower|declin)\b/i.test(text)) points += 5;
    const riskSignals = ["customer", "contract", "synergy", "retention", "churn", "diligence", "execution", "downside", "revenue mix", "implementation cost"];
    points += Math.min(5, riskSignals.filter(x => lower.includes(x)).length * 2);
    if (/\b(next step|request|confirm|validate|diligence|review|rerun|send)\b/i.test(text)) points += 3;
    if (wc >= 70 && wc <= 260) points += 2;
    return Math.min(30, points);
  }

  let lengthPoints =
    Math.round(
      Math.min(words.length, 120) /
        120 *
        12
    );

  const prompt =
    assessment.writingPrompt || "";

  const pathway =
    ALL_PATHWAYS.find(
      p =>
        prompt.includes(p.role) ||
        prompt.includes(p.simulation)
    );

  const keywords =
    pathway?.simKeywords || [
      "risk",
      "assumption",
      "recommendation",
      "evidence"
    ];

  let hits = 0;

  for (const keyword of keywords) {
    const normalized =
      String(keyword)
        .toLowerCase();

    const firstWord =
      normalized.split(/\s+/)[0];

    if (
      lower.includes(normalized) ||
      lower.includes(firstWord)
    ) {
      hits++;
    }
  }

  const keywordPoints =
    Math.min(12, hits * 2);

  const decisionPoints =
    /\b(recommend|approve|decline|proceed|pass|invest|hold|buy|sell|reduce|increase|continue)\b/i.test(
      text
    )
      ? 3
      : 0;

  const riskPoints =
    /\b(risk|downside|assumption|uncertain|sensitivity)\b/i.test(
      text
    )
      ? 3
      : 0;

  return Math.min(
    30,
    lengthPoints +
      keywordPoints +
      decisionPoints +
      riskPoints
  );
}


// ======================================================
// PREREQUISITES + ATTEMPT LIMIT
// ======================================================

async function enforcePrerequisites(
  env,
  uid,
  pathwayId,
  itemId
) {
  const required =
    PREREQUISITES[itemId] || [];

  if (!required.length) return;

  const progress =
    await progressMap(
      env,
      uid,
      pathwayId
    );

  const missing =
    required.filter(item => {
      const record = progress[item];

      return !(
        record &&
        Number(record.completed) === 1 &&
        Number(record.best_score) >=
          PASS_SCORE
      );
    });

  if (missing.length) {
    throw new HttpError(
      403,
      `Complete the prerequisite assessment(s) first: ${missing.join(", ")}`
    );
  }
}

async function enforceAttemptLimit(
  env,
  uid,
  pathwayId,
  itemId
) {
  const row = await env.DB
    .prepare(`
      SELECT COUNT(*) AS total
      FROM assessment_attempts
      WHERE uid = ?
        AND pathway_id = ?
        AND item_id = ?
        AND submitted_at >= datetime('now', '-10 minutes')
    `)
    .bind(uid, pathwayId, itemId)
    .first();

  const total =
    Number(row?.total || 0);

  if (total >= MAX_ATTEMPTS_10_MIN) {
    throw new HttpError(
      429,
      "Too many recent attempts. Please wait before trying again."
    );
  }
}


// ======================================================
// OFFICIAL D1 PROGRESS
// ======================================================

async function recordOfficialAttempt(
  env,
  uid,
  pathwayId,
  itemId,
  itemType,
  score,
  passed
) {
  const attemptId =
    crypto.randomUUID();

  const completed =
    passed ? 1 : 0;

  await env.DB.batch([
    env.DB
      .prepare(`
        INSERT INTO assessment_attempts
        (
          id,
          uid,
          pathway_id,
          item_id,
          item_type,
          score,
          passed
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        attemptId,
        uid,
        pathwayId,
        itemId,
        itemType,
        score,
        completed
      ),

    env.DB
      .prepare(`
        INSERT INTO official_progress
        (
          uid,
          pathway_id,
          item_id,
          item_type,
          best_score,
          completed,
          completed_at,
          updated_at
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          CASE
            WHEN ? = 1
            THEN CURRENT_TIMESTAMP
            ELSE NULL
          END,
          CURRENT_TIMESTAMP
        )

        ON CONFLICT
        (
          uid,
          pathway_id,
          item_id
        )
        DO UPDATE SET

          item_type =
            excluded.item_type,

          best_score =
            CASE
              WHEN
                excluded.best_score >
                COALESCE(
                  official_progress.best_score,
                  0
                )
              THEN excluded.best_score
              ELSE
                official_progress.best_score
            END,

          completed =
            CASE
              WHEN
                official_progress.completed = 1
                OR excluded.completed = 1
              THEN 1
              ELSE 0
            END,

          completed_at =
            CASE
              WHEN
                official_progress.completed = 1
              THEN
                official_progress.completed_at

              WHEN
                excluded.completed = 1
              THEN
                CURRENT_TIMESTAMP

              ELSE
                official_progress.completed_at
            END,

          updated_at =
            CURRENT_TIMESTAMP
      `)
      .bind(
        uid,
        pathwayId,
        itemId,
        itemType,
        score,
        completed,
        completed
      )
  ]);
}

async function progressMap(
  env,
  uid,
  pathwayId
) {
  const result = await env.DB
    .prepare(`
      SELECT
        item_id,
        best_score,
        completed
      FROM official_progress
      WHERE uid = ?
        AND pathway_id = ?
    `)
    .bind(uid, pathwayId)
    .all();

  const map = {};

  for (
    const row of result.results || []
  ) {
    map[row.item_id] = row;
  }

  return map;
}


// ======================================================
// CREDENTIAL ELIGIBILITY
// ======================================================

function requirementsForLevel(level) {
  if (level === "foundations") {
    return [
      "part-1",
      "part-2"
    ];
  }

  if (level === "applied") {
    return [
      "part-1",
      "part-2",
      "part-3",
      "part-4"
    ];
  }

  if (level === "career") {
    return [
      "part-1",
      "part-2",
      "part-3",
      "part-4",
      "part-5",
      "simulation",
      "final"
    ];
  }

  throw new HttpError(
    400,
    "Unknown credential level"
  );
}

async function credentialEligibilitySummary(
  env,
  uid,
  pathway
) {
  const progress =
    await progressMap(
      env,
      uid,
      pathway.id
    );

  const result = {};

  for (
    const level of [
      "foundations",
      "applied",
      "career"
    ]
  ) {
    const required =
      requirementsForLevel(level);

    const missing =
      required.filter(item => {
        const record =
          progress[item];

        return !(
          record &&
          Number(record.completed) === 1 &&
          Number(record.best_score) >=
            PASS_SCORE
        );
      });

    result[level] = {
      eligible:
        missing.length === 0,
      missing
    };
  }

  return result;
}


// ======================================================
// AUTOMATIC CREDENTIAL ISSUANCE
// ======================================================

async function issueEligibleCredentials(
  env,
  user,
  pathway
) {
  const eligibility =
    await credentialEligibilitySummary(
      env,
      user.sub,
      pathway
    );

  const issued = [];

  for (
    const level of [
      "foundations",
      "applied",
      "career"
    ]
  ) {
    if (
      !eligibility[level].eligible
    ) {
      continue;
    }

    const credential =
      await issueOneCredential(
        env,
        user,
        pathway,
        level
      );

    if (credential) {
      issued.push(credential);
    }
  }

  return issued;
}

async function issueOneCredential(
  env,
  user,
  pathway,
  level
) {
  // Important:
  // If a credential ever existed and was revoked,
  // the learner cannot regenerate it automatically.
  // Only admin reissue can create a replacement.

  const previous = await env.DB
    .prepare(`
      SELECT
        credential_id,
        public_token,
        status,
        credential_title,
        issued_at
      FROM credentials
      WHERE uid = ?
        AND pathway_id = ?
        AND credential_level = ?
      ORDER BY issued_at DESC
      LIMIT 1
    `)
    .bind(
      user.sub,
      pathway.id,
      level
    )
    .first();

  if (previous) {
    return null;
  }

  const holderName =
    holderNameFromUser(user);

  const record =
    makeCredentialRecord(
      user.sub,
      holderName,
      pathway,
      level,
      null
    );

  const eventId =
    crypto.randomUUID();

  try {
    await env.DB.batch([
      env.DB
        .prepare(`
          INSERT INTO credentials
          (
            credential_id,
            public_token,
            uid,
            holder_name,
            pathway_id,
            credential_level,
            credential_title,
            status
          )
          VALUES
          (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'active'
          )
        `)
        .bind(
          record.credentialId,
          record.publicToken,
          user.sub,
          holderName,
          pathway.id,
          level,
          record.title
        ),

      env.DB
        .prepare(`
          INSERT INTO credential_events
          (
            id,
            credential_id,
            event_type,
            actor_uid,
            details
          )
          VALUES
          (
            ?,
            ?,
            'issued',
            ?,
            ?
          )
        `)
        .bind(
          eventId,
          record.credentialId,
          user.sub,
          JSON.stringify({
            criteriaVersion: "1.0",
            automatic: true
          })
        )
    ]);

    return {
      credentialId:
        record.credentialId,
      publicToken:
        record.publicToken,
      title:
        record.title,
      level,
      status: "active"
    };
  } catch (error) {
    // Unique index protects against race conditions.
    const existing = await env.DB
      .prepare(`
        SELECT
          credential_id,
          public_token,
          credential_title,
          credential_level,
          status
        FROM credentials
        WHERE uid = ?
          AND pathway_id = ?
          AND credential_level = ?
          AND status = 'active'
        LIMIT 1
      `)
      .bind(
        user.sub,
        pathway.id,
        level
      )
      .first();

    if (existing) {
      return null;
    }

    throw error;
  }
}

function makeCredentialRecord(
  uid,
  holderName,
  pathway,
  level,
  reissuedFromId
) {
  const year =
    new Date().getUTCFullYear();

  const levelCodes = {
    foundations: "FND",
    applied: "APP",
    career: "CAR"
  };

  const random =
    crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 10)
      .toUpperCase();

  return {
    credentialId:
      `CM-${pathway.code}-${levelCodes[level]}-${year}-${random}`,

    publicToken:
      randomToken(24),

    uid,
    holderName,
    pathwayId: pathway.id,
    level,
    title:
      credentialTitles(pathway)[level],

    reissuedFromId:
      reissuedFromId || null
  };
}

function credentialTitles(pathway) {
  return {
    foundations:
      `${pathway.title} Foundations Certificate`,

    applied:
      `${pathway.title} Applied Skills Certificate`,

    career:
      `${pathway.role}` +
      `${pathway.track ? ` — ${pathway.track}` : ""}` +
      ` Career Certificate`
  };
}


// ======================================================
// USER DISPLAY NAME
// ======================================================

function holderNameFromUser(user) {
  let raw =
    user.name ||
    user.email?.split("@")[0] ||
    "Capital Mastery Learner";

  raw =
    String(raw)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);

  return raw ||
    "Capital Mastery Learner";
}


// ======================================================
// REQUEST VALIDATION
// ======================================================

async function readJson(request) {
  const length = Number(
    request.headers.get(
      "Content-Length"
    ) || 0
  );

  if (
    Number.isFinite(length) &&
    length > MAX_BODY_BYTES
  ) {
    throw new HttpError(
      413,
      "Request body too large"
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    throw new HttpError(
      400,
      "Invalid JSON body"
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new HttpError(
      400,
      "JSON object required"
    );
  }

  return body;
}

function cleanString(value, maxLength) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function cleanId(value) {
  const id =
    cleanString(value, 150);

  if (
    !/^[A-Za-z0-9_-]+$/.test(id)
  ) {
    throw new HttpError(
      400,
      "Invalid identifier"
    );
  }

  return id;
}


// ======================================================
// UTILITIES
// ======================================================

function rotate(array, n) {
  if (!array.length) return [];

  const offset =
    ((n % array.length) +
      array.length) %
    array.length;

  return [
    ...array.slice(offset),
    ...array.slice(0, offset)
  ];
}

function hashString(value) {
  let hash = 0;

  for (
    let i = 0;
    i < value.length;
    i++
  ) {
    hash =
      ((hash << 5) - hash) +
      value.charCodeAt(i);

    hash |= 0;
  }

  return hash;
}

function randomToken(
  byteLength = 24
) {
  const bytes =
    new Uint8Array(byteLength);

  crypto.getRandomValues(bytes);

  let binary = "";

  for (const byte of bytes) {
    binary +=
      String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64UrlText(value) {
  return new TextDecoder().decode(
    decodeBase64UrlBytes(value)
  );
}

function decodeBase64UrlBytes(value) {
  let base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  while (base64.length % 4) {
    base64 += "=";
  }

  const binary = atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}


// ======================================================
// HTTP
// ======================================================

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function allowedOriginList(env) {
  return String(env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function corsHeaders(env) {
  return {
    // Browser access is still restricted by the explicit Origin allowlist above.
    // Wildcard response CORS lets the same bearer-token API serve both approved
    // static production hosts during the GitHub Pages -> Cloudflare Pages move.
    "Access-Control-Allow-Origin":
      "*",

    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-Request-ID",

    "Access-Control-Allow-Methods":
      "GET, POST, PATCH, OPTIONS",

    "Access-Control-Max-Age":
      "86400",

    "Vary":
      "Origin"
  };
}

function json(data, status, env) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store",

        "X-Content-Type-Options":
          "nosniff",

        ...corsHeaders(env)
      }
    }
  );
}

const ENTERPRISE_REQUIRED_STANDARD_CONTENT = new Set([
  "foundations-core",
  "foundations-assessment",
  "essentials-mini-case",
  "essentials-assessment",
  "diagnostic",
  "technical-core",
  "applied-skills",
  "role-lab",
  "final-assessment"
]);


function managerReviewPublic(x){return {id:x.id,orgId:x.org_id,assignmentId:x.assignment_id,learnerUid:x.learner_uid,pathwayId:x.pathway_id,artifactType:x.artifact_type,artifactRef:x.artifact_ref,reviewStatus:x.review_status,rating:x.rating==null?null:Number(x.rating),comment:x.comment,createdByUid:x.created_by_uid,createdAt:x.created_at,updatedAt:x.updated_at};}
async function upsertEnterpriseNotification(env,{recipientUid,orgId,assignmentId=null,category,severity='info',title,body,actionHash=null,dedupeKey}){
  const id=`note_${(await sha256Hex(`${recipientUid}|${dedupeKey}`)).slice(0,24)}`;
  await env.DB.prepare(`INSERT INTO enterprise_notifications (id,recipient_uid,org_id,assignment_id,category,severity,title,body,action_hash,dedupe_key,status) VALUES (?,?,?,?,?,?,?,?,?,?,'unread') ON CONFLICT(recipient_uid,dedupe_key) DO UPDATE SET severity=excluded.severity,title=excluded.title,body=excluded.body,action_hash=excluded.action_hash,updated_at=CURRENT_TIMESTAMP`).bind(id,recipientUid,orgId,assignmentId,category,severity,title,body,actionHash,dedupeKey).run(); return id;
}
async function refreshEnterpriseNotifications(env,user){
  const activeKeys=[];
  const memberships=(await env.DB.prepare(`SELECT org_id,role FROM organization_members WHERE uid=? AND status='active'`).bind(user.sub).all()).results||[];
  for(const m of memberships){
    if(ENTERPRISE_EMPLOYER_ROLES.includes(m.role)){
      const assignments=(await env.DB.prepare(`SELECT a.id,a.cohort_id,a.pathway_id,a.due_at,c.name AS cohort_name FROM program_assignments a JOIN cohorts c ON c.id=a.cohort_id WHERE a.org_id=? AND a.status='published'`).bind(m.org_id).all()).results||[];
      for(const a of assignments){
        const learners=(await env.DB.prepare(`SELECT cm.uid,MAX(i.email_normalized) AS email,MAX(cr.holder_name) AS holder_name FROM cohort_members cm LEFT JOIN organization_invites i ON i.org_id=cm.org_id AND i.cohort_id=cm.cohort_id AND i.accepted_by_uid=cm.uid LEFT JOIN credentials cr ON cr.uid=cm.uid WHERE cm.cohort_id=? AND cm.org_id=? AND cm.status='active' GROUP BY cm.uid`).bind(a.cohort_id,m.org_id).all()).results||[];
        for(const l of learners){
          const name=l.holder_name||l.email||'Learner'; const cred=await env.DB.prepare(`SELECT credential_id FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' AND status='active' LIMIT 1`).bind(l.uid,a.id).first(); const lab=await env.DB.prepare(`SELECT score,revision_count,status FROM role_lab_runs WHERE uid=? AND assignment_id=? ORDER BY started_at DESC LIMIT 1`).bind(l.uid,a.id).first(); const readiness=await env.DB.prepare(`SELECT overall_score,evidence_coverage FROM readiness_snapshots WHERE uid=? AND assignment_id=? ORDER BY created_at DESC LIMIT 1`).bind(l.uid,a.id).first();
          const due=a.due_at?Date.parse(a.due_at):null, days=due?Math.ceil((due-Date.now())/86400000):null;
          let note=null,key=null;
          if(due&&due<Date.now()&&!cred){key=`employer:overdue:${a.id}:${l.uid}`;note={category:'overdue',severity:'urgent',title:`Overdue · ${name}`,body:`${a.cohort_name} is past due and Professional Readiness is not complete.`,actionHash:`#/employer/${m.org_id}/reports?assignment=${a.id}`};}
          else if(Number(lab?.revision_count||0)>0&&lab?.status!=='passed'){key=`employer:revision:${a.id}:${l.uid}`;note={category:'revision',severity:'attention',title:`Revision cycle · ${name}`,body:`${Number(lab.revision_count)} Role Lab revision cycle${Number(lab.revision_count)===1?'':'s'} recorded. Review the recurring work-product weakness.`,actionHash:`#/employer/${m.org_id}/reports?assignment=${a.id}`};}
          else if(readiness&&Number(readiness.evidence_coverage||0)>=.7&&Number(readiness.overall_score)<75){key=`employer:readiness:${a.id}:${l.uid}`;note={category:'readiness',severity:'attention',title:`Readiness gap · ${name}`,body:`Readiness is ${Number(readiness.overall_score)} with ${Math.round(Number(readiness.evidence_coverage)*100)}% evidence coverage.`,actionHash:`#/employer/${m.org_id}/reports?assignment=${a.id}`};}
          else if(days!=null&&days>=0&&days<=3&&!cred){key=`employer:deadline:${a.id}:${l.uid}`;note={category:'deadline',severity:'info',title:`Due soon · ${name}`,body:`${a.cohort_name} is due in ${days} day${days===1?'':'s'}.`,actionHash:`#/employer/${m.org_id}/reports?assignment=${a.id}`};}
          if(note){activeKeys.push(key);await upsertEnterpriseNotification(env,{recipientUid:user.sub,orgId:m.org_id,assignmentId:a.id,dedupeKey:key,...note});}
        }
      }
    }
  }
  // Learner-side assigned deadlines/revisions.
  const learnerAssignments=(await env.DB.prepare(`SELECT a.id,a.org_id,a.pathway_id,a.due_at,c.name AS cohort_name FROM cohort_members cm JOIN program_assignments a ON a.cohort_id=cm.cohort_id AND a.org_id=cm.org_id JOIN cohorts c ON c.id=a.cohort_id WHERE cm.uid=? AND cm.status='active' AND a.status='published'`).bind(user.sub).all()).results||[];
  for(const a of learnerAssignments){const cred=await env.DB.prepare(`SELECT credential_id FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' AND status='active' LIMIT 1`).bind(user.sub,a.id).first();const lab=await env.DB.prepare(`SELECT revision_count,status FROM role_lab_runs WHERE uid=? AND assignment_id=? ORDER BY started_at DESC LIMIT 1`).bind(user.sub,a.id).first();const due=a.due_at?Date.parse(a.due_at):null,days=due?Math.ceil((due-Date.now())/86400000):null;let note=null,key=null;if(due&&due<Date.now()&&!cred){key=`learner:overdue:${a.id}`;note={category:'overdue',severity:'urgent',title:`Assigned training is overdue`,body:`${a.cohort_name} is past due. Open the assigned program to continue.`,actionHash:`#/assigned/${a.id}`};}else if(lab&&Number(lab.revision_count||0)>0&&lab.status!=='passed'){key=`learner:revision:${a.id}`;note={category:'revision',severity:'attention',title:'Role Lab revision required',body:'Manager-style feedback is waiting in your Role Lab. Revise the current work product before continuing.',actionHash:`#/role-lab/${a.pathway_id}?assignment=${a.id}`};}else if(days!=null&&days>=0&&days<=3&&!cred){key=`learner:deadline:${a.id}`;note={category:'deadline',severity:'info',title:'Assigned training due soon',body:`${a.cohort_name} is due in ${days} day${days===1?'':'s'}.`,actionHash:`#/assigned/${a.id}`};}if(note){activeKeys.push(key);await upsertEnterpriseNotification(env,{recipientUid:user.sub,orgId:a.org_id,assignmentId:a.id,dedupeKey:key,...note});}}
  return {activeGenerated:activeKeys.length};
}

const ENTERPRISE_EMPLOYER_ROLES = ["owner", "training_admin", "content_manager", "manager", "viewer"];

async function requireOrgMember(env, uid, orgId) {
  const row = await env.DB.prepare(`
    SELECT m.role, m.status, o.status AS org_status
    FROM organization_members m JOIN organizations o ON o.id = m.org_id
    WHERE m.org_id = ? AND m.uid = ? LIMIT 1
  `).bind(orgId, uid).first();
  if (!row || row.status !== "active" || row.org_status !== "active") throw new HttpError(403, "Organization access required");
  return row;
}

async function requireOrgRole(env, uid, orgId, allowedRoles) {
  const membership = await requireOrgMember(env, uid, orgId);
  if (!allowedRoles.includes(membership.role)) throw new HttpError(403, "Insufficient organization permission");
  return membership;
}

function enterpriseAuditStatement(env, orgId, actorUid, action, targetType, targetId, details) {
  return env.DB.prepare(`INSERT INTO enterprise_audit_events (id, org_id, actor_uid, action, target_type, target_id, details_json) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), orgId, actorUid, action, targetType, targetId || null, JSON.stringify(details || {}));
}

function enterpriseEnum(value, allowed, label) {
  const v = cleanString(value, 80);
  if (!allowed.includes(v)) throw new HttpError(400, `Invalid ${label}`);
  return v;
}

function slugifyEnterprise(value) {
  const out = cleanString(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return out || "organization";
}

function normalizeEnterpriseEmail(value, optional = false) {
  const email = cleanString(value, 254).toLowerCase();
  if (optional && !email) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Valid email required");
  return email;
}

function optionalIsoDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) throw new HttpError(400, "Invalid date");
  return d.toISOString();
}

function safeEnterpriseJson(value, maxLength) {
  let text;
  try { text = JSON.stringify(value ?? {}); } catch { throw new HttpError(400, "Invalid content data"); }
  if (text.length > maxLength) throw new HttpError(413, "Content payload too large");
  return text;
}

function enterpriseFirmContentPublic(row) {
  let body = {};
  try { body = JSON.parse(row.body_json || "{}"); } catch {}
  return {
    id: row.id,
    assignmentId: row.assignment_id || null,
    pathwayId: row.pathway_id,
    contentType: row.content_type,
    title: row.title,
    body,
    positionKey: row.position_key,
    visibility: row.visibility,
    sourceStandardContentId: row.source_standard_content_id || null,
    currentVersion: Number(row.current_version || 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map(x => x.toString(16).padStart(2, "0")).join("");
}

function v2ParseJson(value, fallback = {}) {
  try { return JSON.parse(value || '') ?? fallback; } catch { return fallback; }
}

function v2Clamp(n, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, Number(n) || 0)); }

async function v2RequireAssignmentAccess(env, uid, assignmentId, pathwayId = null) {
  const row = await env.DB.prepare(`
    SELECT a.*, c.status AS cohort_status, cm.status AS member_status, o.status AS org_status
    FROM program_assignments a
    JOIN cohorts c ON c.id = a.cohort_id AND c.org_id = a.org_id
    JOIN organization_members om ON om.org_id = a.org_id AND om.uid = ?
    LEFT JOIN cohort_members cm ON cm.cohort_id = c.id AND cm.org_id = c.org_id AND cm.uid = ?
    JOIN organizations o ON o.id = a.org_id
    WHERE a.id = ? LIMIT 1
  `).bind(uid, uid, assignmentId).first();
  if (!row || row.org_status !== 'active') throw new HttpError(404, 'Assignment not found');
  const employerRoles = new Set(['owner','training_admin','content_manager','manager','viewer']);
  const membership = await env.DB.prepare(`SELECT role,status FROM organization_members WHERE org_id=? AND uid=? LIMIT 1`).bind(row.org_id, uid).first();
  const employer = membership && membership.status === 'active' && employerRoles.has(membership.role);
  const learner = row.member_status === 'active';
  if (!employer && !learner) throw new HttpError(403, 'Assignment access required');
  if (pathwayId && row.pathway_id !== pathwayId) throw new HttpError(409, 'Assignment pathway mismatch');
  return { ...row, accessRole: employer ? membership.role : 'learner' };
}

function v2GradeRules(grading, response) {
  const rules = Array.isArray(grading?.rules) ? grading.rules : [];
  let earned = 0, possible = 0;
  const breakdown = [];
  const feedback = [];
  for (const rule of rules) {
    const pts = Math.max(0, Number(rule.points || 0));
    possible += pts;
    const raw = response?.[rule.field];
    let fraction = 0;
    let detail = '';
    if (rule.type === 'numeric') {
      const actual = Number(raw), expected = Number(rule.expected), tolerance = Math.max(0, Number(rule.tolerance || 0));
      if (Number.isFinite(actual) && Number.isFinite(expected)) {
        const diff = Math.abs(actual - expected);
        if (diff <= tolerance) fraction = 1;
        else if (tolerance > 0 && diff <= tolerance * 2) fraction = 0.75;
        else if (tolerance > 0 && diff <= tolerance * 5) fraction = 0.4;
        detail = Number.isFinite(actual) ? `Submitted ${actual}` : 'No valid number submitted';
      }
    } else if (rule.type === 'choice') {
      fraction = String(raw ?? '') === String(rule.expected ?? '') ? 1 : 0;
      detail = String(raw ?? '');
    } else if (rule.type === 'choice_flexible') {
      const value = String(raw ?? '');
      const preferred = Array.isArray(rule.preferred) ? rule.preferred.map(String) : [];
      fraction = preferred.includes(value) ? 1 : value ? 0.6 : 0;
      detail = value;
    } else if (rule.type === 'multi_select') {
      const selected = new Set(Array.isArray(raw) ? raw.map(String) : []);
      const expected = new Set(Array.isArray(rule.expected) ? rule.expected.map(String) : []);
      const hits = [...expected].filter(x => selected.has(x)).length;
      const extras = [...selected].filter(x => !expected.has(x)).length;
      fraction = expected.size ? v2Clamp((hits - extras * 0.5) / expected.size, 0, 1) : 0;
      detail = `${hits}/${expected.size} material issues identified${extras ? ` · ${extras} false positive${extras === 1 ? '' : 's'}` : ''}`;
    } else if (rule.type === 'text_evidence') {
      const text = String(raw ?? '').trim();
      const lower = text.toLowerCase();
      const minChars = Math.max(1, Number(rule.min_chars || 1));
      const groups = Array.isArray(rule.evidence_groups) ? rule.evidence_groups : [];
      const lengthFraction = Math.min(1, text.length / minChars);
      const hits = groups.filter(group => Array.isArray(group) && group.some(term => lower.includes(String(term).toLowerCase()))).length;
      const evidenceFraction = groups.length ? hits / groups.length : 1;
      fraction = v2Clamp(lengthFraction * 0.2 + evidenceFraction * 0.8, 0, 1);
      detail = `${text.length} characters · ${hits}/${groups.length} evidence areas covered`;
    }
    const ruleEarned = pts * fraction;
    earned += ruleEarned;
    const passed = fraction >= 0.999;
    breakdown.push({ field: rule.field, type: rule.type, points: Math.round(ruleEarned * 10) / 10, possible: pts, passed, detail });
    if (!passed && rule.feedback) feedback.push(rule.feedback);
  }
  const score = possible ? Math.round((earned / possible) * 100) : 0;
  return { score, earned: Math.round(earned * 10) / 10, possible, breakdown, feedback: [...new Set(feedback)] };
}

async function v2RecomputeCompetency(env, { uid, orgId, assignmentId, pathwayId, competencyId }) {
  const orgScope = orgId || 'public';
  const assignmentScope = assignmentId || 'public';
  const rows = await env.DB.prepare(`
    SELECT score, weight, source_type FROM competency_evidence
    WHERE uid=? AND pathway_id=? AND competency_id=?
      AND COALESCE(org_id,'public')=? AND COALESCE(assignment_id,'public')=?
  `).bind(uid, pathwayId, competencyId, orgScope, assignmentScope).all();
  const list = rows.results || [];
  const professional = list.filter(r => r.source_type !== 'diagnostic');
  const scoringEvidence = professional.length ? professional : list;
  const totalWeight = scoringEvidence.reduce((s, r) => s + Math.max(0, Number(r.weight || 0)), 0);
  const score = totalWeight ? Math.round(scoringEvidence.reduce((s, r) => s + Number(r.score || 0) * Math.max(0, Number(r.weight || 0)), 0) / totalWeight) : 0;
  await env.DB.prepare(`
    INSERT INTO competency_scores (uid, org_scope, assignment_scope, pathway_id, competency_id, score, evidence_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(uid, org_scope, assignment_scope, pathway_id, competency_id)
    DO UPDATE SET score=excluded.score, evidence_count=excluded.evidence_count, updated_at=CURRENT_TIMESTAMP
  `).bind(uid, orgScope, assignmentScope, pathwayId, competencyId, score, list.length).run();
  return score;
}

async function v2CreateReadinessSnapshot(env, { uid, orgId = null, cohortId = null, assignmentId = null, pathwayId, curriculumVersion = '2.0' }) {
  const orgScope = orgId || 'public';
  const assignmentScope = assignmentId || 'public';
  const mapped = await env.DB.prepare(`
    SELECT pc.competency_id, pc.weight, pc.minimum_score, pc.critical, c.name,
           cs.score, cs.evidence_count
    FROM pathway_competencies pc
    JOIN competencies c ON c.id = pc.competency_id
    LEFT JOIN competency_scores cs
      ON cs.uid=? AND cs.org_scope=? AND cs.assignment_scope=?
      AND cs.pathway_id=pc.pathway_id AND cs.competency_id=pc.competency_id
    WHERE pc.pathway_id=? AND c.status='active'
  `).bind(uid, orgScope, assignmentScope, pathwayId).all();
  const list = mapped.results || [];
  const available = list.filter(x => x.score !== null && x.score !== undefined);
  const denom = available.reduce((s, x) => s + Number(x.weight || 0), 0);
  const overall = denom ? Math.round(available.reduce((s, x) => s + Number(x.score || 0) * Number(x.weight || 0), 0) / denom) : 0;
  const criticalBelow = available.some(x => Number(x.critical) === 1 && Number(x.score) < Number(x.minimum_score || 0));
  const evidenceRows = await env.DB.prepare(`
    SELECT competency_id,
           SUM(CASE WHEN source_type != 'diagnostic' THEN 1 ELSE 0 END) AS professional_count,
           MAX(CASE WHEN source_type = 'role_lab' THEN 1 ELSE 0 END) AS has_role_lab,
           MAX(CASE WHEN source_type = 'final' THEN 1 ELSE 0 END) AS has_final
    FROM competency_evidence
    WHERE uid=? AND pathway_id=? AND COALESCE(org_id,'public')=? AND COALESCE(assignment_id,'public')=?
    GROUP BY competency_id
  `).bind(uid, pathwayId, orgScope, assignmentScope).all();
  const evidence = evidenceRows.results || [];
  const professionalCompetencies = evidence.filter(x => Number(x.professional_count || 0) > 0).length;
  const evidenceCoverage = list.length ? professionalCompetencies / list.length : 0;
  const hasRoleLab = evidence.some(x => Number(x.has_role_lab || 0) === 1);
  const hasFinal = evidence.some(x => Number(x.has_final || 0) === 1);
  const evidencePhase = hasFinal ? 'final_evidence' : hasRoleLab ? 'role_lab_evidence' : evidenceCoverage > 0 ? 'applied_evidence' : 'baseline';
  let status = overall >= 85 ? 'ready' : overall >= 75 ? 'ready_with_development' : overall >= 60 ? 'near_ready' : 'developing';
  if (evidenceCoverage === 0) status = 'developing';
  else if (evidenceCoverage < 0.6 && ['ready','ready_with_development'].includes(status)) status = 'near_ready';
  else if (!hasFinal && status === 'ready') status = 'ready_with_development';
  if (criticalBelow && ['ready','ready_with_development'].includes(status)) status = 'near_ready';
  const baseline = await env.DB.prepare(`SELECT score FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY submitted_at ASC LIMIT 1`).bind(uid, pathwayId, assignmentScope).first();
  const baselineScore = baseline ? Number(baseline.score) : null;
  const improvement = baselineScore === null ? null : overall - baselineScore;
  const scoreJson = JSON.stringify(Object.fromEntries(list.map(x => [x.competency_id, { name:x.name, score:x.score == null ? null : Number(x.score), minimum:Number(x.minimum_score||0), critical:Number(x.critical)===1, evidenceCount:Number(x.evidence_count||0) }])));
  const id = `rdy_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
  await env.DB.prepare(`INSERT INTO readiness_snapshots (id,uid,org_id,cohort_id,assignment_id,pathway_id,overall_score,status,competency_scores_json,baseline_score,improvement,curriculum_version,evidence_coverage,evidence_phase) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, uid, orgId, cohortId, assignmentId, pathwayId, overall, status, scoreJson, baselineScore, improvement, curriculumVersion, evidenceCoverage, evidencePhase).run();
  return { id, overallScore: overall, status, baselineScore, improvement, evidenceCoverage: Math.round(evidenceCoverage * 100), evidencePhase, competencies: v2ParseJson(scoreJson,{}) };
}

function v2PublicDiagnosticQuestion(row) {
  return { id: row.id, competencyId: row.competency_id, position: Number(row.position), prompt: row.prompt, options: v2ParseJson(row.options_json,[]) };
}

function v2PublicLabTask(row) {
  return { id: row.id, stageNo: Number(row.stage_no), title: row.title, taskType: row.task_type, brief: v2ParseJson(row.brief_json,{}), passScore: Number(row.pass_score), maxAttempts: Number(row.max_attempts) };
}

async function v2LatestTaskSubmissions(env, runId) {
  const rows = await env.DB.prepare(`
    SELECT s.* FROM role_lab_submissions s
    JOIN (SELECT task_id, MAX(attempt_no) AS max_attempt FROM role_lab_submissions WHERE run_id=? GROUP BY task_id) x
      ON x.task_id=s.task_id AND x.max_attempt=s.attempt_no
    WHERE s.run_id=?
  `).bind(runId, runId).all();
  return rows.results || [];
}

async function v2RunState(env, run) {
  const tasksRes = await env.DB.prepare(`SELECT * FROM role_lab_tasks WHERE lab_key=? AND lab_version=? AND status='active' ORDER BY stage_no`).bind(run.lab_key, run.lab_version).all();
  let tasks = tasksRes.results || []; if(!tasks.length){const dyn=v2DynamicLabByKey(run.lab_key);tasks=dyn?.tasks||[];}
  const latest = await v2LatestTaskSubmissions(env, run.id);
  const byTask = new Map(latest.map(s => [s.task_id, s]));
  let current = null;
  for (const task of tasks) {
    const s = byTask.get(task.id);
    const score = s ? Number(v2ParseJson(s.score_json,{}).score ?? -1) : -1;
    if (!s || score < Number(task.pass_score)) { current = task; break; }
  }
  const scores = tasks.map(t => byTask.get(t.id) ? Number(v2ParseJson(byTask.get(t.id).score_json,{}).score || 0) : null).filter(x => x !== null);
  const overall = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  if (!current && tasks.length && overall < 80) {
    const revisable = tasks.filter(t => {
      const s=byTask.get(t.id); return s && Number(s.attempt_no) < Number(t.max_attempts);
    }).sort((a,b)=>Number(v2ParseJson(byTask.get(a.id).score_json,{}).score||0)-Number(v2ParseJson(byTask.get(b.id).score_json,{}).score||0));
    current = revisable[0] || null;
  }
  return { tasks, latest, byTask, current, overall, complete: !current && tasks.length > 0 && overall >= 80 };
}

const V2_STANDARD_VERSION = '2.0';
const V2_LEVEL_CODES = {
  essentials: 'ESS',
  role_lab: 'RLB',
  professional_readiness: 'PRD'
};


const ACADEMY_PRIMARY_DOMAIN = {
  'investment-banking':'deals','corporate-development':'deals',
  'private-equity':'investing','venture-capital':'investing','equity-research':'investing','asset-management':'investing','hedge-funds':'investing',
  'sales-trading':'markets_quant','quantitative-finance':'markets_quant',
  'private-credit':'credit_risk','corporate-banking':'credit_risk','risk-management':'credit_risk',
  'fp-and-a':'corporate_finance','treasury':'corporate_finance',
  'wealth-management':'wealth_real_assets','real-estate-finance':'wealth_real_assets'
};
const ACADEMY_AWARDS = [
  {id:'academy-finance-core',pathwayId:'finance-core',level:'finance_core',code:'CORE',title:'Capital Mastery Finance Core Certificate',kind:'finance_core'},
  {id:'academy-deals',pathwayId:'academy-deals',level:'academy',code:'DEALS',title:'Capital Mastery Deals Academy Certificate',required:['investment-banking','corporate-development']},
  {id:'academy-investing',pathwayId:'academy-investing',level:'academy',code:'INV',title:'Capital Mastery Investing Academy Certificate',pool:['private-equity','venture-capital','equity-research','asset-management','hedge-funds'],minimum:2},
  {id:'academy-markets-quant',pathwayId:'academy-markets-quant',level:'academy',code:'MQ',title:'Capital Mastery Markets & Quant Academy Certificate',pool:['sales-trading','quantitative-finance','risk-management'],minimum:2},
  {id:'academy-credit-risk',pathwayId:'academy-credit-risk',level:'academy',code:'CR',title:'Capital Mastery Credit & Risk Academy Certificate',pool:['private-credit','corporate-banking','risk-management'],minimum:2},
  {id:'academy-corporate-finance',pathwayId:'academy-corporate-finance',level:'academy',code:'CF',title:'Capital Mastery Corporate Finance Academy Certificate',pool:['fp-and-a','treasury','corporate-development'],minimum:2},
  {id:'academy-wealth-real-assets',pathwayId:'academy-wealth-real-assets',level:'academy',code:'WRA',title:'Capital Mastery Wealth & Real Assets Academy Certificate',required:['wealth-management','real-estate-finance']},
  {id:'academy-finance-professional',pathwayId:'finance-professional',level:'finance_professional',code:'PRO',title:'Capital Mastery Finance Professional Achievement',kind:'finance_professional'}
];
function academySafeCredential(c){return {credentialId:c.credential_id,title:c.credential_title,pathwayId:c.pathway_id,level:c.credential_level,issuedAt:c.issued_at};}
async function academyCredentialState(env,uid){
  const rows=(await env.DB.prepare(`SELECT credential_id,public_token,pathway_id,credential_level,credential_title,issued_at,status FROM credentials WHERE uid=? AND status='active' ORDER BY issued_at`).bind(uid).all()).results||[];
  const foundations=rows.filter(x=>x.credential_level==='foundations'&&ACADEMY_PRIMARY_DOMAIN[x.pathway_id]);
  const professional=rows.filter(x=>x.credential_level==='professional_readiness'&&ACADEMY_PRIMARY_DOMAIN[x.pathway_id]);
  const byPrd=new Map(professional.map(x=>[x.pathway_id,x]));
  const financeCore=rows.find(x=>x.pathway_id==='finance-core'&&x.credential_level==='finance_core');
  return {rows,foundations,professional,byPrd,financeCore};
}
function academyEligibility(def,state){
  if(def.kind==='finance_core'){
    const domains=new Set(state.foundations.map(x=>ACADEMY_PRIMARY_DOMAIN[x.pathway_id]));
    const supporting=[...new Map(state.foundations.map(x=>[x.pathway_id,x])).values()];
    return {eligible:supporting.length>=4&&domains.size>=3,supporting,summary:`${supporting.length}/4 Foundations · ${domains.size}/3 finance domains`,missing:supporting.length<4?'Earn Foundations in at least four careers':domains.size<3?'Spread Foundations across at least three finance domains':null};
  }
  if(def.kind==='finance_professional'){
    const domains=new Set(state.professional.map(x=>ACADEMY_PRIMARY_DOMAIN[x.pathway_id]));
    return {eligible:!!state.financeCore&&state.professional.length>=4&&domains.size>=3,supporting:[...(state.financeCore?[state.financeCore]:[]),...state.professional],summary:`${state.financeCore?'Finance Core ✓':'Finance Core required'} · ${state.professional.length}/4 Professional Readiness · ${domains.size}/3 domains`,missing:!state.financeCore?'Earn Finance Core first':state.professional.length<4?'Earn Professional Readiness in at least four careers':domains.size<3?'Professional Readiness must span at least three finance domains':null};
  }
  const eligiblePaths=def.required||def.pool||[]; const support=eligiblePaths.map(p=>state.byPrd.get(p)).filter(Boolean);
  const needed=def.required?def.required.length:Number(def.minimum||2); const missingPaths=def.required?def.required.filter(p=>!state.byPrd.has(p)):[];
  return {eligible:support.length>=needed,supporting:support,summary:`${support.length}/${needed} required Professional Readiness credentials`,missing:missingPaths.length?`Still required: ${missingPaths.map(x=>getPathway(x).title).join(', ')}`:support.length<needed?`Earn ${needed-support.length} more eligible Professional Readiness credential${needed-support.length===1?'':'s'}`:null};
}
async function issueAcademyCredential(env,user,def,eligibility){
  const existing=await env.DB.prepare(`SELECT * FROM credentials WHERE uid=? AND pathway_id=? AND credential_level=? AND status='active' ORDER BY issued_at DESC LIMIT 1`).bind(user.sub,def.pathwayId,def.level).first();
  if(existing)return {issued:false,credential:existing,existing:true};
  if(!eligibility.eligible)return {issued:false,eligible:false,missing:eligibility.missing};
  const year=new Date().getUTCFullYear(), random=crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase(), credentialId=`CM-${def.code}-${year}-${random}`, publicToken=randomToken(24), holderName=holderNameFromUser(user);
  const summary={standardVersion:'2.0-academy',supportingCredentials:eligibility.supporting.map(academySafeCredential),ruleSummary:eligibility.summary,generatedAt:new Date().toISOString()};
  const statements=[
    env.DB.prepare(`INSERT INTO credentials (credential_id,public_token,uid,holder_name,pathway_id,credential_level,credential_title,status,standard_version,credential_definition_id,evidence_summary_json) VALUES (?,?,?,?,?,?,?,'active','2.0-academy',?,?)`).bind(credentialId,publicToken,user.sub,holderName,def.pathwayId,def.level,def.title,def.id,JSON.stringify(summary)),
    env.DB.prepare(`INSERT INTO credential_events (id,credential_id,event_type,actor_uid,details) VALUES (?,?, 'issued', ?, ?)`).bind(crypto.randomUUID(),credentialId,user.sub,JSON.stringify({automatic:true,academy:true,definitionId:def.id})),
    env.DB.prepare(`INSERT INTO credential_evidence_items (id,credential_id,evidence_type,evidence_ref,title,evidence_json) VALUES (?,?,?,?,?,?)`).bind(crypto.randomUUID(),credentialId,'curriculum',def.id,'Capital Mastery Academy Standard 2.0',JSON.stringify({definitionId:def.id,ruleSummary:eligibility.summary}))
  ];
  for(const c of eligibility.supporting){statements.push(env.DB.prepare(`INSERT INTO credential_evidence_items (id,credential_id,evidence_type,evidence_ref,title,evidence_json) VALUES (?,?,?,?,?,?)`).bind(crypto.randomUUID(),credentialId,'credential',c.credential_id,c.credential_title,JSON.stringify(academySafeCredential(c))));}
  await env.DB.batch(statements); return {issued:true,eligible:true,credential:{credentialId,publicToken,title:def.title,level:def.level,pathwayId:def.pathwayId,status:'active',standardVersion:'2.0-academy'}};
}
async function academyRefresh(env,user){
  let state=await academyCredentialState(env,user.sub); const results=[];
  for(const def of ACADEMY_AWARDS){const eligibility=academyEligibility(def,state);const result=await issueAcademyCredential(env,user,def,eligibility);results.push({definition:def,eligibility,...result});if(result.issued)state=await academyCredentialState(env,user.sub);}
  return results;
}

async function v2ActiveCredential(env, uid, pathwayId, level) {
  return env.DB.prepare(`
    SELECT * FROM credentials
    WHERE uid=? AND pathway_id=? AND credential_level=? AND status='active'
    ORDER BY issued_at DESC LIMIT 1
  `).bind(uid, pathwayId, level).first();
}

async function v2AnyCredential(env, uid, pathwayId, level) {
  return env.DB.prepare(`
    SELECT * FROM credentials
    WHERE uid=? AND pathway_id=? AND credential_level=?
    ORDER BY issued_at DESC LIMIT 1
  `).bind(uid, pathwayId, level).first();
}

async function v2CredentialDefinition(env, pathwayId, level) {
  return env.DB.prepare(`
    SELECT * FROM credential_definitions
    WHERE pathway_id=? AND credential_level=? AND standard_version=? AND status='active'
    LIMIT 1
  `).bind(pathwayId, level, V2_STANDARD_VERSION).first();
}

async function v2BestAssessmentAttempt(env, uid, pathwayId, assessmentKey, assignmentId = null) {
  const scope = assignmentId || 'public';
  return env.DB.prepare(`
    SELECT * FROM v2_assessment_attempts
    WHERE uid=? AND pathway_id=? AND assessment_key=?
      AND COALESCE(assignment_id,'public')=?
    ORDER BY passed DESC, score DESC, submitted_at DESC
    LIMIT 1
  `).bind(uid, pathwayId, assessmentKey, scope).first();
}

async function v2BestRoleLabRun(env, uid, pathwayId, labKey, assignmentId = null) {
  const scope = assignmentId || 'public';
  return env.DB.prepare(`
    SELECT * FROM role_lab_runs
    WHERE uid=? AND pathway_id=? AND lab_key=?
      AND COALESCE(assignment_id,'public')=? AND status='passed'
    ORDER BY score DESC, completed_at DESC LIMIT 1
  `).bind(uid, pathwayId, labKey, scope).first();
}

async function v2LatestReadiness(env, uid, pathwayId, assignmentId = null) {
  const scope = assignmentId || 'public';
  return env.DB.prepare(`
    SELECT * FROM readiness_snapshots
    WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=?
    ORDER BY created_at DESC LIMIT 1
  `).bind(uid, pathwayId, scope).first();
}

function v2CriticalFloorsMet(readiness) {
  if (!readiness) return false;
  const scores = v2ParseJson(readiness.competency_scores_json, {});
  const rows = Object.values(scores || {});
  return rows.length > 0 && !rows.some(x => x && x.critical === true && Number(x.score ?? -1) < Number(x.minimum || 0));
}

async function v2CredentialEligibility(env, { uid, pathwayId, level, assignmentId = null }) {
  const definition = await v2CredentialDefinition(env, pathwayId, level);
  if (!definition) return { eligible:false, reason:'Credential definition unavailable', definition:null, evidence:{} };
  const req = v2ParseJson(definition.requirements_json, {});
  const evidence = {};
  const missing = [];

  for (const prereq of (req.requires_credentials || [])) {
    const c = await v2ActiveCredential(env, uid, pathwayId, prereq);
    evidence[`credential:${prereq}`] = c ? { credentialId:c.credential_id, title:c.credential_title, issuedAt:c.issued_at } : null;
    if (!c) missing.push(`Active ${prereq.replace(/_/g,' ')} credential`);
  }

  if (req.requires_diagnostic) {
    const scope=assignmentId||'public';
    const d=await env.DB.prepare(`SELECT id,score,version,submitted_at FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY submitted_at ASC LIMIT 1`).bind(uid,pathwayId,scope).first();
    evidence.diagnostic=d?{id:d.id,score:Number(d.score),version:d.version,submittedAt:d.submitted_at}:null;
    if(!d) missing.push('Baseline diagnostic');
  }

  if (req.requires_assessment) {
    const a = await v2BestAssessmentAttempt(env, uid, pathwayId, req.requires_assessment.key, assignmentId);
    evidence.assessment = a ? { id:a.id, key:a.assessment_key, version:a.assessment_version, score:Number(a.score), passed:Number(a.passed)===1, submittedAt:a.submitted_at } : null;
    if (!a || Number(a.passed)!==1 || Number(a.score) < Number(req.requires_assessment.minimum || 0)) {
      missing.push(`${req.requires_assessment.key} at ${Number(req.requires_assessment.minimum || 0)}%+`);
    }
  }

  if (req.requires_role_lab) {
    const r = await v2BestRoleLabRun(env, uid, pathwayId, req.requires_role_lab.key, assignmentId);
    evidence.roleLab = r ? { id:r.id, key:r.lab_key, version:r.lab_version, score:Number(r.score||0), completedAt:r.completed_at } : null;
    if (!r || Number(r.score||0) < Number(req.requires_role_lab.minimum || 0)) {
      missing.push(`${req.requires_role_lab.key} at ${Number(req.requires_role_lab.minimum || 0)}%+`);
    }
  }

  if (req.requires_readiness) {
    const r = await v2LatestReadiness(env, uid, pathwayId, assignmentId);
    const coverage = Number(r?.evidence_coverage || 0);
    const floors = v2CriticalFloorsMet(r);
    evidence.readiness = r ? {
      id:r.id,
      overallScore:Number(r.overall_score),
      status:r.status,
      evidenceCoverage:Math.round(coverage*100),
      evidencePhase:r.evidence_phase,
      criticalFloorsMet:floors,
      baselineScore:r.baseline_score==null?null:Number(r.baseline_score),
      improvement:r.improvement==null?null:Number(r.improvement),
      createdAt:r.created_at
    } : null;
    if (!r || Number(r.overall_score) < Number(req.requires_readiness.minimum || 0)) missing.push(`Readiness score ${Number(req.requires_readiness.minimum || 0)}%+`);
    if (!r || coverage + 1e-9 < Number(req.requires_readiness.evidence_coverage || 0)) missing.push(`${Math.round(Number(req.requires_readiness.evidence_coverage || 0)*100)}% professional evidence coverage`);
    if (req.requires_readiness.critical_floors && !floors) missing.push('All critical competency floors');
  }

  return { eligible:missing.length===0, missing, definition, requirements:req, evidence };
}

function v2CredentialEvidenceSummary(eligibility) {
  const e = eligibility.evidence || {};
  return {
    standardVersion: V2_STANDARD_VERSION,
    requirementsMet: eligibility.eligible,
    evidence: e,
    generatedAt: new Date().toISOString()
  };
}

async function v2IssueCredential(env, { user, pathway, level, orgId = null, assignmentId = null }) {
  if (!V2_LEVEL_CODES[level]) throw new HttpError(400,'Unsupported V2 credential level');
  const active = await v2ActiveCredential(env,user.sub,pathway.id,level);
  if (active) return { issued:false, credential:active, existing:true };
  const previous = await v2AnyCredential(env,user.sub,pathway.id,level);
  if (previous) return { issued:false, credential:previous, existing:true, blockedByPriorStatus:previous.status };

  const eligibility = await v2CredentialEligibility(env,{uid:user.sub,pathwayId:pathway.id,level,assignmentId});
  if (!eligibility.eligible) return { issued:false, eligible:false, missing:eligibility.missing, eligibility };

  const definition = eligibility.definition;
  const year = new Date().getUTCFullYear();
  const random = crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase();
  const credentialId = `CM-${pathway.code}-${V2_LEVEL_CODES[level]}-${year}-${random}`;
  const publicToken = randomToken(24);
  const holderName = holderNameFromUser(user);
  const evidenceSummary = v2CredentialEvidenceSummary(eligibility);
  const eventId = crypto.randomUUID();
  const statements = [
    env.DB.prepare(`
      INSERT INTO credentials
      (credential_id,public_token,uid,holder_name,pathway_id,credential_level,credential_title,status,standard_version,credential_definition_id,org_id,assignment_id,evidence_summary_json)
      VALUES (?,?,?,?,?,?,?,'active',?,?,?,?,?)
    `).bind(credentialId,publicToken,user.sub,holderName,pathway.id,level,definition.title,V2_STANDARD_VERSION,definition.id,orgId,assignmentId,JSON.stringify(evidenceSummary)),
    env.DB.prepare(`INSERT INTO credential_events (id,credential_id,event_type,actor_uid,details) VALUES (?,?, 'issued', ?, ?)`)
      .bind(eventId,credentialId,user.sub,JSON.stringify({criteriaVersion:V2_STANDARD_VERSION,automatic:true,definitionId:definition.id,assignmentId:assignmentId||null,orgId:orgId||null}))
  ];

  statements.push(env.DB.prepare(`INSERT INTO credential_evidence_items (id,credential_id,evidence_type,evidence_ref,title,evidence_json) VALUES (?,?,?,?,?,?)`)
    .bind(crypto.randomUUID(),credentialId,'curriculum',definition.id,`Capital Mastery Standard ${V2_STANDARD_VERSION}`,JSON.stringify({definitionId:definition.id,requirements:v2ParseJson(definition.requirements_json,{})})));

  for (const [key,value] of Object.entries(eligibility.evidence || {})) {
    if (!value) continue;
    let type='credential', ref=value.credentialId || null, title=key.replace(/^credential:/,'').replace(/_/g,' ');
    if (key==='diagnostic') { type='assessment'; ref=value.id; title='Baseline diagnostic'; }
    if (key==='assessment') { type='assessment'; ref=value.id; title=`Assessment · ${value.key}`; }
    if (key==='roleLab') { type='role_lab'; ref=value.id; title=`Role Lab · ${value.key}`; }
    if (key==='readiness') { type='readiness'; ref=value.id; title='Readiness snapshot'; }
    statements.push(env.DB.prepare(`INSERT INTO credential_evidence_items (id,credential_id,evidence_type,evidence_ref,title,evidence_json) VALUES (?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),credentialId,type,ref,title,JSON.stringify(value)));
  }

  if (eligibility.evidence?.readiness) {
    const scope = assignmentId || 'public';
    const skills = await env.DB.prepare(`
      SELECT cs.competency_id,cs.score,cs.evidence_count,c.name,c.category,pc.weight,pc.minimum_score,pc.critical
      FROM competency_scores cs JOIN competencies c ON c.id=cs.competency_id
      JOIN pathway_competencies pc ON pc.pathway_id=cs.pathway_id AND pc.competency_id=cs.competency_id
      WHERE cs.uid=? AND cs.assignment_scope=? AND cs.pathway_id=?
      ORDER BY pc.weight DESC,c.name
    `).bind(user.sub,scope,pathway.id).all();
    statements.push(env.DB.prepare(`INSERT INTO credential_evidence_items (id,credential_id,evidence_type,evidence_ref,title,evidence_json) VALUES (?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),credentialId,'competency_profile',eligibility.evidence.readiness.id,'Competency profile',JSON.stringify({competencies:skills.results||[]})));
  }

  await env.DB.batch(statements);
  return { issued:true, eligible:true, credential:{credentialId,publicToken,title:definition.title,level,status:'active',standardVersion:V2_STANDARD_VERSION}, eligibility };
}

async function v2RefreshCredentials(env, { user, pathway, orgId = null, assignmentId = null }) {
  const out=[];
  for (const level of ['essentials','role_lab','professional_readiness']) {
    out.push({level,...await v2IssueCredential(env,{user,pathway,level,orgId,assignmentId})});
  }
  return out;
}

async function v2AssessmentAccess(env, user, assessment, assignmentId) {
  let orgId=null, cohortId=null, curriculumVersion=V2_STANDARD_VERSION, assignment=null;
  if (assignmentId) {
    assignment=await v2RequireAssignmentAccess(env,user.sub,assignmentId,assessment.pathway_id);
    if (assignment.accessRole==='learner' && !['published','completed'].includes(assignment.status)) throw new HttpError(403,'Assignment is not active');
    orgId=assignment.org_id; cohortId=assignment.cohort_id; curriculumVersion=assignment.curriculum_version||V2_STANDARD_VERSION;
  }
  if (assessment.stage==='essentials') {
    const foundations=await v2ActiveCredential(env,user.sub,assessment.pathway_id,'foundations');
    if (!foundations) throw new HttpError(409,'Earn the Foundations Certificate before the Essentials mini case');
    if (assignment && assignment.track==='professional') {
      const baseline=await env.DB.prepare(`SELECT id FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND assignment_id=? ORDER BY submitted_at ASC LIMIT 1`).bind(user.sub,assessment.pathway_id,assignmentId).first();
      if(!baseline) throw new HttpError(409,'Complete the assigned baseline diagnostic before the Essentials mini case');
    }
  }
  if (assessment.stage==='final') {
    const scope=assignmentId||'public';
    const baseline=await env.DB.prepare(`SELECT id FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? ORDER BY submitted_at ASC LIMIT 1`).bind(user.sub,assessment.pathway_id,scope).first();
    if(!baseline) throw new HttpError(409,'Complete the baseline diagnostic before the Professional Readiness Final');
    for (const level of ['foundations','essentials','applied','role_lab']) {
      if (!await v2ActiveCredential(env,user.sub,assessment.pathway_id,level)) throw new HttpError(409,`Earn the ${level.replace(/_/g,' ')} credential before the Professional Readiness Final`);
    }
  }
  return {orgId,cohortId,curriculumVersion};
}

function v2PublicAssessmentQuestion(row) {
  const options=v2ParseJson(row.options_json,[]); const type=row.question_type||(options.length?'mc':'numeric');
  return {id:row.id,position:Number(row.position),competencyId:row.competency_id,type,prompt:row.prompt,options,weight:Number(row.weight||1),tolerance:Number(row.tolerance||0),unit:row.unit||''};
}

async function v2GradeAssessment(env, { user, assessment, answers, assignmentId = null, orgId = null, cohortId = null, curriculumVersion = V2_STANDARD_VERSION, dynamicQuestions = null }) {
  const qres=dynamicQuestions?{results:dynamicQuestions}:await env.DB.prepare(`SELECT * FROM v2_assessment_questions WHERE assessment_key=? AND assessment_version=? AND status='active' ORDER BY position`).bind(assessment.assessment_key,assessment.version).all();
  const qs=qres.results||[];
  if (!qs.length) throw new HttpError(404,'Assessment questions unavailable');
  let earned=0,totalWeight=0,correct=0;
  const byComp={};
  const details=[];
  for(const q of qs){
    const weight=Math.max(1,Number(q.weight||1)); totalWeight+=weight;
    const submitted=answers?.[q.id]; const options=v2ParseJson(q.options_json,[]); const qType=q.question_type||(options.length?'mc':'numeric');
    const ok=qType==='numeric' ? (Number.isFinite(Number(submitted)) && Math.abs(Number(submitted)-Number(q.correct_answer))<=Number(q.tolerance||0)) : String(submitted??'')===String(q.correct_answer);
    if(ok){earned+=weight;correct++;}
    (byComp[q.competency_id] ||= []).push({score:ok?100:0,weight});
    details.push({id:q.id,correct:ok,rationale:q.rationale});
  }
  const score=totalWeight?Math.round((earned/totalWeight)*100):0;
  const passed=score>=Number(assessment.pass_score);
  const attemptId=`v2a_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
  const compScores={};
  for(const [cid,vals] of Object.entries(byComp)){
    const w=vals.reduce((s,x)=>s+x.weight,0); compScores[cid]=Math.round(vals.reduce((s,x)=>s+x.score*x.weight,0)/w);
  }
  await env.DB.prepare(`INSERT INTO v2_assessment_attempts (id,uid,org_id,cohort_id,assignment_id,pathway_id,assessment_key,assessment_version,score,passed,answers_json,result_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(attemptId,user.sub,orgId,cohortId,assignmentId,assessment.pathway_id,assessment.assessment_key,assessment.version,score,passed?1:0,JSON.stringify(answers||{}),JSON.stringify({correct,total:qs.length,competencyScores:compScores})).run();

  let readiness=null;
  if(passed){
    const sourceType=assessment.stage==='final'?'final':'assessment';
    const scope=assignmentId||'public';
    const statements=[];
    for(const [competencyId,cScore] of Object.entries(compScores)){
      const stableId=`evi_${(await sha256Hex(`${sourceType}|${user.sub}|${scope}|${assessment.assessment_key}|${assessment.version}|${competencyId}`)).slice(0,28)}`;
      statements.push(env.DB.prepare(`
        INSERT INTO competency_evidence (id,uid,org_id,assignment_id,pathway_id,competency_id,source_type,source_id,score,weight,evidence_json)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
          source_id=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.source_id ELSE competency_evidence.source_id END,
          score=MAX(competency_evidence.score, excluded.score),
          weight=excluded.weight,
          evidence_json=CASE WHEN excluded.score >= competency_evidence.score THEN excluded.evidence_json ELSE competency_evidence.evidence_json END
      `).bind(stableId,user.sub,orgId,assignmentId,assessment.pathway_id,competencyId,sourceType,attemptId,cScore,assessment.stage==='final'?1.25:0.75,JSON.stringify({assessmentKey:assessment.assessment_key,version:assessment.version,stage:assessment.stage})));
    }
    if(statements.length) await env.DB.batch(statements);
    for(const competencyId of Object.keys(compScores)) await v2RecomputeCompetency(env,{uid:user.sub,orgId,assignmentId,pathwayId:assessment.pathway_id,competencyId});
    readiness=await v2CreateReadinessSnapshot(env,{uid:user.sub,orgId,cohortId,assignmentId,pathwayId:assessment.pathway_id,curriculumVersion});
  }
  return {attemptId,score,passed,correct,total:qs.length,competencyScores:compScores,details,readiness};
}

async function v2EnforceDiagnosticRate(env, uid, pathwayId, assignmentId = null) {
  const scope=assignmentId||'public';
  const row=await env.DB.prepare(`SELECT COUNT(*) AS n FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? AND submitted_at>=datetime('now','-10 minutes')`).bind(uid,pathwayId,scope).first();
  if(Number(row?.n||0)>=10) throw new HttpError(429,'Too many recent diagnostic attempts. Please wait before trying again.');
}

async function v2EnforceAssessmentRate(env, uid, pathwayId, assessmentKey, assignmentId = null) {
  const scope=assignmentId||'public';
  const row=await env.DB.prepare(`SELECT COUNT(*) AS n FROM v2_assessment_attempts WHERE uid=? AND pathway_id=? AND assessment_key=? AND COALESCE(assignment_id,'public')=? AND submitted_at>=datetime('now','-10 minutes')`).bind(uid,pathwayId,assessmentKey,scope).first();
  if(Number(row?.n||0)>=10) throw new HttpError(429,'Too many recent assessment attempts. Please wait before trying again.');
}

