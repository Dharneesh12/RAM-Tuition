import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api.js';
import { useConfig } from '../useConfig.js';

const STATUS_META = {
  present: { label: 'Present', letter: 'P' },
  absent: { label: 'Absent', letter: 'A' },
  late: { label: 'Late', letter: 'L' },
  leave: { label: 'Leave', letter: 'Lv' },
};
const STATUS_ORDER = ['present', 'absent', 'late', 'leave'];

const todayStr = () => new Date().toISOString().slice(0, 10);
const shiftDate = (dateStr, delta) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};
const fmtDateLabel = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

export default function AttendanceMarking({ user }) {
  const { classes } = useConfig();
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'month'
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [monthKey, setMonthKey] = useState(todayStr().slice(0, 7)); // YYYY-MM

  const [students, setStudents] = useState([]);
  const [monthRecords, setMonthRecords] = useState([]); // every attendance record for monthKey (this class)
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: status|undefined } for selectedDate
  const [initialRecords, setInitialRecords] = useState({}); // baseline snapshot to detect unsaved changes

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [message, setMessage] = useState(null); // { text, type }
  const [lastSaved, setLastSaved] = useState(null);

  const showMessage = (text, type = 'success') => setMessage({ text, type });
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(t);
  }, [message]);

  // Navigate to a date, keeping the loaded month in sync (refetches only on month change)
  const changeDate = (newDate) => {
    setSelectedDate(newDate);
    const nextMonthKey = newDate.slice(0, 7);
    if (nextMonthKey !== monthKey) setMonthKey(nextMonthKey);
  };

  // Fetch students + the whole month's attendance whenever class or month changes
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const studRes = await apiFetch('/api/students');
      const studData = await studRes.json();
      const filtered = studData.filter((s) => s.grade === selectedClass && s.status !== 'draft');
      setStudents(filtered);

      const ids = new Set(filtered.map((s) => s.id));
      const monthRes = await apiFetch(`/api/attendance?month=${monthKey}`);
      const monthData = await monthRes.json();
      setMonthRecords(monthData.filter((r) => ids.has(r.studentId)));
    } catch (err) {
      showMessage(`Error loading data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, monthKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Whenever the selected day or the cached month data changes, recompute the
  // day's record map from what's already loaded — no network round-trip.
  useEffect(() => {
    const map = {};
    monthRecords.forEach((r) => { if (r.date === selectedDate) map[r.studentId] = r.status; });
    setAttendanceRecords(map);
    setInitialRecords(map);
    setLastSaved(null);
  }, [selectedDate, monthRecords]);

  const setStatus = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? undefined : status,
    }));
  };

  const markAll = (status) => {
    const next = {};
    students.forEach((s) => { next[s.id] = status; });
    setAttendanceRecords(next);
  };
  const clearAll = () => setAttendanceRecords({});

  const copyPreviousDay = async () => {
    const prevDate = shiftDate(selectedDate, -1);
    setCopying(true);
    try {
      const res = await apiFetch(`/api/attendance?date=${prevDate}`);
      const data = await res.json();
      const studentIds = new Set(students.map((s) => s.id));
      const relevant = data.filter((r) => studentIds.has(r.studentId));
      if (relevant.length === 0) {
        showMessage(`No attendance found for ${fmtDateLabel(prevDate)}.`, 'error');
        return;
      }
      setAttendanceRecords((prev) => {
        const next = { ...prev };
        relevant.forEach((r) => { next[r.studentId] = r.status; });
        return next;
      });
      showMessage(`Copied ${relevant.length} record${relevant.length === 1 ? '' : 's'} from ${fmtDateLabel(prevDate)}.`);
    } catch (err) {
      showMessage(`Error: ${err.message}`, 'error');
    } finally {
      setCopying(false);
    }
  };

  const handleSave = async () => {
    const recordsArray = Object.keys(attendanceRecords)
      .filter((id) => attendanceRecords[id])
      .map((id) => ({ studentId: parseInt(id, 10), status: attendanceRecords[id] }));

    if (recordsArray.length === 0) {
      showMessage('Mark at least one student before saving.', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, records: recordsArray, markedBy: user?.name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save attendance');

      setInitialRecords({ ...attendanceRecords });
      // Merge into the cached month data so % columns / month grid update instantly
      setMonthRecords((prev) => {
        const touched = new Set(recordsArray.map((r) => r.studentId));
        const kept = prev.filter((r) => !(r.date === selectedDate && touched.has(r.studentId)));
        const merged = recordsArray.map((r) => ({ id: `local-${r.studentId}-${selectedDate}`, studentId: r.studentId, date: selectedDate, status: r.status }));
        return [...kept, ...merged];
      });
      setLastSaved(new Date());
      showMessage(`Attendance saved for ${recordsArray.length} student${recordsArray.length === 1 ? '' : 's'}!`);
    } catch (err) {
      showMessage(`Error saving attendance: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsaved = JSON.stringify(attendanceRecords) !== JSON.stringify(initialRecords);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || (s.rollNo || '').toLowerCase().includes(search.toLowerCase())
  );

  // Present-equivalent % for a student across the currently loaded month (late counts as present)
  const monthlyPercent = (studentId) => {
    const recs = monthRecords.filter((r) => r.studentId === studentId);
    if (recs.length === 0) return null;
    const presentLike = recs.filter((r) => r.status === 'present' || r.status === 'late').length;
    return Math.round((presentLike / recs.length) * 100);
  };

  // Stats for the day being marked
  const counts = { present: 0, absent: 0, late: 0, leave: 0 };
  students.forEach((s) => { const st = attendanceRecords[s.id]; if (st && counts[st] !== undefined) counts[st]++; });
  const unmarkedCount = students.length - (counts.present + counts.absent + counts.late + counts.leave);

  // Days array for the Month View grid
  const [gy, gm] = monthKey.split('-').map(Number);
  const daysInMonth = gy && gm ? new Date(gy, gm, 0).getDate() : 30;
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const isFutureDate = (dateStr) => dateStr > todayStr();

  return (
    <div>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
        <select className="inp" style={{ width: '180px' }} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <input
          className="inp"
          style={{ width: '220px' }}
          placeholder="🔍 Search student…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="seg" style={{ marginLeft: 'auto' }}>
          <span className={viewMode === 'day' ? 'on' : ''} onClick={() => setViewMode('day')}>Mark Attendance</span>
          <span className={viewMode === 'month' ? 'on' : ''} onClick={() => setViewMode('month')}>Month View</span>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontWeight: 600,
          background: message.type === 'error' ? 'var(--red-bg)' : 'var(--green-bg)',
          color: message.type === 'error' ? '#d13636' : '#158a44',
        }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div style={{ fontWeight: 600, padding: '20px' }}>Loading students list...</div>
      ) : viewMode === 'day' ? (
        <>
          {/* Live stats */}
          <div className="att-stats">
            <div className="att-stat present"><b>{counts.present}</b><small>Present</small></div>
            <div className="att-stat absent"><b>{counts.absent}</b><small>Absent</small></div>
            <div className="att-stat late"><b>{counts.late}</b><small>Late</small></div>
            <div className="att-stat leave"><b>{counts.leave}</b><small>Leave</small></div>
            <div className="att-stat unmarked"><b>{unmarkedCount}</b><small>Not Marked</small></div>
          </div>

          <div className="panel">
            <div className="panel-h" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h4>Mark Attendance</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <button type="button" className="btn btn-gh btn-sm" onClick={() => changeDate(shiftDate(selectedDate, -1))}>‹</button>
                  <input type="date" className="inp" style={{ width: '170px', padding: '7px 10px' }} value={selectedDate} onChange={(e) => changeDate(e.target.value)} />
                  <button type="button" className="btn btn-gh btn-sm" onClick={() => changeDate(shiftDate(selectedDate, 1))}>›</button>
                  <button type="button" className="btn btn-gh btn-sm" onClick={() => changeDate(todayStr())}>Today</button>
                  {isFutureDate(selectedDate) && <span className="pill p-pend">Future date</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-gh btn-sm" onClick={() => markAll('present')}>Mark All Present</button>
                <button type="button" className="btn btn-gh btn-sm" onClick={() => markAll('absent')}>Mark All Absent</button>
                <button type="button" className="btn btn-gh btn-sm" onClick={copyPreviousDay} disabled={copying}>
                  {copying ? 'Copying…' : 'Copy Previous Day'}
                </button>
                <button type="button" className="btn btn-gh btn-sm" onClick={clearAll}>Clear</button>
              </div>
            </div>

            <table className="tbl">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th>Monthly %</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const colors = [
                    'linear-gradient(145deg,#3B5BFF,#2743d9)',
                    'linear-gradient(145deg,#10D9B8,#07a98f)',
                    'linear-gradient(145deg,#FFB020,#e8940a)',
                    'linear-gradient(145deg,#6C5CE7,#4c3fd0)',
                  ];
                  const bgGradient = colors[student.id % colors.length];
                  const initials = student.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                  const pct = monthlyPercent(student.id);
                  const currentStatus = attendanceRecords[student.id];

                  return (
                    <tr key={student.id}>
                      <td><b>{student.rollNo}</b></td>
                      <td>
                        <div className="who">
                          <span className="av" style={{ background: bgGradient }}>{initials}</span>
                          {student.name}
                        </div>
                      </td>
                      <td style={pct !== null && pct < 75 ? { color: 'var(--red)', fontWeight: 'bold' } : {}}>
                        <b>{pct === null ? '—' : `${pct}%`}</b>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="att-status-group">
                          {STATUS_ORDER.map((s) => (
                            <button
                              key={s}
                              type="button"
                              title={STATUS_META[s].label}
                              className={`att-status-btn ${s} ${currentStatus === s ? `on ${s}` : ''}`}
                              onClick={() => setStatus(student.id, s)}
                            >
                              {STATUS_META[s].letter}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                      {students.length === 0 ? 'No students registered in this class.' : 'No students match your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap', gap: 10 }}>
              <small style={{ color: 'var(--muted)' }}>
                {hasUnsaved && <span style={{ color: 'var(--gold)', fontWeight: 700 }}>● Unsaved changes</span>}
                {!hasUnsaved && lastSaved && <span>Saved at {lastSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
              </small>
              <button type="button" className="btn btn-pri" onClick={handleSave} disabled={saving || students.length === 0}>
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="panel">
          <div className="panel-h" style={{ flexWrap: 'wrap', gap: 12 }}>
            <h4>Month View · {selectedClass}</h4>
            <input
              type="month"
              className="inp"
              style={{ width: '160px', padding: '7px 10px' }}
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
            />
          </div>

          <div className="att-grid-wrap">
            <table className="att-grid">
              <thead>
                <tr>
                  <th className="att-name-th">Student</th>
                  {dayNumbers.map((d) => <th key={d}>{d}</th>)}
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const pct = monthlyPercent(student.id);
                  return (
                    <tr key={student.id}>
                      <td className="att-name-cell"><b>{student.rollNo}</b> · {student.name}</td>
                      {dayNumbers.map((d) => {
                        const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`;
                        const rec = monthRecords.find((r) => r.studentId === student.id && r.date === dateStr);
                        const dow = new Date(gy, gm - 1, d).getDay();
                        if (!rec) {
                          const cls = dow === 0 ? 'weekend' : 'empty';
                          return (
                            <td key={d}>
                              <span
                                className={`att-cell ${cls}`}
                                title={dow === 0 ? 'Sunday' : `${dateStr} · not marked`}
                                onClick={() => { changeDate(dateStr); setViewMode('day'); }}
                              >
                                {dow === 0 ? '' : '–'}
                              </span>
                            </td>
                          );
                        }
                        return (
                          <td key={d}>
                            <span
                              className={`att-cell ${rec.status}`}
                              title={`${dateStr} · ${STATUS_META[rec.status]?.label || rec.status}`}
                              onClick={() => { changeDate(dateStr); setViewMode('day'); }}
                            >
                              {STATUS_META[rec.status]?.letter || '?'}
                            </span>
                          </td>
                        );
                      })}
                      <td className={`att-pct-cell ${pct !== null && pct < 75 ? 'att-pct-low' : ''}`}>
                        {pct === null ? '—' : `${pct}%`}
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={dayNumbers.length + 2} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                      {students.length === 0 ? 'No students registered in this class.' : 'No students match your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="att-legend">
            <span><i className="dot" style={{ background: 'var(--green)' }}></i>Present</span>
            <span><i className="dot" style={{ background: 'var(--red)' }}></i>Absent</span>
            <span><i className="dot" style={{ background: 'var(--amber)' }}></i>Late</span>
            <span><i className="dot" style={{ background: '#6C5CE7' }}></i>Leave</span>
            <span><i className="dot" style={{ background: 'var(--line2)' }}></i>Not marked</span>
            <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>Click any cell to edit that day</span>
          </div>
        </div>
      )}
    </div>
  );
}
