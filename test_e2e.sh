#!/usr/bin/env bash
set -e
BASE="http://localhost:8080"
TD="$USERPROFILE/AppData/Local/Temp/opsflow_e2e"
mkdir -p "$TD"

step() { echo ""; echo "=== $* ==="; }
get_field() { node -e "const d=JSON.parse(require('fs').readFileSync('$1','utf8')); console.log(d.$2)"; }

# --- 1. Login ---
step "1. Login"
curl -sf -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"devpass123"}' -o "$TD/login.json"
TOKEN=$(get_field "$TD/login.json" accessToken)
echo "token: ${TOKEN:0:40}..."

# --- 2. List services ---
step "2. List services"
curl -sf "$BASE/api/v1/services" \
  -H "Authorization: Bearer $TOKEN" -o "$TD/svcs.json"
SVC_ID=$(node -e "const a=JSON.parse(require('fs').readFileSync('$TD/svcs.json','utf8')); console.log(a[0].id)")
echo "serviceId: $SVC_ID"

# --- 3. Create incident ---
step "3. Create incident (SEV2)"
curl -sf -X POST "$BASE/api/v1/incidents" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"serviceId\":\"$SVC_ID\",\"title\":\"E2E Test Incident\",\"severity\":\"SEV2\"}" \
  -o "$TD/create.json"
INC_ID=$(get_field "$TD/create.json" id)
echo "incidentId: $INC_ID"

# --- 4. GET incident ---
step "4. GET incident — expect OPEN / SEV2"
curl -sf "$BASE/api/v1/incidents/$INC_ID" \
  -H "Authorization: Bearer $TOKEN" -o "$TD/inc.json"
node -e "const o=JSON.parse(require('fs').readFileSync('$TD/inc.json','utf8')); console.log('status:',o.status,' severity:',o.severity)"

# --- 5. Acknowledge ---
step "5. POST ack — expect 204"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$BASE/api/v1/incidents/$INC_ID/ack" \
  -H "Authorization: Bearer $TOKEN")
echo "HTTP $HTTP"

# --- 6. GET after ack ---
step "6. GET after ack — expect MITIGATING"
curl -sf "$BASE/api/v1/incidents/$INC_ID" \
  -H "Authorization: Bearer $TOKEN" -o "$TD/inc.json"
node -e "const o=JSON.parse(require('fs').readFileSync('$TD/inc.json','utf8')); console.log('status:',o.status,' severity:',o.severity)"

# --- 7. Change severity ---
step "7. POST severity SEV1 — expect 204"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$BASE/api/v1/incidents/$INC_ID/severity" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"severity":"SEV1"}')
echo "HTTP $HTTP"

# --- 8. GET after severity ---
step "8. GET after severity — expect MITIGATING / SEV1"
curl -sf "$BASE/api/v1/incidents/$INC_ID" \
  -H "Authorization: Bearer $TOKEN" -o "$TD/inc.json"
node -e "const o=JSON.parse(require('fs').readFileSync('$TD/inc.json','utf8')); console.log('status:',o.status,' severity:',o.severity)"

# --- 9. Resolve ---
step "9. POST resolve — expect 204"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$BASE/api/v1/incidents/$INC_ID/resolve" \
  -H "Authorization: Bearer $TOKEN")
echo "HTTP $HTTP"

# --- 10. GET after resolve ---
step "10. GET after resolve — expect RESOLVED / SEV1"
curl -sf "$BASE/api/v1/incidents/$INC_ID" \
  -H "Authorization: Bearer $TOKEN" -o "$TD/inc.json"
node -e "const o=JSON.parse(require('fs').readFileSync('$TD/inc.json','utf8')); console.log('status:',o.status,' severity:',o.severity)"

# --- 11. Timeline events in DB ---
step "11. Timeline events in DB"
sleep 2
docker exec opsflow-postgres-1 psql -U opsflow -d opsflow -c \
  "SELECT type, message FROM incident_timeline_events WHERE incident_id='$INC_ID' ORDER BY created_at;"

# --- 12. Outbox processed ---
step "12. Outbox events — all processed?"
docker exec opsflow-postgres-1 psql -U opsflow -d opsflow -c \
  "SELECT event_type, processed_at IS NOT NULL AS done FROM outbox_events WHERE aggregate_id='$INC_ID' ORDER BY created_at;"

echo ""
echo "=== ALL DONE ==="
