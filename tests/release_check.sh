#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "===== 수령길-컴맹 릴리스 검사 ====="
echo "[1/5] JavaScript 문법"
node --check app-v095.js

echo "[2/5] 정적·보안 감사"
python3 tests/static_audit.py

echo "[3/5] 대량 데이터 성능"
node tests/performance_check.js

echo "[4/5] 핀치 확대 고정점"
node tests/pinch_anchor_check.js

echo "[5/5] 배포 스크립트 문법"
bash -n publish.sh

echo "===== RELEASE CHECK PASS ====="
