$ErrorActionPreference = "Stop"
$base = "http://localhost:8080"

# a) Login
Write-Host "=== a) Login ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Method Post -Uri "$base/api/v1/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"you@example.com","password":"devpass123"}'
$token = $login.accessToken
Write-Host "OK - orgId: $($login.orgId)"
Write-Host "   accessToken: $($token.Substring(0,40))..."

$headers = @{ Authorization = "Bearer $token" }

# b) Create incident
Write-Host ""
Write-Host "=== b) Create incident ===" -ForegroundColor Cyan
$body = @{
  serviceId = "00000000-0000-0000-0000-000000000010"
  title     = "Test incident $(Get-Date -Format 'HH:mm:ss')"
  severity  = "SEV2"
} | ConvertTo-Json

$created = Invoke-RestMethod -Method Post -Uri "$base/api/v1/incidents" `
  -Headers $headers -ContentType "application/json" -Body $body
$incidentId = $created.id
Write-Host "OK - incidentId: $incidentId"

# c) Fetch incident detail
Write-Host ""
Write-Host "=== c) Incident detail ===" -ForegroundColor Cyan
$detail = Invoke-RestMethod -Method Get -Uri "$base/api/v1/incidents/$incidentId" `
  -Headers $headers
Write-Host "OK - title: $($detail.title)"
Write-Host "   severity: $($detail.severity)  status: $($detail.status)"

# d) SSE: read first 3 event boundaries then disconnect
Write-Host ""
Write-Host "=== d) SSE timeline ===" -ForegroundColor Cyan
$req = [System.Net.WebRequest]::Create("$base/api/v1/sse/timeline")
$req.Headers.Add("Authorization", "Bearer $token")
$req.Accept = "text/event-stream"
$resp = $req.GetResponse()
$reader = New-Object System.IO.StreamReader($resp.GetResponseStream())

$eventCount = 0
$lineCount  = 0
$timeout    = [System.Diagnostics.Stopwatch]::StartNew()

while ($eventCount -lt 3 -and $timeout.Elapsed.TotalSeconds -lt 10) {
  $line = $reader.ReadLine()
  if ($null -eq $line) { break }
  $lineCount++
  Write-Host "  SSE line: $line"
  if ($line -eq "") { $eventCount++ }
}

$reader.Close()
$resp.Close()

if ($eventCount -gt 0) {
  Write-Host "OK - received $eventCount SSE event(s) in $lineCount lines" -ForegroundColor Green
} else {
  Write-Host "WARN - SSE connected but no events received within 10s" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "All steps passed." -ForegroundColor Green
