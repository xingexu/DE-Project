# Project Setup

## Prerequisites
- Node.js 18+
- PostgreSQL 15+

## Quick Start
```bash
cd backend
npm run setup
npm start
```

## Manual Setup
```bash
npm install
npm run db:migrate
node src/config/migration-social.js
npm run db:seed
```