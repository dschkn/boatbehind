# boatbehind

Personal website for **boatbehind.online** by Dmitrii Shchukin.

## Files

- `index.html` — page markup
- `styles.css` — visual style
- `dino.png` — homepage illustration
- `README.md` — project notes

## Current design

A dark grey full-screen page with small yellow Courier New text, the site title, a personal website label, a welcome message, and a green dinosaur illustration.

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
