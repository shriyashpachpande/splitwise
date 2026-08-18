# 💸 Equally Split — Enterprise-Grade Financial Expense & Debt Settlement Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-6366F1?style=for-the-badge&logo=vercel&logoColor=white)](https://splitwise-lilac.vercel.app/login)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Security](https://img.shields.io/badge/Security-Bank--Grade%20Hardened-EMERALD?style=for-the-badge&logo=shield&logoColor=white)](#-bank-grade-security--anti-hacking-architecture)

> **Live Production URL:** [https://splitwise-lilac.vercel.app/login](https://splitwise-lilac.vercel.app/login)

---

## 🌟 Overview

**Equally Split** is a full-stack, enterprise-grade financial management platform designed for group trip expenses, shared household budgets, and automated debt settlement calculations. Built with a modern tech stack (React 19, Express.js, MongoDB Atlas), it provides real-time debt matrix optimization, animated 3D infographics, automated email OTP authentication, and bank-grade security protocols against web vulnerabilities.

---

## 🚀 Key Features

### 📊 1. Visual Analytics & 3D Infographic Dashboard
* **3D Isometric Member Spending Columns:** Interactive 3D infographic column chart visualizing out-of-pocket contributions per member with scroll-driven fill animations.
* **3D Radial Category Gauge Rings:** Multi-layered radial gauge rings detailing category expenditure proportions.
* **SVG Category Donut Graph:** Real-time percentage distribution graph across custom expense categories.
* **Net Position Matrix:** Instant breakdown of individual member receivables (+) vs. liabilities (-).

### ⚖️ 2. Pairwise Debt Settlement Engine
* **Simplified Debt Matrix:** Algorithmically reduces complex multi-member debts into the minimum required financial transfers (e.g., reduces 10 cross-payments down to 2 optimized transfers).
* **One-Click Settlement CTA:** Direct integration for settling pending balances between members with instant balance updates.

### 🔔 3. Real-Time Activity & Notifications
* **Interactive Notification Drawer:** Live notification bell feed tracking newly added expenses, settlements, and member joins.
* **Animated Activity Page:** 3D animated history feed with unread badges and single-click "Mark All as Read" capabilities.

### 📄 4. Financial Reporting & Export Suite
* **PDF Statement Export:** One-click generation of formatted PDF expense reports powered by `jsPDF` and `jspdf-autotable`.
* **Excel Spreadsheet Export:** Structured `.xlsx` spreadsheet exports for financial auditing powered by `xlsx`.

---

## 🛡️ Bank-Grade Security & Anti-Hacking Architecture

To protect user accounts, financial data, and system resources against unauthorized access and common cyber threats, **Equally Split** implements a multi-layered security suite:

```
                  ┌─────────────────────────────────────────┐
                  │          Incoming HTTP Request          │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 1. Helmet Security Headers & CORS Guard │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 2. Express Rate Limiter (DDoS Throttling)│
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 3. Mongo Sanitize (NoSQL Anti-Injection)│
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 4. Recursive XSS Input Sanitizer        │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 5. HttpOnly Cookie & JWT Token Auth     │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 6. Account Lockout & Security Audit Log │
                  └─────────────────────────────────────────┘
```

### 🔐 Security Implementation Details:

1. **HttpOnly Cookie Authentication (XSS Token Theft Protection)**
   * Authentication tokens (`JWT`) are delivered via `HttpOnly`, `Secure`, `SameSite=lax` cookies.
   * Client-side JavaScript cannot access the authentication token, completely eliminating token theft via malicious XSS scripts.

2. **Recursive XSS Sanitizer Middleware (`xss`)**
   * Custom middleware recursively strips HTML script tags, malicious attributes (`onload`, `onerror`), and vector payloads from `req.body`, `req.query`, and `req.params`.

3. **Account Lockout Policy (Brute-Force & Dictionary Defense)**
   * Implemented at the database model layer (`User` schema).
   * Automatically locks user accounts for **15 minutes** after **5 consecutive failed login attempts**.
   * Provides informative lockout countdown notifications while blocking brute-force login loops.

4. **Rate Limiting (DDoS Throttling)**
   * Protected with `express-rate-limit`:
     * **API Limiter:** Caps general requests to 300 requests per 15 minutes per IP.
     * **Auth Limiter:** Restricts authentication endpoints (`/login`, `/register`, `/send-otp`) to **15 attempts per 15 minutes** to prevent credential stuffing.

5. **NoSQL Injection Prevention (`express-mongo-sanitize`)**
   * Automatically strips `$` and `.` operators from incoming request objects, preventing attackers from injecting NoSQL query logic.

6. **HTTP Security Headers (`helmet`)**
   * Configured with `helmet` to enforce Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), Clickjacking frameguards, and MIME-type sniffing protections.

7. **3-Step Email OTP Identity Verification (Password Reset & Registration)**
   * Multi-stage OTP verification using **Nodemailer (SMTP)**:
     * **Step 1:** Enter email to dispatch a dynamic 6-digit OTP code to the user's email inbox.
     * **Step 2:** Verify 6-digit OTP code against MongoDB with 10-minute expiration enforcement.
     * **Step 3:** Set & update new password with automatic account lockout reset.

8. **Security Audit Trail (`SecurityLog` Model)**
   * Logs security events (`FAILED_LOGIN`, `ACCOUNT_LOCKED`, `PASSWORD_CHANGED`) alongside client IP address and user-agent string for forensic auditing.

---

## 🛠️ Technology Stack

### **Frontend**
* **Framework:** React 19 + Vite 8
* **Styling:** TailwindCSS v4 + Custom Vanilla CSS Design System
* **Animations:** Framer Motion 13 + Lenis Smooth Scroll
* **Icons:** Lucide React
* **Document Export:** jsPDF, XLSX

### **Backend**
* **Runtime:** Node.js + Express.js
* **Database:** MongoDB Atlas + Mongoose ORM
* **Authentication:** JSON Web Tokens (`jsonwebtoken`) + Cookie-Parser
* **Email Service:** Nodemailer (Gmail SMTP)
* **Security Libraries:** `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `xss`, `bcryptjs`

---

## 📂 Project Structure

```
splitwise/
├── client/                      # React Frontend Application
│   ├── src/
│   │   ├── components/          # Reusable UI Components & Modals
│   │   │   ├── ForgotPasswordModal.jsx
│   │   │   ├── ThreeDColumnChart.jsx
│   │   │   ├── ThreeDGaugeRings.jsx
│   │   │   └── VisualAnalyticsDashboard.jsx
│   │   ├── context/             # React Context (AuthContext, NotificationContext)
│   │   ├── pages/               # Application Pages (Dashboard, GroupDetails, Activity)
│   │   └── services/            # Axios API Service Configuration
│   ├── index.html
│   └── vite.config.js
│
├── server/                      # Node.js Express Backend Engine
│   ├── config/                  # Database Configuration (db.js)
│   ├── controllers/             # Auth, Group, Expense, Notification Controllers
│   ├── middleware/              # Auth & XSS Sanitizer Middleware
│   ├── models/                  # Mongoose Schemas (User, Group, Expense, SecurityLog)
│   ├── routes/                  # Express Router Endpoints
│   ├── services/                # Analytics & Email Services
│   └── server.js                # Server Entrypoint & Middleware Pipeline
│
├── api/                         # Vercel Serverless Function Entrypoint
│   └── index.js
├── package.json                 # Root Package Manifest
└── vercel.json                  # Vercel Serverless Build & Rewrite Config
```

---

## 💻 Local Setup & Installation

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher
* **MongoDB:** Local instance or MongoDB Atlas cluster connection string

### Step 1: Clone Repository
```bash
git clone https://github.com/shriyashpachpande/splitwise.git
cd splitwise
```

### Step 2: Install Dependencies
```bash
# Install root, server, and client dependencies
npm run install:all
```

### Step 3: Configure Environment Variables
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development

# SMTP Email Setup (For 6-Digit Email OTPs)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Step 4: Run Application Locally
```bash
# Terminal 1: Start Backend Server
cd server
npm run dev

# Terminal 2: Start Frontend Application
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🌐 Production Deployment

The application is deployed on **Vercel**:
* **Frontend & Backend API Serverless Deployment:** [https://splitwise-lilac.vercel.app/login](https://splitwise-lilac.vercel.app/login)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.
