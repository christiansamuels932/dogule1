#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://127.0.0.1:5177}"
OUT="${OUT:-/home/ran/codex/dogule1/attachments/checks/2026-02-24}"
API_DIR="$OUT/api"
RESULTS="$OUT/local_check_results.tsv"
SUMMARY_JSON="$OUT/local_check_summary.json"
mkdir -p "$API_DIR"

echo -e "item_id\tresult\thttp_status\tdetail\tevidence" > "$RESULTS"

record_result() {
  local item_id="$1"
  local result="$2"
  local status="$3"
  local detail="$4"
  local evidence="$5"
  echo -e "${item_id}\t${result}\t${status}\t${detail}\t${evidence}" >> "$RESULTS"
}

request() {
  local name="$1"
  local method="$2"
  local path="$3"
  local token="${4:-}"
  local data="${5:-}"
  local headers_file="$API_DIR/${name}.headers"
  local body_file="$API_DIR/${name}.body"

  local -a cmd
  cmd=(curl -sS -D "$headers_file" -o "$body_file" -X "$method" "$BASE$path")
  if [[ -n "$token" ]]; then
    cmd+=(-H "Authorization: Bearer $token")
  fi
  if [[ -n "$data" ]]; then
    cmd+=(-H "Content-Type: application/json" --data "$data")
  fi
  "${cmd[@]}"
  awk 'NR==1 {print $2}' "$headers_file"
}

expect_status() {
  local item_id="$1"
  local expected="$2"
  local actual="$3"
  local detail="$4"
  local evidence="$5"
  if [[ "$actual" == "$expected" ]]; then
    record_result "$item_id" "PASS" "$actual" "$detail" "$evidence"
  else
    record_result "$item_id" "FAIL" "$actual" "expected=$expected; $detail" "$evidence"
  fi
}

expect_status_any() {
  local item_id="$1"
  local expected_csv="$2"
  local actual="$3"
  local detail="$4"
  local evidence="$5"
  local matched="0"
  IFS=',' read -r -a expected <<< "$expected_csv"
  for e in "${expected[@]}"; do
    if [[ "$actual" == "$e" ]]; then
      matched="1"
      break
    fi
  done
  if [[ "$matched" == "1" ]]; then
    record_result "$item_id" "PASS" "$actual" "$detail" "$evidence"
  else
    record_result "$item_id" "FAIL" "$actual" "expected_any=$expected_csv; $detail" "$evidence"
  fi
}

extract_token_from_body() {
  local file="$1"
  jq -r '.accessToken // empty' "$file"
}

json_contains_id() {
  local file="$1"
  local id="$2"
  jq -e --arg id "$id" 'if type=="array" then any(.[]; .id==$id) else (.id==$id) end' "$file" >/dev/null 2>&1
}

login_and_record() {
  local label="$1"
  local username="$2"
  local password="$3"
  local name="auth_login_${label}"
  local payload
  payload=$(jq -nc --arg u "$username" --arg p "$password" '{username:$u,password:$p}')
  local status
  status=$(request "$name" "POST" "/api/auth/login" "" "$payload")
  expect_status "AUTH-${label^^}-LOGIN" "200" "$status" "login for $username" "$name"
  extract_token_from_body "$API_DIR/${name}.body"
}

# C1 auth/session basics
status=$(request "c1_no_token_kunden" "GET" "/api/kunden")
expect_status "C1-001" "401" "$status" "GET /api/kunden without token" "c1_no_token_kunden"

status=$(request "c1_invalid_token_kunden" "GET" "/api/kunden" "invalid.token.value")
expect_status "C1-002" "401" "$status" "GET /api/kunden with invalid token" "c1_invalid_token_kunden"

# Auth options and roles
status=$(request "auth_options" "GET" "/api/auth/options")
expect_status "AUTH-OPTIONS" "200" "$status" "auth options available" "auth_options"
if jq -e '.users[] | select(.role=="trainer")' "$API_DIR/auth_options.body" >/dev/null 2>&1; then
  record_result "AUTH-TRAINER-ROLE" "PASS" "200" "trainer role present in auth options" "auth_options"
else
  record_result "AUTH-TRAINER-ROLE" "BLOCKED" "200" "no trainer role user available in auth options" "auth_options"
fi

# Logins
DEVELOPER_TOKEN=$(login_and_record "developer" "Developer" "deve6087")
ADMIN_TOKEN=$(login_and_record "admin" "info" "rifo6087")
RAPPORT_TOKEN=$(login_and_record "rapport" "patty.bruehwiler" "pabr003")

if [[ -z "$DEVELOPER_TOKEN" || -z "$ADMIN_TOKEN" || -z "$RAPPORT_TOKEN" ]]; then
  echo "Token acquisition failed" >&2
  exit 1
fi

# Fetch reference trainer
status=$(request "b_ref_trainers" "GET" "/api/trainer" "$ADMIN_TOKEN")
expect_status "B0-TRAINER-LIST" "200" "$status" "load trainer list" "b_ref_trainers"
TRAINER_ID=$(jq -r '.[0].id // empty' "$API_DIR/b_ref_trainers.body")
TRAINER_NAME=$(jq -r '.[0].name // ""' "$API_DIR/b_ref_trainers.body")
TRAINER_TITEL=$(jq -r '.[0].titel // ""' "$API_DIR/b_ref_trainers.body")
if [[ -z "$TRAINER_ID" ]]; then
  record_result "B0-TRAINER-REF" "FAIL" "$status" "no trainer available for chain scenario" "b_ref_trainers"
  exit 1
else
  record_result "B0-TRAINER-REF" "PASS" "$status" "trainer selected: $TRAINER_ID" "b_ref_trainers"
fi

TS="$(date +%s)"
TODAY="$(date +%F)"

# B1 create Kunde
payload=$(jq -nc --arg v "QA$TS" --arg n "CompleteCheck" --arg e "qa.$TS@example.invalid" '{vorname:$v,nachname:$n,status:"Aktiv",email:$e,ort:"QA-Ort",notizen:"complete-check"}')
status=$(request "b1_create_kunde" "POST" "/api/kunden" "$ADMIN_TOKEN" "$payload")
expect_status "B1-001" "201" "$status" "create kunde" "b1_create_kunde"
KUNDE_ID=$(jq -r '.id // empty' "$API_DIR/b1_create_kunde.body")

# B1 create Hund linked
payload=$(jq -nc --arg n "Hund$TS" --arg kid "$KUNDE_ID" '{name:$n,status:"Aktiv",kundenId:$kid,rasse:"Mischling"}')
status=$(request "b1_create_hund" "POST" "/api/hunde" "$ADMIN_TOKEN" "$payload")
expect_status "B1-002" "201" "$status" "create hund linked to kunde" "b1_create_hund"
HUND_ID=$(jq -r '.id // empty' "$API_DIR/b1_create_hund.body")
HUND_NAME=$(jq -r '.name // ""' "$API_DIR/b1_create_hund.body")

# B1 create Kurs
payload=$(jq -nc --arg code "QA-K-$TS" --arg title "QA Kurs $TS" --arg tid "$TRAINER_ID" '{code:$code,title:$title,trainerId:$tid,ort:"QA-Ort",status:"Aktiv",inhaltTheorie:"Theorie A",inhaltPraxis:"Praxis A",date:"2026-03-01",startTime:"10:00",endTime:"11:00"}')
status=$(request "b1_create_kurs" "POST" "/api/kurse" "$ADMIN_TOKEN" "$payload")
expect_status "B1-003" "201" "$status" "create kurs" "b1_create_kurs"
KURS_ID=$(jq -r '.id // empty' "$API_DIR/b1_create_kurs.body")
KURS_TITLE=$(jq -r '.title // ""' "$API_DIR/b1_create_kurs.body")
KURS_ORT=$(jq -r '.ort // ""' "$API_DIR/b1_create_kurs.body")

# B1 create Sub-Kurs
payload=$(jq -nc --arg tid "$TRAINER_ID" '{weekday:"Mo",time:"10:00",primaryTrainerId:$tid,trainerIds:[$tid]}')
status=$(request "b1_create_subkurs" "POST" "/api/kurse/$KURS_ID/subkurse" "$ADMIN_TOKEN" "$payload")
expect_status "B1-004" "201" "$status" "create sub-kurs" "b1_create_subkurs"
SUBKURS_ID=$(jq -r '.id // empty' "$API_DIR/b1_create_subkurs.body")
SUBKURS_NAME=$(jq -r '.name // ""' "$API_DIR/b1_create_subkurs.body")

# B1 add Teilnehmer with sub-kurs
payload=$(jq -nc --arg kid "$KUNDE_ID" --arg hid "$HUND_ID" --arg sk "$SUBKURS_ID" --arg hn "$HUND_NAME" '{kundeId:$kid,hundId:$hid,subKursId:$sk,kundeNachname:"CompleteCheck",kundeVorname:"QA",kundeOrt:"QA-Ort",hundName:$hn,startDatum:"2026-03-02"}')
status=$(request "b1_add_teilnehmer_subkurs" "POST" "/api/kurse/$KURS_ID/teilnehmer" "$ADMIN_TOKEN" "$payload")
expect_status "B1-005" "201" "$status" "add teilnehmer with sub-kurs" "b1_add_teilnehmer_subkurs"
TEIL_ID_1=$(jq -r '.id // empty' "$API_DIR/b1_add_teilnehmer_subkurs.body")

# B1 reflections
status=$(request "b1_list_teilnehmer_kurs" "GET" "/api/kurse/$KURS_ID/teilnehmer" "$ADMIN_TOKEN")
expect_status "B1-006" "200" "$status" "list teilnehmer by kurs" "b1_list_teilnehmer_kurs"
if json_contains_id "$API_DIR/b1_list_teilnehmer_kurs.body" "$TEIL_ID_1"; then
  record_result "B1-007" "PASS" "$status" "teilnehmer appears in kurs list" "b1_list_teilnehmer_kurs"
else
  record_result "B1-007" "FAIL" "$status" "teilnehmer missing in kurs list" "b1_list_teilnehmer_kurs"
fi

status=$(request "b1_list_teilnehmer_kunde" "GET" "/api/kurse/teilnehmer?kundeId=$KUNDE_ID" "$ADMIN_TOKEN")
expect_status "B1-008" "200" "$status" "list teilnehmer by kunde" "b1_list_teilnehmer_kunde"
if json_contains_id "$API_DIR/b1_list_teilnehmer_kunde.body" "$TEIL_ID_1"; then
  record_result "B1-009" "PASS" "$status" "teilnehmer appears in kunde list" "b1_list_teilnehmer_kunde"
else
  record_result "B1-009" "FAIL" "$status" "teilnehmer missing in kunde list" "b1_list_teilnehmer_kunde"
fi

status=$(request "b1_list_teilnehmer_hund" "GET" "/api/kurse/teilnehmer?hundId=$HUND_ID" "$ADMIN_TOKEN")
expect_status "B1-010" "200" "$status" "list teilnehmer by hund" "b1_list_teilnehmer_hund"
if json_contains_id "$API_DIR/b1_list_teilnehmer_hund.body" "$TEIL_ID_1"; then
  record_result "B1-011" "PASS" "$status" "teilnehmer appears in hund list" "b1_list_teilnehmer_hund"
else
  record_result "B1-011" "FAIL" "$status" "teilnehmer missing in hund list" "b1_list_teilnehmer_hund"
fi

status=$(request "b1_list_teilnehmer_subkurs" "GET" "/api/kurse/teilnehmer?subKursId=$SUBKURS_ID" "$ADMIN_TOKEN")
expect_status "B1-012" "200" "$status" "list teilnehmer by sub-kurs" "b1_list_teilnehmer_subkurs"
if json_contains_id "$API_DIR/b1_list_teilnehmer_subkurs.body" "$TEIL_ID_1"; then
  record_result "B1-013" "PASS" "$status" "teilnehmer appears in sub-kurs list" "b1_list_teilnehmer_subkurs"
else
  record_result "B1-013" "FAIL" "$status" "teilnehmer missing in sub-kurs list" "b1_list_teilnehmer_subkurs"
fi

# B2 direct assignment without sub-kurs
payload=$(jq -nc --arg kid "$KUNDE_ID" --arg hid "$HUND_ID" --arg hn "$HUND_NAME" '{kundeId:$kid,hundId:$hid,kundeNachname:"CompleteCheck",kundeVorname:"QA",kundeOrt:"QA-Ort",hundName:$hn,startDatum:"2026-03-03"}')
status=$(request "b2_add_teilnehmer_direct" "POST" "/api/kurse/$KURS_ID/teilnehmer" "$ADMIN_TOKEN" "$payload")
expect_status "B2-001" "201" "$status" "add teilnehmer direct kurs" "b2_add_teilnehmer_direct"
TEIL_ID_2=$(jq -r '.id // empty' "$API_DIR/b2_add_teilnehmer_direct.body")

status=$(request "b2_verify_direct" "GET" "/api/kurse/$KURS_ID/teilnehmer" "$ADMIN_TOKEN")
expect_status "B2-002" "200" "$status" "verify direct teilnehmer" "b2_verify_direct"
if jq -e --arg id "$TEIL_ID_2" 'any(.[]; .id==$id and ((.subKursId==null) or (.subKursId=="")))' "$API_DIR/b2_verify_direct.body" >/dev/null 2>&1; then
  record_result "B2-003" "PASS" "$status" "direct teilnehmer has empty subKursId" "b2_verify_direct"
else
  record_result "B2-003" "FAIL" "$status" "direct teilnehmer subKursId not empty" "b2_verify_direct"
fi

# B4 sub-kurs delete guard
status=$(request "b4_delete_subkurs_guard" "DELETE" "/api/kurse/$KURS_ID/subkurse/$SUBKURS_ID" "$ADMIN_TOKEN")
expect_status "B4-001" "409" "$status" "delete sub-kurs with linked teilnehmer is blocked" "b4_delete_subkurs_guard"

# B1 create zertifikat from participant chain
TRAINER_TITEL_SAFE="$TRAINER_TITEL"
if [[ -z "$TRAINER_TITEL_SAFE" ]]; then
  TRAINER_TITEL_SAFE="Trainer"
fi
payload=$(jq -nc \
  --arg kid "$KUNDE_ID" \
  --arg hid "$HUND_ID" \
  --arg kurs "$KURS_ID" \
  --arg kn "QA CompleteCheck" \
  --arg hn "$HUND_NAME" \
  --arg kt "$KURS_TITLE" \
  --arg ko "$KURS_ORT" \
  --arg d "$TODAY" \
  --arg t1 "$TRAINER_NAME" \
  --arg tt1 "$TRAINER_TITEL_SAFE" \
  '{
    kundeId:$kid,
    hundId:$hid,
    kursId:$kurs,
    kundeNameSnapshot:$kn,
    kundeGeschlechtSnapshot:"",
    hundNameSnapshot:$hn,
    hundRasseSnapshot:"Mischling",
    hundGeschlechtSnapshot:"",
    kursTitelSnapshot:$kt,
    kursDatumSnapshot:"2026-03-01",
    kursOrtSnapshot:$ko,
    kursInhaltTheorieSnapshot:"Theorie A",
    kursInhaltPraxisSnapshot:"Praxis A",
    ausstellungsdatum:$d,
    trainer1NameSnapshot:$t1,
    trainer1TitelSnapshot:$tt1,
    bemerkungen:""
  }')
status=$(request "b1_create_zertifikat" "POST" "/api/zertifikate" "$ADMIN_TOKEN" "$payload")
expect_status "B1-014" "201" "$status" "create zertifikat from participant chain" "b1_create_zertifikat"
ZERT_ID=$(jq -r '.id // empty' "$API_DIR/b1_create_zertifikat.body")

status=$(request "b1_list_zertifikate" "GET" "/api/zertifikate" "$ADMIN_TOKEN")
expect_status "B1-015" "200" "$status" "list zertifikate" "b1_list_zertifikate"
if json_contains_id "$API_DIR/b1_list_zertifikate.body" "$ZERT_ID"; then
  record_result "B1-016" "PASS" "$status" "zertifikat appears in list" "b1_list_zertifikate"
else
  record_result "B1-016" "FAIL" "$status" "zertifikat missing in list" "b1_list_zertifikate"
fi

# B3 delete kurs and verify historical snapshots remain via teilnehmer
status=$(request "b3_delete_kurs" "DELETE" "/api/kurse/$KURS_ID" "$ADMIN_TOKEN")
expect_status "B3-001" "200" "$status" "delete kurs with linked history" "b3_delete_kurs"

status=$(request "b3_get_deleted_kurs" "GET" "/api/kurse/$KURS_ID" "$ADMIN_TOKEN")
expect_status "B3-002" "404" "$status" "deleted kurs not loadable" "b3_get_deleted_kurs"

status=$(request "b3_kunde_history_after_delete" "GET" "/api/kurse/teilnehmer?kundeId=$KUNDE_ID" "$ADMIN_TOKEN")
expect_status "B3-003" "200" "$status" "historical teilnehmer entries still queryable" "b3_kunde_history_after_delete"
if jq -e 'length >= 2 and all(.[]; (.kursTitleSnapshot|length)>0)' "$API_DIR/b3_kunde_history_after_delete.body" >/dev/null 2>&1; then
  record_result "B3-004" "PASS" "$status" "snapshot fields retained after kurs deletion" "b3_kunde_history_after_delete"
else
  record_result "B3-004" "FAIL" "$status" "snapshot fields missing after kurs deletion" "b3_kunde_history_after_delete"
fi

# C2 API authz matrix
status=$(request "c2_dev_backups" "GET" "/api/developer/backups" "$DEVELOPER_TOKEN")
expect_status "C2-001" "200" "$status" "developer can read backups" "c2_dev_backups"
if jq -e '.slots["24h"] and .slots["72h"]' "$API_DIR/c2_dev_backups.body" >/dev/null 2>&1; then
  record_result "C2-002" "PASS" "$status" "backup slots 24h/72h present" "c2_dev_backups"
else
  record_result "C2-002" "FAIL" "$status" "backup slots missing in response" "c2_dev_backups"
fi

status=$(request "c2_admin_backups_denied" "GET" "/api/developer/backups" "$ADMIN_TOKEN")
expect_status "C2-003" "403" "$status" "admin denied developer route" "c2_admin_backups_denied"

status=$(request "c2_rapport_backups_denied" "GET" "/api/developer/backups" "$RAPPORT_TOKEN")
expect_status "C2-004" "403" "$status" "trainer_rapport denied developer route" "c2_rapport_backups_denied"

payload=$(jq -nc '{slot:"bad-slot"}')
status=$(request "c2_dev_restore_invalid_slot" "POST" "/api/developer/restore" "$DEVELOPER_TOKEN" "$payload")
expect_status "C2-005" "400" "$status" "developer restore validates slot" "c2_dev_restore_invalid_slot"

status=$(request "c2_rapport_get_kurse" "GET" "/api/kurse" "$RAPPORT_TOKEN")
expect_status "C2-006" "200" "$status" "trainer_rapport can read kurse" "c2_rapport_get_kurse"

payload=$(jq -nc --arg code "QA-DENY-$TS" --arg tid "$TRAINER_ID" '{code:$code,title:"Denied write",trainerId:$tid,ort:"QA-Ort"}')
status=$(request "c2_rapport_post_kurs_denied" "POST" "/api/kurse" "$RAPPORT_TOKEN" "$payload")
expect_status "C2-007" "403" "$status" "trainer_rapport cannot create kurs" "c2_rapport_post_kurs_denied"

payload=$(jq -nc --arg kid "$KUNDE_ID" --arg hid "$HUND_ID" '{kundeId:$kid,hundId:$hid,startDatum:"2026-03-05"}')
status=$(request "c2_rapport_post_teilnehmer_denied" "POST" "/api/kurse/$KURS_ID/teilnehmer" "$RAPPORT_TOKEN" "$payload")
expect_status "C2-008" "403" "$status" "trainer_rapport cannot add teilnehmer" "c2_rapport_post_teilnehmer_denied"

status=$(request "c2_rapport_get_kunden" "GET" "/api/kunden" "$RAPPORT_TOKEN")
expect_status "C2-009" "200" "$status" "trainer_rapport can read kunden" "c2_rapport_get_kunden"

payload=$(jq -nc --arg v "Denied$TS" --arg n "Rapport" '{vorname:$v,nachname:$n,status:"Aktiv"}')
status=$(request "c2_rapport_post_kunden_denied" "POST" "/api/kunden" "$RAPPORT_TOKEN" "$payload")
expect_status "C2-010" "403" "$status" "trainer_rapport cannot create kunde" "c2_rapport_post_kunden_denied"

status=$(request "c2_rapport_get_zertifikate_denied" "GET" "/api/zertifikate" "$RAPPORT_TOKEN")
expect_status "C2-011" "403" "$status" "trainer_rapport cannot read zertifikate" "c2_rapport_get_zertifikate_denied"

payload=$(jq -nc --arg kid "$KUNDE_ID" --arg hid "$HUND_ID" --arg kurs "$KURS_ID" '{kundeId:$kid,hundId:$hid,kursId:$kurs,ausstellungsdatum:"2026-02-24",kursOrtSnapshot:"x",trainer1NameSnapshot:"x",trainer1TitelSnapshot:"x",kursInhaltTheorieSnapshot:"x",kursInhaltPraxisSnapshot:"x"}')
status=$(request "c2_rapport_post_zertifikat_denied" "POST" "/api/zertifikate" "$RAPPORT_TOKEN" "$payload")
expect_status "C2-012" "403" "$status" "trainer_rapport cannot create zertifikat" "c2_rapport_post_zertifikat_denied"

# C3 input hardening
payload=$(jq -nc --arg v "<script>alert(1)</script>" --arg n "Payload$TS" '{vorname:$v,nachname:$n,status:"Aktiv",notizen:"<script>alert(1)</script>"}')
status=$(request "c3_script_payload_create" "POST" "/api/kunden" "$ADMIN_TOKEN" "$payload")
expect_status "C3-001" "201" "$status" "script payload accepted as text without crash" "c3_script_payload_create"
SCRIPT_KUNDE_ID=$(jq -r '.id // empty' "$API_DIR/c3_script_payload_create.body")

status=$(request "c3_script_payload_readback" "GET" "/api/kunden/$SCRIPT_KUNDE_ID" "$ADMIN_TOKEN")
expect_status "C3-002" "200" "$status" "readback script payload" "c3_script_payload_readback"
if jq -e '.vorname == "<script>alert(1)</script>"' "$API_DIR/c3_script_payload_readback.body" >/dev/null 2>&1; then
  record_result "C3-003" "PASS" "$status" "script string stored as plain data" "c3_script_payload_readback"
else
  record_result "C3-003" "FAIL" "$status" "script string modified/unexpected" "c3_script_payload_readback"
fi

LONG_NOTES=$(printf 'A%.0s' {1..20000})
payload=$(jq -nc --arg notes "$LONG_NOTES" '{notizen:$notes}')
status=$(request "c3_long_payload_patch" "PATCH" "/api/kunden/$KUNDE_ID" "$ADMIN_TOKEN" "$payload")
expect_status_any "C3-004" "200,400" "$status" "long payload should not crash server" "c3_long_payload_patch"

status=$(request "c3_invalid_uuid_route" "GET" "/api/kunden/not-a-uuid" "$ADMIN_TOKEN")
expect_status "C3-005" "404" "$status" "invalid id route returns not_found" "c3_invalid_uuid_route"

# Role behavior check for trainer_rapport on sub-kurs detail read
status=$(request "b5_rapport_get_subkurs_detail" "GET" "/api/kurse/$KURS_ID/subkurse/$SUBKURS_ID" "$RAPPORT_TOKEN")
expect_status "B5-001" "200" "$status" "trainer_rapport can view sub-kurs detail" "b5_rapport_get_subkurs_detail"

status=$(request "b5_rapport_delete_subkurs_denied" "DELETE" "/api/kurse/$KURS_ID/subkurse/$SUBKURS_ID" "$RAPPORT_TOKEN")
expect_status "B5-002" "403" "$status" "trainer_rapport cannot delete sub-kurs" "b5_rapport_delete_subkurs_denied"

# Summarize
PASS_COUNT=$(awk -F'\t' 'NR>1 && $2=="PASS" {c++} END {print c+0}' "$RESULTS")
FAIL_COUNT=$(awk -F'\t' 'NR>1 && $2=="FAIL" {c++} END {print c+0}' "$RESULTS")
BLOCKED_COUNT=$(awk -F'\t' 'NR>1 && $2=="BLOCKED" {c++} END {print c+0}' "$RESULTS")
TOTAL_COUNT=$(awk 'END{print NR-1}' "$RESULTS")

jq -nc \
  --arg total "$TOTAL_COUNT" \
  --arg pass "$PASS_COUNT" \
  --arg fail "$FAIL_COUNT" \
  --arg blocked "$BLOCKED_COUNT" \
  '{total:($total|tonumber),passed:($pass|tonumber),failed:($fail|tonumber),blocked:($blocked|tonumber)}' > "$SUMMARY_JSON"

cat "$SUMMARY_JSON"
