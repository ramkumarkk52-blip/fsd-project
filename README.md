# 🏋️‍♂️ Fitness Center Management System (Full Stack FSD Project)

A complete, production-ready **Fitness Center Management System** built with **React.js**, **Node.js + Express.js**, and **MySQL**. Featuring dedicated dashboards for **Administrators**, **Personal Trainers**, and **Gym Members**, with secure JWT authentication, interactive analytics charts, and comprehensive CRUD management modules.

---

## 🌟 Key Features & User Roles

### 1. 🛡️ Administrator Portal
* **Analytics & Executive Dashboard**:
  * Real-time metrics: Total Members, Active Members, Trainers, Plans, Lifetime Revenue, Today's Attendance.
  * Interactive **Monthly Revenue Trend** bar chart & **Membership Distribution** doughnut chart.
  * Automated 30-day subscription expiration warning alerts.
* **Member Management (CRUD)**:
  * Register new members, search by name/email/phone, filter by plan/trainer/status.
  * Edit member records, view full fitness & subscription dossiers, delete members (cascades cleanly).
* **Trainer Management (CRUD)**:
  * Hire & manage trainers, assign specializations (Hypertrophy, HIIT, Yoga, CrossFit), track client load, hourly rates.
* **Membership Plans Management (CRUD)**:
  * Create, edit, and price membership packages (Basic, Pro Athlete, Elite VIP, Annual Club) with custom feature perk lists.
* **Subscription & Renewal Operations**:
  * Manage recurring billing cycles, payment modes (Card, Cash, UPI, Netbanking), and manual expiration/renewal adjustments.
* **Gym-Wide Attendance Tracking**:
  * Real-time daily entry & exit log, manual check-in overrides, status tagging (Present, Absent, Late).

---

### 2. 🏅 Trainer Portal
* **Trainer Command Center**:
  * Key stats: Assigned athletes count, active workout plans, scheduled sessions for today.
* **Client & Trainee Oversight**:
  * Dedicated list of assigned members with direct access to their progress dossiers and training programs.
* **Custom Workout Routine Builder**:
  * Interactive exercise program builder: sets, reps, target weights/durations, and coaching form cues.
* **Class & Appointment Scheduling**:
  * Schedule 1-on-1 personal training sessions, consultations, or open group workshops.
* **Athlete Progress Logging**:
  * Record weigh-ins, automated BMI calculations, body fat %, and muscular measurements (chest, waist, arms).

---

### 3. 👤 Member Portal
* **Member Self-Service Dashboard**:
  * Active membership tier card with real-time countdown to expiration.
  * Assigned personal coach details with direct contact info.
  * Active workout routine preview with key exercise sets and targets.
  * Attendance history & 1-click self check-in button.
* **Training Routines**:
  * Browse full exercise breakdown prescribed by their dedicated trainer.
* **Class & Slot Booking**:
  * View open group workshops and personal training slots and register with 1 click.
* **Progress Tracking & Analytics**:
  * Interactive line charts visualizing weight trajectory and body fat percentage trends across milestones.
* **Subscription Management**:
  * View payment receipts, expiration dates, and renew membership packages directly.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js 18, React Router v6, Bootstrap 5, Lucide React, Chart.js, React-ChartJS-2 |
| **Backend** | Node.js, Express.js (REST API, MVC Architecture, Morgan, CORS) |
| **Database** | MySQL Server 8.0, `mysql2/promise` connection pooling |
| **Security** | `bcryptjs` password hashing, JSON Web Tokens (JWT), Role-Based Access Control (RBAC) |
| **Build Tools** | Vite 5 |

---

## 🗄️ Database Architecture & Tables

Database Name: `fitness_center_db`

```
fitness_center_db
├── users (id, name, email, password, role, phone, address, avatar_url, status)
├── trainers (id, user_id, specialization, experience_years, bio, hourly_rate, hire_date)
├── memberships (id, name, description, duration_months, price, features, status)
├── members (id, user_id, trainer_id, membership_id, gender, dob, emergency_contact, health_conditions, join_date, status)
├── subscriptions (id, member_id, membership_id, start_date, end_date, amount_paid, payment_method, payment_status, status)
├── workout_plans (id, title, description, member_id, trainer_id, goal, difficulty, schedule_days, exercises, status)
├── schedules (id, trainer_id, member_id, session_title, session_type, session_date, start_time, end_time, capacity, room, status)
├── attendance (id, member_id, date, check_in_time, check_out_time, status, notes)
└── fitness_progress (id, member_id, recorded_by, date, weight_kg, height_cm, bmi, body_fat_percentage, chest_cm, waist_cm, arms_cm, notes)
```

---

## 🔑 Demo Login Credentials

The system comes pre-seeded with realistic records and accounts for all roles:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fitness.com` | `AdminPassword123!` | System Administrator (Full System Control) |
| **Trainer** | `marcus@fitness.com` | `TrainerPassword123!` | Strength & Conditioning Coach |
| **Trainer** | `elena@fitness.com` | `TrainerPassword123!` | HIIT & Mobility Specialist |
| **Trainer** | `david@fitness.com` | `TrainerPassword123!` | Weight Loss & Cardio Coach |
| **Member** | `member@fitness.com` | `MemberPassword123!` | Sarah Jenkins (Pro Athlete Plan) |
| **Member** | `michael@fitness.com` | `MemberPassword123!` | Michael Torres (Elite VIP Plan) |
| **Member** | `aaliyah@fitness.com` | `MemberPassword123!` | Aaliyah Patel (Basic Fitness Plan) |

> 💡 **Quick Login**: The Login page includes one-click buttons for Admin, Trainer, and Member to quickly test each role without typing!

---

## 🚀 Quick Start Guide

### 1. Database Setup
Ensure MySQL Server 8.0 is running.
Verify or adjust your credentials in `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fitness_center_db
DB_PORT=3306
JWT_SECRET=fitness_center_super_secret_jwt_key_2026_!@#$
JWT_EXPIRES_IN=7d
```

Run the automated database schema creation & seeding script:
```bash
npm run seed
# or
node backend/database/seed.js
```

### 2. Run the Full Stack Application
You can run the unified application directly:
```bash
npm start
```
The server will boot up and host the complete web portal at:
👉 **`http://localhost:5000`**

### 3. (Optional) Run Backend & Frontend in Development Mode
If you prefer running Vite's hot-reload server alongside the backend:

* **Backend API**:
  ```bash
  cd backend
  npm run dev
  # Runs on http://localhost:5000
  ```
* **Frontend React Client**:
  ```bash
  cd frontend
  npm run dev
  # Runs on http://localhost:3000 (proxies /api to 5000)
  ```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Public member registration
* `POST /api/auth/login` - Authenticate user & return JWT token
* `GET  /api/auth/me` - Get profile of authenticated user
* `PUT  /api/auth/profile` - Update user profile information
* `PUT  /api/auth/change-password` - Securely change account password

### Dashboard & Analytics (`/api/dashboard`)
* `GET  /api/dashboard/admin` - Admin KPIs, revenue trend, and membership breakdown
* `GET  /api/dashboard/trainer` - Trainer trainees, upcoming sessions, and recent logs
* `GET  /api/dashboard/member` - Member's plan status, active workout, and attendance

### Members (`/api/members`)
* `GET    /api/members` - List members with search & filter options
* `GET    /api/members/:id` - Get detailed member profile with subscriptions & routines
* `POST   /api/members` - Register member (Admin)
* `PUT    /api/members/:id` - Update member details (Admin/Trainer)
* `DELETE /api/members/:id` - Remove member (Admin)

### Trainers (`/api/trainers`)
* `GET    /api/trainers` - List trainers and specializations
* `GET    /api/trainers/:id` - Get trainer profile and assigned client roster
* `POST   /api/trainers` - Add new trainer (Admin)
* `PUT    /api/trainers/:id` - Update trainer information (Admin/Trainer)
* `DELETE /api/trainers/:id` - Remove trainer (Admin)

### Membership Plans (`/api/memberships`)
* `GET    /api/memberships` - List all membership packages
* `GET    /api/memberships/:id` - Get plan details
* `POST   /api/memberships` - Create plan (Admin)
* `PUT    /api/memberships/:id` - Update plan (Admin)
* `DELETE /api/memberships/:id` - Delete plan (Admin)

### Subscriptions & Renewals (`/api/subscriptions`)
* `GET  /api/subscriptions` - View all subscription records (Admin)
* `GET  /api/subscriptions/my` - View logged-in member's subscriptions
* `POST /api/subscriptions` - Create / renew subscription
* `PUT  /api/subscriptions/:id` - Update status (active, expired, renewed, cancelled)

### Workout Plans (`/api/workout-plans`)
* `GET    /api/workout-plans` - List workout routines
* `GET    /api/workout-plans/:id` - View routine with exercise list
* `POST   /api/workout-plans` - Create workout plan for member (Trainer/Admin)
* `PUT    /api/workout-plans/:id` - Update plan (Trainer/Admin)
* `DELETE /api/workout-plans/:id` - Delete plan (Trainer/Admin)

### Training Schedule (`/api/schedules`)
* `GET    /api/schedules` - List schedule sessions and open classes
* `POST   /api/schedules` - Schedule training session or class (Trainer/Admin)
* `PUT    /api/schedules/:id` - Update session
* `POST   /api/schedules/:id/book` - Book session (Member)
* `DELETE /api/schedules/:id` - Cancel session

### Attendance (`/api/attendance`)
* `GET    /api/attendance` - Query attendance records (Admin/Trainer)
* `GET    /api/attendance/my` - View own check-in history (Member)
* `POST   /api/attendance` - Record check-in
* `PUT    /api/attendance/:id/checkout` - Record check-out time
* `DELETE /api/attendance/:id` - Remove record (Admin)

### Fitness Progress (`/api/progress`)
* `GET    /api/progress/:memberId` - Get progress milestones for member
* `POST   /api/progress` - Record weight, BMI, body fat %, measurements
* `DELETE /api/progress/:id` - Remove milestone record

---

## 🧪 Automated Testing
Run the comprehensive integration test suite to verify end-to-end functionality:
```bash
npm test
```
Outputs status of health check, frontend delivery, database queries, and role-based login tests.
