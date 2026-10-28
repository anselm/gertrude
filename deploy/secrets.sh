#!/usr/bin/env bash
# Write /etc/gertrude.env on the VM from the local .env (ANTHROPIC_API_KEY, ATTEST_URL, ADMIN_HANDLE, NTFY_*). Usage: deploy/secrets.sh [vm]
set -euo pipefail
VM="${1:-${VM:-gertrude}}"; HOST="$VM.exe.xyz"; DEST="exedev@$HOST"; ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH="ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ServerAliveInterval=5"
grep -qE '^ANTHROPIC_API_KEY=.+' "$ROOT/.env" || { echo "no ANTHROPIC_API_KEY in .env"; exit 1; }
TOPIC="$(grep -E '^NTFY_TOPIC=' "$ROOT/.env" | cut -d= -f2- || true)"; [ -n "$TOPIC" ] || TOPIC="$(cat ~/.config/ntfy/topic 2>/dev/null || true)"
{ grep -E '^(ANTHROPIC_API_KEY|ATTEST_URL|PUBLIC_ORIGIN|ADMIN_HANDLE|ADMIN_DID|TALKER_MODEL|THINKER_MODEL|NTFY_SERVER|NTFY_TOKEN)=' "$ROOT/.env"; [ -n "$TOPIC" ] && echo "NTFY_TOPIC=$TOPIC"; } | $SSH "$DEST" 'cat > /etc/gertrude.env && chmod 600 /etc/gertrude.env && wc -l < /etc/gertrude.env'
echo "✓ secrets on $HOST (/etc/gertrude.env)"
