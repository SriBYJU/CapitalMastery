# Firebase Setup — Owner Step

This is the only major integration intentionally left until the Firebase project is created by the owner.

## Owner actions

1. Create a Firebase project named for Capital Mastery.
2. Add a Web App.
3. Enable Authentication providers:
   - Google
   - Email/Password
4. Create Cloud Firestore.
5. Add the production domain and GitHub Pages domain to authorized domains.
6. If using secure Cloud Functions for live credential issuance, upgrade/link billing as Firebase requires for function deployment.
7. Copy the standard Firebase Web App configuration values into the production config file/environment.
8. Create the designated admin user in Firebase Authentication and apply a server-controlled `admin: true` custom claim.

## Never commit

- Firebase service-account JSON
- private keys
- admin password
- refresh tokens
- any server secret

The standard public Firebase Web App config is not the same as a service-account secret, but production deployment should still use a clear config/environment strategy.

## Migration plan

Replace the local QA persistence adapter with Firestore reads/writes, keeping the same UI state model. Practice UX can remain client-side, but live credential eligibility must be independently checked by Cloud Functions before issuing a public record.

The current admin preview route must be replaced/gated by a verified Firebase custom claim before the site is considered production-authenticated.
