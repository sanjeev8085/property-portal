#!/usr/bin/env bash
# =============================================================================
# AuraHomes PostgreSQL Backup & Restore Script
# =============================================================================
# Usage:
#   ./backup_db.sh backup          - Create a timestamped PostgreSQL dump
#   ./backup_db.sh restore <file>  - Restore from a specific backup file
#   ./backup_db.sh list            - List all available backups
#   ./backup_db.sh prune           - Remove backups older than KEEP_DAYS
#
# Cron example (daily at 2 AM):
#   0 2 * * * /app/scripts/backup_db.sh backup >> /var/log/aurahomes_backup.log 2>&1
#
# Environment variables:
#   DATABASE_URL   - Full PostgreSQL connection string (required)
#   BACKUP_DIR     - Where to store backup files (default: /backups)
#   KEEP_DAYS      - How many days of backups to retain (default: 7)
# =============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/aurahomes_${TIMESTAMP}.sql.gz"

# Load .env if present
if [ -f "$(dirname "$0")/../../.env" ]; then
    set -a; source "$(dirname "$0")/../../.env"; set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "[ERROR] DATABASE_URL is not set."; exit 1
fi

DB_URL="${DATABASE_URL//postgresql+asyncpg:\/\//postgresql:\/\/}"
DB_URL="${DB_URL//postgres:\/\//postgresql:\/\/}"
DB_HOST=$(python3 -c "from urllib.parse import urlparse; u=urlparse('${DB_URL}'); print(u.hostname)")
DB_PORT=$(python3 -c "from urllib.parse import urlparse; u=urlparse('${DB_URL}'); print(u.port or 5432)")
DB_NAME=$(python3 -c "from urllib.parse import urlparse; u=urlparse('${DB_URL}'); print(u.path.lstrip('/'))")
DB_USER=$(python3 -c "from urllib.parse import urlparse; u=urlparse('${DB_URL}'); print(u.username)")
export PGPASSWORD=$(python3 -c "from urllib.parse import urlparse; u=urlparse('${DB_URL}'); print(u.password or '')")

cmd_backup() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..."
    mkdir -p "${BACKUP_DIR}"
    pg_dump --host="${DB_HOST}" --port="${DB_PORT}" --username="${DB_USER}" --dbname="${DB_NAME}" \
        --format=custom --no-password | gzip > "${BACKUP_FILE}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup complete: ${BACKUP_FILE} ($(du -sh ${BACKUP_FILE} | cut -f1))"
    cmd_prune
}

cmd_restore() {
    local f="${1:-}"; [ -z "$f" ] && echo "[ERROR] Provide backup file" && exit 1
    [ ! -f "$f" ] && echo "[ERROR] File not found: $f" && exit 1
    echo "[WARNING] This will overwrite ${DB_NAME} on ${DB_HOST}"
    read -rp "Type 'yes' to confirm: " c; [ "$c" != "yes" ] && echo "Cancelled." && exit 0
    gunzip -c "$f" | pg_restore --host="${DB_HOST}" --port="${DB_PORT}" --username="${DB_USER}" \
        --dbname="${DB_NAME}" --no-password --clean --if-exists
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restore complete."
}

cmd_list() {
    echo "Backups in ${BACKUP_DIR}:"; ls "${BACKUP_DIR}"/aurahomes_*.sql.gz 2>/dev/null || echo "  None."
}

cmd_prune() {
    find "${BACKUP_DIR}" -name "aurahomes_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete -print | sed 's/^/  Deleted: /'
}

case "${1:-}" in
    backup)  cmd_backup ;;
    restore) cmd_restore "${2:-}" ;;
    list)    cmd_list ;;
    prune)   cmd_prune ;;
    *) echo "Usage: $0 {backup|restore <file>|list|prune}"; exit 1 ;;
esac
