# Fly.io Migration

In order to add a new fly.io app, in addition to populating all the secrets (we need to figure out a way to do it declaratively for transparency), we also need to go into platform Django admin to add them to `Applications` in order to enable successful OAuth 2.0 authentication.

# TODO:
- Change SENTRY_URL to the Fly.io sentry project URL
- Redis not reachable because it doesn't exist or work LOL
- Redirect URI `?next` needs to be added`
  - This actually doesn't need to be changed if we use the same domain for both
- Destroy this fly app and rename as `penn-clubs-backend`
- Support HTTPS traffic and migrate cert manager
- FIx my `/etc/hosts` hack