# boatbehind

Minimal homepage for **boatbehind.online** by Dmitrii Shchukin.

## Files

- `index.html` — page markup
- `styles.css` — visual style

## Current design

A dark grey full-screen page with a small yellow monospace block in the upper-left corner. It shows the domain name, the word `homepage`, and the author credit `dmitrii shchukin`.

## Manual deployment target

The live files are served from the VPS directory:

```text
/var/www/boatbehind/
```

Caddy serves that directory for `boatbehind.online` and provides HTTPS.

Until CI/CD is added, update the live copy manually on the VPS:

```bash
cd /var/www/boatbehind
git pull --ff-only origin main
```
