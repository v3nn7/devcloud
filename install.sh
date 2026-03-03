#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.yml"
SERVER_ENV="server/.env"
SERVER_ENV_TEMPLATE="server/.env.example"

log() {
  echo "[INFO] $*"
}

die() {
  echo "[ERROR] $*" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

resolve_compose_command() {
  if command_exists docker; then
    if docker compose version >/dev/null 2>&1; then
      echo "docker compose"
      return 0
    fi
  fi

  if command_exists docker-compose; then
    echo "docker-compose"
    return 0
  fi

  return 1
}

compose_cmd="$(resolve_compose_command || true)"
if [[ -z "$compose_cmd" ]]; then
  die "Docker Compose not found. Install Docker + Docker Compose and rerun."
fi

if ! command_exists openssl; then
  die "openssl not found. Install openssl package before running the installer."
fi

random_secret() {
  openssl rand -hex 32
}

ensure_server_env() {
  if [[ ! -f "$SERVER_ENV_TEMPLATE" ]]; then
    die "Missing template: $SERVER_ENV_TEMPLATE"
  fi

  if [[ ! -f "$SERVER_ENV" ]]; then
    cp "$SERVER_ENV_TEMPLATE" "$SERVER_ENV"
    log "Created $SERVER_ENV from template"
  fi

  local access_secret
  local refresh_secret
  access_secret="$(random_secret)"
  refresh_secret="$(random_secret)"

  if grep -q '^JWT_ACCESS_SECRET=' "$SERVER_ENV"; then
    sed -i "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$access_secret|" "$SERVER_ENV"
  else
    echo "JWT_ACCESS_SECRET=$access_secret" >> "$SERVER_ENV"
  fi

  if grep -q '^JWT_REFRESH_SECRET=' "$SERVER_ENV"; then
    sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$refresh_secret|" "$SERVER_ENV"
  else
    echo "JWT_REFRESH_SECRET=$refresh_secret" >> "$SERVER_ENV"
  fi

  if grep -q '^CORS_ORIGIN=' "$SERVER_ENV"; then
    if ! grep -Fq "http://localhost:8080" "$SERVER_ENV"; then
      sed -i "s|^CORS_ORIGIN=|CORS_ORIGIN=http://localhost:8080,|" "$SERVER_ENV"
    fi
  else
    echo "CORS_ORIGIN=http://localhost:8080" >> "$SERVER_ENV"
  fi

  if [[ ! -f "$SERVER_ENV" ]]; then
    die "Failed to create environment file"
  fi
}

start_services() {
  log "Starting DevCloud with Docker Compose"
  $compose_cmd -f "$COMPOSE_FILE" up --build -d
  log "Services started"
  local attempts=0
  while (( attempts < 20 )); do
    running="$($compose_cmd -f "$COMPOSE_FILE" ps --services --filter "status=running" server 2>/dev/null || true)"
    if [[ "$running" == "server" ]]; then
      break
    fi
    sleep 1
    ((attempts++))
  done

  if [[ "$running" != "server" ]]; then
    log "Server service failed to stay running. Showing recent logs:"
    $compose_cmd -f "$COMPOSE_FILE" logs --tail 120 server || true
    die "Server container is restarting. Check the logs above."
  fi

  $compose_cmd -f "$COMPOSE_FILE" ps
}

stop_services() {
  log "Stopping DevCloud services"
  $compose_cmd -f "$COMPOSE_FILE" down
}

print_status() {
  $compose_cmd -f "$COMPOSE_FILE" ps
  docker images | grep devcloud || true
}

case "${1:-install}" in
  install|start|up)
    ensure_server_env
    start_services
    ;;
  stop|down)
    stop_services
    ;;
  restart|reload)
    stop_services
    ensure_server_env
    start_services
    ;;
  status)
    print_status
    ;;
  *)
    cat <<'USAGE'
DevCloud installation script

Usage:
  ./install.sh            # generate env and start containers
  ./install.sh install     # same as default
  ./install.sh start|up    # start existing stack
  ./install.sh stop|down   # stop services
  ./install.sh restart     # regenerate secrets and restart
  ./install.sh status      # show status
USAGE
    exit 1
    ;;
esac
