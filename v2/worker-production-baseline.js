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
  "fp&a": "fp-and-a"
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

      if (origin && origin !== env.ALLOWED_ORIGIN) {
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
            assessmentVersion: "1.0"
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
            WHERE public_token = ?
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
    const bank =
      stageQuestions(pathway, 5);

    return {
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
    options: q.options
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

    if (
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

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin":
      env.ALLOWED_ORIGIN,

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