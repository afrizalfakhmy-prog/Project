$ErrorActionPreference = 'Stop'

$portableNodeScript = Join-Path $PSScriptRoot 'setup-node-portable.ps1'
if (-not (Test-Path $portableNodeScript)) {
  throw 'File setup-node-portable.ps1 tidak ditemukan.'
}

& $portableNodeScript

$backendPath = Join-Path $PSScriptRoot 'backend'
if (-not (Test-Path $backendPath)) {
  throw 'Folder backend tidak ditemukan.'
}

Set-Location $backendPath

if (-not (Test-Path (Join-Path $backendPath '.env'))) {
  if (Test-Path (Join-Path $backendPath '.env.example')) {
    Copy-Item (Join-Path $backendPath '.env.example') (Join-Path $backendPath '.env')
    Write-Host 'File .env dibuat dari .env.example. Silakan cek JWT_SECRET dan CLIENT_ORIGIN.' -ForegroundColor Yellow
  }
}

Write-Host 'Install dependency backend...' -ForegroundColor Cyan
npm install

Write-Host 'Menjalankan backend dev server...' -ForegroundColor Cyan
npm run dev
