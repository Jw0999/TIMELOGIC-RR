import { useEffect, useState, useMemo, type FormEvent } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Coffee,
  GraduationCap,
  LogIn,
  LogOut,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
  AlertTriangle,
  Sparkles,
  Mail,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  clearSession,
  enrollFace,
  getDashboard,
  findManualEmployee,
  getMe,
  getAccessToken,
  login,
  manualCheckIn,
  manualCheckOut,
  startEmployeeBreak,
  endEmployeeBreak,
  getEmployeeBreak,
  getStudents,
  checkInStudent,
  checkOutStudent,
  type AdminUser,
  type Dashboard,
  type Employee,
  type Student,
  type BreakRecord,
} from './api';
import FaceCapture from './components/FaceCapture';

// Format time utility
const formatTime = (value?: string | null, timezone?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        ...(timezone ? { timeZone: timezone } : {}),
      })
    : '—';

const formatOfficeName = (session: Dashboard['activeSessions'][number]) =>
  typeof session.office === 'string'
    ? session.office
    : session.office?.name || 'Main Office';

const formatDepartment = (employee: Employee) =>
  typeof employee.department === 'string'
    ? employee.department
    : employee.department?.name || 'General';

// Check if an employee has a face registered
const hasEnrolledFace = (emp: Employee): boolean =>
  Boolean(emp.hasFaceEnrolled || emp.profileImageUrl === 'enrolled');

// Check if an attendance timestamp belongs to today
const isDateToday = (timeStr?: string | null, serverTime?: string | null): boolean => {
  if (!timeStr) return false;
  const d = new Date(timeStr);
  const now = new Date(serverTime || Date.now());
  return d.getUTCFullYear() === now.getUTCFullYear() &&
         d.getUTCMonth() === now.getUTCMonth() &&
         d.getUTCDate() === now.getUTCDate();
};

/* ==========================================================================
   Admin Login Screen
   ========================================================================== */
function LoginScreen({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please enter your admin credentials.');
      return;
    }
    setBusy(true);
    try {
      const user = await login(identifier.trim(), password);
      onLogin(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="login-hero-brand">
          <img src="/logo.jpg" alt="TimeLogic" className="brand-img-logo-lg" style={{ marginBottom: 0 }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              TimeLogic
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.08em' }}>
              ENTERPRISE ATTENDANCE
            </p>
          </div>
        </div>
        <h1>Attendance Kiosk Station</h1>
        <p>
          High-accuracy biometric and password workforce verification. Secure, tamper-proof, and
          synced directly with organization server time.
        </p>
      </section>

      <section className="login-card-container">
        <form className="login-card" onSubmit={submit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2>Station Access</h2>
            <p className="muted">Authenticate this device as an authorized kiosk station.</p>
          </div>

          {error && (
            <div className="alert error">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Admin Email or Employee Code</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              placeholder="admin@company.com"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••••••"
            />
          </div>

          <button className="btn primary full" disabled={busy} style={{ marginTop: '1rem', padding: '0.85rem' }}>
            {busy ? 'Authenticating…' : 'Open Kiosk Station'}
          </button>

          <p className="login-note">
            Only Administrator accounts can initialize and monitor this kiosk.
          </p>
        </form>
      </section>
    </main>
  );
}

/* ==========================================================================
   Main Attendance Station Application
   ========================================================================== */
function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unclocked' | 'clocked_in' | 'enrolled' | 'needs_face'>('all');
  const [activeTab, setActiveTab] = useState<'attendance' | 'breaks' | 'students'>('attendance');

  // Async states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Active modals
  const [pendingAction, setPendingAction] = useState<{
    type: 'check_in' | 'check_out' | 'enroll_face';
    employee: Employee;
  } | null>(null);

  // Form states in modal
  const [password, setPassword] = useState('');
  const [faceImage, setFaceImage] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  // Breaks state
  const [breaks, setBreaks] = useState<Record<string, BreakRecord | null>>({});
  const [breakBusy, setBreakBusy] = useState<string | null>(null);

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBusy, setStudentBusy] = useState<string | null>(null);

  // Real-time ticking clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Kiosk Privacy Mode States
  const [kioskEmail, setKioskEmail] = useState('');
  const [identifiedEmployee, setIdentifiedEmployee] = useState<Employee | null>(null);
  const [kioskBusy, setKioskBusy] = useState(false);
  const [kioskError, setKioskError] = useState('');
  const [showAdminRoster, setShowAdminRoster] = useState(false);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);

  // Auto-reset countdown timer for privacy kiosk
  useEffect(() => {
    if (resetCountdown === null) return;
    if (resetCountdown <= 0) {
      setIdentifiedEmployee(null);
      setKioskEmail('');
      setResetCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setResetCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resetCountdown]);

  // Lookup employee by Gmail
  async function handleLookupEmployee(e?: FormEvent) {
    if (e) e.preventDefault();
    const email = kioskEmail.trim().toLowerCase();
    if (!email) {
      setKioskError('Please enter your registered Gmail address.');
      return;
    }
    setKioskBusy(true);
    setKioskError('');
    setResetCountdown(null);
    try {
      const emp = await findManualEmployee(email);
      setIdentifiedEmployee(emp);
    } catch (err: unknown) {
      const e = err as Error;
      const local = dashboard?.employees.find((item) => item.email?.toLowerCase() === email);
      if (local) {
        setIdentifiedEmployee(local);
      } else {
        setKioskError(e.message || 'No active employee was found with that registered Gmail address.');
      }
    } finally {
      setKioskBusy(false);
    }
  }

  // Initial authentication check
  useEffect(() => {
    if (!getAccessToken()) {
      setBooting(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(clearSession)
      .finally(() => setBooting(false));
  }, []);

  // Dashboard Loader
  async function load(quiet = false) {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const next = await getDashboard(sessionId || undefined, search.trim() || undefined);
      setDashboard(next);
      if (!sessionId && next.selectedSession?.id) {
        setSessionId(next.selectedSession.id);
      }

      // Load active breaks for checked-in staff
      const checkedInStaff = next.employees.filter(
        (emp) => emp.attendance?.clockInTime && !emp.attendance?.clockOutTime
      );
      if (checkedInStaff.length > 0) {
        const breakResults = await Promise.all(
          checkedInStaff.map(async (emp) => [emp.id, await getEmployeeBreak(emp.id)] as const)
        );
        setBreaks(Object.fromEntries(breakResults));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not refresh attendance data.');
    } finally {
      setLoading(false);
    }
  }

  // Poll dashboard every 20s
  useEffect(() => {
    if (!user) return;
    void load();
    const interval = setInterval(() => void load(true), 20000);
    return () => clearInterval(interval);
  }, [user, sessionId, search]);

  // Students loader
  async function loadStudents() {
    try {
      const res = await getStudents(studentSearch);
      setStudents(res.students);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load students.');
    }
  }

  useEffect(() => {
    if (user?.organization?.hasStudents && activeTab === 'students') {
      void loadStudents();
    }
  }, [user, studentSearch, activeTab]);

  // Modal helpers
  function closeModal() {
    setPendingAction(null);
    setPassword('');
    setFaceImage('');
    setActionBusy(false);
  }

  // Handle Face Enrollment for an employee
  async function handleEnrollFace() {
    if (!pendingAction || !faceImage) return;
    const emp = pendingAction.employee;

    setActionBusy(true);
    setError('');
    try {
      // Convert base64 data URI to Blob
      const res = await fetch(faceImage);
      const blob = await res.blob();

      await enrollFace(emp.id, blob);

      setNotice(`Biometric face template registered successfully for ${emp.firstName} ${emp.lastName}!`);

      // Update identifiedEmployee if matching
      setIdentifiedEmployee((prev) =>
        prev && prev.id === emp.id
          ? { ...prev, profileImageUrl: 'enrolled', hasFaceEnrolled: true }
          : prev
      );

      // Immediately update local state to reflect enrolled face
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          employees: prev.employees.map((e) =>
            e.id === emp.id
              ? { ...e, profileImageUrl: 'enrolled', hasFaceEnrolled: true }
              : e
          ),
        };
      });

      closeModal();
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Face registration failed. Ensure face is clearly visible.');
    } finally {
      setActionBusy(false);
    }
  }

  // Handle Check-In and Check-Out
  async function handleAttendanceAction() {
    if (!pendingAction || !password) return;
    const { type, employee } = pendingAction;

    // For check-in, an active attendance session is required
    if (type === 'check_in') {
      if (!sessionId || !dashboard?.activeSessions.some((s) => s.id === sessionId)) {
        setError('Please select an active attendance session before checking in.');
        return;
      }
    }

    const faceRegistered = hasEnrolledFace(employee);

    // Face verification is strictly enforced ONLY on check_in
    if (type === 'check_in' && faceRegistered && !faceImage) {
      setError('Live camera verification is required. Please snap your face photo below.');
      return;
    }

    setActionBusy(true);
    setError('');
    try {
      const result =
        type === 'check_in'
          ? await manualCheckIn(employee.id, sessionId, password, faceImage || undefined)
          : await manualCheckOut(employee.id, employee.attendance?.sessionId || sessionId || undefined, password);

      const actionText = type === 'check_in' ? 'checked in' : 'checked out';
      const eventTime = formatTime(
        result.clockInTime || result.clockOutTime || result.serverTime,
        dashboard?.organization.timezone
      );

      setNotice(`✓ ${employee.firstName} ${employee.lastName} ${actionText} successfully at ${eventTime}.`);

      // Update identifiedEmployee if currently displayed in kiosk view
      setIdentifiedEmployee((prev) => {
        if (!prev || prev.id !== employee.id) return prev;
        if (type === 'check_in') {
          return {
            ...prev,
            attendance: {
              ...(prev.attendance || {}),
              sessionId,
              clockInTime: result.clockInTime || new Date().toISOString(),
              clockOutTime: null,
            },
          };
        } else {
          return {
            ...prev,
            attendance: {
              ...(prev.attendance || {}),
              clockOutTime: result.clockOutTime || new Date().toISOString(),
            },
          };
        }
      });

      // Start auto-reset timer for the next person in line
      setResetCountdown(7);

      closeModal();
      await load(true);
    } catch (e: unknown) {
      const err = e as Error & { code?: string };
      if (err.code === 'FACE_NOT_ENROLLED') {
        setError('Face not registered. Please enroll face first.');
      } else if (err.code === 'FACE_REQUIRED') {
        setError('Face verification is required for this employee. Please capture photo.');
      } else {
        setError(err.message || 'Attendance confirmation failed. Verify password.');
      }
    } finally {
      setActionBusy(false);
    }
  }

  // Toggle Break for checked in staff
  async function handleToggleBreak(employee: Employee) {
    setBreakBusy(employee.id);
    setError('');
    try {
      const activeBreak = breaks[employee.id] ?? (await getEmployeeBreak(employee.id));
      const updatedBreak = activeBreak
        ? await endEmployeeBreak(employee.id, activeBreak.id)
        : await startEmployeeBreak(employee.id);

      setBreaks((prev) => ({
        ...prev,
        [employee.id]: activeBreak ? null : updatedBreak,
      }));

      setNotice(
        activeBreak
          ? `✓ ${employee.firstName} ${employee.lastName} ended break.`
          : `☕ ${employee.firstName} ${employee.lastName} is now on break.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Break action failed.');
    } finally {
      setBreakBusy(null);
    }
  }

  // Toggle Student Attendance
  async function handleToggleStudent(student: Student) {
    setStudentBusy(student.id);
    setError('');
    try {
      if (student.todayAttendance?.checkInTime && !student.todayAttendance.checkOutTime) {
        await checkOutStudent(student.id);
        setNotice(`✓ Student ${student.firstName} ${student.lastName} checked out.`);
      } else {
        await checkInStudent(student.id);
        setNotice(`✓ Student ${student.firstName} ${student.lastName} checked in.`);
      }
      await loadStudents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Student action failed.');
    } finally {
      setStudentBusy(null);
    }
  }

  // Loading state
  if (booting) {
    return (
      <div className="center" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ color: '#0284c7', marginBottom: '1rem' }} />
          <p style={{ fontWeight: 600, color: '#64748b' }}>Starting TimeLogic Kiosk…</p>
        </div>
      </div>
    );
  }

  // Unauthenticated -> Login Screen
  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  // Check if manual check-in is allowed for this organization
  if (!user.organization?.allowManualCheckIn) {
    return (
      <div className="center" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
        <div className="empty-state" style={{ maxWidth: 460 }}>
          <ShieldCheck size={48} style={{ color: '#0284c7' }} />
          <h2>Manual Attendance Disabled</h2>
          <p style={{ marginTop: '0.5rem', color: '#64748b', lineHeight: 1.6 }}>
            Kiosk station check-in is currently disabled for {user.organization?.name || 'this organization'}.
            An administrator can enable manual check-in from the Super Admin portal.
          </p>
          <button
            className="btn secondary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => {
              clearSession();
              setUser(null);
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const selectedSession =
    dashboard?.activeSessions.find((s) => s.id === sessionId) || dashboard?.selectedSession;
  const hasActiveSession = Boolean(dashboard?.activeSessions?.length);
  const rawEmployees = dashboard?.employees || [];
  const studentsEnabled = Boolean(user.organization?.hasStudents);

  // Filtered employees list
  const filteredEmployees = rawEmployees.filter((emp) => {
    const isClockedIn = Boolean(emp.attendance?.clockInTime && !emp.attendance?.clockOutTime);
    const hasFace = hasEnrolledFace(emp);

    if (filter === 'clocked_in' && !isClockedIn) return false;
    if (filter === 'unclocked' && isClockedIn) return false;
    if (filter === 'enrolled' && !hasFace) return false;
    if (filter === 'needs_face' && hasFace) return false;

    return true;
  });

  // Calculate high-level metrics
  const totalEmployees = dashboard?.total ?? rawEmployees.length;
  const clockedInCount = rawEmployees.filter(
    (e) => e.attendance?.clockInTime && !e.attendance?.clockOutTime
  ).length;
  const faceEnrolledCount = rawEmployees.filter((e) => hasEnrolledFace(e)).length;
  const facePendingCount = totalEmployees - faceEnrolledCount;

  return (
    <div className="app-shell">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand-badge">
            <img src="/logo.jpg" alt="TimeLogic" className="brand-img-logo" />
            <div className="brand-title">
              <strong>TimeLogic Station</strong>
              <span>Biometric Kiosk</span>
            </div>
          </div>

          <nav className="topbar-tabs">
            <button
              className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              <Users size={15} />
              <span>Attendance</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'breaks' ? 'active' : ''}`}
              onClick={() => setActiveTab('breaks')}
            >
              <Coffee size={15} />
              <span>Break Room</span>
              {clockedInCount > 0 && (
                <span
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.68rem',
                  }}
                >
                  {clockedInCount}
                </span>
              )}
            </button>
            {studentsEnabled && (
              <button
                className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <GraduationCap size={15} />
                <span>Students</span>
              </button>
            )}
          </nav>
        </div>

        <div className="topbar-right">
          <div className="live-clock-pill">
            <div className="pulse-dot"></div>
            <Clock size={14} />
            <span>
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                ...(dashboard?.organization.timezone ? { timeZone: dashboard.organization.timezone } : {}),
              })}
            </span>
          </div>

          <div className="org-badge">
            <span>{user.organization?.name || 'Organization'}</span>
          </div>

          <button
            className="signout-btn"
            title="Sign out of station"
            onClick={() => {
              clearSession();
              setUser(null);
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Main Workspace ────────────────────────────────────────────────── */}
      <main className="workspace">
        {/* Alerts */}
        {notice && (
          <div className="alert success">
            <CheckCircle2 size={18} />
            <span>{notice}</span>
            <button className="alert-close" onClick={() => setNotice('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="alert error">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button className="alert-close" onClick={() => setError('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Dashboard Header Title */}
        <div className="station-header">
          <div className="station-title">
            <h1>
              {activeTab === 'attendance'
                ? 'Workforce Check-In'
                : activeTab === 'breaks'
                ? 'Staff Break Station'
                : 'Student Attendance'}
            </h1>
            <p>
              {activeTab === 'attendance'
                ? 'Verify employee password and facial biometrics to securely record attendance.'
                : activeTab === 'breaks'
                ? 'Track active employee breaks according to department policies.'
                : 'Check students in or out by their assigned student ID.'}
            </p>
          </div>

          <div className="station-actions">
            <button className="btn secondary" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Refresh Station</span>
            </button>
          </div>
        </div>

        {/* Stats & Session Control Bar */}
        <section className="stats-grid">
          {/* Active Session Selector Card */}
          <div className="stat-card session-card">
            <div>
              <div className="session-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Clock size={16} style={{ color: '#38bdf8' }} />
                  <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active Session
                  </strong>
                </div>
                {hasActiveSession ? (
                  <span className="session-badge-open">
                    <span className="pulse-dot"></span> Open
                  </span>
                ) : (
                  <span className="session-badge-closed">No Session</span>
                )}
              </div>

              {hasActiveSession ? (
                <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                  {dashboard?.activeSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sessionName || 'Standard Session'} · {formatOfficeName(s)}
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#f87171', margin: '0.5rem 0' }}>
                  No active session found. An admin must schedule an attendance session.
                </p>
              )}
            </div>

            {selectedSession && (
              <div className="session-time-info">
                <span>
                  Hours: {formatTime(selectedSession.startTime, dashboard?.organization.timezone)} –{' '}
                  {formatTime(selectedSession.endTime, dashboard?.organization.timezone)}
                </span>
              </div>
            )}
          </div>

          {/* Total Staff */}
          <div className="stat-card">
            <div className="stat-icon-wrap staff">
              <Users size={20} />
            </div>
            <div>
              <div className="stat-value">{totalEmployees}</div>
              <div className="stat-label">Total Organization Staff</div>
            </div>
          </div>

          {/* Clocked In */}
          <div className="stat-card">
            <div className="stat-icon-wrap active">
              <LogIn size={20} />
            </div>
            <div>
              <div className="stat-value">{clockedInCount}</div>
              <div className="stat-label">Currently Clocked In</div>
            </div>
          </div>

          {/* Face Status */}
          <div className="stat-card">
            <div className="stat-icon-wrap face">
              <Camera size={20} />
            </div>
            <div>
              <div className="stat-value">
                {faceEnrolledCount}
                <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>
                  /{totalEmployees}
                </span>
              </div>
              <div className="stat-label">
                {facePendingCount > 0 ? `${facePendingCount} Pending Enrollment` : 'All Faces Enrolled'}
              </div>
            </div>
          </div>
        </section>

        {/* ── Tab: Attendance Station ─────────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <>
            {!showAdminRoster ? (
              /* KIOSK PRIVACY MODE: Only enter Gmail before seeing employee stuff */
              !identifiedEmployee ? (
                <div className="kiosk-lookup-container">
                  <div className="kiosk-lookup-card">
                    <img src="/logo.jpg" alt="TimeLogic" className="brand-img-logo-lg" />
                    <h2>Attendance Station Kiosk</h2>
                    <p className="muted">
                      Enter your registered Gmail address below to access your attendance profile and record check-in.
                    </p>

                    {kioskError && (
                      <div className="alert error" style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
                        <AlertTriangle size={18} />
                        <span>{kioskError}</span>
                      </div>
                    )}

                    <form className="kiosk-email-form" onSubmit={handleLookupEmployee}>
                      <div className="kiosk-email-input-wrap">
                        <Mail size={18} className="mail-icon" />
                        <input
                          type="email"
                          value={kioskEmail}
                          onChange={(e) => {
                            setKioskEmail(e.target.value);
                            setKioskError('');
                          }}
                          placeholder="Enter your registered Gmail address…"
                          autoFocus
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn primary kiosk-continue-btn"
                        disabled={kioskBusy}
                      >
                        {kioskBusy ? (
                          <>
                            <RefreshCw size={16} className="spin" />
                            <span>Finding Employee…</span>
                          </>
                        ) : (
                          <>
                            <span>Continue to Station</span>
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </form>

                    <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                      <button
                        type="button"
                        className="switch-user-btn"
                        style={{ margin: '0 auto', fontSize: '0.78rem' }}
                        onClick={() => setShowAdminRoster(true)}
                      >
                        <Users size={14} />
                        <span>Supervisor Mode: Show Full Roster</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* IDENTIFIED EMPLOYEE CARD */
                (() => {
                  const emp = identifiedEmployee;
                  const attendance = emp.attendance;
                  const hasOpenCheckIn = Boolean(attendance?.clockInTime && !attendance?.clockOutTime);
                  const isCheckedOutToday = Boolean(attendance?.clockInTime && attendance?.clockOutTime && isDateToday(attendance.clockInTime, dashboard?.serverTime));
                  const isCheckedIn = hasOpenCheckIn || isCheckedOutToday;
                  const isCheckedOut = isCheckedOutToday;
                  const faceReady = hasEnrolledFace(emp);
                  const onBreak = Boolean(breaks[emp.id]);

                  return (
                    <div className="kiosk-lookup-container">
                      <div className="identified-emp-card">
                        {resetCountdown !== null && (
                          <div
                            className="alert success"
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.65rem 1rem',
                            }}
                          >
                            <span>
                              ✓ Attendance recorded! Ready for next person in <strong>{resetCountdown}s</strong>…
                            </span>
                            <button
                              className="btn secondary"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                setIdentifiedEmployee(null);
                                setKioskEmail('');
                                setResetCountdown(null);
                              }}
                            >
                              Reset Now
                            </button>
                          </div>
                        )}

                        <div className="identified-emp-header">
                          <div className={`identified-avatar ${faceReady ? 'enrolled' : ''}`}>
                            {emp.firstName[0]}
                            {emp.lastName[0]}
                          </div>
                          <div className="identified-emp-details">
                            <h2>
                              {emp.firstName} {emp.lastName}
                            </h2>
                            <div className="email-tag">{emp.email || kioskEmail}</div>
                            <div className="emp-meta" style={{ marginTop: '0.25rem' }}>
                              <span>Code: {emp.employeeCode || '—'}</span>
                              <span>•</span>
                              <span>{formatDepartment(emp)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Details */}
                        <div className="identified-status-box">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                              Facial Biometrics:
                            </span>
                            {faceReady ? (
                              <span className="badge face-enrolled" style={{ fontSize: '0.82rem' }} title="Face verified and permanently locked">
                                <UserCheck size={13} />
                                <span>Face Enrolled (Locked)</span>
                              </span>
                            ) : (
                              <span className="badge face-pending" style={{ fontSize: '0.82rem' }}>
                                <Camera size={13} />
                                <span>Face Not Enrolled</span>
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                              Attendance Status:
                            </span>
                            {isCheckedIn && !isCheckedOut ? (
                              <span className="badge clock-in" style={{ fontSize: '0.82rem' }}>
                                <LogIn size={13} />
                                <span>In: {formatTime(attendance?.clockInTime, dashboard?.organization.timezone)}</span>
                              </span>
                            ) : isCheckedOut ? (
                              <span className="badge clock-out" style={{ fontSize: '0.82rem' }}>
                                <LogOut size={13} />
                                <span>Out: {formatTime(attendance?.clockOutTime, dashboard?.organization.timezone)}</span>
                              </span>
                            ) : (
                              <span className="badge department" style={{ fontSize: '0.82rem' }}>
                                Not Clocked In Today
                              </span>
                            )}
                          </div>

                          {isCheckedIn && !isCheckedOut && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Break:</span>
                              {onBreak ? (
                                <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.82rem' }}>
                                  <Coffee size={13} />
                                  <span>Currently On Break</span>
                                </span>
                              ) : (
                                <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.82rem' }}>
                                  <span>Working</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="identified-actions-grid">
                          {!isCheckedIn ? (
                            <button
                              className="btn primary"
                              style={{ padding: '0.95rem', fontSize: '1.05rem', justifyContent: 'center' }}
                              disabled={!hasActiveSession}
                              onClick={() => setPendingAction({ type: 'check_in', employee: emp })}
                            >
                              <LogIn size={18} />
                              <span>Check In for Today</span>
                            </button>
                          ) : !isCheckedOut ? (
                            <>
                              <button
                                className="btn danger"
                                style={{ padding: '0.95rem', fontSize: '1.05rem', justifyContent: 'center' }}
                                onClick={() => setPendingAction({ type: 'check_out', employee: emp })}
                              >
                                <LogOut size={18} />
                                <span>Check Out (Password Only)</span>
                              </button>

                              <button
                                className={`btn ${onBreak ? 'danger' : 'amber'}`}
                                style={{ padding: '0.75rem', justifyContent: 'center' }}
                                disabled={breakBusy === emp.id}
                                onClick={() => void handleToggleBreak(emp)}
                              >
                                <Coffee size={16} />
                                <span>{breakBusy === emp.id ? 'Updating…' : onBreak ? 'End Break' : 'Take Break'}</span>
                              </button>
                            </>
                          ) : (
                            <div
                              style={{
                                textAlign: 'center',
                                padding: '1rem',
                                background: '#ecfdf5',
                                color: '#065f46',
                                borderRadius: 'var(--radius-lg)',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              ✓ Attendance Completed for Today
                            </div>
                          )}

                          {/* STRICT RULE: If face is NOT enrolled, allow enrolling. Once enrolled, NEVER show enroll button! */}
                          {!faceReady && (
                            <button
                              className="btn indigo"
                              style={{ padding: '0.85rem', justifyContent: 'center' }}
                              onClick={() => setPendingAction({ type: 'enroll_face', employee: emp })}
                            >
                              <UserPlus size={16} />
                              <span>📸 Enroll Facial Biometrics (One-Time Setup)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="switch-user-btn"
                            style={{ marginTop: '0.5rem' }}
                            onClick={() => {
                              setIdentifiedEmployee(null);
                              setKioskEmail('');
                              setResetCountdown(null);
                            }}
                          >
                            <RotateCcw size={15} />
                            <span>Done / Next Employee</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )
            ) : (
              /* SUPERVISOR MODE: Full Roster View */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <button className="btn secondary" onClick={() => setShowAdminRoster(false)}>
                    ← Back to Privacy Kiosk Mode
                  </button>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Supervisor View ({filteredEmployees.length} employees)
                  </span>
                </div>

                {/* Search & Filter Bar */}
                <div className="toolbar-panel">
                  <div className="search-field">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search staff by name or employee code…"
                    />
                  </div>

                  <div className="filter-pills">
                    <button
                      className={`pill-btn ${filter === 'all' ? 'active' : ''}`}
                      onClick={() => setFilter('all')}
                    >
                      All ({totalEmployees})
                    </button>
                    <button
                      className={`pill-btn ${filter === 'unclocked' ? 'active' : ''}`}
                      onClick={() => setFilter('unclocked')}
                    >
                      Not Clocked In
                    </button>
                    <button
                      className={`pill-btn ${filter === 'clocked_in' ? 'active' : ''}`}
                      onClick={() => setFilter('clocked_in')}
                    >
                      Clocked In ({clockedInCount})
                    </button>
                    <button
                      className={`pill-btn ${filter === 'enrolled' ? 'active' : ''}`}
                      onClick={() => setFilter('enrolled')}
                    >
                      Face Ready ({faceEnrolledCount})
                    </button>
                    <button
                      className={`pill-btn ${filter === 'needs_face' ? 'active' : ''}`}
                      onClick={() => setFilter('needs_face')}
                    >
                      Needs Face ({facePendingCount})
                    </button>
                  </div>
                </div>

                {/* Employee Cards Grid */}
                {loading && !dashboard ? (
                  <div className="empty-state">
                    <RefreshCw size={32} className="spin" />
                    <h3>Loading staff roster…</h3>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="empty-state">
                    <Users size={40} />
                    <h3>No staff members found</h3>
                    <p>Try modifying your search query or selected filter pills.</p>
                  </div>
                ) : (
                  <div className="employee-grid">
                    {filteredEmployees.map((emp) => {
                      const attendance = emp.attendance;
                      const hasOpenCheckIn = Boolean(attendance?.clockInTime && !attendance?.clockOutTime);
                      const isCheckedOutToday = Boolean(attendance?.clockInTime && attendance?.clockOutTime && isDateToday(attendance.clockInTime, dashboard?.serverTime));
                      const isCheckedIn = hasOpenCheckIn || isCheckedOutToday;
                      const isCheckedOut = isCheckedOutToday;
                      const faceReady = hasEnrolledFace(emp);

                      return (
                        <div className="emp-card" key={emp.id}>
                          <div>
                            <div className="emp-card-header">
                              <div className={`emp-avatar ${faceReady ? 'enrolled' : ''}`}>
                                {emp.firstName[0]}
                                {emp.lastName[0]}
                              </div>
                              <div className="emp-info">
                                <h3>
                                  {emp.firstName} {emp.lastName}
                                </h3>
                                <div className="emp-meta">
                                  <span>{emp.employeeCode || 'ID: —'}</span>
                                  <span>•</span>
                                  <span>{formatDepartment(emp)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Status Badges */}
                            <div className="emp-badges">
                              {/* Face Enrollment Status */}
                              {faceReady ? (
                                <span className="badge face-enrolled" title="Face verified & locked">
                                  <UserCheck size={12} />
                                  <span>Face Enrolled</span>
                                </span>
                              ) : (
                                <span className="badge face-pending" title="Biometric face not yet registered">
                                  <Camera size={12} />
                                  <span>Face Pending</span>
                                </span>
                              )}

                              {/* Attendance Status */}
                              {isCheckedIn && !isCheckedOut ? (
                                <span className="badge clock-in">
                                  <LogIn size={12} />
                                  <span>In: {formatTime(attendance?.clockInTime, dashboard?.organization.timezone)}</span>
                                </span>
                              ) : isCheckedOut ? (
                                <span className="badge clock-out">
                                  <LogOut size={12} />
                                  <span>Out: {formatTime(attendance?.clockOutTime, dashboard?.organization.timezone)}</span>
                                </span>
                              ) : (
                                <span className="badge department">Not Clocked In</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="emp-card-actions">
                            {/* Attendance Action: Check In or Check Out */}
                            {!isCheckedIn ? (
                              <button
                                className="btn primary"
                                disabled={!hasActiveSession}
                                onClick={() => setPendingAction({ type: 'check_in', employee: emp })}
                              >
                                <LogIn size={15} />
                                <span>Check In</span>
                              </button>
                            ) : !isCheckedOut ? (
                              <button
                                className="btn danger"
                                onClick={() => setPendingAction({ type: 'check_out', employee: emp })}
                              >
                                <LogOut size={15} />
                                <span>Check Out</span>
                              </button>
                            ) : (
                              <div
                                style={{
                                  textAlign: 'center',
                                  padding: '0.5rem',
                                  fontSize: '0.82rem',
                                  color: '#059669',
                                  fontWeight: 700,
                                }}
                              >
                                ✓ Attendance Completed for Today
                              </div>
                            )}

                            {/* STRICT RULE: If face is NOT enrolled, allow enrolling. If enrolled, NEVER allow re-enrolling! */}
                            {!faceReady && (
                              <button
                                className="btn indigo"
                                onClick={() => setPendingAction({ type: 'enroll_face', employee: emp })}
                              >
                                <UserPlus size={15} />
                                <span>Enroll Face</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Tab: Break Room ─────────────────────────────────────────────── */}
        {activeTab === 'breaks' && (
          <div className="break-table">
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Active Clocked-In Employees</h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.2rem' }}>
                Toggle break mode for employees currently present in the building.
              </p>
            </div>

            {rawEmployees.filter((e) => e.attendance?.clockInTime && !e.attendance?.clockOutTime).length === 0 ? (
              <div className="empty-state">
                <Coffee size={36} />
                <h3>No staff currently clocked in</h3>
                <p>Employees must check in to the station before taking a break.</p>
              </div>
            ) : (
              rawEmployees
                .filter((e) => e.attendance?.clockInTime && !e.attendance?.clockOutTime)
                .map((emp) => {
                  const onBreak = Boolean(breaks[emp.id]);
                  return (
                    <div className="break-row" key={`break-tab-${emp.id}`}>
                      <div className="break-user-info">
                        <div className="emp-avatar">{emp.firstName[0]}{emp.lastName[0]}</div>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                            {emp.firstName} {emp.lastName}
                          </strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                            {formatDepartment(emp)} · Clocked in at{' '}
                            {formatTime(emp.attendance?.clockInTime, dashboard?.organization.timezone)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {onBreak ? (
                          <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                            <Coffee size={12} />
                            <span>Currently on Break</span>
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                            <span>Working</span>
                          </span>
                        )}

                        <button
                          className={`btn ${onBreak ? 'danger' : 'amber'}`}
                          disabled={breakBusy === emp.id}
                          onClick={() => void handleToggleBreak(emp)}
                          style={{ minWidth: 120 }}
                        >
                          {breakBusy === emp.id ? (
                            <RefreshCw size={14} className="spin" />
                          ) : onBreak ? (
                            'End Break'
                          ) : (
                            'Take Break'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* ── Tab: Student Attendance ─────────────────────────────────────── */}
        {activeTab === 'students' && studentsEnabled && (
          <div>
            <div className="toolbar-panel">
              <div className="search-field">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student code or student name…"
                />
              </div>
            </div>

            <div className="break-table">
              {students.length === 0 ? (
                <div className="empty-state">
                  <GraduationCap size={40} />
                  <h3>No students found</h3>
                  <p>Search by student ID code above.</p>
                </div>
              ) : (
                students.map((student) => {
                  const isPresent = Boolean(
                    student.todayAttendance?.checkInTime && !student.todayAttendance?.checkOutTime
                  );
                  return (
                    <div className="break-row" key={student.id}>
                      <div className="break-user-info">
                        <div className="emp-avatar">{student.firstName[0]}{student.lastName[0]}</div>
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>
                            {student.firstName} {student.lastName}
                          </strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Code: {student.studentCode} {student.className ? `· ${student.className}` : ''}
                          </div>
                        </div>
                      </div>

                      <button
                        className={`btn ${isPresent ? 'danger' : 'primary'}`}
                        disabled={studentBusy === student.id || !hasActiveSession}
                        onClick={() => void handleToggleStudent(student)}
                      >
                        {studentBusy === student.id
                          ? 'Updating…'
                          : isPresent
                          ? 'Check Out Student'
                          : 'Check In Student'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          MODAL: Face Enrollment (One-Time Setup)
          ==================================================================== */}
      {pendingAction && pendingAction.type === 'enroll_face' && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge indigo">
                  <Camera size={20} />
                </div>
                <div>
                  <h2>Enroll Facial Biometrics</h2>
                  <span>One-Time Permanent Registration</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-notice">
                Registering face template for{' '}
                <strong>
                  {pendingAction.employee.firstName} {pendingAction.employee.lastName}
                </strong>
                .<br />
                <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>
                  ⚠️ Note: Once enrolled, this face will be locked and used for all future check-ins.
                </span>
              </div>

              {/* Camera Capture Viewfinder */}
              <FaceCapture
                onCapture={setFaceImage}
                onError={(err) => setError(err)}
                disabled={actionBusy}
              />
            </div>

            <div className="modal-footer">
              <button className="btn secondary" onClick={closeModal} disabled={actionBusy}>
                Cancel
              </button>
              <button
                className="btn indigo"
                disabled={!faceImage || actionBusy}
                onClick={handleEnrollFace}
              >
                {actionBusy ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Registering Face…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Save & Lock Face</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: Employee Check-In / Check-Out
          ==================================================================== */}
      {pendingAction &&
        (pendingAction.type === 'check_in' || pendingAction.type === 'check_out') && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <div
                    className={`modal-icon-badge ${
                      pendingAction.type === 'check_in' ? '' : 'danger'
                    }`}
                  >
                    {pendingAction.type === 'check_in' ? (
                      <LogIn size={20} />
                    ) : (
                      <LogOut size={20} />
                    )}
                  </div>
                  <div>
                    <h2>
                      {pendingAction.type === 'check_in' ? 'Employee Check-In' : 'Employee Check-Out'}
                    </h2>
                    <span>
                      {pendingAction.employee.firstName} {pendingAction.employee.lastName} ·{' '}
                      {formatDepartment(pendingAction.employee)}
                    </span>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {/* Notice if employee has no face enrolled — ONLY on check_in */}
                {pendingAction.type === 'check_in' && !hasEnrolledFace(pendingAction.employee) && (
                  <div
                    className="alert warning"
                    style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                      <AlertTriangle size={16} />
                      <span>No Face Enrolled Yet</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                      This employee has not registered a face photo yet. You can enroll their face now or confirm check-in with password.
                    </p>
                    <button
                      type="button"
                      className="btn indigo"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', marginTop: '0.25rem' }}
                      onClick={() =>
                        setPendingAction({
                          type: 'enroll_face',
                          employee: pendingAction.employee,
                        })
                      }
                    >
                      <UserPlus size={14} />
                      <span>Enroll Face Now</span>
                    </button>
                  </div>
                )}

                {/* Information hint for check-out */}
                {pendingAction.type === 'check_out' && (
                  <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    Enter your employee password below to confirm clocking out.
                  </p>
                )}

                {/* Password Input */}
                <div className="form-group">
                  <label>
                    <Lock size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                    Employee Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter personal password"
                    autoFocus
                  />
                </div>

                {/* Face Biometric Verification — STRICTLY ONLY for check_in */}
                {pendingAction.type === 'check_in' && hasEnrolledFace(pendingAction.employee) && (
                  <div className="form-group">
                    <label>
                      <Camera size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                      Face Verification
                    </label>
                    <FaceCapture
                      onCapture={setFaceImage}
                      onError={(msg) => setError(msg)}
                      disabled={actionBusy}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn secondary" onClick={closeModal} disabled={actionBusy}>
                  Cancel
                </button>
                <button
                  className={`btn ${pendingAction.type === 'check_in' ? 'primary' : 'danger'}`}
                  disabled={
                    !password ||
                    actionBusy ||
                    (pendingAction.type === 'check_in' &&
                      hasEnrolledFace(pendingAction.employee) &&
                      !faceImage)
                  }
                  onClick={handleAttendanceAction}
                >
                  {actionBusy ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>{pendingAction.type === 'check_in' ? 'Verifying Biometrics…' : 'Checking Out…'}</span>
                    </>
                  ) : pendingAction.type === 'check_in' ? (
                    <>
                      <LogIn size={15} />
                      <span>Confirm Check-In</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={15} />
                      <span>Confirm Check-Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default App;
