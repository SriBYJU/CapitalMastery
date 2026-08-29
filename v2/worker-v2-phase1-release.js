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
        return json({ ok: true, organizations: memberships.results || [] }, 200, env);
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
        if (!(rows.results || []).length) throw new HttpError(404, "Diagnostic not available yet");
        return json({ ok:true, pathway:{id:pathway.id,title:pathway.title}, version:'2.0', credentialWeight:0, questions:(rows.results||[]).map(v2PublicDiagnosticQuestion), note:'The diagnostic measures your starting point and does not count against credential eligibility.' },200,env);
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
        const qs=qRes.results||[]; if(!qs.length) throw new HttpError(404,'Diagnostic not available yet');
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
        return json({ok:true,labs:(rows.results||[]).map(r=>({labKey:r.lab_key,version:r.version,pathwayId:r.pathway_id,title:r.title,roleTitle:r.role_title,clientName:r.client_name,scenario:v2ParseJson(r.scenario_json,{}),passScore:Number(r.pass_score)}))},200,env);
      }

      if (request.method === "POST" && parts[0] === "enterprise" && parts[1] === "role-labs" && parts[3] === "start" && parts.length === 4) {
        const user=await requireUser(request,env); const labKey=cleanId(parts[2]); const body=await readJson(request);
        const lab=await env.DB.prepare(`SELECT * FROM role_lab_definitions WHERE lab_key=? AND status='active' ORDER BY version DESC LIMIT 1`).bind(labKey).first(); if(!lab) throw new HttpError(404,'Role Lab not found');
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
        const lab=await env.DB.prepare(`SELECT * FROM role_lab_definitions WHERE lab_key=? AND version=?`).bind(run.lab_key,run.lab_version).first(); const state=await v2RunState(env,run);
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
      // CAPITAL MASTERY V2 — ASSESSMENTS + CREDENTIAL EVIDENCE
      // ==================================================

      if (request.method === 'GET' && parts[0] === 'enterprise' && parts[1] === 'assessments' && parts.length === 3) {
        const user=await requireUser(request,env);
        const key=cleanId(parts[2]);
        const assessment=await env.DB.prepare(`SELECT * FROM v2_assessment_definitions WHERE assessment_key=? AND status='active' ORDER BY version DESC LIMIT 1`).bind(key).first();
        if(!assessment) throw new HttpError(404,'Assessment not available');
        const assignmentId=url.searchParams.get('assignmentId')?cleanId(url.searchParams.get('assignmentId')):null;
        await v2AssessmentAccess(env,user,assessment,assignmentId);
        const qres=await env.DB.prepare(`SELECT * FROM v2_assessment_questions WHERE assessment_key=? AND assessment_version=? AND status='active' ORDER BY position`).bind(assessment.assessment_key,assessment.version).all();
        return json({ok:true,assessment:{key:assessment.assessment_key,version:assessment.version,pathwayId:assessment.pathway_id,stage:assessment.stage,title:assessment.title,description:assessment.description,scenario:v2ParseJson(assessment.scenario_json,{}),passScore:Number(assessment.pass_score)},questions:(qres.results||[]).map(v2PublicAssessmentQuestion)},200,env);
      }

      if (request.method === 'POST' && parts[0] === 'enterprise' && parts[1] === 'assessments' && parts[3] === 'submit' && parts.length === 4) {
        const user=await requireUser(request,env);
        const key=cleanId(parts[2]);
        const assessment=await env.DB.prepare(`SELECT * FROM v2_assessment_definitions WHERE assessment_key=? AND status='active' ORDER BY version DESC LIMIT 1`).bind(key).first();
        if(!assessment) throw new HttpError(404,'Assessment not available');
        const body=await readJson(request);
        const assignmentId=body.assignmentId?cleanId(body.assignmentId):null;
        await v2EnforceAssessmentRate(env,user.sub,assessment.pathway_id,assessment.assessment_key,assignmentId);
        const access=await v2AssessmentAccess(env,user,assessment,assignmentId);
        const answers=body.answers&&typeof body.answers==='object'&&!Array.isArray(body.answers)?body.answers:{};
        const result=await v2GradeAssessment(env,{user,assessment,answers,assignmentId,orgId:access.orgId,cohortId:access.cohortId,curriculumVersion:access.curriculumVersion});
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
        const credential=await env.DB.prepare(`SELECT credential_id,public_token,holder_name,pathway_id,credential_level,credential_title,status,issued_at,revoked_at,standard_version,credential_definition_id,evidence_summary_json FROM credentials WHERE public_token=? LIMIT 1`).bind(publicToken).first();
        if(!credential) return json({ok:false,valid:false,error:'Credential not found'},404,env);
        const definition=credential.credential_definition_id?await env.DB.prepare(`SELECT description,requirements_json,track,learner_level FROM credential_definitions WHERE id=? LIMIT 1`).bind(credential.credential_definition_id).first():null;
        const items=await env.DB.prepare(`SELECT evidence_type,title,evidence_json FROM credential_evidence_items WHERE credential_id=? AND evidence_type IN ('assessment','role_lab','readiness','competency_profile','curriculum') ORDER BY created_at,id`).bind(credential.credential_id).all();
        const publicEvidence=(items.results||[]).map(x=>{
          const data=v2ParseJson(x.evidence_json,{});
          if(x.evidence_type==='competency_profile') return {type:x.evidence_type,title:x.title,competencies:(data.competencies||[]).map(c=>({name:c.name,category:c.category,score:Number(c.score),minimumScore:Number(c.minimum_score||0),critical:Number(c.critical)===1,evidenceCount:Number(c.evidence_count||0)}))};
          if(x.evidence_type==='readiness') return {type:x.evidence_type,title:x.title,overallScore:data.overallScore,status:data.status,evidenceCoverage:data.evidenceCoverage,criticalFloorsMet:data.criticalFloorsMet,improvement:data.improvement};
          if(x.evidence_type==='assessment') return {type:x.evidence_type,title:x.title,key:data.key,version:data.version,score:data.score,passed:data.passed,submittedAt:data.submittedAt};
          if(x.evidence_type==='role_lab') return {type:x.evidence_type,title:x.title,key:data.key,version:data.version,score:data.score,completedAt:data.completedAt};
          return {type:x.evidence_type,title:x.title,standardVersion:credential.standard_version};
        });
        return json({ok:true,valid:credential.status==='active',credential:{credentialId:credential.credential_id,holderName:credential.holder_name,pathwayId:credential.pathway_id,level:credential.credential_level,title:credential.credential_title,status:credential.status,issuedAt:credential.issued_at,revokedAt:credential.revoked_at||null,standardVersion:credential.standard_version||'1.0-legacy',description:definition?.description||null,track:definition?.track||'legacy',learnerLevel:definition?.learner_level||'legacy'},evidence:publicEvidence},200,env);
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
            const final=await env.DB.prepare(`SELECT score,passed,submitted_at FROM v2_assessment_attempts WHERE uid=? AND assignment_id=? AND assessment_key='ib-professional-final' ORDER BY score DESC,submitted_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const readinessCredential=await env.DB.prepare(`SELECT credential_id,status,issued_at FROM credentials WHERE uid=? AND assignment_id=? AND credential_level='professional_readiness' ORDER BY issued_at DESC LIMIT 1`).bind(l.uid,a.id).first();
            const due=a.due_at?Date.parse(a.due_at):null;
            const complete=!!(readinessCredential&&readinessCredential.status==='active');
            learnerRows.push({uid:l.uid,name:l.holder_name||null,email:l.email||null,diagnostic:diagnostic?{score:Number(diagnostic.score),submittedAt:diagnostic.submitted_at}:null,readiness:readiness?{overallScore:Number(readiness.overall_score),status:readiness.status,baselineScore:readiness.baseline_score==null?null:Number(readiness.baseline_score),improvement:readiness.improvement==null?null:Number(readiness.improvement),evidenceCoverage:Math.round(Number(readiness.evidence_coverage||0)*100),evidencePhase:readiness.evidence_phase,competencies:v2ParseJson(readiness.competency_scores_json,{})}:null,roleLab:lab?{id:lab.id,status:lab.status,score:lab.score==null?null:Number(lab.score),revisions:Number(lab.revision_count||0),completedAt:lab.completed_at}:null,final:final?{score:Number(final.score),passed:Number(final.passed)===1,submittedAt:final.submitted_at}:null,credential:readinessCredential?{credentialId:readinessCredential.credential_id,status:readinessCredential.status,issuedAt:readinessCredential.issued_at}:null,complete,overdue:!!(due&&due<Date.now()&&!complete)});
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
        const finalAssessment=await env.DB.prepare(`SELECT assessment_key,assessment_version,score,passed,submitted_at FROM v2_assessment_attempts WHERE uid=? AND pathway_id=? AND COALESCE(assignment_id,'public')=? AND assessment_key='ib-professional-final' ORDER BY score DESC,submitted_at DESC LIMIT 1`).bind(user.sub,pathway.id,skillsScope).first();
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
  const tasks = tasksRes.results || [];
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
  if (assessment.assessment_key==='ib-essentials-case') {
    const foundations=await v2ActiveCredential(env,user.sub,assessment.pathway_id,'foundations');
    if (!foundations) throw new HttpError(409,'Earn the Foundations Certificate before the Essentials mini case');
    if (assignment && assignment.track==='professional') {
      const baseline=await env.DB.prepare(`SELECT id FROM diagnostic_attempts WHERE uid=? AND pathway_id=? AND assignment_id=? ORDER BY submitted_at ASC LIMIT 1`).bind(user.sub,assessment.pathway_id,assignmentId).first();
      if(!baseline) throw new HttpError(409,'Complete the assigned baseline diagnostic before the Essentials mini case');
    }
  }
  if (assessment.assessment_key==='ib-professional-final') {
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
  return {id:row.id,position:Number(row.position),competencyId:row.competency_id,prompt:row.prompt,options:v2ParseJson(row.options_json,[]),weight:Number(row.weight||1)};
}

async function v2GradeAssessment(env, { user, assessment, answers, assignmentId = null, orgId = null, cohortId = null, curriculumVersion = V2_STANDARD_VERSION }) {
  const qres=await env.DB.prepare(`SELECT * FROM v2_assessment_questions WHERE assessment_key=? AND assessment_version=? AND status='active' ORDER BY position`).bind(assessment.assessment_key,assessment.version).all();
  const qs=qres.results||[];
  if (!qs.length) throw new HttpError(404,'Assessment questions unavailable');
  let earned=0,totalWeight=0,correct=0;
  const byComp={};
  const details=[];
  for(const q of qs){
    const weight=Math.max(1,Number(q.weight||1)); totalWeight+=weight;
    const submitted=String(answers?.[q.id]??''); const ok=submitted===String(q.correct_answer);
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

