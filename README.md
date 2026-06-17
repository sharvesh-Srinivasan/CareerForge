# CareerForge 🎯

> A premium placement and internship management platform for Indian college students.

Track every application, record interview rounds, upload resume versions, and receive automated WhatsApp + email reminders — all in a clean, Linear-inspired interface.

---

## ✨ Features

- **Application Tracker** — Full CRUD with status pipeline, search, filter, sort
- **Interview Timeline** — Round-by-round tracker with questions, topics, difficulty, outcomes
- **Resume Manager** — Upload multiple resume versions via Cloudinary, track performance metrics
- **Smart Reminders** — Automated email + WhatsApp notifications via Twilio and Gmail SMTP
- **Analytics Dashboard** — Funnel charts, monthly trends, conversion rates, resume performance
- **JWT Auth** — Secure login with bcrypt password hashing
- **Activity Feed** — Real-time log of all placement actions

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Tailwind CSS v4 |
| Routing | React Router v6 |
| Forms | React Hook Form |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js + Express.js |
| Database | MySQL (mysql2 + promise pool) |
| Auth | JWT + bcryptjs |
| File Upload | Cloudinary + Multer |
| Email | Nodemailer (Gmail SMTP) |
| WhatsApp | Twilio WhatsApp API |
| Scheduler | node-cron |
| Hosting (FE) | Vercel |
| Hosting (BE) | Render |
| Database Host | Aiven (free MySQL) |
| CI/CD | GitHub Actions + GHCR |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- MySQL (local or cloud)
- Cloudinary account (free tier)
- Gmail account with App Password enabled

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/careerforge.git
cd careerforge
```

### 2. Setup Server

```bash
cd server
cp ../.env.example .env   # Fill in your credentials
npm install
```

### 3. Setup Database

```bash
# Run schema against your MySQL instance
mysql -u root -p < ../schema.sql

# Seed with test data
node seed.js
```

### 4. Setup Client

```bash
cd ../client
cp .env.example .env      # Set VITE_API_URL=http://localhost:4000
npm install
```

### 5. Run Development

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Test credentials:**
- Email: `test@careerforge.com`
- Password: `test123`

---

## 🐳 Docker Compose

```bash
# Copy and fill env vars
cp .env.example server/.env

# Build and run
docker compose up --build
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:4000](http://localhost:4000)

---

## ☁️ Production Deployment

### Step 1: Database (Aiven)
1. Create free MySQL instance at [aiven.io](https://aiven.io)
2. Run `schema.sql` in your Aiven console
3. Run `node server/seed.js` with Aiven credentials

### Step 2: Backend (Render)
1. New Web Service → connect GitHub repo
2. Root Directory: `server`
3. Build: `npm install`
4. Start: `node index.js`
5. Add all server env variables
6. URL: `https://careerforge-backend.onrender.com`

### Step 3: Frontend (Vercel)
1. Import GitHub repo
2. Framework: Vite
3. Root Directory: `client`
4. Add: `VITE_API_URL=https://careerforge-backend.onrender.com`
5. URL: `https://careerforge.vercel.app`

### Step 4: GitHub Actions Secrets
Add these secrets to your repo:
- `RENDER_DEPLOY_HOOK_SERVER` — from Render deploy hooks

---

## 📁 Project Structure

```
careerforge/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # React Context (Auth)
│   │   └── api.js              # Axios client with interceptors
│   ├── Dockerfile
│   └── tailwind.config.js
│
├── server/                     # Express.js backend
│   ├── config/db.js            # MySQL pool (Aiven SSL)
│   ├── controllers/            # Request handlers
│   ├── routes/                 # Express routers
│   ├── middleware/             # Auth + Upload middleware
│   ├── services/               # Email + WhatsApp services
│   ├── jobs/reminderJob.js     # node-cron reminder scheduler
│   ├── seed.js                 # Database seeder
│   └── index.js                # App entry point
│
├── schema.sql                  # Full database schema
├── docker-compose.yml
└── .github/workflows/deploy.yml
```

---

## 🔐 Environment Variables

See `.env.example` for all required variables.

**Key variables:**
| Variable | Description |
|----------|-------------|
| `DB_HOST` | Aiven MySQL host |
| `JWT_SECRET` | Min 32-char secret |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail App Password (not your login password) |
| `TWILIO_ACCOUNT_SID` | Twilio credentials |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary credentials |

---

## 📡 API Reference

Base URL: `/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get current user |
| PATCH | `/auth/profile` | Update profile |
| GET | `/applications` | List applications |
| POST | `/applications` | Create application |
| GET | `/applications/stats` | Analytics stats |
| GET | `/applications/:id` | Get application + rounds |
| PATCH | `/applications/:id` | Update application |
| DELETE | `/applications/:id` | Delete application |
| GET | `/interviews/:appId` | List interview rounds |
| POST | `/interviews/:appId` | Add interview round |
| PATCH | `/interviews/round/:id` | Update round |
| GET | `/resumes` | List resumes |
| POST | `/resumes` | Upload resume |
| DELETE | `/resumes/:id` | Delete resume |
| GET | `/reminders` | List reminders |
| POST | `/reminders` | Create reminder |
| DELETE | `/reminders/:id` | Delete reminder |

---

## 🧪 Test Credentials

```
Email:    test@careerforge.com
Password: test123
```

Includes 8 sample applications across different stages, interview rounds, 2 resume versions, and 5 upcoming reminders.

---

## 📜 License

MIT License — built for Indian college students by Indian engineers. Go crack those placements! 🚀
