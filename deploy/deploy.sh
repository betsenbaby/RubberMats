#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# rubbermats.ch — FTP deployment script (lftp)
# Usage: bash deploy/deploy.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration (edit or set as env vars) ──────────────────
FTP_HOST="${FTP_HOST:-sl71.web.hostpoint.ch}"
FTP_USER="${FTP_USER:-ftp@rubbermats.ch}"
FTP_PASS="${FTP_PASS:-}"  # pass via env var, never hardcode
REMOTE_DIR="${REMOTE_DIR:-/}"

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── Excludes ─────────────────────────────────────────────────
EXCLUDES=(
  "litho-template/"
  "node_modules/"
  ".git/"
  ".vs/"
  ".claude/"
  "deploy/"
  "*.md"
  "_generate-*.js"
  "index-old-homepage.html"
  "mail-config.local.php"
  "assets/php/mail-config.local.php"
)

EXCLUDE_ARGS=""
for ex in "${EXCLUDES[@]}"; do
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude $ex"
done

# ── Summary ──────────────────────────────────────────────────
echo "╔══════════════════════════════════════════╗"
echo "║  rubbermats.ch — FTP Deployment          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Source:  $PROJECT_ROOT"
echo "Target:  $FTP_HOST:$REMOTE_DIR"
echo "User:    $FTP_USER"
echo ""

# Count files to upload (excluding the excludes)
FILE_COUNT=$(find "$PROJECT_ROOT" -type f \
  ! -path "*/litho-template/*" \
  ! -path "*/.git/*" \
  ! -path "*/.vs/*" \
  ! -path "*/.claude/*" \
  ! -path "*/node_modules/*" \
  ! -path "*/deploy/*" \
  ! -name "*.md" \
  ! -name "_generate-*.js" \
  ! -name "index-old-homepage.html" \
  ! -name "mail-config.local.php" \
  | wc -l)

SIZE=$(find "$PROJECT_ROOT" -type f \
  ! -path "*/litho-template/*" \
  ! -path "*/.git/*" \
  ! -path "*/.vs/*" \
  ! -path "*/.claude/*" \
  ! -path "*/node_modules/*" \
  ! -path "*/deploy/*" \
  ! -name "*.md" \
  ! -name "_generate-*.js" \
  ! -name "index-old-homepage.html" \
  ! -name "mail-config.local.php" \
  -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1)

echo "Files to upload: ~$FILE_COUNT"
echo "Estimated size:  ~$SIZE"
echo ""

read -rp "Proceed with upload? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# ── Upload via lftp ──────────────────────────────────────────
echo ""
echo "Uploading via lftp..."

lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:ssl-allow yes
set ssl:verify-certificate no
set mirror:parallel-transfer-count 5
mirror --reverse --verbose --delete \
  $EXCLUDE_ARGS \
  "$PROJECT_ROOT" "$REMOTE_DIR"
bye
EOF

echo ""
echo "Deployment complete."
echo "Visit: https://rubbermats.ch"
