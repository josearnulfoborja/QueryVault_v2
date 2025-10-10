<#
  deploy-iis.ps1
  Usage:
    PowerShell -ExecutionPolicy Bypass -File .\deploy-iis.ps1 -Destination "C:\inetpub\wwwroot\QueryVault" -StartNode

  This script copies the `workflowy-sql-app` folder to the target IIS site folder,
  ensures the `data` folder exists, grants modify permissions to the AppPool identity,
  runs the SQLite initialization script, and optionally starts node.

  For safety during local testing, pass -Destination pointing to a test folder.
#>

param(
  [string]$Source = (Join-Path (Get-Location) 'workflowy-sql-app'),
  [string]$Destination = 'C:\inetpub\wwwroot\QueryVault',
  [string]$AppPoolIdentity = 'IIS AppPool\DefaultAppPool',
  [switch]$StartNode,
  [switch]$DryRun
)

function Info($m) { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Err($m) { Write-Host "[ERROR] $m" -ForegroundColor Red }

Info "Source: $Source"
Info "Destination: $Destination"
Info "AppPoolIdentity: $AppPoolIdentity"
if ($DryRun) { Warn 'Running in DryRun mode — no files will be changed' }

if (!(Test-Path $Source)) {
  Err "Source path does not exist: $Source"
  exit 1
}

if ($DryRun) {
  Info "Would create destination folder: $Destination"
} else {
  if (!(Test-Path $Destination)) {
    Info "Creating destination folder: $Destination"
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  }
}

# Copy files (exclude node_modules to keep lightweight)
$exclude = @('node_modules','data','*.log')
function Copy-AppFiles($src, $dst) {
  Info "Copying files from $src to $dst (excluding node_modules, data)"
  $items = Get-ChildItem -Path $src -Force
  foreach ($it in $items) {
    if ($exclude -contains $it.Name) { continue }
    $target = Join-Path $dst $it.Name
    if ($DryRun) { Info "Would copy: $($it.FullName) -> $target"; continue }
    if ($it.PSIsContainer) {
      Copy-Item -Path $it.FullName -Destination $target -Recurse -Force -ErrorAction Stop
    } else {
      Copy-Item -Path $it.FullName -Destination $target -Force -ErrorAction Stop
    }
  }
}

Copy-AppFiles -src $Source -dst $Destination

# Ensure data directory exists inside destination
$dataDir = Join-Path $Destination 'data'
if ($DryRun) { Info "Would ensure data dir: $dataDir" } else {
  if (!(Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null; Info "Created data dir" }
}

# Set ACLs for AppPool identity (grant Modify). Use icacls for simplicity.
try {
  $icaclsCmd = "icacls `"$Destination`" /grant `"$AppPoolIdentity`":(OI)(CI)M /T"
  if ($DryRun) { Info "Would run: $icaclsCmd" } else {
    Info "Granting modify permissions to $AppPoolIdentity on $Destination"
    & icacls $Destination /grant "$AppPoolIdentity:(OI)(CI)M" /T | Out-Null
    Info "Permissions set (icacls exit code: $LASTEXITCODE)"
  }
} catch {
  Warn "Could not set ACLs: $($_.Exception.Message)"
}

# Run SQLite init script inside destination (if present)
$initScript = Join-Path $Destination 'backend\initSqlite.js'
if (Test-Path $initScript) {
  if ($DryRun) {
    Info "Would run Node init script: $initScript"
  } else {
    Info "Running DB init script: node $initScript"
    Push-Location $Destination
    try {
      # Use synchronous execution and show output
      $proc = Start-Process -FilePath node -ArgumentList $initScript -NoNewWindow -PassThru -Wait
      Info "Init script exit code: $($proc.ExitCode)"
    } catch {
      Warn "Failed to run init script: $($_.Exception.Message)"
    }
    Pop-Location
  }
} else {
  Warn "No init script found at $initScript — skipping DB init"
}

# Optionally start node process in background (simple start, not a Windows service)
if ($StartNode) {
  $serverFile = Join-Path $Destination 'server-iis.js'
  if (Test-Path $serverFile) {
    if ($DryRun) { Info "Would start node $serverFile" } else {
      Info "Starting Node server: node $serverFile"
      Start-Process -FilePath node -ArgumentList $serverFile -WorkingDirectory $Destination -WindowStyle Hidden
      Info "Node started (background). Check process list or logs to verify."
    }
  } else { Warn "Server file not found at $serverFile — cannot start Node" }
}

Info "Deployment finished. Review messages above for any warnings/errors."
