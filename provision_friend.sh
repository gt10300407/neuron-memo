#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-}"
APP_REPO="${APP_REPO:-suryunggil-commaeng}"
DATA_REPO="${DATA_REPO:-suryunggil-commaeng-data}"

[ -n "$TARGET" ] || { echo "사용법: bash provision_friend.sh <지인_GitHub_아이디>"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "git이 필요해."; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "GitHub CLI(gh)가 필요해."; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "먼저 네 GitHub 계정으로 gh auth login 해."; exit 1; }

OWNER="$(gh api user --jq '.login')"
USER_ID="$(gh api user --jq '.id')"
gh api "users/${TARGET}" >/dev/null 2>&1 || { echo "GitHub 사용자 '${TARGET}'를 찾지 못했어."; exit 1; }

gh repo view "${OWNER}/${APP_REPO}" >/dev/null 2>&1 && { echo "${OWNER}/${APP_REPO}가 이미 있어. 중단."; exit 1; }
gh repo view "${OWNER}/${DATA_REPO}" >/dev/null 2>&1 && { echo "${OWNER}/${DATA_REPO}가 이미 있어. 중단."; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[1/5] 프로그램 저장소 생성"
gh repo create "${OWNER}/${APP_REPO}" --public --description "수령길-컴맹 개인 메모 앱" >/dev/null
mkdir -p "$TMP/app"
cp -R . "$TMP/app/"
rm -rf "$TMP/app/.git"
(
  cd "$TMP/app"
  git init -b main >/dev/null
  git config user.name "$OWNER"
  git config user.email "${USER_ID}+${OWNER}@users.noreply.github.com"
  git add -A
  git commit -m "Initial 수령길-컴맹 setup" >/dev/null
  git remote add origin "https://github.com/${OWNER}/${APP_REPO}.git"
  git push -u origin main >/dev/null
)

echo "[2/5] GitHub Pages 설정"
gh api --method POST "repos/${OWNER}/${APP_REPO}/pages" -f build_type=workflow >/dev/null 2>&1 || true

echo "[3/5] 비공개 데이터 저장소 생성"
gh repo create "${OWNER}/${DATA_REPO}" --private --description "수령길-컴맹 개인 메모 데이터" >/dev/null
printf '# 수령길-컴맹 데이터 저장소\n\n앱이 data/state.json을 자동 관리합니다.\n' > "$TMP/README.md"
B64="$(base64 < "$TMP/README.md" | tr -d '\n')"
gh api --method PUT "repos/${OWNER}/${DATA_REPO}/contents/README.md" -f message="Initialize private data repo" -f content="$B64" >/dev/null

echo "[4/5] 지인 계정으로 이전 요청"
gh api --method POST "repos/${OWNER}/${APP_REPO}/transfer" -f new_owner="$TARGET" >/dev/null
gh api --method POST "repos/${OWNER}/${DATA_REPO}/transfer" -f new_owner="$TARGET" >/dev/null

echo "[5/5] 완료"
cat <<EOF

지인 GitHub 아이디: ${TARGET}

지인이 GitHub 메일에서 다음 두 저장소 이전을 승인해야 해.
- ${APP_REPO}
- ${DATA_REPO}

주의:
GitHub 아이디만으로 저장소 소유권 이전까지는 가능해.
하지만 브라우저가 PRIVATE 데이터 저장소에 자동으로 쓰려면 GitHub 인증 권한은 별도로 필요해.
현재 v0.3.x의 동기화 설정은 이 인증 단계가 남아 있어.
EOF
