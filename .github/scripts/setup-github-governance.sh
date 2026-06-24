#!/usr/bin/env bash
set -euo pipefail

# Applies branch protection rules and sets production as the default branch.
#
# Prerequisites:
#   1. Install GitHub CLI: https://cli.github.com/
#   2. Authenticate: gh auth login
#   3. You must be a repo admin (imTusharsingh)
#
# Usage (from repo root):
#   ./.github/scripts/setup-github-governance.sh

REPO="${GITHUB_REPO:-imTusharsingh/ai-publishing-platform}"
OWNER="${REPO%%/*}"
REPO_NAME="${REPO##*/}"
ADMIN_USER="${GITHUB_ADMIN_USER:-imTusharsingh}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is required. Install from https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: run 'gh auth login' first." >&2
  exit 1
fi

echo "Configuring repository: ${REPO}"
echo "Admin user (only push access to staging/production): ${ADMIN_USER}"
echo

ADMIN_USER_ID="$(gh api "users/${ADMIN_USER}" --jq '.id')"
echo "→ Resolved ${ADMIN_USER} to user id ${ADMIN_USER_ID}"
echo

echo "→ Setting default branch to production..."
gh repo edit "${REPO}" --default-branch production

protect_restricted_branch() {
  local branch="$1"
  echo "→ Protecting ${branch} (push restricted to ${ADMIN_USER})..."

  gh api \
    --method PUT \
    "repos/${OWNER}/${REPO_NAME}/branches/${branch}/protection" \
    --input - <<EOF
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": {
    "users": [${ADMIN_USER_ID}],
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
}

protect_development_branch() {
  echo "→ Protecting development (minimum 1 PR approval)..."

  gh api \
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

protect_restricted_branch "production"
protect_restricted_branch "staging"
protect_development_branch

echo
echo "Done."
echo "  • Default branch: production"
echo "  • production / staging: only ${ADMIN_USER} can push"
echo "  • development: PRs require at least 1 approval"
echo "  • CI runs only on push to development, staging, production (see .github/workflows/ci.yml)"
