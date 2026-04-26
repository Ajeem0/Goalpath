# 🎯 GoalPath — Interview Prep Platform

An advanced full-stack platform to help students crack product-based company interviews by combining DSA pattern recognition, DBMS analysis, project-based learning, and daily goal tracking.

---

## 📁 Project Structure

```
goalpath/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── auth.js               # JWT protect middleware
│   ├── models/
│   │   ├── User.js               # User + XP + badges + streaks
│   │   ├── DSAProblem.js         # DSA problems with pattern tracking
│   │   ├── DBMSAnalysis.js       # DBMS case studies
│   │   ├── Project.js            # Projects with concept mapping
│   │   ├── DailyGoal.js          # Daily goals + streaks
│   │   └── Roadmap.js            # Learning roadmaps
│   ├── routes/
│   │   ├── auth.js               # Auth + profile + notifications
│   │   ├── dsa.js                # DSA CRUD + badge logic
│   │   ├── dbms.js               # DBMS CRUD + badge logic
│   │   ├── projects.js           # Projects CRUD + feature toggling
│   │   ├── goals.js              # Daily goals + streak tracking
│   │   └── analytics.js          # Unified analytics + suggestions
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   └── Sidebar.css
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── AuthPage.jsx / .css
    │   │   ├── Dashboard.jsx / .css
    │   │   ├── DSAPractice.jsx / .css
    │   │   ├── DBMSAnalysis.jsx / .css
    │   │   ├── Projects.jsx / .css
    │   │   ├── DailyGoals.jsx / .css
    │   │   ├── Analytics.jsx / .css
    │   │   └── Profile.jsx / .css
    │   ├── utils/
    │   │   └── api.js            # Axios instance + all API calls
    │   ├── App.jsx
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## ⚙️ Prerequisites

- Node.js v18+
- PostgreSQL (local, Neon, Supabase, etc.)
- npm or yarn

---

## 🚀 Setup Instructions

### 1. Clone / Extract the Project

```bash
cd goalpath
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goalpath
PGSSLMODE=disable
JWT_SECRET=your_super_secret_key_here_change_this
NODE_ENV=development
```

> For hosted PostgreSQL (Neon/Supabase/etc.), set SSL mode to require:
> `PGSSLMODE=require`

Start the backend:

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Backend runs on: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

The `proxy` field in `package.json` auto-routes API calls to port 5000.

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/auth/notifications` | Get notifications |
| PUT | `/api/auth/notifications/:id/read` | Mark notification read |

### DSA Practice
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dsa` | Get all problems (filter: pattern, difficulty) |
| POST | `/api/dsa` | Add new problem |
| PUT | `/api/dsa/:id` | Update problem |
| DELETE | `/api/dsa/:id` | Delete problem |
| GET | `/api/dsa/stats` | DSA statistics |

### DBMS Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dbms` | Get all analyses (filter: problemType) |
| POST | `/api/dbms` | Add new analysis |
| PUT | `/api/dbms/:id` | Update analysis |
| DELETE | `/api/dbms/:id` | Delete analysis |
| GET | `/api/dbms/stats` | DBMS statistics |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects (filter: status) |
| POST | `/api/projects` | Create new project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| PUT | `/api/projects/:id/feature/:fid` | Toggle feature complete |

### Daily Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals/today` | Get today's goals (auto-creates if empty) |
| POST | `/api/goals/today` | Add a goal to today |
| PUT | `/api/goals/:id/complete/:goalId` | Complete a goal |
| GET | `/api/goals/history` | Get last 14 days history |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Full analytics overview |

---

## 🎮 Gamification

### XP System
| Action | XP Earned |
|--------|-----------|
| Easy DSA problem | 10 XP |
| Medium DSA problem | 20 XP |
| Hard DSA problem | 35 XP |
| DBMS analysis | 15 XP |
| Project created | 20 XP |
| Project completed | 100 XP |
| Daily goal completed | varies |
| All goals done (bonus) | +25 XP |

### Badges
| Badge | Requirement |
|-------|-------------|
| 🎯 Problem Solver | 10 DSA problems |
| ⚔️ DP Warrior | 5 DP problems |
| 🧠 DP Master | 15 DP problems |
| 🕸️ Graph Explorer | 5 Graph problems |
| 🏆 DSA Champion | 50 DSA problems |
| 🗄️ DBMS Starter | 3 DBMS analyses |
| 💎 DBMS Expert | 10 DBMS analyses |
| 🔐 Transaction Master | 3 Transaction analyses |
| ⚡ Index Optimizer | 5 Indexing analyses |
| 🚀 Project Starter | 1 project created |
| 🏗️ Project Builder | 3 projects completed |
| 👑 Project Master | 5 projects completed |

---

## ☁️ Deployment

### Option A: Railway (Recommended — Free Tier)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create new project → Deploy from GitHub
4. Add MongoDB plugin or connect MongoDB Atlas
5. Set environment variables in Railway dashboard
6. Deploy backend; for frontend use **Vercel** or **Netlify**

### Option B: Render

```bash
# Backend: Web Service
# Root Directory: backend
# Build Command: npm install
# Start Command: node server.js

# Frontend: Static Site
# Root Directory: frontend
# Build Command: npm run build
# Publish Directory: build
```

### Option C: VPS (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Start backend
cd goalpath/backend
pm2 start server.js --name goalpath-api

# Build frontend
cd goalpath/frontend
npm run build
# Serve with nginx or serve package

# Install nginx
sudo apt install nginx
# Configure reverse proxy to port 5000
```

### Option D: Docker

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/goalpath
      - JWT_SECRET=your_secret
    depends_on:
      - mongo
  
  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

```bash
docker-compose up -d
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | ✅ Yes | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | Secret for JWT signing |
| `NODE_ENV` | No | `development` or `production` |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts |
| Styling | Custom CSS with CSS Variables (dark theme) |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | express-validator |

---

## 🎨 Features at a Glance

- ✅ JWT Authentication with streak tracking on login
- ✅ DSA Problem logging with 15 pattern types + learning insights
- ✅ DBMS Analysis with SQL code, concept mapping, real-world context
- ✅ Project Tracker with feature toggles, concept + learning mapping
- ✅ Daily Goal System with auto-generation by skill level
- ✅ Smart AI-style suggestions based on weak areas
- ✅ Full Analytics dashboard with Recharts (Radar, Pie, Bar charts)
- ✅ XP + Badge gamification system
- ✅ Notification system
- ✅ Responsive dark-theme UI

---

## 📝 License

MIT — Build freely, prep hard, crack that interview! 🚀
