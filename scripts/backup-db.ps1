# Backup Neon database to a .dump file (Docker Desktop must be running)
param([string]$OutDir = "D:\backups")

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$secure = Read-Host "Paste Neon connection string (direct, NO -pooler)" -AsSecureString
$url = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

if (-not $url.StartsWith("postgresql://")) { Write-Host "Invalid connection string."; exit 1 }
if ($url -match "-pooler") { Write-Host "This is a pooler string. Remove '-pooler' from the host name."; exit 1 }

$file = "smee-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".dump"
$env:DB_URL = $url
$env:BACKUP_FILE = $file

docker run --rm -e DB_URL -e BACKUP_FILE -v "${OutDir}:/backup" postgres:18-alpine sh -c 'pg_dump "$DB_URL" -Fc -f "/backup/$BACKUP_FILE"'
$exit = $LASTEXITCODE

Remove-Item Env:DB_URL
Remove-Item Env:BACKUP_FILE

$path = Join-Path $OutDir $file
if ($exit -ne 0 -or -not (Test-Path $path)) { Write-Host "BACKUP FAILED."; exit 1 }

$kb = [math]::Round((Get-Item $path).Length / 1KB)
Write-Host ("Done: " + $path + " (" + $kb + " KB)")