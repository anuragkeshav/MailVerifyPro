# MailVerify Pro — Email Verification Dashboard

A production-ready, fully local email verification web application that validates emails from CSV files using direct SMTP verification and DNS checks. No paid APIs, no cloud services — everything runs on your machine.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.6-blue.svg)

## Features

### Email Verification Pipeline (10 Steps)
1. **Syntax Validation** — RFC 5322 compliant regex validation
2. **Disposable Email Detection** — 830+ known disposable domains
3. **Role Account Detection** — 70+ organizational prefixes (admin, support, etc.)
4. **Domain Validation** — DNS resolution and MX record verification
5. **SMTP Verification** — Direct RCPT TO check without sending emails
6. **Catch-All Detection** — Identifies domains that accept all addresses
7. **Mailbox Existence** — Determines if the specific mailbox exists
8. **Greylisting Retry** — Exponential backoff for temporary failures
9. **Timeout Handling** — Graceful handling of network issues
10. **Confidence Scoring** — 0–100 score with classification (Valid/Invalid/Risky/Catch-All/Unknown)

### Dashboard
- 📊 Real-time statistics cards with animated counters
- 📈 Interactive pie chart for email distribution
- 🔄 Live progress bar with ETA and speed metrics
- 📝 Terminal-style live verification logs
- 🔍 Searchable and filterable results table
- 🌙 Dark/Light mode toggle
- ⏯️ Pause/Resume/Cancel controls
- 📥 CSV export per status category
- 📋 Verification history with SQLite persistence

### Performance
- Concurrent processing with configurable limits
- Per-domain rate limiting to avoid IP blocking
- Worker queue with p-queue
- Handles 100,000+ emails
- DNS and catch-all result caching

## Architecture

```
┌─────────────────────────────┐     WebSocket      ┌──────────────────────────────┐
│         Frontend            │◄──────────────────►│          Backend             │
│  React + Vite + TailwindCSS │     REST API       │   Express + Socket.IO        │
│  shadcn/ui + Framer Motion  │◄──────────────────►│   TypeScript + SQLite        │
└─────────────────────────────┘                    └──────────┬───────────────────┘
                                                              │
                                                   ┌──────────▼───────────────────┐
                                                   │    Verification Pipeline      │
                                                   │                              │
                                                   │  Syntax → Disposable → Role  │
                                                   │  → DNS → SMTP → Catch-All    │
                                                   │  → Mailbox → Greylisting     │
                                                   │  → Timeout → Scoring         │
                                                   └──────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, TypeScript 5.6 |
| Styling | TailwindCSS v4, shadcn/ui (New York) |
| Animations | Framer Motion |
| Charts | Recharts (via shadcn/ui) |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| WebSocket | Socket.IO |
| Queue | p-queue |
| SMTP | Custom client (net/tls) |
| DNS | Node.js built-in dns.promises |

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Port 25** must be accessible for outbound SMTP connections (see Troubleshooting)

## Installation

### 1. Clone / Extract the project

```bash
cd email-verifier
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment

```bash
cd ../backend
cp .env.example .env
# Edit .env if needed (defaults work out of the box)
```

## Running the Application

### Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

The backend starts at **http://localhost:3001**

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

The frontend starts at **http://localhost:5173**

### Open in Browser

Navigate to **http://localhost:5173**

## Usage

### 1. Upload a CSV File

- Drag & drop a CSV or TXT file onto the upload zone
- The app auto-detects the email column
- Review the preview showing total rows, duplicates, and empty rows

### 2. Start Verification

- Click **"Start Verification"**
- Watch real-time progress with live logs
- Use **Pause/Resume/Cancel** controls as needed

### 3. View Results

- Results appear in the searchable table
- Filter by status: Valid, Invalid, Risky, Catch-All, Unknown
- View confidence scores and detailed reasons

### 4. Export Results

Download CSV files for each category:
- `verification_report.csv` — Complete report with all fields
- `valid.csv` — Valid emails only
- `invalid.csv` — Invalid emails only
- `risky.csv` — Risky emails
- `catchall.csv` — Catch-all domain emails
- `unknown.csv` — Unknown status emails

### CSV File Format

Your CSV should have a header row with an email column. The app auto-detects columns named:
- `email`, `e-mail`, `mail`, `address`, `email_address`, `emailaddress`

Example:
```csv
name,email,company
John Doe,john@example.com,Acme Inc
Jane Smith,jane@example.com,Widget Corp
```

For TXT files, put one email per line:
```
john@example.com
jane@example.com
```

## Configuration

Edit `backend/.env` to customize:

```env
# Server
PORT=3001                          # Backend port
FRONTEND_URL=http://localhost:5173 # Frontend URL for CORS

# SMTP Verification
SMTP_TIMEOUT=10000                 # SMTP connection timeout (ms)
HELO_DOMAIN=localhost              # EHLO domain
MAIL_FROM=verify@localhost         # MAIL FROM address

# Processing
CONCURRENCY=5                      # Max concurrent verifications
MAX_RETRIES=3                      # Greylisting retry count

# Storage
DB_PATH=../data/verifier.db       # SQLite database path
EXPORTS_DIR=../exports             # CSV export directory
LOGS_DIR=../logs                   # Log files directory

# Logging
LOG_LEVEL=info                     # Log level (error/warn/info/debug)
```

## Email Classification

| Status | Confidence | Meaning |
|--------|-----------|---------|
| **Valid** | 80–100% | SMTP accepted, mailbox exists, not catch-all |
| **Invalid** | 0–30% | Syntax error, domain doesn't exist, or SMTP rejected |
| **Catch-All** | 40–60% | Domain accepts all addresses, mailbox may not exist |
| **Risky** | 40–79% | Disposable email, role account, or greylisted |
| **Unknown** | 0–50% | SMTP timeout, connection error, or indeterminate |

## Troubleshooting

### Port 25 Blocked

Many ISPs and cloud providers block outbound port 25. To check:

```bash
telnet gmail-smtp-in.l.google.com 25
```

If connection fails, SMTP verification won't work. The app will still:
- ✅ Validate syntax
- ✅ Detect disposable domains
- ✅ Detect role accounts
- ✅ Validate DNS/MX records
- ⚠️ Mark SMTP-unreachable emails as "Unknown"

**Solutions:**
- Run from a VPS/server with port 25 open
- Use a home network (most residential ISPs allow port 25)
- Check if your firewall blocks outbound connections

### DNS Resolution Issues

If DNS lookups fail:
```bash
# Test DNS resolution
nslookup -type=MX gmail.com
```

### Rate Limiting

If you're verifying large batches and getting blocked:
1. Reduce `CONCURRENCY` in `.env` (try 2-3)
2. Increase `SMTP_TIMEOUT` to 15000+
3. Take breaks between large batches
4. Consider running from different IPs

### Database Issues

The SQLite database is stored at `data/verifier.db`. To reset:
```bash
rm data/verifier.db
# Restart the backend - it will recreate the database
```

### Build Errors

```bash
# Clear node_modules and reinstall
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

## Project Structure

```
email-verifier/
├── frontend/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   ├── dashboard/         # Dashboard widgets
│   │   │   ├── upload/            # File upload components
│   │   │   ├── history/           # Verification history
│   │   │   ├── export/            # Export controls
│   │   │   └── layout/            # App layout
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # Utilities, API client, types
│   │   └── pages/                 # Page components
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                       # Express + TypeScript backend
│   ├── src/
│   │   ├── config/                # Environment config
│   │   ├── db/                    # SQLite database
│   │   ├── routes/                # API routes
│   │   ├── services/
│   │   │   └── verification/      # 10-step pipeline
│   │   ├── types/                 # TypeScript types
│   │   ├── utils/                 # Logger, helpers
│   │   └── data/                  # Disposable domains, role accounts
│   ├── package.json
│   └── .env
│
├── exports/                       # Generated CSV exports
├── logs/                          # Application logs
├── data/                          # SQLite database
└── README.md
```

## License

MIT License — free to use, modify, and distribute.
