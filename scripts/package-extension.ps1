$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$extensionDirectory = Join-Path $projectRoot 'Way Tools'
$manifestPath = Join-Path $extensionDirectory 'manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$releaseDirectory = Join-Path $projectRoot 'release'
$packagePath = Join-Path $releaseDirectory ("way-tools-v{0}.zip" -f $manifest.version)

New-Item -ItemType Directory -Force -Path $releaseDirectory | Out-Null

if (Test-Path -LiteralPath $packagePath) {
    Remove-Item -LiteralPath $packagePath -Force
}

Compress-Archive -Path (Join-Path $extensionDirectory '*') -DestinationPath $packagePath -CompressionLevel Optimal
Write-Output $packagePath
