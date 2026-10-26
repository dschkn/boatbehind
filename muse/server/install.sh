#!/usr/bin/env bash
# Run on the VPS as the existing dschkn SSH deploy user.
set -euo pipefail
HOME_DIR="$HOME"
APP_DIR="$HOME_DIR/muse-api"
SECRETS="$HOME_DIR/.config/muse"
mkdir -p "$APP_DIR" "$SECRETS" "$HOME_DIR/.local/share/muse"
chmod 700 "$SECRETS"
test -s "$SECRETS/password" || { echo "Missing private password file"; exit 1; }
if [ ! -s "$SECRETS/session-secret" ]; then
  python3 -c 'import secrets;print(secrets.token_hex(48))' > "$SECRETS/session-secret"
fi
chmod 600 "$SECRETS/password" "$SECRETS/session-secret"
python3 -m py_compile "$APP_DIR/app.py"
if ! sudo -n true 2>/dev/null; then
  echo "ACTION_REQUIRED: account cannot use sudo without a password; manual server setup required."
  exit 2
fi
# Install a dedicated service without publishing private credentials.
sudo tee /etc/systemd/system/muse-api.service >/dev/null <<SERVICE
[Unit]
Description=Muse single-user SQLite API
After=network.target

[Service]
Type=simple
User=$(id -un)
WorkingDirectory=$APP_DIR
Environment=MUSE_HOST=127.0.0.1
Environment=MUSE_PORT=8765
Environment=MUSE_DB=$HOME_DIR/.local/share/muse/board.sqlite3
Environment=MUSE_PASSWORD_FILE=$SECRETS/password
Environment=MUSE_SESSION_SECRET_FILE=$SECRETS/session-secret
ExecStart=/usr/bin/python3 $APP_DIR/app.py
Restart=always
RestartSec=3
UMask=0077
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=$HOME_DIR/.local/share/muse
ProtectHome=false

[Install]
WantedBy=multi-user.target
SERVICE
sudo systemctl daemon-reload
sudo systemctl enable --now muse-api.service
sudo systemctl restart muse-api.service
# Restrict API to this machine; route from HTTPS Caddy only.
sudo python3 - <<'PY'
from pathlib import Path
import re, shutil, subprocess
p=Path('/etc/caddy/Caddyfile')
if not p.is_file():
    raise SystemExit('ACTION_REQUIRED: /etc/caddy/Caddyfile missing, configure reverse proxy manually')
config=p.read_text()
if 'handle /muse-api/*' not in config:
    m=re.search(r'(?m)^([^\n{}]*boatbehind\.online[^\n{}]*\{)[ \t]*$',config)
    if not m:
        raise SystemExit('ACTION_REQUIRED: boatbehind.online Caddy site block not recognized')
    replacement=m.group(1)+'\n    handle /muse-api/* {\n        reverse_proxy 127.0.0.1:8765\n    }'
    backup=p.with_name('Caddyfile.muse-backup')
    shutil.copy2(p,backup)
    changed=config[:m.start()]+replacement+config[m.end():]
    p.write_text(changed)
    result=subprocess.run(['caddy','validate','--config',str(p)],capture_output=True,text=True)
    if result.returncode:
        shutil.copy2(backup,p)
        raise SystemExit('Caddy validation failed, original Caddyfile restored: '+result.stderr[-700:])
    subprocess.run(['systemctl','reload','caddy'],check=True)
PY
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8765/muse-api/board)" = "401"
echo "Muse API backend installed; unauthenticated requests denied."
