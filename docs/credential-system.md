# Capital Mastery Credential System

Capital Mastery separates **verified Standard 2.0 credentials** from **program-completion certificates**. This distinction is intentional: a shorter preparation program can recognize completion without creating an extra credential level or weakening the advanced Professional Readiness standard.

## Standard 2.0 verified career ladder

Each of the 16 finance career pathways has exactly five verified Standard 2.0 credential definitions:

1. **Foundations Credential**
2. **Essentials Credential**
3. **Applied Skills Credential**
4. **Role Lab Credential**
5. **Professional Readiness Credential**

That produces **80 verified career credential definitions** across 16 careers.

Capital Mastery also has **8 Academy credential definitions** in the cross-career Academy layer. Therefore the current Standard 2.0 + Academy architecture contains **88 official verified credential definitions**.

The Career Skills Program Completion Certificate described below is a program-completion document and is **not** a 89th verified credential definition or a sixth career credential level.

## Career Skills Program

Career Skills is the shorter practical preparation program.

A learner progresses through:

1. Foundations
2. Essentials
3. Applied Skills
4. the role-specific Career Skills practical capstone

The learner can earn three verified Standard 2.0 credentials during that program:

- Foundations
- Essentials
- Applied Skills

After the required practical capstone is completed to the applicable mastery standard, the learner can receive a **Career Skills Program Completion Certificate**.

That completion certificate recognizes completion of the shorter program. It does not represent a sixth Standard 2.0 credential level and does not substitute for Role Lab or Professional Readiness evidence.

## Professional Readiness Program

Professional Readiness is the advanced, full job-readiness pathway.

It uses the complete five-level Standard 2.0 career ladder:

1. Foundations
2. Essentials
3. Applied Skills
4. Role Lab
5. Professional Readiness

The advanced pathway also includes the required baseline diagnostic, deeper professional work, Role Lab review/revision behavior, Professional Readiness Final, evidence coverage, and required competency floors defined by the applicable credential version.

The first three verified credentials carry forward from Career Skills. A learner who upgrades should not repeat already earned shared stages merely because the selected program changed.

## Evidence and issuance principles

Official credentials are determined server-side from authoritative Capital Mastery records. Browser-only state cannot create a verified credential.

Depending on the credential level, the evidence model can include:

- required learning/prerequisite completion;
- secure assessment results meeting the mastery threshold;
- applied-work evidence;
- competency evidence;
- Role Lab work products and revisions;
- Professional Readiness Final results;
- evidence-coverage requirements; and
- critical competency floors.

A baseline diagnostic measures starting readiness and does not count as a credential score.

## Career Skills completion record compatibility

Capital Mastery historically used the internal/legacy `career` credential level for Career Certificate records. Those existing records remain supported and publicly verifiable.

For current two-program product semantics, the authoritative `career` record is treated as the **Career Skills Program Completion Certificate** rather than being inserted into the five-level Standard 2.0 credential ladder.

This preserves backward compatibility without inflating the verified credential count.

## Credential record fields

Authoritative credential records can include:

- credential ID;
- recipient display name;
- career / pathway;
- credential level;
- credential title;
- issue timestamp;
- curriculum / criteria version;
- status such as active, reissued, or revoked;
- assignment / organization evidence scope where applicable;
- demonstrated competency/evidence information where applicable;
- Professional Readiness Final and Role Lab evidence where applicable; and
- privacy-safe public verification token.

Program-completion records are labeled separately in current product surfaces even where legacy storage compatibility uses the historical `career` level.

## Public verification

Public verification must describe exactly what was earned. It may verify:

- Foundations Credential;
- Essentials Credential;
- Applied Skills Credential;
- Career Skills Program Completion Certificate;
- Role Lab Credential; and
- Professional Readiness Credential.

The verification experience must make clear that the Career Skills completion certificate is not a sixth Standard 2.0 credential and does not equal Professional Readiness.

Public verification is designed not to expose Firebase UIDs, account email addresses, secure assessment answers, answer keys, scoring tolerances, hidden grading rules, private employer data, or private manager notes.

## Sharing

Supported learner credential/completion surfaces can provide:

- certificate view;
- print/save PDF;
- PNG export where supported;
- LinkedIn credential-field helpers;
- LinkedIn post helpers;
- copy credential ID; and
- copy public verification link.

Capital Mastery uses **Capital Mastery** as the issuing organization name for its own verified records and completion certificates.

## Legacy compatibility

Previously issued legacy Foundations, Applied Skills, and Career Certificates remain valid under their original criteria/version and remain distinguishable from current Standard 2.0 credentials.

A legacy or Career Skills completion record must never be used to satisfy a requirement that explicitly calls for the Standard 2.0 Role Lab or Professional Readiness credential.
