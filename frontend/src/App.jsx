import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login.jsx';
import AppShell from './components/AppShell.jsx';
import DirectorDashboard from './components/DirectorDashboard.jsx';
import StudentsList from './components/StudentsList.jsx';
import StaffDirectory from './components/StaffDirectory.jsx';
import AdmissionForm from './components/AdmissionForm.jsx';
import AttendanceMarking from './components/AttendanceMarking.jsx';
import MarksEntry from './components/MarksEntry.jsx';
import FeeManagement from './components/FeeManagement.jsx';
import NoticeBoard from './components/NoticeBoard.jsx';
import WorkDoneLog from './components/WorkDoneLog.jsx';
import ReportsOverview from './components/ReportsOverview.jsx';
import StudentPortal from './components/StudentPortal.jsx';
import UserManagement from './components/UserManagement.jsx';
import ClassSubjectSettings from './components/ClassSubjectSettings.jsx';

const SESSION_KEY = 'ramTuitionSession';

// Restore a previously saved session (if any) so refreshing the page doesn't
// log the user out. "Keep me signed in" decides which storage was used:
// localStorage survives browser restarts, sessionStorage clears on tab close.
const loadSession = () => {
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function App() {
  const initialSession = loadSession();
  const [user, setUser] = useState(initialSession?.user || null); // { id, name, username, role }
  const [activeTab, setActiveTab] = useState(initialSession?.activeTab || 'dashboard');
  // Tracks which storage the current session lives in, so tab changes get
  // persisted to the same place; null means no session is being persisted.
  const storageRef = useRef(initialSession ? (localStorage.getItem(SESSION_KEY) ? 'local' : 'session') : null);

  const handleLoginSuccess = (userData, keepSignedIn) => {
    storageRef.current = keepSignedIn ? 'local' : 'session';
    const payload = JSON.stringify({ user: userData, activeTab: 'dashboard' });
    (keepSignedIn ? localStorage : sessionStorage).setItem(SESSION_KEY, payload);
    (keepSignedIn ? sessionStorage : localStorage).removeItem(SESSION_KEY);
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    storageRef.current = null;
    setUser(null);
    setActiveTab('dashboard');
  };

  // Keep the persisted session's activeTab in sync so a refresh lands back
  // on the same page instead of bouncing to the dashboard.
  useEffect(() => {
    if (!storageRef.current || !user) return;
    const store = storageRef.current === 'local' ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify({ user, activeTab }));
  }, [activeTab, user]);

  // When authenticated, run the app full-screen (no page scroll / body padding)
  useEffect(() => {
    if (user) {
      document.body.classList.add('app-mode');
    } else {
      document.body.classList.remove('app-mode');
    }
    return () => document.body.classList.remove('app-mode');
  }, [user]);

  // Render correct view based on role and active tab
  const renderActiveView = () => {
    if (!user) return null;

    // STUDENT PORTAL: a single component that switches its inner view by activeTab
    if (user.role === 'student') {
      return <StudentPortal user={user} activeTab={activeTab} />;
    }

    // Role-based access map — staff only reach their own tabs; everything
    // else (students, staff, admission, fees, reports, users) is director-only.
    const staffAllowed = ['dashboard', 'attendance', 'marks', 'workdone', 'notices'];
    if (user.role === 'staff' && !staffAllowed.includes(activeTab)) {
      return <DirectorDashboard setActiveTab={setActiveTab} />;
    }

    // DIRECTOR and STAFF views
    switch (activeTab) {
      case 'dashboard':
        return <DirectorDashboard setActiveTab={setActiveTab} user={user} />;
      case 'students':
        return <StudentsList setActiveTab={setActiveTab} />;
      case 'staff':
        return <StaffDirectory />;
      case 'admission':
        return <AdmissionForm onAdmissionComplete={() => setActiveTab('students')} />;
      case 'attendance':
        return <AttendanceMarking user={user} />;
      case 'marks':
        return <MarksEntry />;
      case 'fees':
        return <FeeManagement />;
      case 'notices':
        return <NoticeBoard />;
      case 'workdone':
        return <WorkDoneLog user={user} />;
      case 'reports':
        return <ReportsOverview />;
      case 'users':
        // Account management is director-only
        return user.role === 'director' ? <UserManagement /> : <DirectorDashboard setActiveTab={setActiveTab} />;
      case 'settings':
        // Classes & Subjects config is director-only
        return user.role === 'director' ? <ClassSubjectSettings /> : <DirectorDashboard setActiveTab={setActiveTab} />;
      default:
        return <DirectorDashboard setActiveTab={setActiveTab} user={user} />;
    }
  };

  // Render Login page if not authenticated
  if (!user) {
    return (
      <div className="canvas" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
        <div className="screen" style={{ width: '100%', maxWidth: '1080px' }}>
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  // Render App Frame if authenticated — full-screen, no intro cover
  return (
    <div className="canvas canvas-app">
      <div className="screen screen-app">
        <AppShell user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
          {renderActiveView()}
        </AppShell>
      </div>
    </div>
  );
}
