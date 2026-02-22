param(
  [Parameter(Mandatory = $true)]
  [string]$ApiBase
)

$configPath = Join-Path $PSScriptRoot 'app-config.js'
if (-not (Test-Path $configPath)) {
  throw "File app-config.js tidak ditemukan di $PSScriptRoot"
}

$normalized = $ApiBase.TrimEnd('/')
if ($normalized -notmatch '/api$') {
  $normalized = "$normalized/api"
}

$content = @"
(function () {
  // URL backend online
  window.AIOS_API_BASE = '$normalized';
})();
"@

Set-Content -Path $configPath -Value $content -Encoding UTF8
Write-Host "Berhasil update app-config.js => $normalized"
