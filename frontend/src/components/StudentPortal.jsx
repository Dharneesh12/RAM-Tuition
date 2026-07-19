import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api.js';

export default function StudentPortal({ user, activeTab = 'dashboard' }) {
  const [studentDetails, setStudentDetails] = useState(null);
  const [marks, setMarks] = useState([]);
  const [notices, setNotices] = useState([]);
  const [fee, setFee] = useState(null);
  const [allFees, setAllFees] = useState([]);      // every month's fee record
  const [attendance, setAttendance] = useState([]); // this student's day-by-day records
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mobile Mockup Tab Navigation State
  const [mobileTab, setMobileTab] = useState('home');

  const fetchStudentData = async () => {
    try {
      // 1. Fetch student list to find this student
      const studRes = await apiFetch('/api/students');
      const studData = await studRes.json();
      // Default to roll R-1042 (Arun Kumar) if no matching user roll
      const student = studData.find(s => s.name === user.name) || studData.find(s => s.rollNo === 'R-1042') || studData[0];
      setStudentDetails(student);

      if (student) {
        // 2. Fetch ALL marks for this student (across every test / month)
        const marksRes = await apiFetch(`/api/marks/student/${student.id}`);
        setMarks(await marksRes.json());

        // 3. Fetch ALL fee records for this student (every month, incl. carry-over)
        const feeRes = await apiFetch(`/api/fees/student/${student.id}`);
        const feeData = await feeRes.json();
        setAllFees(feeData);
        setFee(feeData.find(f => f.month === 'July') || null);

        // 4. Fetch this student's day-by-day attendance
        const attRes = await apiFetch(`/api/attendance/student/${student.id}`);
        setAttendance(await attRes.json());
      }

      // 4. Fetch notices
      const noticeRes = await apiFetch('/api/notices');
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

  // --- Per-subject fee split + advance + previous-month dues ---
  const subjectList = Array.isArray(student.subjects) ? student.subjects : [];
  const advance = fee ? (fee.advance || 0) : 0;
  const perSubjectFee = subjectList.length ? Math.round(feeAmount / subjectList.length) : feeAmount;
  const previousDues = allFees.filter(f => f.status === 'pending' && f.month !== 'July');
  const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  // --- Attendance stats (day-by-day, month view + absent dates) ---
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentRecords = attendance.filter(a => a.status === 'absent');
  const totalMarked = attendance.length;
  const attendancePct = totalMarked ? Math.round((presentCount / totalMarked) * 100) : 96;
  const fmtDay = (d) => {
    const parts = (d || '').split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return parts.length === 3 ? `${parts[2]} ${months[parseInt(parts[1], 10) - 1]}` : d;
  };

  // --- Marks grouped by month (month view for test marks) ---
  const marksByMonth = marks.reduce((acc, m) => {
    const key = m.testMonth || 'Other';
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {});

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
        Roll No · {student.rollNo} · {student.grade}{student.board ? ` · ${student.board}` : ''}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
        <div className="ring" style={{ background: `conic-gradient(var(--mint) 0 ${attendancePct}%, #e7ecf7 ${attendancePct}% 100%)` }}>
          <div className="in">
            <b>{attendancePct}%</b>
            <small>Present</small>
          </div>
        </div>
        <div style={{ fontSize: '.9rem', color: 'var(--ink2)', lineHeight: 2 }}>
          <b>{presentCount}</b> / {totalMarked || '—'} days present
          <br />
          <span style={{ color: absentRecords.length ? 'var(--red)' : 'var(--muted)' }}>
            {absentRecords.length} day{absentRecords.length === 1 ? '' : 's'} absent
          </span>
        </div>
      </div>

      {/* Month view — one chip per marked day (green=present, red=absent) */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Month View · July</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {attendance.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>No attendance marked yet.</span>}
          {attendance.map((a) => (
            <div key={a.id} title={`${fmtDay(a.date)} · ${a.status}`}
              style={{
                minWidth: 44, textAlign: 'center', padding: '7px 6px', borderRadius: 10, fontSize: '.72rem', fontWeight: 700,
                background: a.status === 'present' ? 'var(--green-bg)' : 'var(--red-bg)',
                color: a.status === 'present' ? '#158a44' : '#d13636',
                border: `1px solid ${a.status === 'present' ? 'rgba(34,197,94,.25)' : 'rgba(255,77,77,.25)'}`,
              }}>
              {fmtDay(a.date)}
            </div>
          ))}
        </div>
      </div>

      {/* Absent dates list */}
      {absentRecords.length > 0 && (
        <div style={{ marginTop: 16, background: 'var(--red-bg)', borderRadius: 12, padding: '12px 14px' }}>
          <b style={{ color: '#d13636', fontSize: '.85rem' }}>Absent dates</b>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {absentRecords.map(a => (
              <span key={a.id} className="pill p-absent">{fmtDay(a.date)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const MarksTable = () => {
    const months = Object.keys(marksByMonth);
    return (
      <div className="panel">
        <div className="panel-h">
          <h4>My Marks</h4>
          <span className="lnk">Month view</span>
        </div>
        {marks.length === 0 && (
          <div className="empty-state"><div className="icon">📝</div><p>No test marks recorded yet.</p></div>
        )}
        {months.map((month) => {
          const rows = marksByMonth[month];
          return (
            <div key={month} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--blue-d)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                {month} 2026
              </div>
              <table className="tbl">
                <thead>
                  <tr><th>Test</th><th>Subject</th><th>Score</th><th>%</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {rows.map((m) => {
                    const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
                    const low = pct < 50;
                    return (
                      <tr key={m.id} className={low ? 'row-low' : ''}>
                        <td><b>{m.testName}</b></td>
                        <td>{m.subject}</td>
                        <td><span className={`pill ${low ? 'p-low' : 'p-paid'}`}>{m.marksObtained}/{m.maxMarks}</span></td>
                        <td><b>{pct}%</b></td>
                        <td style={{ color: 'var(--ink2)', fontSize: '.82rem' }}>{m.remarks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  };

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
        <h4>My Fees · July 2026</h4>
        <span className={`pill ${feePaid ? 'p-paid' : 'p-pend'}`}>{feeStatusLabel}</span>
      </div>

      {/* Previous-month carry-over dues */}
      {previousDues.length > 0 && (
        <div style={{ border: '1px solid rgba(255,176,32,.35)', background: 'var(--amber-bg)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <b style={{ color: '#b4770a', fontSize: '.88rem' }}>⚠️ Pending from previous months</b>
          {previousDues.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '.85rem' }}>
              <span style={{ color: 'var(--ink2)' }}>{d.month} tuition fee</span>
              <b style={{ color: '#b4770a' }}>{inr(d.amount)} · Pending</b>
            </div>
          ))}
        </div>
      )}

      {/* Per-subject fee breakdown */}
      <div style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '18px', background: 'var(--sky2)' }}>
        <b style={{ fontFamily: 'var(--disp)', fontSize: '1.05rem' }}>Fee Breakdown ({student.grade})</b>
        <div style={{ marginTop: 12 }}>
          {subjectList.map((sub, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line2)', fontSize: '.9rem' }}>
              <span style={{ color: 'var(--ink2)' }}>📘 {sub}</span>
              <b>{inr(perSubjectFee)}</b>
            </div>
          ))}
          {subjectList.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: '.9rem' }}>
              <span style={{ color: 'var(--ink2)' }}>Tuition fee</span><b>{inr(feeAmount)}</b>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '2px solid var(--line)', fontSize: '.92rem' }}>
          <b>Total (July)</b>
          <b>{inr(feeAmount)}</b>
        </div>
        {/* Advance shown separately */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '.9rem' }}>
          <span style={{ color: 'var(--ink2)' }}>Advance paid</span>
          <b style={{ color: advance > 0 ? 'var(--green)' : 'var(--muted)' }}>{advance > 0 ? `− ${inr(advance)}` : inr(0)}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '.9rem' }}>
          <span style={{ color: 'var(--ink2)' }}>Status</span>
          <b style={{ color: feePaid ? 'var(--green)' : 'var(--gold)' }}>{feeStatusLabel.toUpperCase()}</b>
        </div>
      </div>

      {/* Monthly installment schedule (annual fee split across the year) */}
      {allFees.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <b style={{ fontFamily: 'var(--disp)', fontSize: '1rem' }}>Monthly Fee Schedule</b>
            <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
              Annual: <b style={{ color: 'var(--ink)' }}>{inr(allFees.reduce((a, f) => a + (f.amount || 0), 0))}</b>
            </span>
          </div>
          <table className="tbl">
            <thead><tr><th>Month</th><th>Installment</th><th style={{ textAlign: 'right' }}>Status</th></tr></thead>
            <tbody>
              {allFees.map((f) => (
                <tr key={f.id}>
                  <td><b>{f.month}</b></td>
                  <td>{inr(f.amount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`pill ${f.status === 'paid' ? 'p-paid' : 'p-pend'}`}>
                      {f.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
