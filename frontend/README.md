# Restaurant System - Frontend

Welcome to the sleek, modern frontend for the Restaurant System! This application provides a premium user interface for both customers (table ordering) and administrators (dashboard).

## ✨ Features

- **Customer Experience:** Browse the menu, select items, and place orders directly from the table.
- **Admin Dashboard:** Manage menu items, track real-time orders, and manage table activations.
- **Responsive Design:** Optimized for tablets, desktops, and mobile devices using Tailwind CSS and shadcn/ui.
- **Real-time Updates:** Powered by Socket.io for instant order notifications.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Backend server running (see [Backend README](../backend/README.md))

### Local Development

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:8080`.

## 🛠 Tech Stack

- **Framework:** React with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS & shadcn/ui
- **State Management:** TanStack Query (React Query)
- **Icons:** Lucide React
- **Animations:** Framer Motion

## 🔗 Connection to Backend

The frontend communicates with the backend API. Ensure your backend is running on the port specified in `src/api/axios.ts` (default is usually `http://localhost:5001`).

---
*Created with a focus on visual excellence and productivity.*
