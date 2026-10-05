# Builds the web app and starts the API, which serves the app too (one port: this PC and Tailscale Funnel alike),
# then opens the default browser. Desktop shortcut: "Hunt App" (powershell -ExecutionPolicy Bypass -File start.ps1).
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$url = 'http://localhost:8787'

function Test-Port($port) {
  $c = New-Object Net.Sockets.TcpClient
  try { $c.Connect('localhost', $port); $true } catch { $false } finally { $c.Close() }
}

if ((Get-Service postgresql-x64-18).Status -ne 'Running') { Start-Service postgresql-x64-18 }

Write-Host 'Building web app...' -ForegroundColor Cyan
Push-Location "$root\web"
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; Read-Host 'Build failed. Press Enter to close'; exit 1 }
Pop-Location

if (Test-Port 8787) { Write-Host 'Hunt App already running on 8787 (serving the new build).' }
else { Start-Process cmd -ArgumentList '/k', 'title Hunt API && npm start' -WorkingDirectory "$root\api" -WindowStyle Minimized }

Write-Host 'Waiting for the server...' -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds(60)
while (-not (Test-Port 8787)) {
  if ((Get-Date) -gt $deadline) { Read-Host 'Server did not start. Check the Hunt API window. Press Enter to close'; exit 1 }
  Start-Sleep -Milliseconds 500
}
Start-Process $url
Write-Host "Hunt App is running at $url (and on your Tailscale Funnel address). Close the Hunt API window to stop it." -ForegroundColor Green
Start-Sleep 3
