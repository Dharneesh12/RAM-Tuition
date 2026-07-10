import React, { useEffect, useState } from 'react';

export default function DirectorDashboard({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <div style={{ padding: '20px', fontWeight: 600 }}>Loading Dashboard...</div>;
  if (error) return <div style={{ padding: '20px', color: 'var(--red)' }}>Error: {error}</div>;

  const { stats, recentAdmissions } = data;

  // Helper to format currency
  const formatCurrency = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div>
      {/* KPI Cards Section */}
      <div className="kpis">
        <div className="kpi k1">
          <span className="trend up">▲ 6%</span>
          <div className="kic">
            <svg className="ic">
              <use href="#i-users" />
            </svg>
          </div>
          <div className="big">{stats.totalStudents}</div>
          <div className="lbl">Total Students</div>
        </div>

        <div className="kpi k2">
          <div className="kic">
            <svg className="ic">
              <use href="#i-teacher" />
            </svg>
          </div>
          <div className="big">{stats.totalStaff}</div>
          <div className="lbl">Staff Members</div>
        </div>

        <div className="kpi k3">
          <span className="trend dn">{stats.pendingCount} due</span>
          <div className="kic">
            <svg className="ic">
              <use href="#i-wallet" />
            </svg>
          </div>
          <div className="big">{formatCurrency(stats.feesPendingAmount)}</div>
          <div className="lbl">Fees Pending</div>
        </div>

        <div className="kpi k4">
          <div className="kic">
            <svg className="ic">
              <use href="#i-clip" />
            </svg>
          </div>
          <div className="big">{stats.lowScoresCount}</div>
          <div className="lbl">Scores below 50%</div>
        </div>
      </div>

      {/* Grid containing Charts */}
      <div className="grid2">
        <div className="panel">
          <div className="panel-h">
            <h4>Attendance Overview</h4>
            <span className="lnk">This month ▾</span>
          </div>
          <div className="bars">
            <div className="bar-col">
              <div className="bar" style={{ height: '70%' }}></div>
              <small>Cls 9</small>
            </div>
            <div className="bar-col">
              <div className="bar alt" style={{ height: '88%' }}></div>
              <small>Cls 10</small>
            </div>
            <div className="bar-col">
              <div className="bar" style={{ height: '62%' }}></div>
              <small>Cls 11</small>
            </div>
            <div className="bar-col">
              <div className="bar alt" style={{ height: '95%' }}></div>
              <small>Cls 12</small>
            </div>
            <div className="bar-col">
              <div className="bar" style={{ height: '80%' }}></div>
              <small>Maths</small>
            </div>
            <div className="bar-col">
              <div className="bar alt" style={{ height: '74%' }}></div>
              <small>Science</small>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-h">
            <h4>Fee Status</h4>
          </div>
          <div className="donut-wrap">
            {/* Render conic-gradient dynamic based on the actual database collection rate */}
            <div
              className="donut"
              style={{
                background: `conic-gradient(var(--green) 0 ${stats.collectionRate}%, var(--amber) ${stats.collectionRate}% 100%)`
              }}
            >
              <div className="hole">
                <b>{stats.collectionRate}%</b>
                <small>Collected</small>
              </div>
            </div>
            <div>
              <div className="leg-row">
                <i style={{ background: 'var(--green)' }}></i> Paid · {stats.paidCount}
              </div>
              <div className="leg-row">
                <i style={{ background: 'var(--amber)' }}></i> Pending · {stats.pendingCount}
              </div>
              <div style={{ marginTop: '14px', fontSize: '.82rem', color: 'var(--muted)' }}>
                Total expected
                <br />
                <b style={{ fontFamily: 'var(--disp)', fontSize: '1.2rem', color: 'var(--ink)' }}>
                  {formatCurrency(stats.totalExpectedAmount)}
                </b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Admissions Table */}
      <div className="panel">
        <div className="panel-h">
          <h4>Recent Admissions</h4>
          <span className="lnk" onClick={() => setActiveTab('students')}>
            View all students →
          </span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll No</th>
              <th>Class</th>
              <th>Subjects</th>
              <th>Fee Status</th>
            </tr>
          </thead>
          <tbody>
            {recentAdmissions.map((student) => {
              // Extract colors based on roll no
              const colors = [
                'linear-gradient(145deg,#3B5BFF,#2743d9)',
                'linear-gradient(145deg,#10D9B8,#07a98f)',
                'linear-gradient(145deg,#FFB020,#e8940a)',
                'linear-gradient(145deg,#6C5CE7,#4c3fd0)'
              ];
              const bgGradient = colors[student.id % colors.length];
              const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              
              // Find fee status
              const feeStatus = student.status === 'draft' ? 'draft' : student.rollNo === 'R-1043' || student.rollNo === 'R-1045' ? 'pending' : 'paid';

              return (
                <tr key={student.id}>
                  <td>
                    <div className="who">
                      <span className="av" style={{ background: bgGradient }}>
                        {initials}
                      </span>
                      <b>{student.name}</b>
                    </div>
                  </td>
                  <td>{student.rollNo || 'Pending'}</td>
                  <td>{student.grade}</td>
                  <td>
                    <div className="chipset">
                      {Array.isArray(student.subjects) &&
                        student.subjects.map((sub, sIdx) => (
                          <span key={sIdx} className="subj">
                            {sub}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td>
                    {feeStatus === 'draft' ? (
                      <span className="pill" style={{ background: 'var(--line)', color: 'var(--muted)' }}>Draft</span>
                    ) : feeStatus === 'pending' ? (
                      <span className="pill p-pend">Pending</span>
                    ) : (
                      <span className="pill p-paid">Paid</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {recentAdmissions.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                  No students admitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
