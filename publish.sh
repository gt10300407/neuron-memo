#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${NEURON_REPO_NAME:-neuron-memo}"
VERSION="$(cat VERSION 2>/dev/null || echo dev)"
COMMIT_MSG="${1:-NEURON v${VERSION}}"

die() {
  printf '\n[ERROR] %s\n' "$1" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || die "git이 설치되어 있지 않아."
command -v gh >/dev/null 2>&1 || die "GitHub CLI(gh)가 설치되어 있지 않아."

gh auth status >/dev/null 2>&1 || die "GitHub 로그인이 필요해. 먼저: gh auth login"

OWNER="$(gh api user --jq '.login')"
USER_ID="$(gh api user --jq '.id')"
USER_NAME="$(gh api user --jq '.name // .login')"
REPO="${OWNER}/${REPO_NAME}"
REMOTE_URL="https://github.com/${REPO}.git"
PAGE_URL="https://${OWNER}.github.io/${REPO_NAME}/"

printf '\n=== NEURON Publish ===\n'
printf 'Repo : %s\n' "$REPO"
printf 'Ver  : %s\n\n' "$VERSION"

# Use GitHub CLI as HTTPS credential helper, so the command works even if SSH isn't configured.
gh auth setup-git >/dev/null 2>&1 || true

if [ -d .git ]; then
  git branch -M main >/dev/null 2>&1 || true
else
  git init -b main >/dev/null
fi

git config user.name "$USER_NAME"
git config user.email "${USER_ID}+${OWNER}@users.noreply.github.com"

if gh repo view "$REPO" >/dev/null 2>&1; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REMOTE_URL"
  else
    git remote add origin "$REMOTE_URL"
  fi

  # Make this ZIP release a child of the latest remote commit while keeping
  # the ZIP's working tree as the desired new snapshot.
  git fetch origin main --quiet
  git reset --mixed origin/main --quiet
else
  gh repo create "$REPO" \
    --public \
    --description "NEURON - responsive personal memory inbox and brain graph" \
    >/dev/null

  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REMOTE_URL"
  else
    git remote add origin "$REMOTE_URL"
  fi
fi

git add -A

if git diff --cached --quiet; then
  printf '변경사항 없음. 기존 main을 유지해.\n'
else
  git commit -m "$COMMIT_MSG" --quiet
  git push -u origin main --quiet
  printf '커밋/푸시 완료.\n'
fi

# Ensure GitHub Pages is configured for GitHub Actions.
if gh api "repos/${REPO}/pages" >/dev/null 2>&1; then
  gh api --method PUT "repos/${REPO}/pages" \
    -f build_type=workflow \
    >/dev/null 2>&1 || true
else
  gh api --method POST "repos/${REPO}/pages" \
    -f build_type=workflow \
    >/dev/null 2>&1 || true
fi

# Explicitly trigger deployment after Pages is enabled.
gh workflow run pages.yml --repo "$REPO" >/dev/null 2>&1 || true

printf '\nGitHub : https://github.com/%s\n' "$REPO"
printf '사이트 : %s\n' "$PAGE_URL"
printf '\n처음 배포면 GitHub Pages가 뜨기까지 1~3분 정도 걸릴 수 있어.\n'
printf '상태 확인: gh run list --repo %s --workflow pages.yml --limit 3\n\n' "$REPO"
