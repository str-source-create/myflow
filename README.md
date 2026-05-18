# CleanFlow

CleanFlow is a full-stack cleaning operations app with:
- Frontend: React + Vite (port 5173)
- Backend: Express + MongoDB (port 3000)

## Requirements

- Node.js 18+ (recommended 20+)
- npm
- MongoDB connection configured in backend `.env`

## Install

Run once from the project root:

```powershell
npm install
cd backend
npm install
```

## Run The Full App (Frontend + Backend)

Open two terminals.

### Terminal 1: Backend API

```powershell
cd backend
npm run dev
```

Backend default URL: http://localhost:3000

### Terminal 2: Frontend

```powershell
npm run dev
```

Frontend default URL: http://localhost:5173

## Optional: Seed Data

Use seed when you want demo/test data.

Important: the seed script clears existing seed collections first.

```powershell
cd backend
npm run seed
```

Seeded demo users:
- Admin: admin@cleanflow.com / admin123
- Worker: jessica@cleanflow.com / worker123

## How To Stop / Kill Running App Terminals

## Option A: Stop from the active terminal

Press Ctrl+C in each running terminal (frontend and backend).

## Option B: Kill by port on Windows

If a process is stuck and still holding a port:

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID_FROM_NETSTAT> /F

netstat -ano | findstr :5173
taskkill /PID <PID_FROM_NETSTAT> /F
```

## Option C: VS Code terminal UI

Click the trash icon on the terminal tab to kill that terminal session.

## Quick Health Checks

- Backend health: http://localhost:3000/
- Frontend: http://localhost:5173

