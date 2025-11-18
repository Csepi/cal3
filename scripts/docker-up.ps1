param(
    [ValidateSet("local", "portainer")]
    [string]$Profile = "local",
    [switch]$Build,
    [switch]$Detached
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$composeFile = Join-Path $repoRoot "docker" "compose.yaml"

if (-not (Test-Path $composeFile)) {
    Write-Error "Could not find compose file at $composeFile"
}

$argsList = @("compose", "-f", $composeFile, "--profile", $Profile, "up")
if ($Build) { $argsList += "--build" }
if ($Detached) { $argsList += "-d" }

Push-Location $repoRoot
try {
    Write-Host "Running: docker $($argsList -join ' ')" -ForegroundColor Cyan
    docker @argsList
}
finally {
    Pop-Location
}
