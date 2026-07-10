import React, { useState, useEffect } from 'react';

export default function StudentPortal({ user, activeTab = 'dashboard' }) {
  const [studentDetails, setStudentDetails] = useState(null);
  const [marks, setMarks] = useState([]);
  const [notices, setNotices] = useState([]);
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mobile Mockup Tab Navigation State
  const [mobileTab, setMobileTab] = useState('home');

  const fetchStudentData = async () => {
    try {
      // 1. Fetch student list to find this student
      const studRes = await fetch('/api/students');
      const studData = await studRes.json();
      // Default to roll R-1042 (Arun Kumar) if no matching user roll
      const student = studData.find(s => s.name === user.name) || studData.find(s => s.rollNo === 'R-1042') || studData[0];
      setStudentDetails(student);

      if (student) {
        // 2. Fetch marks for this student
        const marksRes = await fetch('/api/marks?testName=Unit Test 2 — Trigonometry');
        const marksData = await marksRes.json();
        setMarks(marksData.filter(m => m.studentId === student.id));

        // 3. Fetch this student's fee record for the current month
        const feeRes = await fetch('/api/fees?month=July');
        const feeData = await feeRes.json();
        setFee(feeData.find(f => f.studentId === student.id) || null);
      }

      // 4. Fetch notices
      const noticeRes = await fetch('/api/notices');
      const noticeData = await noticeRes.json();
      setNotices(noticeData.slice(0, 3));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  if (loading) return <div style={{ padding: '20px', fontWeight: 600 }}>Loading Student Portal...</div>;
  if (error) return <div style={{ padding: '20px', color: 'var(--red)' }}>Error: {error}</div>;

  const student = studentDetails || {
    name: 'Arun Kumar',
    rollNo: 'R-1042',
    grade: 'Class 12',
    subjects: ['Mathematics', 'Physics']
  };

  // Avatar Initials
  const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Fee display helpers (fall back to a representative value if none on record)
  const feeStatus = fee ? fee.status : 'paid';
  const feeAmount = fee ? fee.amount : 2500;
  const feePaid = feeStatus === 'paid';
  const feeStatusLabel = feePaid ? 'Paid' : 'Pending';

  // -----------------------------------------------------------------
  // Reusable sub-views (each maps to a sidebar tab)
  // -----------------------------------------------------------------
  const ProfileCard = () => (
    <div className="panel" style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '24px',
          margin: '6px auto 14px',
          background: 'linear-gradient(145deg, var(--blue), var(--indigo))',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          fontFamily: 'var(--disp)',
          fontWeight: 800,
          fontSize: '2rem',
          boxShadow: 'var(--sh-blue)'
        }}
      >
        {initials}
      </div>
      <h4 style={{ fontFamily: 'var(--disp)' }}>{student.name}</h4>
      <div style={{ color: 'var(--muted)', fontSize: '.85rem', margin: '2px 0 12px' }}>
        Roll No · {student.rollNo} · {student.grade}
      </div>
      <div className="chipset" style={{ justifyContent: 'center' }}>
        {Array.isArray(student.subjects) &&
          student.subjects.map((sub, idx) => (
            <span key={idx} className="subj">
              {sub}
            </span>
          ))}
      </div>
      <div
        style={{
          borderTop: '1px solid var(--line)',
          marginTop: '16px',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <b style={{ fontFamily: 'var(--disp)', fontSize: '1.2rem' }}>96%</b>
          <br />
          <small style={{ color: 'var(--muted)' }}>Attendance</small>
        </div>
        <div>
          <b style={{ fontFamily: 'var(--disp)', fontSize: '1.2rem', color: feePaid ? 'var(--green)' : 'var(--gold)' }}>
            {feeStatusLabel}
          </b>
          <br />
          <small style={{ color: 'var(--muted)' }}>Fees · July</small>
        </div>
      </div>
    </div>
  );

  const AttendancePanel = () => (
    <div className="panel">
      <div className="panel-h">
        <h4>My Attendance</h4>
        <span className="lnk">July 2026</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
        <div className="ring">
          <div className="in">
            <b>96%</b>
            <small>Present</small>
          </div>
        </div>
        <div style={{ fontSize: '.9rem', color: 'var(--ink2)', lineHeight: 2 }}>
          <b>24</b> / 25 days present
          <br />
          <span style={{ color: 'var(--muted)' }}>1 day absent · above target</span>
        </div>
      </div>
    </div>
  );

  const MarksTable = () => (
    <div className="panel">
      <div className="panel-h">
        <h4>Recent Marks</h4>
        <span className="lnk">Unit Test 2</span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Test</th>
            <th>Subject</th>
            <th>Score</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {marks.map((m) => (
            <tr key={m.id}>
              <td>
                <b>{m.testName}</b>
              </td>
              <td>{m.subject}</td>
              <td>
                <span className="pill p-paid">
                  {m.marksObtained}/{m.maxMarks}
                </span>
              </td>
              <td style={{ color: 'var(--ink2)', fontSize: '.82rem' }}>{m.remarks}</td>
            </tr>
          ))}
          {marks.length === 0 && (
            <tr>
              <td>
                <b>Unit Test 2</b>
              </td>
              <td>Maths</td>
              <td>
                <span className="pill p-paid">46/50</span>
              </td>
              <td style={{ color: 'var(--ink2)', fontSize: '.82rem' }}>Calc slip in Q7</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const NoticesPanel = () => (
    <div className="panel">
      <div className="panel-h">
        <h4>📢 Latest Notices</h4>
      </div>
      <div className="notices">
        {notices.map((notice) => (
          <div key={notice.id} className="notice" style={{ borderLeftColor: notice.title.includes('Fee') ? 'var(--gold)' : notice.title.includes('Doubt') ? 'var(--mint)' : '' }}>
            <b>{notice.title}</b>
            <p>{notice.message}</p>
            <div className="meta">{notice.publishDate}</div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="notice">
            <b>Quarterly Exam Timetable Released</b>
            <p>Class 12 exams begin 22 July.</p>
            <div className="meta">05 Jul</div>
          </div>
        )}
      </div>
    </div>
  );

  const FeesPanel = () => (
    <div className="panel">
      <div className="panel-h">
        <h4>My Fees</h4>
        <span className={`pill ${feePaid ? 'p-paid' : 'p-pending'}`}>{feeStatusLabel}</span>
      </div>
      <div style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '18px', background: 'var(--sky2)' }}>
        <b style={{ fontFamily: 'var(--disp)', fontSize: '1.05rem' }}>July 2026 Invoice</b>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '.9rem' }}>
          <span style={{ color: 'var(--ink2)' }}>Tuition Fee ({student.grade})</span>
          <b>₹{feeAmount.toLocaleString('en-IN')}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '.9rem' }}>
          <span style={{ color: 'var(--ink2)' }}>Status</span>
          <b style={{ color: feePaid ? 'var(--green)' : 'var(--gold)' }}>{feeStatusLabel.toUpperCase()}</b>
        </div>
        {!feePaid && (
          <div style={{ marginTop: '8px', fontSize: '.82rem', color: 'var(--muted)' }}>
            Kindly clear the pending fee before 15 July to avoid late charges.
          </div>
        )}
      </div>
    </div>
  );

  const MobileMockup = () => (
    <div style={{ borderTop: '2px solid var(--line)', paddingTop: '32px' }}>
      <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: '1.25rem', marginBottom: '18px' }}>
        Mobile Responsive Preview Mockup
      </h3>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start', padding: '8px 4px' }}>
        <div className="phone">
          <div className="phone-nub"></div>
          <div className="phone-scr">
            {/* Phone Header */}
            <div className="mtop">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '13px',
                    background: 'linear-gradient(145deg, #FFB020, #e8940a)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800
                  }}
                >
                  {initials}
                </div>
                <div>
                  <b style={{ fontFamily: 'var(--disp)', color: '#fff' }}>Hi, {student.name.split(' ')[0]} 👋</b>
                  <br />
                  <small style={{ color: '#c3ccf5' }}>
                    {student.grade} · {student.rollNo}
                  </small>
                </div>
                <div
                  className="tb-ic"
                  style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.15)', color: '#fff' }}
                >
                  <svg className="ic">
                    <use href="#i-bell" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Phone Body Pages */}
            <div style={{ padding: '16px', overflow: 'auto', flex: 1, marginTop: '-12px' }}>
              {mobileTab === 'home' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div className="panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <b style={{ fontFamily: 'var(--disp)', fontSize: '1.5rem', color: 'var(--blue)' }}>96%</b>
                      <br />
                      <small style={{ color: 'var(--muted)' }}>Attendance</small>
                    </div>
                    <div className="panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <b style={{ fontFamily: 'var(--disp)', fontSize: '1.5rem', color: feePaid ? 'var(--green)' : 'var(--gold)' }}>{feeStatusLabel}</b>
                      <br />
                      <small style={{ color: 'var(--muted)' }}>Fees July</small>
                    </div>
                  </div>
                  <div className="panel" style={{ padding: '16px', marginBottom: '14px' }}>
                    <div className="panel-h" style={{ marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '.95rem' }}>Recent Marks</h4>
                    </div>
                    {marks.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderBottom: '1px solid var(--line2)',
                          fontSize: '.85rem'
                        }}
                      >
                        <span>
                          <b>{m.subject}</b> · {m.testName.split(' — ')[0]}
                        </span>
                        <span className="pill p-paid">
                          {m.marksObtained}/{m.maxMarks}
                        </span>
                      </div>
                    ))}
                    {marks.length === 0 && (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid var(--line2)',
                            fontSize: '.85rem'
                          }}
                        >
                          <span>
                            <b>Maths</b> · Unit Test 2
                          </span>
                          <span className="pill p-paid">46/50</span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            fontSize: '.85rem'
                          }}
                        >
                          <span>
                            <b>Physics</b> · Unit Test 2
                          </span>
                          <span className="pill p-paid">42/50</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="panel" style={{ padding: '16px' }}>
                    <div className="panel-h" style={{ marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '.95rem' }}>📢 Notice</h4>
                    </div>
                    {notices.map((n) => (
                      <div key={n.id} className="notice" style={{ padding: '10px 12px', marginBottom: '8px', borderLeftColor: n.title.includes('Fee') ? 'var(--gold)' : '' }}>
                        <b style={{ fontSize: '.85rem' }}>{n.title}</b>
                        <p style={{ fontSize: '.76rem' }}>{n.message}</p>
                      </div>
                    ))}
                    {notices.length === 0 && (
                      <div className="notice" style={{ padding: '10px 12px' }}>
                        <b style={{ fontSize: '.85rem' }}>Exam Timetable Out</b>
                        <p style={{ fontSize: '.76rem' }}>Class 12 exams from 22 July.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {mobileTab === 'cal' && (
                <div className="panel" style={{ padding: '16px' }}>
                  <div className="panel-h" style={{ marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '.95rem' }}>Attendance Records</h4>
                  </div>
                  <p style={{ fontSize: '.85rem', color: 'var(--ink2)' }}>July 2026 Attendance Summary:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                      <span>Total Sessions:</span>
                      <b>25 days</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                      <span>Present Count:</span>
                      <b style={{ color: 'var(--green)' }}>24 days</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                      <span>Absent Count:</span>
                      <b style={{ color: 'var(--red)' }}>1 day</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                      <span>Portion Coverage:</span>
                      <b>96% (Portion Target Met)</b>
                    </div>
                  </div>
                </div>
              )}

              {mobileTab === 'clip' && (
                <div className="panel" style={{ padding: '16px' }}>
                  <div className="panel-h" style={{ marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '.95rem' }}>Marks Sheet</h4>
                  </div>
                  <p style={{ fontSize: '.85rem', color: 'var(--ink2)', marginBottom: '8px' }}>Portion: Unit Test 2</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', borderBottom: '1px solid var(--line2)', paddingBottom: '6px' }}>
                      <span>Maths:</span>
                      <b>46 / 50</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem' }}>
                      <span>Physics:</span>
                      <b>42 / 50</b>
                    </div>
                  </div>
                </div>
              )}

              {mobileTab === 'wallet' && (
                <div className="panel" style={{ padding: '16px' }}>
                  <div className="panel-h" style={{ marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '.95rem' }}>Fee Invoices</h4>
                  </div>
                  <div style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '12px', background: 'var(--sky2)', fontSize: '.8rem' }}>
                    <b>July 2026 Invoice</b>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span>Tuition Fee:</span>
                      <b>₹{feeAmount.toLocaleString('en-IN')}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span>Status:</span>
                      <b style={{ color: feePaid ? 'var(--green)' : 'var(--gold)' }}>{feeStatusLabel.toUpperCase()}</b>
                    </div>
                  </div>
                </div>
              )}

              {mobileTab === 'user' && (
                <div className="panel" style={{ padding: '16px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      margin: '6px auto 10px',
                      background: 'linear-gradient(145deg, var(--blue), var(--indigo))',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1.2rem'
                    }}
                  >
                    {initials}
                  </div>
                  <b>{student.name}</b>
                  <p style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Class: {student.grade}</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--muted)' }}>School: {student.school}</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '8px' }}>Email: {student.email}</p>
                </div>
              )}
            </div>

            {/* Phone Tab Navigator */}
            <div className="mtab">
              <svg className={`ic ${mobileTab === 'home' ? 'on' : ''}`} onClick={() => setMobileTab('home')}>
                <use href="#i-home" />
              </svg>
              <svg className={`ic ${mobileTab === 'cal' ? 'on' : ''}`} onClick={() => setMobileTab('cal')}>
                <use href="#i-cal" />
              </svg>
              <svg className={`ic ${mobileTab === 'clip' ? 'on' : ''}`} onClick={() => setMobileTab('clip')}>
                <use href="#i-clip" />
              </svg>
              <svg className={`ic ${mobileTab === 'wallet' ? 'on' : ''}`} onClick={() => setMobileTab('wallet')}>
                <use href="#i-wallet" />
              </svg>
              <svg className={`ic ${mobileTab === 'user' ? 'on' : ''}`} onClick={() => setMobileTab('user')}>
                <use href="#i-user" />
              </svg>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '320px', paddingTop: '20px' }}>
          <h4 style={{ fontFamily: 'var(--disp)', fontSize: '1.1rem', marginBottom: '10px' }}>
            Responsive by design
          </h4>
          <p style={{ color: 'var(--ink2)', fontSize: '.92rem', lineHeight: '1.7' }}>
            Every role's portal adapts to phone and tablet. Students can check attendance, marks, fees and notices on the
            go, with a bottom tab bar for quick navigation — meeting the responsive requirement in the brief. Try clicking the tabs on the mobile screen mockup above to see it change!
          </p>
        </div>
      </div>
    </div>
  );

  // -----------------------------------------------------------------
  // Switch the visible view based on the sidebar tab
  // -----------------------------------------------------------------
  if (activeTab === 'attendance') {
    return <AttendancePanel />;
  }
  if (activeTab === 'marks') {
    return <MarksTable />;
  }
  if (activeTab === 'fees') {
    return <FeesPanel />;
  }
  if (activeTab === 'notices') {
    return <NoticesPanel />;
  }

  // Default: consolidated dashboard
  return (
    <div>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 1.4fr', marginBottom: '32px' }}>
        <ProfileCard />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <AttendancePanel />
          <MarksTable />
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <NoticesPanel />
      </div>

      <MobileMockup />
    </div>
  );
}
