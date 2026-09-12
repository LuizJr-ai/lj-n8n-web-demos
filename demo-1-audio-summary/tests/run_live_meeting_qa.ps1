param(
  [Parameter(Mandatory = $true)]
  [string]$AudioPath
)

$ErrorActionPreference = "Stop"
$demoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $demoRoot "ui\.env.local"
$resolvedAudio = (Resolve-Path -LiteralPath $AudioPath).Path

# Lê somente o endpoint necessário e nunca imprime seu valor.
$endpointLine = [System.IO.File]::ReadLines($envPath) |
  Where-Object { $_ -like "VITE_DEMO1_TRANSCRIBE_URL=*" } |
  Select-Object -First 1

if (-not $endpointLine) {
  throw "Endpoint da Demo 1 ausente no ambiente local."
}

$endpoint = $endpointLine.Substring($endpointLine.IndexOf("=") + 1).Trim()
if ($endpoint -notmatch "^https://") {
  throw "Endpoint da Demo 1 deve usar HTTPS."
}

try {
  $rawResponse = & curl.exe --silent --show-error --fail-with-body --max-time 180 `
    -F "file=@$resolvedAudio;type=audio/wav" `
    -F "mode=reuniao" `
    $endpoint

  if ($LASTEXITCODE -ne 0) {
    throw "curl retornou código $LASTEXITCODE"
  }
  $response = $rawResponse | ConvertFrom-Json
}
catch {
  throw "QA ao vivo falhou sem expor o endpoint."
}

# Expõe apenas o contrato funcional necessário para avaliação semântica.
[pscustomobject]@{
  id = $response.id
  transcricao = $response.transcricao
  resumo = $response.resumo
  decisoes = $response.decisoes
  acoes = $response.acoes
  insight = $response.insight
} | ConvertTo-Json -Depth 8
