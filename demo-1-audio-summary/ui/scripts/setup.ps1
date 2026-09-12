$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsRoot = Join-Path $projectRoot ".tools"
$bunRoot = Join-Path $toolsRoot "bun-1.4.2"
$bunExe = Join-Path $bunRoot "bun-windows-x64\bun.exe"
$bunZip = Join-Path $toolsRoot "bun-windows-x64-1.4.2.zip"
$bunUrl = "https://github.com/oven-sh/bun/releases/download/bun-v1.4.2/bun-windows-x64.zip"
$expectedSha256 = "ce4c17497b2f29712a99d3d53f028de28cd42e3bacb8589599e7f000e49b6405"

New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null

if (-not (Test-Path -LiteralPath $bunExe)) {
  Invoke-WebRequest -Uri $bunUrl -OutFile $bunZip
  $actualSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $bunZip).Hash.ToLowerInvariant()
  if ($actualSha256 -ne $expectedSha256) {
    throw "Checksum do Bun inválido. Esperado: $expectedSha256; recebido: $actualSha256"
  }
  Expand-Archive -LiteralPath $bunZip -DestinationPath $bunRoot -Force
}

$previousLocation = Get-Location
try {
  Set-Location -LiteralPath $projectRoot
  $env:BUN_OPTIONS = $null
  & $bunExe install --frozen-lockfile --ignore-scripts
  if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependências: código $LASTEXITCODE" }
}
finally {
  Set-Location -LiteralPath $previousLocation
}

Write-Host "Ambiente local pronto: Bun 1.4.2 verificado e dependências travadas instaladas."
