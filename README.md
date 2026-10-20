# How to Test the App

## Student Information

- **Student Name:** Nyein Chan Htet Naing
- **Student ID:** 6726045

## Test Credentials

The system has 3 Teacher accounts and 3 Student accounts.

| Username / Email | Password | Role |
|---|---|---|
| teacher1 / teacher1@example.com | Course2026! | Teacher |
| teacher2 / teacher2@example.com | Course2026! | Teacher |
| teacher3 / teacher3@example.com | Course2026! | Teacher |
| student1 / student1@example.com | Course2026! | Student |
| student2 / student2@example.com | Course2026! | Student |
| student3 / student3@example.com | Course2026! | Student |

**Note:** Login uses the username and password.

## Prerequisites

- Node.js and npm installed
- MongoDB Atlas database connection
- Visual Studio Code
- Internet connection
- Git installed
- Backend and frontend environment variables configured

## How to Run & Test

### 1. Backend Setup (`next-backend/`)

1. Open Command Prompt.
2. Navigate to the `next-backend` folder.
3. Install dependencies using `npm install`.
4. Create the `.env.local` file containing `MONGODB_URI` and `JWT_SECRET`.
5. Create the six test accounts using `node --env-file=.env.local seed.cjs` if they do not already exist.
6. Start the backend using `npm run dev`.
7. Backend URL: `http://localhost:3000`

### 2. Frontend Setup (`react-frontend/`)

1. Open another Command Prompt.
2. Navigate to the `react-frontend` folder.
3. Install dependencies using `npm install`.
4. Create the `.env` file.
5. Add `VITE_API_URL=http://localhost:3000`.
6. Start the frontend using `npm run dev`.
7. Open `http://localhost:5173` in Chrome.

### 3. Testing Walkthrough

**Teacher Functions**

1. Log in using `teacher1` and `Course2026!`.
2. The Teacher Dashboard displays the Teacher's own courses.
3. Click Create Course to add a new course.
4. Enter the course name, duration, topics, price, maximum students, and status.
5. Click Save Course.
6. Click View to see course details and enrolled students.
7. Click Edit to update course information.
8. Click Delete to delete a course without enrolled students.
9. Teachers cannot modify courses belonging to another Teacher.

**Student Functions**

1. Log out and log in using `student1` and `Course2026!`.
2. View all available courses except Cancel courses.
3. Search courses by course name or Teacher name.
4. Click View Details to see course information.
5. Click Enroll Now to enroll in an Open course.
6. Click My Enrollments to view enrolled courses.
7. Students cannot enroll in the same course twice.
8. Students cannot enroll in courses that are full, Close, or Cancel.

**Authentication Testing**

1. Users must log in before accessing protected features.
2. Teachers and Students have different permissions.
3. Click Logout to end the login session.
4. Protected backend operations reject unauthorized requests.

