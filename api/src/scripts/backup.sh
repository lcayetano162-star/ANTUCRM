#!/bin/bash
# ============================================
# BACKUP AUTOMÁTICO - ANTU CRM Production
# ============================================

set -e

# Configuración
BACKUP_DIR="/var/backups/antucrm"
DB_NAME="${DB_NAME:-antucrm}"
DB_USER="${DB_USER:-antu_admin}"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/antucrm_backup_${DATE}.sql"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

# Función de logging
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Iniciando backup de base de datos..."

# Backup de PostgreSQL
if [ -n "$DATABASE_URL" ]; then
  # Usar DATABASE_URL (producción)
  pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
else
  # Usar variables individuales
  pg_dump -h "${DB_HOST:-localhost}" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"
fi

# Comprimir
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Calcular tamaño
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup completado: $BACKUP_FILE (Tamaño: $SIZE)"

# Verificar integridad
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  log "✓ Verificación de integridad exitosa"
else
  log "✗ Error de integridad en el backup"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Subir a S3 (si está configurado)
if [ -n "$AWS_S3_BUCKET" ]; then
  log "Subiendo a S3..."
  aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/"
  log "✓ Backup subido a S3"
fi

# Limpiar backups antiguos
log "Limpiando backups antiguos (> $RETENTION_DAYS días)..."
find "$BACKUP_DIR" -name "antucrm_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Notificar si hay webhook configurado
if [ -n "$BACKUP_WEBHOOK_URL" ]; then
  curl -X POST "$BACKUP_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"success\",\"file\":\"$(basename $BACKUP_FILE)\",\"size\":\"$SIZE\",\"date\":\"$DATE\"}" \
    || true
fi

log "Backup completado exitosamente"
