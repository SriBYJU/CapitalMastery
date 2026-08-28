# Firebase Functions Placeholder

The UI is complete without Firebase. Production functions are intentionally not deployed until the owner creates the Firebase project.

Planned callable/server functions:

- `setAdminClaim` — owner-only setup utility, never callable by ordinary clients
- `gradeAuthoritativeAssessment`
- `verifyCredentialEligibility`
- `issueCredential`
- `reissueCredential`
- `revokeCredential`

Do not implement live credential issuance using only browser JavaScript.
