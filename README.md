## Healthcare Backend (Node.js + Express + MongoDB)

Features implemented:
- Authentication with roles: patient, doctor, admin (JWT + bcrypt)
- Appointments: book, list, reschedule, cancel
- Patient records: create by doctor/admin, list with access control
- Messaging: real-time via Socket.IO + REST endpoints
- Admin: manage users and view basic analytics
- Security: helmet, CORS, rate limiting, Mongo sanitize, xss-clean

### 1) Requirements
- Node.js 18+
- MongoDB (Atlas or local)

### 2) Setup
Create `.env` in project root:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=a-very-strong-secret
JWT_EXPIRES_IN=7d
PORT=4000

# Optional bootstrap admin
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin123
```

Install and run:

```
npm install
npm run dev
```

Health check:

```
GET http://localhost:4000/health
```

### 3) Auth
Register:
```
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "patient"  // or "doctor" or "admin"
}
```

Login:
```
POST /api/auth/login
{ "email": "john@example.com", "password": "secret123" }
```
Returns `{ token, user }`. Use header `Authorization: Bearer <token>` for protected routes.

Me:
```
GET /api/auth/me
```

### 4) Appointments
Create (patient only):
```
POST /api/appointments
{
  "doctorId": "<doctor_user_id>",
  "startTime": "2025-11-12T10:00:00.000Z",
  "endTime": "2025-11-12T10:30:00.000Z",
  "notes": "Follow up"
}
```

List:
```
GET /api/appointments
```
Patients see their own; doctors see theirs; admins see all.

Update (owner patient/doctor or admin):
```
PATCH /api/appointments/:id
{ "startTime": "...", "endTime": "...", "status": "cancelled" }
```

Cancel:
```
DELETE /api/appointments/:id
```

### 5) Patient Records
Create (doctor/admin):
```
POST /api/records
{
  "patientId": "<patient_user_id>",
  "diagnosis": "Hypertension",
  "prescriptions": ["Med A 5mg"],
  "notes": "Check BP weekly"
}
```

List with access control:
```
GET /api/records
GET /api/records/patient/:patientId
```

### 6) Messaging
Send:
```
POST /api/messages
{ "to": "<other_user_id>", "content": "Hello" }
```

Thread:
```
GET /api/messages/thread/:userId
```

Mark read:
```
POST /api/messages/:id/read
```

Socket.IO (client):
```js
const socket = io('http://localhost:4000');
socket.emit('auth:identify', '<your_user_id>');
socket.on('message:new', (msg) => console.log('New message', msg));
```

### 7) Admin
Requires admin token.
```
GET /api/admin/users
GET /api/admin/analytics
DELETE /api/admin/users/:id
```

### 8) Notes
- Ensure your MongoDB network access allows your IP.
- Never expose real secrets; rotate if leaked.

# RK Hospitals - Hospital Management System

## Description
**RK Hospitals** is a comprehensive Hospital Management System built on the MERN stack to enhance hospital operations. This system includes features such as secure user authentication, efficient appointment scheduling, patient record management, and real-time communication between doctors and patients. It provides a scalable and user-friendly platform to streamline healthcare workflows and improve the hospital experience.

## Features
- **User Authentication**: Secure login for patients, doctors, and administrators.
- **Appointment Scheduling**: Easy booking, rescheduling, and cancellation of appointments.
- **Patient Records Management**: Store, access, and update patient health records.
- **Doctor-Patient Communication**: Real-time messaging for consultations and follow-ups.
- **Admin Dashboard**: Manage users, appointments, and view analytics.
- **Secure Data Storage**: Ensure patient privacy and data security with MongoDB.

## Tech Stack
- **Frontend**: React.js
- **Backend**: Node.js and Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: Redux (optional)

## Getting Started
Follow these instructions to set up the project locally.

### Prerequisites
- Node.js installed
- MongoDB installed or access to a MongoDB cloud instance
- Git installed

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/RK-Hospitals.git
   cd RK-Hospitals

## Install dependencies

1. **Install admin dependencies**
   ```bash
   cd admin
   npm install
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables**
   In the server directory, create a .env file with the following:

   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   Run the application

4. **Start server:**
   ```bash
   cd backend
   npm run server
   ```

5. **Start Admin Panel:**
   ```bash
   cd admin
   npm run dev
   ```

6. **Start Frontend Panel:**
   ```bash
   cd frontend
   npm run dev
   ```

# Topics
Hospital Management, MERN Stack, MongoDB, Express.js, React, Node.js, Healthcare App, Patient Records, Appointments.

# Contributors
Niraj Kumar [Github](https://github.com/meniraj07)

# Deployment Links
[RK Hospitals Backend](https://prescriptobackend-4ylq.onrender.com)

[RK Hospitals Patient Panel](https://prescripto-hospital-management-system.vercel.app/)

[RK Hospitals Admin/Doctor Panel](https://prescripto-hospital-management-system-c29o.vercel.app/)

# Contact
For any questions or feedback, please contact [Niraj Kumar](https://www.linkedin.com/in/nirajkumar-nk/)

# License
This project is licensed under the MIT License.
