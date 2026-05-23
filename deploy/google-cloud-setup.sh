#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Uso: bash google-cloud-setup.sh <url-do-repositorio-github>"
  exit 1
fi

REPO_URL="$1"
APP_DIR="$HOME/discord-music-bot"

sudo apt-get update
sudo apt-get install -y curl git ffmpeg build-essential

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo npm install -g pm2

if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
npm install --omit=dev

if [ ! -f .env ]; then
  cp .env.example .env
  echo
  echo "Edite $APP_DIR/.env com DISCORD_TOKEN, CLIENT_ID e GUILD_ID antes de iniciar."
  echo "Comando: nano $APP_DIR/.env"
  exit 0
fi

pm2 delete discord-music-bot >/dev/null 2>&1 || true
pm2 start src/index.js --name discord-music-bot
pm2 save

echo
echo "Bot iniciado. Use: pm2 logs discord-music-bot"
