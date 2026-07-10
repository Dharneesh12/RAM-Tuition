import React, { useState, useEffect } from 'react';

export default function AttendanceMarking() {
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedDate, setSelectedDate] = useState('2026-07-08');
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'present' | 'absent' }
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch students and attendance on load or filter change
  const fetchData = async () => {
    setLoading(true);
    setMessage('');
    try {
      // 1. Fetch students
      const studRes = await fetch('/api/students');
      const studData = await studRes.json();
      
      // Filter students by selected class
      const filtered = studData.filter(s => s.grade === selectedClass && s.status !== 'draft');
      setStudents(filtered);

      // 2. Fetch attendance for date
      const attRes = await fetch(`/api/attendance?date=${selectedDate}`);
      const attData = await attRes.json();

      // Map existing records
      const recordMap = {};
      filtered.forEach(s => {
        // Find existing record
        const found = attData.find(a => a.studentId === s.id);
        recordMap[s.id] = found ? found.status : 'present'; // Default to present
      });

      setAttendanceRecords(recordMap);
    } catch (err) {
      setMessage(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass, selectedDate]);

  const toggleStatus = (studentId) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const recordsArray = Object.keys(attendanceRecords).map(studentId => ({
      studentId: parseInt(studentId),
      status: attendanceRecords[studentId]
    }));

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          records: recordsArray
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      setMessage('Attendance saved successfully!');
    } catch (err) {
      setMessage(`Error saving attendance: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Helper to count present
  const presentCount = Object.values(attendanceRecords).filter(status => status === 'present').length;

  return (
    <div>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <select
          className="inp"
          style={{ width: '200px' }}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="Class 9">Class 9 · Maths/Science</option>
          <option value="Class 10">Class 10 · Mathematics</option>
          <option value="Class 11">Class 11 · Mathematics</option>
          <option value="Class 12">Class 12 · Mathematics</option>
        </select>

        <select className="inp" style={{ width: '150px' }}>
          <option>July 2026</option>
        </select>

        <select
          className="inp"
          style={{ width: '130px' }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          <option value="2026-07-08">08 Jul 2026</option>
          <option value="2026-07-09">09 Jul 2026</option>
          <option value="2026-07-10">10 Jul 2026</option>
        </select>

        <div className="seg" style={{ marginLeft: 'auto' }}>
          <span>Month View</span>
          <span className="on">Mark Today</span>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontWeight: 600,
            background: message.startsWith('Error') ? 'var(--red-bg)' : 'var(--green-bg)',
            color: message.startsWith('Error') ? '#d13636' : '#158a44'
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ fontWeight: 600, padding: '20px' }}>Loading students list...</div>
      ) : (
        <div className="panel">
          <div className="panel-h">
            <h4>Mark Attendance · {selectedDate}</h4>
            <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
              {students.length} students · Present {presentCount}
            </span>
          </div>

          <table className="tbl">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Student</th>
                <th>Monthly %</th>
                <th style={{ textAlign: 'right' }}>Status (Click to toggle)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const isPresent = attendanceRecords[student.id] === 'present';
                // Add initials colors
                const colors = [
                  'linear-gradient(145deg,#3B5BFF,#2743d9)',
                  'linear-gradient(145deg,#10D9B8,#07a98f)',
                  'linear-gradient(145deg,#FFB020,#e8940a)',
                  'linear-gradient(145deg,#6C5CE7,#4c3fd0)'
                ];
                const bgGradient = colors[student.id % colors.length];
                const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                // Mocking monthly percent
                const monthlyPercent = student.rollNo === 'R-1051' ? '64%' : student.rollNo === 'R-1058' ? '100%' : '96%';
                const hasLowAttendance = student.rollNo === 'R-1051';

                return (
                  <tr key={student.id}>
                    <td>
                      <b>{student.rollNo}</b>
                    </td>
                    <td>
                      <div className="who">
                        <span className="av" style={{ background: bgGradient }}>
                          {initials}
                        </span>
                        {student.name}
                      </div>
                    </td>
                    <td style={hasLowAttendance ? { color: 'var(--red)', fontWeight: 'bold' } : {}}>
                      <b>{monthlyPercent}</b>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className={`pill ${isPresent ? 'p-present' : 'p-absent'}`}
                        onClick={() => toggleStatus(student.id)}
                        style={{ cursor: 'pointer', outline: 'none' }}
                      >
                        {isPresent ? (
                          <>
                            <svg className="ic" style={{ width: '14px', height: '14px' }}>
                              <use href="#i-check" />
                            </svg>{' '}
                            Present
                          </>
                        ) : (
                          'Absent'
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                    No students registered in this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-pri"
              onClick={handleSave}
              disabled={saving || students.length === 0}
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
