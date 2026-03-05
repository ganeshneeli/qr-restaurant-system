# Restaurant System - Backend

Welcome to the backend server for the Restaurant System! This is a Node.js and Express-based API that handles authentication, order management, menu items, and table activations.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (Running locally or a cloud URI)

### Local Development

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the `backend` root (see [Environment Variables](#environment-variables) below).

4.  **Seed the database (Optional but recommended for first run):**
    ```bash
    node seedTables.js
    node seedMenu.js
    node seedAdmin.js
    ```

5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:5000` (by default).

## 🔑 Environment Variables

Create a `.env` file in the root of the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_for_auth
SESSION_SECRET=your_session_secret
```

## 📂 Project Structure

- `src/controllers/`: Logic for handling API requests.
- `src/models/`: Mongoose schemas for MongoDB.
- `src/routes/`: API endpoint definitions.
- `src/middleware/`: Authentication and validation logic.
- `public/uploads/`: Local storage for menu item images.

## 🛠 Features

- **Authentication:** JWT-based login for admins and session-based auth for table orders.
- **Menu Management:** CRUD operations for food items including image uploads.
- **Order System:** Real-time order tracking and status updates.
- **Table Activation:** QR code or code-based activation for tables.

---
*Built with Node.js, Express, and Mongoose.*
