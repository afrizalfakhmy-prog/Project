$ErrorActionPreference = 'Stop'

$toolsRoot = Join-Path $PSScriptRoot '.tools'
$nodeRoot = Join-Path $toolsRoot 'node'

if (-not (Test-Path $toolsRoot)) {
  New-Item -ItemType Directory -Path $toolsRoot | Out-Null
}
if (-not (Test-Path $nodeRoot)) {
  New-Item -ItemType Directory -Path $nodeRoot | Out-Null
}

Write-Host 'Mencari versi Node.js LTS terbaru...' -ForegroundColor Cyan
$index = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json'
$lts = $index | Where-Object { $_.lts -and $_.files -contains 'win-x64-zip' } | Select-Object -First 1

if (-not $lts) {
  throw 'Tidak menemukan build Node.js LTS win-x64-zip.'
}

$version = $lts.version
$zipName = "node-$($version)-win-x64.zip"
$zipUrl = "https://nodejs.org/dist/$version/$zipName"
$zipPath = Join-Path $nodeRoot $zipName
$extractPath = Join-Path $nodeRoot "node-$($version)-win-x64"

if (-not (Test-Path $extractPath)) {
  Write-Host "Download $zipUrl" -ForegroundColor Yellow
  Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

  Write-Host 'Extract ZIP Node.js portable...' -ForegroundColor Yellow
  Expand-Archive -Path $zipPath -DestinationPath $nodeRoot -Force
}

$env:Path = "$extractPath;$env:Path"

Write-Host ''
Write-Host 'Node.js portable siap dipakai untuk terminal ini.' -ForegroundColor Green
Write-Host "node: $(node -v)"
Write-Host "npm : $(npm -v)"
Write-Host ''
Write-Host 'Langkah berikutnya:' -ForegroundColor Cyan
Write-Host '1) cd backend'
Write-Host '2) npm install'
Write-Host '3) npm run dev'
Write-Host ''
Write-Host 'Catatan: jika buka terminal baru, jalankan script ini lagi.' -ForegroundColor DarkYellow
