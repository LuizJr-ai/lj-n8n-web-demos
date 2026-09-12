$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$bunRoot = Join-Path $projectRoot ".tools\bun-1.4.2\bun-windows-x64"
$bunExe = Join-Path $bunRoot "bun.exe"
if (-not (Test-Path -LiteralPath $bunExe)) {
  throw "Bun local ausente. Execute .\scripts\setup.ps1 primeiro."
}

$env:BUN_OPTIONS = $null
$env:Path = "$bunRoot;$env:Path"
Set-Location -LiteralPath $projectRoot

& $bunExe run lint
if ($LASTEXITCODE -ne 0) { throw "Lint reprovado: código $LASTEXITCODE" }

& $bunExe run build
if ($LASTEXITCODE -ne 0) { throw "Build reprovado: código $LASTEXITCODE" }

Write-Host "QA estático aprovado: lint e build verdes."
