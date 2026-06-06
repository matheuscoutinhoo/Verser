# Verser — Windows PowerShell setup
$ErrorActionPreference = 'Stop'

Write-Host '» Installing workspace dependencies...' -ForegroundColor Cyan
npm install

if (-not (Test-Path '.env')) {
    Write-Host '» Creating root .env from template' -ForegroundColor Cyan
    Copy-Item .env.example .env
}

if (-not (Test-Path 'server/.env')) {
    Write-Host '» Creating server/.env from template' -ForegroundColor Cyan
    Copy-Item .env.example server/.env
}

Write-Host '» Generating Prisma client' -ForegroundColor Cyan
npm run prisma:generate

Write-Host '» Running database migrations' -ForegroundColor Cyan
npm run prisma:migrate

Write-Host '» Seeding the database' -ForegroundColor Cyan
npm run prisma:seed

Write-Host '✔ Setup complete. Start with: npm run dev:server  (and in another terminal) npm run dev:client' -ForegroundColor Green
