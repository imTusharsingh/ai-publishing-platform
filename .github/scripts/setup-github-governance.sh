#!/usr/bin/env bash
set -euo pipefail

# Applies branch protection rules and sets production as the default branch.
#
# Prerequisites:
#   1. GitHub CLI (gh) — install via apt/snap, or use bundled copy under .tools/
#   2. Authenticate: gh auth login  (or see resolve_gh below)
#   3. You must be a repo admin (imTusharsingh)
#
# Usage (from repo root):
#   ./.github/scripts/setup-github-governance.sh

REPO="${GITHUB_REPO:-imTusharsingh/ai-publishing-platform}"
OWNER="${REPO%%/*}"
REPO_NAME="${REPO##*/}"
ADMIN_USER="${GITHUB_ADMIN_USER:-imTusharsingh}"

resolve_gh() {
  if command -v gh >/dev/null 2>&1; then
    command -v gh
    return 0
  fi

  local script_dir repo_root bundled
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  repo_root="$(cd "${script_dir}/../.." && pwd)"

  for bundled in "${repo_root}"/.tools/gh_*/bin/gh; do
    if [[ -x "${bundled}" ]]; then
      echo "${bundled}"
      return 0
    fi
  done

  return 1
}

if ! GH="$(resolve_gh)"; then
  cat >&2 <<'EOF'
Error: gh CLI not found.

Option A — install system-wide (requires sudo):
  sudo apt install gh

Option B — download locally (no sudo), from repo root:
  mkdir -p .tools
  curl -sL https://github.com/cli/cli/releases/download/v2.86.0/gh_2.86.0_linux_amd64.tar.gz \
    | tar xz -C .tools
  .tools/gh_2.86.0_linux_amd64/bin/gh auth login

Then re-run this script.
EOF
  exit 1
fi

if ! "${GH}" auth status >/dev/null 2>&1; then
  echo "Error: GitHub CLI is not authenticated." >&2
  echo "Run: ${GH} auth login" >&2
  exit 1
fi

echo "Configuring repository: ${REPO}"
echo "Admin user (only push access to staging/production): ${ADMIN_USER}"
echo

ADMIN_USER_ID="$("${GH}" api "users/${ADMIN_USER}" --jq '.id')"
echo "→ Resolved ${ADMIN_USER} to user id ${ADMIN_USER_ID}"
echo

echo "→ Setting default branch to production..."
"${GH}" repo edit "${REPO}" --default-branch production

OWNER_TYPE="$("${GH}" api "repos/${OWNER}/${REPO_NAME}" --jq '.owner.type')"
echo "→ Repository owner type: ${OWNER_TYPE}"
echo

protect_promotion_branch() {
  local branch="$1"
  echo "→ Protecting ${branch} (promotion branch — PR required, no force push)..."

  if [[ "${OWNER_TYPE}" == "Organization" ]]; then
    "${GH}" api \
      --method PUT \
      "repos/${OWNER}/${REPO_NAME}/branches/${branch}/protection" \
      --input - <<EOF
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": {
    "users": ["${ADMIN_USER_ID}"],
    "teams": [],
    "apps": []
  },
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF
    return
  fi

  # Personal repos cannot use user/team push restrictions — only the owner has write access.
  "${GH}" api \
    --method PUT \
    "repos/${OWNER}/${REPO_NAME}/branches/${branch}/protection" \
    --input - <<EOF
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF
}

protect_development_branch() {
  echo "→ Protecting development (minimum 1 PR approval)..."

  "${GH}" api \
    --method PUT \
    "repos/${OWNER}/${REPO_NAME}/branches/development/protection" \
    --input - <<EOF
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF
}

protect_promotion_branch "production"
protect_promotion_branch "staging"
protect_development_branch

echo
echo "Done."
echo "  • Default branch: production"
if [[ "${OWNER_TYPE}" == "Organization" ]]; then
  echo "  • production / staging: push restricted to ${ADMIN_USER}"
else
  echo "  • production / staging: protected (personal repo — only ${ADMIN_USER} has write access; direct push OK)"
fi
echo "  • development: PRs require at least 1 approval"
echo "  • CI runs only on push to development, staging, production (see .github/workflows/ci.yml)"
