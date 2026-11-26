# Ideamagix CRM – Lead Management System

A full-stack Customer Relationship Management (CRM) application built using the **MERN stack** to manage leads, assign agents, track conversions and monitor team performance through a centralized dashboard.

## Features

### 1. Authentication & Authorization
- Secure login and logout.
- JWT-based authentication.
- Password hashing using bcrypt.
- Role-based access control and protected routes.

### 2. User Management
- Create, view, update and delete users.
- Manage Sub-Admins and Support Agents.
- Activate and deactivate accounts.

### 3. Lead Management
- Complete lead CRUD operations.
- Assign leads to Support Agents.
- Search by name, email and phone.
- Filter leads by status and other criteria.
- Track statuses: New, Contacted, Qualified, Lost and Won.

### 4. Tags & Notes
- Organize leads using tags.
- Add notes and comments.
- Track note authors and timestamps.

### 5. Dashboard & Analytics
- Total lead statistics and status distribution.
- Recent activity tracking.
- Agent performance monitoring.
- Assigned, Won, Lost and Pending lead counts.
- Agent conversion rates.

### 6. Excel Management
- Import leads from Excel files.
- Export lead records to Excel.
- Filter records before exporting.
- Export lead details, including tags and notes.

## User Roles

| Role | Permissions |
|---|---|
| Super Admin | User management, lead management and overall system access |
| Sub-Admin | Lead management, agent assignment and team monitoring |
| Support Agent | View and update assigned leads and add notes |

## Technology Stack

**Frontend:** React.js, Vite, Tailwind CSS, React Router DOM, Axios, Lucide React, Recharts

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Multer, XLSX

**Tools:** VS Code, Git, GitHub, Postman

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Mediwateyash/Ideamagix_CRM.git
cd Ideamagix_CRM
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ideamagix_crm
JWT_SECRET=your_long_random_secret_key
```

Start the backend:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

### 3. Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Author

**Yash Diwate**

Computer Engineering | Full Stack Web Development

GitHub: [@Mediwateyash](https://github.com/Mediwateyash)

---

* Developed as a CRM application project for the Ideamagix assignment. *