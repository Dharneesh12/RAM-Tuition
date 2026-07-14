import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [user, setUser] = useState(null); // { id, name, username, role }
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

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
        return <DirectorDashboard setActiveTab={setActiveTab} />;
      case 'students':
        return <StudentsList setActiveTab={setActiveTab} />;
      case 'staff':
        return <StaffDirectory />;
      case 'admission':
        return <AdmissionForm onAdmissionComplete={() => setActiveTab('students')} />;
      case 'attendance':
        return <AttendanceMarking />;
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
      default:
        return <DirectorDashboard setActiveTab={setActiveTab} />;
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
