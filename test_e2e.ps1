$BASE = "http://localhost:8080"
$CT   = @{ "Content-Type" = "application/json" }

function Hdr($tok) { @{ "Authorization" = "Bearer $tok" } }
function step($m)  { Write-Host ""; Write-Host "=== $m ===" -ForegroundColor Cyan }
function pass($l,$v){ Write-Host "  PASS ${l}: $v" -ForegroundColor Green }
function chk($l,$g,$w) {
    if ($g -eq $w) { pass $l $g }
    else { Write-Host "  FAIL ${l}: got=$g want=$w" -ForegroundColor Red; exit 1 }
}

# 1. Login
step "1. Login"
$r = Invoke-RestMethod -Uri "$BASE/api/v1/auth/login" -Method POST -Headers $CT `
     -Body '{"email":"you@example.com","password":"devpass123"}'
$tok = $r.accessToken
pass "token" ($tok.Substring(0,40) + "...")

# 2. Use seeded service
step "2. Using seeded service"
$svcId = "00000000-0000-0000-0000-000000000010"
pass "serviceId" $svcId

# 3. Create incident
step "3. Create incident SEV2"
$body = (@{ serviceId=$svcId; title="E2E Test Incident"; severity="SEV2" } | ConvertTo-Json)
$c = Invoke-RestMethod -Uri "$BASE/api/v1/incidents" -Method POST -Headers (Hdr $tok) -ContentType "application/json" -Body $body
$id = $c.id
pass "incidentId" $id

# 4. GET
step "4. GET incident"
$inc = Invoke-RestMethod -Uri "$BASE/api/v1/incidents/$id" -Headers (Hdr $tok)
chk "status"   $inc.status   "OPEN"
chk "severity" $inc.severity "SEV2"

# 5. Ack
step "5. POST ack"
$resp = Invoke-WebRequest -Uri "$BASE/api/v1/incidents/$id/ack" -Method POST -Headers (Hdr $tok) -UseBasicParsing
chk "HTTP" $resp.StatusCode 204

# 6. GET after ack
step "6. GET after ack"
$inc = Invoke-RestMethod -Uri "$BASE/api/v1/incidents/$id" -Headers (Hdr $tok)
chk "status"   $inc.status   "MITIGATING"
chk "severity" $inc.severity "SEV2"

# 7. Severity
step "7. POST severity SEV1"
$resp = Invoke-WebRequest -Uri "$BASE/api/v1/incidents/$id/severity" -Method POST `
    -Headers (Hdr $tok) -ContentType "application/json" -Body '{"severity":"SEV1"}' -UseBasicParsing
chk "HTTP" $resp.StatusCode 204

# 8. GET after severity
step "8. GET after severity"
$inc = Invoke-RestMethod -Uri "$BASE/api/v1/incidents/$id" -Headers (Hdr $tok)
chk "status"   $inc.status   "MITIGATING"
chk "severity" $inc.severity "SEV1"

# 9. Resolve
step "9. POST resolve"
$resp = Invoke-WebRequest -Uri "$BASE/api/v1/incidents/$id/resolve" -Method POST -Headers (Hdr $tok) -UseBasicParsing
chk "HTTP" $resp.StatusCode 204

# 10. GET after resolve
step "10. GET after resolve"
$inc = Invoke-RestMethod -Uri "$BASE/api/v1/incidents/$id" -Headers (Hdr $tok)
chk "status"   $inc.status   "RESOLVED"
chk "severity" $inc.severity "SEV1"

# 11. Timeline in DB
step "11. Timeline events in DB (wait 2s)"
Start-Sleep 2
$sql1 = "SELECT type, message FROM incident_timeline_events WHERE incident_id='" + $id + "' ORDER BY created_at;"
docker exec opsflow-postgres-1 psql -U opsflow -d opsflow -c $sql1

# 12. Outbox
step "12. Outbox events - all processed?"
$sql2 = "SELECT event_type, processed_at IS NOT NULL AS done FROM outbox_events WHERE aggregate_id='" + $id + "' ORDER BY created_at;"
docker exec opsflow-postgres-1 psql -U opsflow -d opsflow -c $sql2

Write-Host ""
Write-Host "=== ALL DONE ===" -ForegroundColor Green
