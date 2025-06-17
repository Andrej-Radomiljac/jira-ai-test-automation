# Jira-Claude-Playwright Automation System

## Overview
Automates Playwright test generation and execution for Jira tickets using Claude AI. Receives Jira webhooks, generates Playwright tests, runs them, and reports results back to Jira.

## Features
- Receives Jira webhooks (Express server)
- Integrates with Claude AI for test generation
- Runs Playwright tests on demand
- Reports results to Jira as comments
- Production-ready error handling and logging

## Setup

### 1. Clone & Install
```bash
npm install
npx playwright install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
nano .env
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Expose to Jira (for webhooks)
Use [ngrok](https://ngrok.com/) or similar to expose port 3000.

## Docker Usage

### Build & Run
```bash
docker-compose up --build
```

## Endpoints
- `POST /webhook/jira` — Receives Jira webhooks
- `GET /health` — Health check endpoint

## Directory Structure
- `src/` — Source code
- `generated-tests/` — Playwright test files
- `tests/` — Unit/integration tests

## Monitoring
- Logs output to console (Winston)
- Health check: `GET /health`

## License
MIT 