#!/usr/bin/env bash
# Provision the gertrude VM: Node 22, rsync, /srv/gertrude, one systemd unit on :8070. Secrets in /etc/gertrude.env (deploy/secrets.sh).
# Usage: deploy/provision.sh [vm]
set -euo pipefail
VM="${1:-${VM:-gertrude}}"; HOST="$VM.exe.xyz"; DEST="exedev@$HOST"
SSH="ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ServerAliveInterval=5 -o ServerAliveCountMax=3"
echo "› node 22 + rsync"
$SSH "$DEST" 'node -e "process.exit(+process.versions.node.split(\".\")[0] >= 22 ? 0 : 1)" 2>/dev/null || { curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - >/dev/null && sudo apt-get install -y -q nodejs >/dev/null; }; sudo apt-get install -y -q rsync >/dev/null; node --version'
echo "› dirs"
$SSH "$DEST" 'sudo mkdir -p /srv/gertrude/data && sudo chown -R exedev:exedev /srv'
echo "› systemd unit"
$SSH "$DEST" "sudo tee /etc/systemd/system/gertrude.service >/dev/null" <<UNIT
[Unit]
Description=gertrude — socket.io server, talker, thinker, static build
After=network-online.target

[Service]
User=exedev
WorkingDirectory=/srv/gertrude
EnvironmentFile=/etc/gertrude.env
Environment=PORT=8070
Environment=HOST=0.0.0.0
Environment=GERTRUDE_DB=/srv/gertrude/data/gertrude.db
ExecStart=/usr/bin/node /srv/gertrude/server/index.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
$SSH "$DEST" 'sudo touch /etc/gertrude.env && sudo chown exedev:exedev /etc/gertrude.env && sudo chmod 600 /etc/gertrude.env && sudo systemctl daemon-reload && sudo systemctl enable gertrude >/dev/null 2>&1'
echo "✓ provisioned $HOST. Next: deploy/secrets.sh, deploy/deploy.sh, then: ssh exe.dev share port $VM 8070 && ssh exe.dev share set-public $VM"
