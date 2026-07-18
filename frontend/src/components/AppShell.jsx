import React from 'react';

export default function AppShell({ user, activeTab, setActiveTab, onLogout, children }) {
  // Sidebar items definition based on role
  const getSidebarConfig = () => {
    switch (user.role) {
      case 'director':
        return {
          title: 'Director Panel',
          sections: [
            {
              title: 'Main',
              items: [
                { id: 'dashboard', label: 'Dashboard', icon: 'i-grid' },
                { id: 'students', label: 'Students', icon: 'i-users' },
                { id: 'staff', label: 'Staff', icon: 'i-teacher' }
              ]
            },
            {
              title: 'Academics',
              items: [
                { id: 'attendance', label: 'Attendance', icon: 'i-cal' },
                { id: 'marks', label: 'Marks & Tests', icon: 'i-clip', badge: 12 },
                { id: 'workdone', label: 'Work Done', icon: 'i-book' }
              ]
            },
            {
              title: 'Admin',
              items: [
                { id: 'fees', label: 'Fees', icon: 'i-wallet' },
                { id: 'notices', label: 'Notice Board', icon: 'i-mega' },
                { id: 'reports', label: 'Reports', icon: 'i-chart' },
                { id: 'users', label: 'User Management', icon: 'i-user' }
              ]
            }
          ]
        };
      case 'staff':
        return {
          title: 'Staff Panel',
          sections: [
            {
              title: 'My Classes',
              items: [
                { id: 'dashboard', label: 'Dashboard', icon: 'i-grid' },
                { id: 'attendance', label: 'Attendance', icon: 'i-cal' },
                { id: 'marks', label: 'Marks & Tests', icon: 'i-clip' },
                { id: 'workdone', label: 'Work Done', icon: 'i-book' },
                { id: 'notices', label: 'Notice Board', icon: 'i-mega' }
              ]
            }
          ]
        };
      case 'student':
      default:
        return {
          title: 'Student Portal',
          sections: [
            {
              title: 'My Space',
              items: [
                { id: 'dashboard', label: 'My Dashboard', icon: 'i-grid' },
                { id: 'attendance', label: 'My Attendance', icon: 'i-cal' },
                { id: 'marks', label: 'My Marks', icon: 'i-clip' },
                { id: 'fees', label: 'My Fees', icon: 'i-wallet' },
                { id: 'notices', label: 'Notices', icon: 'i-mega' }
              ]
            }
          ]
        };
    }
  };

  const config = getSidebarConfig();

  // Get user avatar initials
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  // Human-readable titles for headers.
  // Prefer the label from this role's own sidebar config so the header always
  // matches what the user clicked (e.g. a student sees "My Marks", not "Marks Entry").
  const getTabLabel = (id) => {
    for (const section of config.sections) {
      const match = section.items.find((item) => item.id === id);
      if (match) return match.label;
    }
    const labels = {
      dashboard: 'Dashboard',
      students: 'Students List',
      staff: 'Staff Directory',
      attendance: 'Attendance',
      marks: 'Marks Entry',
      workdone: 'Work Done Log',
      fees: 'Fee Management',
      notices: 'Notice Board',
      reports: 'Performance Reports'
    };
    return labels[id] || id.charAt(0).toUpperCase() + id.slice(1);
  };

  return (
    <div className="app">
      <aside className="sb">
        <div className="sb-brand">
          <span className="sb-logo">
            <span>R</span>
          </span>
          <div>
            <b>RAM Tuition</b>
            <small>{config.title}</small>
          </div>
        </div>

        {config.sections.map((section, idx) => (
          <React.Fragment key={idx}>
            <div className="sb-sec">{section.title}</div>
            {section.items.map((item) => (
              <div
                key={item.id}
                className={`sb-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <svg className="ic">
                  <use href={`#${item.icon}`} />
                </svg>
                {item.label}
                {item.badge && <span className="badge">{item.badge}</span>}
              </div>
            ))}
          </React.Fragment>
        ))}

        {/* Logout button at the bottom of sections */}
        <div className="sb-sec">Account</div>
        <div className="sb-item" onClick={onLogout} style={{ color: 'var(--red)' }}>
          <svg className="ic">
            <use href="#i-out" />
          </svg>
          Sign Out
        </div>

        {/* Profile Card Footer */}
        <div className="sb-user">
          <div className="av" style={user.role === 'student' ? { background: 'linear-gradient(145deg, var(--gold), var(--gold-d))' } : {}}>
            {getInitials(user.name)}
          </div>
          <div>
            <b>{user.name}</b>
            <small>{user.role === 'director' ? 'Managing Director' : user.role === 'staff' ? 'Maths · Class 10, 12' : `Roll R-1042`}</small>
          </div>
        </div>

        {/* Developer Signature */}
        <a
          className="sb-credit"
          href="https://in.linkedin.com/in/dharneesh-thangavel-6062aa26a"
          target="_blank"
          rel="noopener noreferrer"
        >
          Developed by <b>Dharneesh Thangavel</b>
        </a>
      </aside>

      <div className="main">
        <div className="tb">
          <div>
            <h2>{getTabLabel(activeTab)}</h2>
            <div className="crumb">Home · {getTabLabel(activeTab)}</div>
          </div>
          {user.role !== 'student' && (
            <div className="tb-search">
              <svg className="ic">
                <use href="#i-search" />
              </svg>{' '}
              Search students, staff…
            </div>
          )}
          <div className="tb-ic" style={user.role === 'student' ? { marginLeft: 'auto' } : {}}>
            <svg className="ic">
              <use href="#i-bell" />
            </svg>
            <span className="dot"></span>
          </div>
          <div className="tb-av" style={user.role === 'student' ? { background: 'linear-gradient(145deg, var(--gold), var(--gold-d))' } : {}}>
            {getInitials(user.name)}
          </div>
        </div>

        {/* keyed by tab so each view replays the 3D entrance animation */}
        <div className="content">
          <div className="view-anim" key={activeTab}>{children}</div>
        </div>
      </div>
    </div>
  );
}
