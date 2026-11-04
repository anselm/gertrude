#!/usr/bin/env bash
# Install the voice worker as a second systemd unit beside the server (same env file, same checkout). Idempotent.
# Usage: deploy/voice-unit.sh [vm]
set -euo pipefail
VM="${1:-${VM:-gertrude}}"; HOST="$VM.exe.xyz"; DEST="exedev@$HOST"
SSH="ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ServerAliveInterval=5 -o ServerAliveCountMax=3"
$SSH "$DEST" "sudo tee /etc/systemd/system/gertrude-voice.service >/dev/null" <<UNIT
[Unit]
Description=gertrude voice — LiveKit agent worker (her telephone)
After=network-online.target gertrude.service

[Service]
User=exedev
WorkingDirectory=/srv/gertrude
EnvironmentFile=/etc/gertrude.env
Environment=GERTRUDE_DB=/srv/gertrude/data/gertrude.db
ExecStart=/usr/bin/node /srv/gertrude/server/voice.mjs start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
$SSH "$DEST" 'sudo systemctl daemon-reload && sudo systemctl enable gertrude-voice >/dev/null 2>&1 && sudo systemctl restart gertrude-voice && sleep 3 && systemctl is-active gertrude-voice && journalctl -u gertrude-voice -n 5 --no-pager -o cat | cut -c1-160'
echo "✓ gertrude-voice installed on $HOST"
