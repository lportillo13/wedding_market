#!/usr/bin/env bash

set -Eeuo pipefail

if [[ "$(id -u)" -eq 0 ]]; then
  echo "Root detected; switching to the deploy user..."
  exec sudo -u deploy -H /usr/bin/bash "$(readlink -f "${BASH_SOURCE[0]}")" "$@"
fi

DEPLOY_USER="deploy"

if [[ "$(id -un)" != "$DEPLOY_USER" ]]; then
  echo "Run this deployer as root or $DEPLOY_USER, not $(id -un)." >&2
  exit 1
fi

APP_DIR="${APP_DIR:-/var/www/wedding-market}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-dev}"
DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
PM2_APP_NAME="${PM2_APP_NAME:-wedding-market}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/api/health}"
LOCK_FILE="${LOCK_FILE:-/tmp/wedding-market-deploy.lock}"
HEALTH_ATTEMPTS="${HEALTH_ATTEMPTS:-20}"
HEALTH_DELAY_SECONDS="${HEALTH_DELAY_SECONDS:-3}"
force_deploy=0

previous_sha=""
deployment_updated=0

log() {
  printf '%s [wedding-market-deploy] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

restart_app() {
  pm2 startOrRestart deploy/ecosystem.config.cjs --only "$PM2_APP_NAME" --update-env
  pm2 save
}

wait_for_health() {
  local attempt
  for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt += 1)); do
    if curl --fail --silent --show-error --max-time 5 "$HEALTH_URL" >/dev/null; then
      log "Health check passed: $HEALTH_URL"
      return 0
    fi
    log "Health check $attempt/$HEALTH_ATTEMPTS failed; retrying in ${HEALTH_DELAY_SECONDS}s"
    sleep "$HEALTH_DELAY_SECONDS"
  done
  return 1
}

rollback() {
  local failed_line="$1"
  local exit_code="$2"
  trap - ERR
  set +e

  log "Deployment failed at line $failed_line with exit code $exit_code."
  if [[ "$deployment_updated" -eq 1 && -n "$previous_sha" ]]; then
    log "Rolling back to $previous_sha"
    git reset --hard "$previous_sha"
    npm ci
    nice -n 10 npm run build
    restart_app
    if wait_for_health; then
      log "Rollback completed successfully."
    else
      log "ERROR: Rollback completed, but the health check is still failing."
    fi
  fi

  exit "$exit_code"
}

trap 'rollback "$LINENO" "$?"' ERR

case "${1:-}" in
  "") ;;
  --force) force_deploy=1 ;;
  *) fail "Usage: $0 [--force]" ;;
esac

require_command git
require_command npm
require_command pm2
require_command curl
require_command flock
require_command nice

git check-ref-format --branch "$DEPLOY_BRANCH" >/dev/null 2>&1 || fail "Invalid branch name: $DEPLOY_BRANCH"
[[ -d "$APP_DIR/.git" ]] || fail "Git checkout not found at $APP_DIR"
[[ -f "$APP_DIR/.env.production" ]] || fail "Missing $APP_DIR/.env.production"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another deployment is already running; exiting."
  exit 0
fi

cd "$APP_DIR"

current_branch="$(git symbolic-ref --quiet --short HEAD || true)"
[[ "$current_branch" == "$DEPLOY_BRANCH" ]] || fail "Expected branch $DEPLOY_BRANCH, found ${current_branch:-detached HEAD}"

if [[ -n "$(git status --porcelain --untracked-files=normal)" ]]; then
  fail "The server checkout has local changes. Clean or commit them before deploying."
fi

log "Checking $DEPLOY_REMOTE/$DEPLOY_BRANCH for updates."
git fetch --prune "$DEPLOY_REMOTE" "+refs/heads/$DEPLOY_BRANCH:refs/remotes/$DEPLOY_REMOTE/$DEPLOY_BRANCH"

previous_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse "$DEPLOY_REMOTE/$DEPLOY_BRANCH")"

if [[ "$previous_sha" == "$remote_sha" && "$force_deploy" -eq 0 ]]; then
  log "Already deployed at $remote_sha; nothing to do."
  exit 0
fi

if [[ "$previous_sha" != "$remote_sha" ]]; then
  if ! git merge-base --is-ancestor "$previous_sha" "$remote_sha"; then
    fail "Local HEAD $previous_sha has diverged from $DEPLOY_REMOTE/$DEPLOY_BRANCH ($remote_sha). Refusing to reset it."
  fi

  log "Deploying $previous_sha -> $remote_sha"
  git merge --ff-only "$DEPLOY_REMOTE/$DEPLOY_BRANCH"
  deployment_updated=1
else
  log "Force-deploying current commit $remote_sha."
fi

log "Installing locked dependencies."
npm ci

log "Building the Next.js application."
nice -n 10 npm run build

log "Restarting PM2 application $PM2_APP_NAME."
restart_app

wait_for_health

deployment_updated=0
log "Deployment completed successfully at $remote_sha."
