#!/usr/bin/env bash
set -euo pipefail
DATA_REPO="${1:-suryunggil-commaeng-data}"
command -v gh >/dev/null 2>&1 || { echo "GitHub CLI(gh)가 필요해."; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "지인의 GitHub 계정으로 먼저: gh auth login"; exit 1; }
OWNER="$(gh api user --jq '.login')"
if gh repo view "${OWNER}/${DATA_REPO}" >/dev/null 2>&1; then echo "이미 존재함: ${OWNER}/${DATA_REPO}"; else gh repo create "${OWNER}/${DATA_REPO}" --private --description "수령길-컴맹 개인 메모 동기화 데이터" >/dev/null; echo "생성 완료: ${OWNER}/${DATA_REPO}"; fi
echo
echo "앱 설정값"
echo "GitHub 계정 : ${OWNER}"
echo "데이터 저장소: ${DATA_REPO}"
echo "브랜치       : main"
echo "데이터 파일  : data/state.json"
echo
echo "GitHub 웹에서 Fine-grained PAT 생성:"
echo "- Only select repositories: ${DATA_REPO}"
echo "- Repository permissions > Contents: Read and write"
echo "- GitHub 비밀번호는 앱에 넣지 말 것"
