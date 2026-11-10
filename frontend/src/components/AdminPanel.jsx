import { useCallback, useEffect, useMemo, useState } from "react";
import siteLogo from "../pages/logo.png";

const ADMIN_SESSION_STORAGE_KEY = "studypro_admin_session";
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
  || (typeof window !== "undefined" ? `${window.location.origin}/api` : "/api")
).replace(/\/+$/, "");

const buildApiUrl = (path) => `${API_BASE_URL}/${String(path || "").replace(/^\/+/, "")}`;

const getStoredAdminSession = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const setStoredAdminSession = (session) => {
  if (!session) {
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
};

const toCurrency = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
};

const adminSectionLabels = (language) => {
  const isRu = language === "ru";
  const isKy = language === "ky";

  return {
    dashboard: isRu ? "Дашборд" : isKy ? "Башкы панел" : "Dashboard",
    users: isRu ? "Пользователи" : isKy ? "Колдонуучулар" : "Users",
    courses: isRu ? "Курсы" : isKy ? "Курстар" : "Courses",
    lessons: isRu ? "Уроки" : isKy ? "Сабактар" : "Lessons",
    pricing: isRu ? "Тарифы" : isKy ? "Тарифтер" : "Plans",
    reviews: isRu ? "Отзывы" : isKy ? "Пикирлер" : "Reviews",
    payments: isRu ? "Платежи" : isKy ? "Төлөмдөр" : "Payments",
    aiPro: isRu ? "AI Pro" : isKy ? "AI Pro" : "AI Pro",
    logs: isRu ? "Логи" : isKy ? "Журналдар" : "Logs",
  };
};

const normalizeAdminUser = (user) => {
  if (!user || typeof user !== "object") return null;
  return {
    id: user.id || user.user_id || "",
    email: user.email || "",
    username: user.username || user.email || "",
    role: user.role || "member",
    is_staff: Boolean(user.is_staff),
    is_superuser: Boolean(user.is_superuser),
  };
};

export default function AdminPanel({ language = "en", onBack, onLogout, onAuthenticated }) {
  const [session, setSession] = useState(() => getStoredAdminSession());
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [aiProUsers, setAiProUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "", slug: "", level: "beginner" });
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", course: "", video_url: "", order: 1 });
  const [planForm, setPlanForm] = useState({ name: "", slug: "", description: "", price: "49.00", currency: "USD", billing_period: "monthly", features: "" });

  const labels = useMemo(() => adminSectionLabels(language), [language]);
  const isLoggedIn = Boolean(session?.access && session?.user?.email);

  const adminFetch = useCallback(
    async (endpoint, options = {}) => {
      if (!session?.access) {
        throw new Error("Admin session expired.");
      }

      const response = await fetch(buildApiUrl(endpoint), {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          Authorization: `Bearer ${session.access}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || payload?.error || "The request could not be completed.");
      }

      return payload;
    },
    [session]
  );

  const loadAdminData = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingData(true);
    setFormError("");

    try {
      const [nextDashboard, nextUsers, nextCourses, nextLessons, nextPlans, nextReviews, nextPayments, nextLogs, nextAiPro] = await Promise.all([
        adminFetch("admin/dashboard/"),
        adminFetch("admin/users/"),
        adminFetch("admin/courses/"),
        adminFetch("admin/lessons/"),
        adminFetch("admin/pricing/"),
        adminFetch("admin/reviews/"),
        adminFetch("admin/payments/"),
        adminFetch("admin/activity-logs/"),
        adminFetch("admin/ai-pro/"),
      ]);

      setDashboard(nextDashboard);
      setUsers(Array.isArray(nextUsers) ? nextUsers : []);
      setCourses(Array.isArray(nextCourses) ? nextCourses : []);
      setLessons(Array.isArray(nextLessons) ? nextLessons : []);
      setPlans(Array.isArray(nextPlans) ? nextPlans : []);
      setReviews(Array.isArray(nextReviews) ? nextReviews : []);
      setPayments(Array.isArray(nextPayments) ? nextPayments : []);
      setLogs(Array.isArray(nextLogs) ? nextLogs : []);
      setAiProUsers(Array.isArray(nextAiPro) ? nextAiPro : []);
    } catch (error) {
      setFormError(error.message || "Admin data could not be loaded.");
      if (error.message && error.message.toLowerCase().includes("session")) {
        handleLogout();
      }
    } finally {
      setLoadingData(false);
    }
  }, [adminFetch, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setDashboard(null);
      setUsers([]);
      setCourses([]);
      setLessons([]);
      setPlans([]);
      setReviews([]);
      setPayments([]);
      setLogs([]);
      setAiProUsers([]);
      return;
    }
    loadAdminData();
  }, [isLoggedIn, loadAdminData]);

  const handleLogout = () => {
    setSession(null);
    setStoredAdminSession(null);
    setSection("dashboard");
    setLoginForm({ email: "", password: "" });
    setLoginError("");
    onLogout?.();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      const response = await fetch(buildApiUrl("admin/auth/login/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || "Admin login failed.");
      }

      const nextSession = {
        access: payload.access,
        refresh: payload.refresh,
        user: normalizeAdminUser(payload.user),
      };

      setSession(nextSession);
      setStoredAdminSession(nextSession);
      onAuthenticated?.(nextSession);
      setSection("dashboard");
    } catch (error) {
      setLoginError(error.message || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, patch) => {
    try {
      setFormError("");
      setFormSuccess("");
      const updated = await adminFetch(`admin/users/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setUsers((previous) => previous.map((user) => (String(user.id) === String(userId) ? updated : user)));
      setFormSuccess("User updated successfully.");
    } catch (error) {
      setFormError(error.message || "Unable to update user.");
    }
  };

  const saveCourse = async (event) => {
    event.preventDefault();
    try {
      setFormError("");
      setFormSuccess("");
      const payload = {
        ...courseForm,
        slug: courseForm.slug || courseForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      };
      const created = await adminFetch("admin/courses/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setCourses((previous) => [created, ...previous]);
      setCourseForm({ title: "", description: "", category: "", slug: "", level: "beginner" });
      setFormSuccess("Course created successfully.");
    } catch (error) {
      setFormError(error.message || "Unable to create course.");
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await adminFetch(`admin/courses/${courseId}/`, { method: "DELETE" });
      setCourses((previous) => previous.filter((course) => String(course.id) !== String(courseId)));
      setFormSuccess("Course removed successfully.");
    } catch (error) {
      setFormError(error.message || "Unable to delete course.");
    }
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    try {
      setFormError("");
      setFormSuccess("");
      const payload = {
        ...lessonForm,
        order: Number(lessonForm.order || 1),
        course: Number(lessonForm.course || courses?.[0]?.id),
      };
      const created = await adminFetch("admin/lessons/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setLessons((previous) => [created, ...previous]);
      setLessonForm({ title: "", description: "", course: courses?.[0]?.id || "", video_url: "", order: 1 });
      setFormSuccess("Lesson created successfully.");
    } catch (error) {
      setFormError(error.message || "Unable to create lesson.");
    }
  };

  const deleteLesson = async (lessonId) => {
    try {
      await adminFetch(`admin/lessons/${lessonId}/`, { method: "DELETE" });
      setLessons((previous) => previous.filter((lesson) => String(lesson.id) !== String(lessonId)));
      setFormSuccess("Lesson removed successfully.");
    } catch (error) {
      setFormError(error.message || "Unable to delete lesson.");
    }
  };

  const savePlan = async (event) => {
    event.preventDefault();
    try {
      setFormError("");
      setFormSuccess("");
      const payload = {
        ...planForm,
        price: Number(planForm.price || 0),
        features: planForm.features
          .split(/[\n,]+/)
          .map((feature) => feature.trim())
          .filter(Boolean),
      };
      const created = await adminFetch("admin/pricing/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setPlans((previous) => [created, ...previous]);
      setPlanForm({ name: "", slug: "", description: "", price: "49.00", currency: "USD", billing_period: "monthly", features: "" });
      setFormSuccess("Plan saved successfully.");
    } catch (error) {
      setFormError(error.message || "Unable to save plan.");
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await adminFetch(`admin/reviews/${reviewId}/`, { method: "DELETE" });
      setReviews((previous) => previous.filter((review) => String(review.id) !== String(reviewId)));
      setFormSuccess("Review removed successfully.");
    } catch (error) {
      setFormError(error.message || "Unable to delete review.");
    }
  };

  const updatePaymentStatus = async (paymentId, status) => {
    try {
      setFormError("");
      setFormSuccess("");
      const updated = await adminFetch(`admin/payments/${paymentId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setPayments((previous) => previous.map((payment) => (String(payment.id) === String(paymentId) ? updated : payment)));
      setFormSuccess("Payment status updated.");
    } catch (error) {
      setFormError(error.message || "Unable to update payment.");
    }
  };

  const toggleAiPro = async (userId, nextState) => {
    try {
      setFormError("");
      setFormSuccess("");
      const updated = await adminFetch(`admin/ai-pro/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_pro_active: nextState }),
      });
      setAiProUsers((previous) => previous.map((item) => (String(item.id) === String(userId) ? { ...item, ai_pro_active: updated.ai_pro_active, plan_name: updated.plan_name } : item)));
      setUsers((previous) => previous.map((user) => (String(user.id) === String(userId) ? { ...user, profile: { ...user.profile, ai_pro_active: updated.ai_pro_active } } : user)));
      setFormSuccess("AI Pro access updated.");
    } catch (error) {
      setFormError(error.message || "Unable to update AI Pro status.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="levelup-app admin-route-shell">
        <div className="admin-login-wrap">
          <div className="card-surface admin-login-card">
            <div className="admin-brand-row">
              <img src={siteLogo} alt="LevelUp" className="admin-brand-logo" />
              <div>
                <span className="eyebrow subtle">Admin</span>
                <h1>LevelUp Admin</h1>
              </div>
            </div>

            <form onSubmit={handleLogin} className="admin-login-form">
              <label className="profile-field">
                <span>Email</span>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, email: event.target.value }))}
                  placeholder="admin@levelup.com"
                  required
                />
              </label>

              <label className="profile-field">
                <span>Password</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </label>

              {loginError ? <p className="auth-error">{loginError}</p> : null}

              <div className="admin-login-actions">
                <button type="button" className="secondary-btn" onClick={onBack}>
                  Back
                </button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboard || {
    total_users: users.length,
    registered_users: users.filter((user) => user.is_active !== false).length,
    total_courses: courses.length,
    total_lessons: lessons.length,
    active_plans: plans.filter((plan) => plan.is_active !== false).length,
    ai_pro_users: aiProUsers.length,
    total_reviews: reviews.length,
    average_rating: 0,
  };

  const sidebarItems = [
    { id: "dashboard", label: labels.dashboard },
    { id: "users", label: labels.users },
    { id: "courses", label: labels.courses },
    { id: "lessons", label: labels.lessons },
    { id: "pricing", label: labels.pricing },
    { id: "reviews", label: labels.reviews },
    { id: "payments", label: labels.payments },
    { id: "aiPro", label: labels.aiPro },
    { id: "logs", label: labels.logs },
  ];

  return (
    <div className="levelup-app admin-route-shell">
      <div className="admin-shell">
        <aside className="admin-sidebar card-surface">
          <div className="admin-brand-row">
            <img src={siteLogo} alt="LevelUp" className="admin-brand-logo" />
            <div>
              <span className="eyebrow subtle">Admin</span>
              <h2>LevelUp</h2>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={section === item.id ? "admin-nav-item active" : "admin-nav-item"}
                onClick={() => setSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-user-card">
              <strong>{session?.user?.username || session?.user?.email || "Admin"}</strong>
              <small>{session?.user?.role || "admin"}</small>
            </div>
            <button type="button" className="secondary-btn full" onClick={handleLogout}>Logout</button>
          </div>
        </aside>

        <main className="admin-main-panel">
          <div className="admin-topbar card-surface">
            <div>
              <span className="eyebrow subtle">Control center</span>
              <h1>{labels[section] || "Dashboard"}</h1>
            </div>
            <button type="button" className="secondary-btn" onClick={onBack}>Back to site</button>
          </div>

          {formError ? <p className="admin-alert danger">{formError}</p> : null}
          {formSuccess ? <p className="admin-alert success">{formSuccess}</p> : null}

          {loadingData ? <p className="admin-loading">Loading admin data...</p> : null}

          {section === "dashboard" ? (
            <div className="admin-dashboard-grid">
              {[
                ["Total users", stats.total_users],
                ["Registered users", stats.registered_users],
                ["Courses", stats.total_courses],
                ["Lessons", stats.total_lessons],
                ["Active plans", stats.active_plans],
                ["AI Pro users", stats.ai_pro_users],
                ["Reviews", stats.total_reviews],
                ["Average rating", `${Number(stats.average_rating || 0).toFixed(1)} / 5`],
              ].map(([label, value]) => (
                <div key={label} className="admin-stat-card card-surface">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          ) : null}

          {section === "users" ? (
            <div className="admin-table-card card-surface">
              <div className="admin-section-head">
                <h3>Users</h3>
              </div>
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>AI Pro</th>
                      <th>Plan</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email || user.username}</td>
                        <td>
                          <select value={user.profile?.role || user.role || "member"} onChange={(event) => updateUserStatus(user.id, { role: event.target.value })}>
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <button type="button" className={user.profile?.is_blocked ? "tag danger" : "tag success"} onClick={() => updateUserStatus(user.id, { is_blocked: !user.profile?.is_blocked })}>
                            {user.profile?.is_blocked ? "Blocked" : "Active"}
                          </button>
                        </td>
                        <td>
                          <button type="button" className={user.profile?.ai_pro_active ? "tag success" : "tag muted"} onClick={() => toggleAiPro(user.id, !user.profile?.ai_pro_active)}>
                            {user.profile?.ai_pro_active ? "Enabled" : "Disabled"}
                          </button>
                        </td>
                        <td>{user.profile?.plan_name || "—"}</td>
                        <td>
                          <button type="button" className="secondary-btn small" onClick={() => updateUserStatus(user.id, { is_blocked: !user.profile?.is_blocked })}>Toggle status</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === "courses" ? (
            <div className="admin-form-layout">
              <form className="card-surface admin-form" onSubmit={saveCourse}>
                <h3>Add course</h3>
                <label className="profile-field">
                  <span>Title</span>
                  <input value={courseForm.title} onChange={(event) => setCourseForm((previous) => ({ ...previous, title: event.target.value }))} required />
                </label>
                <label className="profile-field">
                  <span>Slug</span>
                  <input value={courseForm.slug} onChange={(event) => setCourseForm((previous) => ({ ...previous, slug: event.target.value }))} />
                </label>
                <label className="profile-field">
                  <span>Category</span>
                  <input value={courseForm.category} onChange={(event) => setCourseForm((previous) => ({ ...previous, category: event.target.value }))} />
                </label>
                <label className="profile-field">
                  <span>Level</span>
                  <select value={courseForm.level} onChange={(event) => setCourseForm((previous) => ({ ...previous, level: event.target.value }))}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <label className="profile-field">
                  <span>Description</span>
                  <textarea value={courseForm.description} onChange={(event) => setCourseForm((previous) => ({ ...previous, description: event.target.value }))} rows={4} />
                </label>
                <button type="submit" className="primary-btn">Save course</button>
              </form>

              <div className="admin-table-card card-surface">
                <div className="admin-section-head"><h3>Course list</h3></div>
                <div className="admin-table-wrap compact">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Level</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course.id}>
                          <td>{course.title}</td>
                          <td>{course.category}</td>
                          <td>{course.level}</td>
                          <td><button type="button" className="secondary-btn small danger" onClick={() => deleteCourse(course.id)}>Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {section === "lessons" ? (
            <div className="admin-form-layout">
              <form className="card-surface admin-form" onSubmit={saveLesson}>
                <h3>Add lesson</h3>
                <label className="profile-field">
                  <span>Course</span>
                  <select value={lessonForm.course} onChange={(event) => setLessonForm((previous) => ({ ...previous, course: event.target.value }))}>
                    <option value="">Select course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </label>
                <label className="profile-field">
                  <span>Title</span>
                  <input value={lessonForm.title} onChange={(event) => setLessonForm((previous) => ({ ...previous, title: event.target.value }))} required />
                </label>
                <label className="profile-field">
                  <span>Video URL</span>
                  <input value={lessonForm.video_url} onChange={(event) => setLessonForm((previous) => ({ ...previous, video_url: event.target.value }))} />
                </label>
                <label className="profile-field">
                  <span>Order</span>
                  <input type="number" min="1" value={lessonForm.order} onChange={(event) => setLessonForm((previous) => ({ ...previous, order: Number(event.target.value) || 1 }))} />
                </label>
                <label className="profile-field">
                  <span>Description</span>
                  <textarea value={lessonForm.description} onChange={(event) => setLessonForm((previous) => ({ ...previous, description: event.target.value }))} rows={4} />
                </label>
                <button type="submit" className="primary-btn">Save lesson</button>
              </form>

              <div className="admin-table-card card-surface">
                <div className="admin-section-head"><h3>Lesson list</h3></div>
                <div className="admin-table-wrap compact">
                  <table>
                    <thead>
                      <tr>
                        <th>Lesson</th>
                        <th>Course</th>
                        <th>Order</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessons.map((lesson) => (
                        <tr key={lesson.id}>
                          <td>{lesson.title}</td>
                          <td>{lesson.course_title || lesson.course}</td>
                          <td>{lesson.order}</td>
                          <td><button type="button" className="secondary-btn small danger" onClick={() => deleteLesson(lesson.id)}>Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {section === "pricing" ? (
            <div className="admin-form-layout">
              <form className="card-surface admin-form" onSubmit={savePlan}>
                <h3>Create plan</h3>
                <label className="profile-field">
                  <span>Name</span>
                  <input value={planForm.name} onChange={(event) => setPlanForm((previous) => ({ ...previous, name: event.target.value }))} required />
                </label>
                <label className="profile-field">
                  <span>Slug</span>
                  <input value={planForm.slug} onChange={(event) => setPlanForm((previous) => ({ ...previous, slug: event.target.value }))} />
                </label>
                <label className="profile-field">
                  <span>Price</span>
                  <input type="number" min="0" step="0.01" value={planForm.price} onChange={(event) => setPlanForm((previous) => ({ ...previous, price: event.target.value }))} />
                </label>
                <label className="profile-field">
                  <span>Billing period</span>
                  <select value={planForm.billing_period} onChange={(event) => setPlanForm((previous) => ({ ...previous, billing_period: event.target.value }))}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one_time">One time</option>
                  </select>
                </label>
                <label className="profile-field">
                  <span>Features (one per line or comma)</span>
                  <textarea value={planForm.features} onChange={(event) => setPlanForm((previous) => ({ ...previous, features: event.target.value }))} rows={4} />
                </label>
                <button type="submit" className="primary-btn">Save plan</button>
              </form>

              <div className="admin-table-card card-surface">
                <div className="admin-section-head"><h3>Pricing catalog</h3></div>
                <div className="admin-table-wrap compact">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Period</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr key={plan.id}>
                          <td>{plan.name}</td>
                          <td>{toCurrency(plan.price)}</td>
                          <td>{plan.billing_period}</td>
                          <td>{plan.is_active ? "Active" : "Hidden"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {section === "reviews" ? (
            <div className="admin-table-card card-surface">
              <div className="admin-section-head"><h3>Reviews</h3></div>
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Course</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => (
                      <tr key={review.id}>
                        <td>{review.name || review.user}</td>
                        <td>{review.course_title || review.course}</td>
                        <td>{review.rating}</td>
                        <td>{review.text}</td>
                        <td><button type="button" className="secondary-btn small danger" onClick={() => deleteReview(review.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === "payments" ? (
            <div className="admin-table-card card-surface">
              <div className="admin-section-head"><h3>Payments</h3></div>
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.user_email || payment.user || payment.user_id}</td>
                        <td>{toCurrency(payment.amount)}</td>
                        <td>{payment.payment_method}</td>
                        <td>{payment.status}</td>
                        <td>
                          <select value={payment.status} onChange={(event) => updatePaymentStatus(payment.id, event.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="manual_review">Manual Review</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === "aiPro" ? (
            <div className="admin-table-card card-surface">
              <div className="admin-section-head"><h3>AI Pro access</h3></div>
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiProUsers.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.email || entry.full_name}</td>
                        <td>{entry.plan_name || "AI Pro"}</td>
                        <td>{entry.ai_pro_active ? "Active" : "Inactive"}</td>
                        <td>
                          <button type="button" className="secondary-btn small" onClick={() => toggleAiPro(entry.id, !entry.ai_pro_active)}>
                            {entry.ai_pro_active ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === "logs" ? (
            <div className="admin-table-card card-surface">
              <div className="admin-section-head"><h3>Activity logs</h3></div>
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.actor_email || "system"}</td>
                        <td>{log.action}</td>
                        <td>{log.target_model}</td>
                        <td>{log.details || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
