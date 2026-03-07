# 🍽️ OG Restaurant - Smart Dine-In System

A premium, full-stack QR-based smart ordering system designed for modern restaurants. This platform bridges the gap between digital convenience and a premium dining experience.

---

## 🌟 Core Features

### 🛒 Customer Interface
- **QR-Based Access**: Instant menu access via table-specific QR codes.
- **Interactive Menu**: category-filtered browsing with beautiful animations.
- **Special Requests**: Add "Notes for Chef" (e.g., "Less spicy", "Extra cheese") directly to items.
- **Order Tracking**: Real-time status updates from the kitchen.
- **Feedback System**: Post-dining rating and review system to maintain high service standards.

### 🛡 Admin Dashboard
- **Live Summary**: Real-time metrics including **Total Orders**, **Today's Revenue**, and **Monthly Revenue**.
- **Analytics**: Most/Least ordered items tracked to optimize the menu.
- **Order Management**: Transition orders from "Pending" to "Preparing" to "Completed".
- **Enhanced History**:
  - **Sequential Order IDs** (e.g., #0001) for global tracking.
  - **Daily Serial Numbers** (resets to 1 daily) for easy kitchen management.
  - **Professional Filters**: Filter history by Today, Week, Month, or Custom Date Ranges.
- **Data Export**: Export filtered order history to CSV (includes items, amounts, and serials).
- **Table Management**: Dynamic creation and deletion of dining tables with automatic QR code generation.

### 📧 Automated Reporting
- **Monthly Revenue Reports**: Automated emails sent to all administrators on the 1st of every month via **Brevo API**.
- **Verified Deliverability**: Uses professional SDKs to ensure reports land in the inbox, not spam.

---

## 🛠 Technical Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), Socket.io |
| **Email Service** | Brevo (formerly Sendinblue) |
| **Automation** | node-cron (Schedule jobs) |
| **Deployment** | Render (Web Services & Static Sites) |

---

## 📁 Repository Structure

```text
.
├── backend/                # API & Business Logic
│   ├── src/
│   │   ├── config/         # Database & Socket configuration
│   │   ├── controllers/    # Request handlers (Orders, Tables, Auth)
│   │   ├── jobs/           # Automated tasks (Cron jobs)
│   │   ├── middleware/     # Security & Auth (JWT)
│   │   ├── models/         # MongoDB Schemas
│   │   ├── routes/         # API Endpoint definitions
│   │   └── app.js          # Express app setup
│   └── .env                # Server configuration (API keys)
│
├── frontend/               # User Interface
│   ├── src/
│   │   ├── api/            # Axios API instances
│   │   ├── components/     # Reusable UI parts (Cards, Buttons, etc.)
│   │   ├── context/        # Authentication & State management
│   │   ├── pages/          # Full layouts (AdminDashboard, Landing)
│   │   └── App.tsx         # Main routing
│
├── render.yaml             # Deployment configuration for Render
└── .gitignore              # Repository cleanup & protection
```

---

## 🚀 Setup & Installation

### 1. Backend Configuration
Navigate to the `/backend` folder and create a `.env` file:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=your@verified-email.com
SENDER_NAME=OG Restaurant
```
Run the server:
```bash
npm install
npm run dev
```

### 2. Frontend Configuration
Navigate to the `/frontend` folder and create a `.env` file:
```env
VITE_API_URL=https://your-api-url.com/api
```
Run the app:
```bash
npm install
npm run dev
```

---

## 🛡 Security & Maintenance
- **JWT Protection**: Admin routes are secured via JSON Web Tokens.
- **Clean Repository**: `.DS_Store` and `node_modules` are ignored via root `.gitignore`.
- **Manual Verification**: Test the email system using `node backend/src/jobs/testEmail.js`.

---
*Designed for performance, scalability, and visual excellence.*
