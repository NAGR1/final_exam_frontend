import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./App.css";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000")
  .replace(/\/$/, "");
const API_BASE = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`);
  }
  return data;
}

const blankCourse = () => ({
  name: "",
  duration: "",
  topics: "",
  price: "",
  maxStudent: "",
  status: "Open",
});

function topicsText(topics) {
  return Array.isArray(topics) ? topics.join(", ") : String(topics || "");
}

function courseSeats(course) {
  return Math.max(0, Number(course.maxStudent || 0) - Number(course.enrolledCount || 0));
}

function Alert({ text, isError = false }) {
  if (!text) return null;
  return (
    <div className={`message ${isError ? "message-error" : "message-success"}`} role="alert">
      {text}
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!data.user) throw new Error("Login response did not include a user");
      setPassword("");
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">🎓</div>
        <h1 className="auth-title">Online Course Service</h1>
        <p className="auth-subtitle">Sign in to learn or manage your courses.</p>
        <form onSubmit={login}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input id="username" className="form-input" value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" type="password" className="form-input"
              value={password} onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password" required />
          </div>
          <button className="primary-btn full-width" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <Alert text={error} isError />
        </form>
      </div>
    </div>
  );
}

function TeacherDashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(blankCourse());
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refreshCourses() {
    const data = await apiRequest("/course");
    setCourses(data.courses || []);
  }

  useEffect(() => {
    let active = true;
    apiRequest("/course")
      .then((data) => { if (active) setCourses(data.courses || []); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [user.id]);

  function changeField(name, value) {
    setForm((old) => ({ ...old, [name]: value }));
  }

  function createCourse() {
    setForm(blankCourse());
    setEditingId(null);
    setDetails(null);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function editCourse(course) {
    setForm({
      name: course.name || "",
      duration: String(course.duration ?? ""),
      topics: topicsText(course.topics),
      price: String(course.price ?? ""),
      maxStudent: String(course.maxStudent ?? ""),
      status: course.status || "Open",
    });
    setEditingId(course._id);
    setDetails(null);
    setShowForm(true);
    setError("");
    setMessage("");
  }

  async function saveCourse(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const payload = {
      name: form.name.trim(),
      duration: Number(form.duration),
      topics: form.topics.split(",").map((topic) => topic.trim()).filter(Boolean),
      price: Number(form.price),
      maxStudent: Number(form.maxStudent),
      status: form.status,
    };
    try {
      await apiRequest(editingId ? `/course/${editingId}` : "/course", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      await refreshCourses();
      setShowForm(false);
      setEditingId(null);
      setForm(blankCourse());
      setMessage(editingId ? "Course updated successfully!" : "Course created successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function viewCourse(course) {
    setError("");
    setMessage("");
    setShowForm(false);
    try {
      const data = await apiRequest(`/course/${course._id}`);
      setDetails(data.course);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteCourse(course) {
    if (!window.confirm(`Delete "${course.name}"?`)) return;
    setError("");
    setMessage("");
    try {
      await apiRequest(`/course/${course._id}`, { method: "DELETE" });
      await refreshCourses();
      setDetails(null);
      setMessage("Course deleted successfully!");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Teacher Dashboard</h1>
          <p className="dashboard-subtitle">Welcome, {user.username}!</p>
        </div>
        <button className="primary-btn" onClick={createCourse}>+ Create Course</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{courses.length}</div><div className="stat-label">My Courses</div></div>
        <div className="stat-card"><div className="stat-value">{courses.filter((c) => c.status === "Open").length}</div><div className="stat-label">Open Courses</div></div>
        <div className="stat-card"><div className="stat-value">{courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)}</div><div className="stat-label">Enrollments</div></div>
      </div>
      <Alert text={message} />
      <Alert text={error} isError />

      {showForm && (
        <section className="panel">
          <h2 className="section-title">{editingId ? "Edit Course" : "Create Course"}</h2>
          <form onSubmit={saveCourse}>
            <div className="form-group">
              <label className="form-label" htmlFor="course-name">Course Name</label>
              <input id="course-name" className="form-input" value={form.name}
                onChange={(e) => changeField("name", e.target.value)} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="course-duration">Duration (days)</label>
                <input id="course-duration" type="number" min="1" step="1" className="form-input"
                  value={form.duration} onChange={(e) => changeField("duration", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="course-price">Price</label>
                <input id="course-price" type="number" min="0" step="0.01" className="form-input"
                  value={form.price} onChange={(e) => changeField("price", e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="course-topics">Topics (separate with commas)</label>
              <input id="course-topics" className="form-input" value={form.topics}
                placeholder="HTML, CSS, JavaScript"
                onChange={(e) => changeField("topics", e.target.value)} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="course-capacity">Maximum Students</label>
                <input id="course-capacity" type="number" min="1" step="1" className="form-input"
                  value={form.maxStudent} onChange={(e) => changeField("maxStudent", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="course-status">Status</label>
                <select id="course-status" className="form-select" value={form.status}
                  onChange={(e) => changeField("status", e.target.value)}>
                  <option value="Open">Open</option>
                  <option value="Close">Close</option>
                  <option value="Cancel">Cancel</option>
                </select>
              </div>
            </div>
            <div className="button-group">
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Saving..." : "Save Course"}
              </button>
              <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {details && (
        <section className="panel">
          <h2 className="section-title">Course Details</h2>
          <h3>{details.name}</h3>
          <p>Teacher: {details.teacherName}</p>
          <p>Duration: {details.duration} days</p>
          <p>Topics: {topicsText(details.topics)}</p>
          <p>Price: {details.price}</p>
          <p>Status: {details.status}</p>
          <p>Enrolled: {details.enrolledCount || 0}/{details.maxStudent}</p>
          <h3>Enrolled Students</h3>
          {details.students?.length ? (
            <ul>{details.students.map((student) => (
              <li key={student._id}>{student.username} — {student.email}</li>
            ))}</ul>
          ) : <p>No students enrolled yet.</p>}
          <button className="secondary-btn" onClick={() => setDetails(null)}>Close Details</button>
        </section>
      )}

      <h2 className="section-title">My Courses</h2>
      {!courses.length ? (
        <div className="empty-state">No courses yet. Click Create Course.</div>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <article key={course._id} className="course-card">
              <span className={`status status-${course.status.toLowerCase()}`}>{course.status}</span>
              <h3 className="course-title">{course.name}</h3>
              <p className="course-meta">Duration: {course.duration} days</p>
              <p className="course-meta">Topics: {topicsText(course.topics)}</p>
              <p className="course-meta">Students: {course.enrolledCount || 0}/{course.maxStudent}</p>
              <div className="course-price">Price: {course.price}</div>
              <div className="course-actions">
                <button className="secondary-btn" onClick={() => viewCourse(course)}>View</button>
                <button className="primary-btn" onClick={() => editCourse(course)}>Edit</button>
                <button className="danger-btn" onClick={() => deleteCourse(course)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function StudentDashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function coursePath() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (tab === "enrolled") params.set("enrolled", "true");
    const query = params.toString();
    return query ? `/course?${query}` : "/course";
  }

  async function refreshCourses() {
    const data = await apiRequest(coursePath());
    setCourses(data.courses || []);
  }

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (tab === "enrolled") params.set("enrolled", "true");
    const query = params.toString();

    setLoading(true);
    setError("");
    apiRequest(query ? `/course?${query}` : "/course")
      .then((data) => { if (active) setCourses(data.courses || []); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab, search]);

  async function viewCourse(course) {
    setError("");
    setMessage("");
    try {
      const data = await apiRequest(`/course/${course._id}`);
      setDetails(data.course);
    } catch (err) {
      setError(err.message);
    }
  }

  function canEnroll(course) {
    return course.status === "Open" && !course.isEnrolled && courseSeats(course) > 0;
  }

  function enrollLabel(course) {
    if (course.isEnrolled) return "Already Enrolled";
    if (course.status !== "Open") return "Enrollment Closed";
    if (courseSeats(course) <= 0) return "Course Full";
    return "Enroll Now";
  }

  async function enroll(course) {
    setEnrollingId(course._id);
    setError("");
    setMessage("");
    try {
      const data = await apiRequest(`/course/${course._id}/enroll`, { method: "POST" });
      setMessage(data.message || "Enrollment successful!");
      await refreshCourses();
      if (details?._id === course._id) {
        const updated = await apiRequest(`/course/${course._id}`);
        setDetails(updated.course);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <main className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Student Dashboard</h1>
          <p className="dashboard-subtitle">Welcome, {user.username}!</p>
        </div>
      </div>
      <div className="button-group" style={{ marginBottom: 24 }}>
        <button className={tab === "all" ? "primary-btn" : "secondary-btn"}
          onClick={() => { setTab("all"); setDetails(null); setMessage(""); }}>
          Available Courses
        </button>
        <button className={tab === "enrolled" ? "primary-btn" : "secondary-btn"}
          onClick={() => { setTab("enrolled"); setDetails(null); setMessage(""); }}>
          My Enrollments
        </button>
      </div>
      <div className="toolbar">
        <input className="search-input" value={search}
          placeholder="Search course or teacher name..."
          onChange={(event) => { setSearch(event.target.value); setDetails(null); }} />
        <button className="secondary-btn" onClick={() => setSearch("")}>Clear</button>
      </div>
      <Alert text={message} />
      <Alert text={error} isError />

      {details && (
        <section className="panel">
          <h2 className="section-title">Course Details</h2>
          <h3>{details.name}</h3>
          <p>Teacher: {details.teacherName}</p>
          <p>Duration: {details.duration} days</p>
          <p>Topics: {topicsText(details.topics)}</p>
          <p>Price: {details.price}</p>
          <p>Status: {details.status}</p>
          <p>Enrolled: {details.enrolledCount || 0}/{details.maxStudent}</p>
          <p>Available Seats: {courseSeats(details)}</p>
          <div className="button-group">
            <button className="primary-btn" disabled={!canEnroll(details) || enrollingId !== null}
              onClick={() => enroll(details)}>
              {enrollingId === details._id ? "Enrolling..." : enrollLabel(details)}
            </button>
            <button className="secondary-btn" onClick={() => setDetails(null)}>Close Details</button>
          </div>
        </section>
      )}

      <h2 className="section-title">{tab === "all" ? "Available Courses" : "My Enrolled Courses"}</h2>
      {loading ? (
        <div className="empty-state">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="empty-state">{tab === "all" ? "No courses found." : "No enrolled courses found."}</div>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <article className="course-card" key={course._id}>
              <span className={`status status-${course.status.toLowerCase()}`}>{course.status}</span>
              <h3 className="course-title">{course.name}</h3>
              <p className="course-meta">Teacher: {course.teacherName}</p>
              <p className="course-meta">Duration: {course.duration} days</p>
              <p className="course-meta">Topics: {topicsText(course.topics)}</p>
              <p className="course-meta">Students: {course.enrolledCount || 0}/{course.maxStudent}</p>
              <p className="course-meta">Available Seats: {courseSeats(course)}</p>
              <div className="course-price">Price: {course.price}</div>
              {course.isEnrolled && <Alert text="You are enrolled in this course." />}
              <div className="course-actions">
                <button className="secondary-btn" onClick={() => viewCourse(course)}>View Details</button>
                <button className="primary-btn" disabled={!canEnroll(course) || enrollingId !== null}
                  onClick={() => enroll(course)}>
                  {enrollingId === course._id ? "Enrolling..." : enrollLabel(course)}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function Application() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Restore login from the server-side JWT cookie after refreshing the page.
  useEffect(() => {
    let active = true;
    apiRequest("/auth/me")
      .then((data) => { if (active && data.user) setUser(data.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  async function logout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      setLogoutError(err.message);
    } finally {
      setLoggingOut(false);
    }
  }

  if (checkingSession) {
    return <div className="auth-layout"><div className="auth-card">Loading your session...</div></div>;
  }
  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <div className="app-shell">
      <nav className="navbar">
        <span className="brand">🎓 Online Course Service</span>
        <div className="nav-right">
          <span className="role-badge">{user.role}</span>
          <span>{user.username}</span>
          <button className="secondary-btn" onClick={logout} disabled={loggingOut}>
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </nav>
      {logoutError && <div className="page-container"><Alert text={logoutError} isError /></div>}
      {user.role === "Teacher"
        ? <TeacherDashboard user={user} />
        : <StudentDashboard user={user} />}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<Application />} />
      </Routes>
    </HashRouter>
  );
}
