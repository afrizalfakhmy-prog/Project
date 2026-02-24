$ErrorActionPreference = 'Stop'

$nodeExe = Join-Path $PSScriptRoot '.tools\node\node-v24.13.1-win-x64\node.exe'
if (-not (Test-Path $nodeExe)) {
  throw 'Node portable belum ditemukan. Jalankan setup-node-portable.ps1 terlebih dahulu.'
}

$serverScript = Join-Path $PSScriptRoot 'serve-frontend-noadmin.js'
if (-not (Test-Path $serverScript)) {
  throw 'File serve-frontend-noadmin.js tidak ditemukan.'
}

Write-Host 'Menjalankan frontend static server di http://localhost:5500 ...' -ForegroundColor Cyan
& $nodeExe $serverScript
