param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,

  [switch]$ConfirmTargetReset
)

$ErrorActionPreference = 'Stop'

if (-not $ConfirmTargetReset) {
  throw 'This restore resets objects in the target public schema. Re-run with -ConfirmTargetReset.'
}

$sourceUrl = $env:SOURCE_DATABASE_URL
$targetUrl = $env:TARGET_DATABASE_URL

if ([string]::IsNullOrWhiteSpace($sourceUrl) -or [string]::IsNullOrWhiteSpace($targetUrl)) {
  throw 'Set SOURCE_DATABASE_URL and TARGET_DATABASE_URL before running this script.'
}

if ($sourceUrl -eq $targetUrl) {
  throw 'Source and target database URLs must be different.'
}

foreach ($command in @('pg_dump', 'pg_restore')) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "$command is not installed or is not available in PATH."
  }
}

$backupParent = Split-Path -Parent $BackupPath
if ([string]::IsNullOrWhiteSpace($backupParent) -or -not (Test-Path -LiteralPath $backupParent)) {
  throw "Backup directory does not exist: $backupParent"
}

Write-Host 'Exporting the Supabase public schema...'
& pg_dump --format=custom --verbose --schema=public --file=$BackupPath --dbname=$sourceUrl
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed with exit code $LASTEXITCODE."
}

Write-Host 'Restoring into Neon...'
& pg_restore --verbose --clean --if-exists --no-owner --no-acl --exit-on-error --dbname=$targetUrl $BackupPath
if ($LASTEXITCODE -ne 0) {
  throw "pg_restore failed with exit code $LASTEXITCODE."
}

Write-Host 'Restore completed. Run npm run db:verify-migration --workspace server before cutover.'
