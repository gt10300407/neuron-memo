#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "===== 수령길-컴맹 릴리스 검사 ====="
echo "[1/4] JavaScript 문법"
node --check app-v093.js

echo "[2/4] 정적·보안 감사"
python3 tests/static_audit.py

echo "[3/4] 대량 데이터 성능"
node tests/performance_check.js

echo "[4/4] 배포 스크립트 문법"
bash -n publish.sh

echo "===== RELEASE CHECK PASS ====="
