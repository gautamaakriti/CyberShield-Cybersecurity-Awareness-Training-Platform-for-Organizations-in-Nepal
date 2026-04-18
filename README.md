# 🛡️ CyberShield — Cybersecurity Awareness Training Platform for Organizations in Nepal

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

> A full-stack cybersecurity awareness training platform designed to help organizations in Nepal train employees, simulate phishing attacks, track awareness progress, and reduce human-error-based security risks.

---

## 📌 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Author](#author)

---

## 📖 About the Project

CyberShield is a cybersecurity awareness training platform built specifically for organizations operating in Nepal. It addresses the growing threat of phishing attacks and social engineering by providing:

- A structured training module system for employees
- Realistic phishing email simulations with difficulty levels
- Real-time tracking of employee awareness and risk scores
- An admin dashboard for managing employees, campaigns, and reports

This project was developed as a final year academic project to demonstrate a practical, full-stack solution to cybersecurity awareness gaps in Nepali organizations.

---

## ✨ Features

### 👤 Admin Panel
- **Employee Management** — Add, view, and manage employees across departments
- **Training Modules** — Create and assign video-based or quiz-based training content
- **Phishing Simulation** — Launch realistic phishing email campaigns with 3 difficulty levels (Easy, Medium, Hard)
- **AI Email Generator** — Auto-generate phishing/genuine emails using built-in templates across 4 categories (Password Reset, HR Notice, Finance, IT Alert)
- **Dashboard Analytics** — Track open rates, click rates, report rates, and ignored emails per campaign
- **Employee Risk Scoring** — Automatically calculate per-employee awareness scores and risk levels (Low / Medium / High)
- **Campaign Management** — View, delete, and drill into individual campaigns

### 👨‍💼 Employee Portal
- **Phishing Inbox** — Receive and interact with simulated phishing emails
- **Report Phishing / Spam** — Report suspicious emails to improve awareness score
- **Training Gate** — Access assigned training modules
- **Quiz System** — Complete quizzes after training modules
- **My Results** — View personal simulation results and feedback

### 📊 Tracking & Analytics
- Total campaigns, emails sent, open rate, click rate, report rate
- **Ignored count** — tracks employees who did not report phishing or spam
- Per-employee risk assessment with color-coded scores
- Full assignment results table with status badges

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Python, FastAPI |
| Database | SQLite (via SQLAlchemy ORM) |
| Auth | JWT-based authentication |
| State Management | Zustand |
| API Client | Axios |

---

## 📁 Project Structure

```
cyber-awareness-platform/
├── backend/
│   └── app/
│       ├── core/
│       │   ├── config.py         # App configuration
│       │   ├── database.py       # DB connection & session
│       │   └── security.py       # JWT & password hashing
│       ├── models/
│       │   ├── admin.py
│       │   ├── employee.py
│       │   ├── phishing.py       # PhishingCampaign & PhishingAssignment
│       │   ├── progress.py
│       │   ├── quiz.py
│       │   └── training_module.py
│       ├── routes/
│       │   ├── auth.py
│       │   ├── dashboard.py
│       │   ├── employees.py
│       │   ├── modules.py
│       │   ├── phishing.py       # All phishing simulation routes
│       │   └── training.py
│       └── main.py
├── frontend/
│   └── src/
│       ├── api/
│       │   └── client.ts         # Axios API client
│       ├── components/
│       │   └── layout/
│       │       ├── AdminLayout.tsx
│       │       └── Sidebar.tsx
│       ├── pages/
│       │   ├── admin/
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Employees.tsx
│       │   │   ├── Modules.tsx
│       │   │   ├── PhishingSimulation.tsx
│       │   │   └── Reports.tsx
│       │   └── employee/
│       │       ├── EmployeeLogin.tsx
│       │       ├── MyTraining.tsx
│       │       ├── PhishingInbox.tsx
│       │       ├── Quiz.tsx
│       │       └── VideoPlayer.tsx
│       ├── store/
│       │   └── authStore.ts
│       └── App.tsx
└── README.md
```

---

## 📸 Screenshots

> Add screenshots inside a `/screenshots` folder in the repo root and update the paths below.

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)

### Phishing Simulation
![Phishing Simulation](screenshots/phishing-simulation.png)

### Campaign Analytics
![Campaign Analytics](screenshots/campaign-analytics.png)

### Employee Phishing Inbox
![Employee Inbox](screenshots/employee-inbox.png)

### Training Module
![Training Module](screenshots/training-module.png)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- Python 3.11+
- Node.js 18+
- npm or yarn
- Git

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/gautamaakriti/CyberShield-Cybersecurity-Awareness-Training-Platform-for-Organizations-in-Nepal.git
cd CyberShield-Cybersecurity-Awareness-Training-Platform-for-Organizations-in-Nepal

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# 3. Install dependencies
cd backend
pip install -r requirements.txt

# 4. Create .env file
cp .env.example .env
# Edit .env with your settings

# 5. Run the backend server
uvicorn app.main:app --reload
```

Backend will be running at: `http://localhost:8000`

API docs available at: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000

# 4. Start the development server
npm run dev
```

Frontend will be running at: `http://localhost:5173`

---

## 📡 API Documentation

Full interactive API docs are available via Swagger UI at `http://localhost:8000/docs` when the backend is running.

### Auth Routes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Admin login |
| POST | `/auth/employee-login` | Employee login |

### Employee Routes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/employees/` | List all employees |
| POST | `/employees/` | Add new employee |
| DELETE | `/employees/{id}` | Delete employee |

### Phishing Routes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/phishing/generate-content` | Generate phishing email content |
| POST | `/phishing/create` | Create a new phishing campaign |
| GET | `/phishing/campaigns` | List all campaigns |
| DELETE | `/phishing/campaigns/{id}` | Delete a campaign |
| GET | `/phishing/dashboard` | Get stats, table, and employee scores |
| GET | `/phishing/inbox` | Employee — get assigned emails |
| POST | `/phishing/inbox/{id}/open` | Mark email as opened |
| POST | `/phishing/inbox/{id}/click` | Mark CTA as clicked |
| POST | `/phishing/inbox/{id}/report-phishing` | Report as phishing |
| POST | `/phishing/inbox/{id}/report-spam` | Report as spam |
| GET | `/phishing/my-result/{id}` | Get employee result & feedback |

### Training Routes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/modules/` | List all training modules |
| POST | `/modules/` | Create a training module |
| GET | `/training/my-modules` | Employee — get assigned modules |
| POST | `/training/complete/{id}` | Mark module as complete |

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch
```bash
git checkout -b feature/your-feature-name
```
3. Make your changes and commit
```bash
git commit -m "feat: describe your feature"
```
4. Push to your fork
```bash
git push origin feature/your-feature-name
```
5. Open a Pull Request against the `dev` branch

### Commit Message Convention
This project follows conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `style:` — formatting changes
- `refactor:` — code refactoring

---

## 👩‍💻 Author

**Aakrit Gautam**
- GitHub: [@gautamaakriti](https://github.com/gautamaakriti)

---

> Built as a Final Year Project — CyberShield aims to strengthen cybersecurity awareness in Nepali organizations through hands-on simulation and structured training. 🇳🇵
