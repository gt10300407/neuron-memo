#!/usr/bin/env bash
set -euo pipefail
REPO_NAME="${SURYUNGGIL_REPO_NAME:-neuron-memo}"
VERSION="$(cat VERSION)"
MSG="${1:-수령길-컴맹 v${VERSION}}"
command -v git >/dev/null || { echo "git이 필요해."; exit 1; }
command -v gh >/dev/null || { echo "GitHub CLI(gh)가 필요해."; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "먼저 gh auth login 실행해."; exit 1; }
OWNER="$(gh api user --jq '.login')"; UID_NUM="$(gh api user --jq '.id')"; UNAME="$(gh api user --jq '.name // .login')"; REPO="${OWNER}/${REPO_NAME}"; URL="https://github.com/${REPO}.git"
gh auth setup-git >/dev/null 2>&1 || true
[ -d .git ] || git init -b main >/dev/null
git config user.name "$UNAME"; git config user.email "${UID_NUM}+${OWNER}@users.noreply.github.com"
if gh repo view "$REPO" >/dev/null 2>&1; then
  git remote get-url origin >/dev/null 2>&1 && git remote set-url origin "$URL" || git remote add origin "$URL"
  git fetch origin main --quiet || true
  git rev-parse --verify origin/main >/dev/null 2>&1 && git reset --mixed origin/main --quiet || true
else
  gh repo create "$REPO" --public --description "수령길-컴맹 retro responsive memo app" >/dev/null
  git remote add origin "$URL"
fi
git add -A
if git diff --cached --quiet; then echo "변경사항 없음."; else git commit -m "$MSG" --quiet; git push -u origin main --quiet; echo "커밋/푸시 완료."; fi
if gh api "repos/${REPO}/pages" >/dev/null 2>&1; then gh api --method PUT "repos/${REPO}/pages" -f build_type=workflow >/dev/null 2>&1 || true; else gh api --method POST "repos/${REPO}/pages" -f build_type=workflow >/dev/null 2>&1 || true; fi
gh workflow run pages.yml --repo "$REPO" >/dev/null 2>&1 || true
echo; echo "새 버전 확인: https://${OWNER}.github.io/${REPO_NAME}/v030.html"; echo "기본 주소: https://${OWNER}.github.io/${REPO_NAME}/"; echo "처음에는 1~3분 정도 걸릴 수 있어."
