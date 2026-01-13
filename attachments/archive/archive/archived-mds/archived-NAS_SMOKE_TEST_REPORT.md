date: 2025-XX-XX
nas_url: http://<NAS>/dogule1-alpha/
branch: feature/station42-nas-smoketest
commit: <commit-hash>
tester: Codex
environment: Browser: Chrome (latest), OS: <your OS>
summary: PASS - NAS-hosted app loads and all modules CRUD/navigation work; only favicon 404 observed
console_findings: favicon.ico 404 (expected/benign); no other errors
module_check_results: Dashboard/Kunden/Hunde/Kurse/Trainer/Kalender/Finanzen/Waren/Kommunikation all loaded; CRUD for Kunden/Hunde/Kurse/Trainer/Finanzen/Waren successful; Kalender Tag/Woche views and linking OK; back/forward OK
final_verdict: PASS
