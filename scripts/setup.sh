#!/usr/bin/env bash
# Verser — first-time setup
set -euo pipefail

echo "» Installing workspace dependencies..."
npm install

if [ ! -f .env ]; then
  echo "» Creating root .env from template"
  cp .env.example .env
fi

if [ ! -f server/.env ]; then
  echo "» Creating server/.env from template"
  cp .env.example server/.env
fi

echo "» Generating Prisma client"
npm run prisma:generate

echo "» Running database migrations"
npm run prisma:migrate

echo "» Seeding the database"
npm run prisma:seed

echo "✔ Setup complete. Start with: npm run dev:server  (and in another terminal) npm run dev:client"
