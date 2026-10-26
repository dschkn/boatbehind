# Muse

Muse is Dmitrii Shchukin's private spatial notebook and an experimental part of
`boatbehind.online`. It lives at <https://boatbehind.online/muse/>.

## Structure

- `index.html` — the browser application.
- `server/app.py` — the single-user JSON API backed by SQLite.
- `server/install.sh` — optional systemd installer for the VPS.

The production database and credentials are not stored in Git. They live on the
VPS, while deployment credentials are kept in GitHub Actions secrets.

## Development

Muse is maintained inside the `boatbehind` repository. Changes to the frontend
are deployed with the main website workflow. Changes under `muse/server/` also
run the Muse API deployment workflow.
