import React, { useState, useEffect } from 'react';

export default function MarksEntry() {
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [subject, setSubject] = useState('Maths');
  const [testName, setTestName] = useState('Unit Test 2 — Trigonometry');
  const [maxMarks, setMaxMarks] = useState(50);
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({}); // { studentId: { marksObtained: '', remarks: '' } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setMessage('');
    try {
      // 1. Fetch students
      const studRes = await fetch('/api/students');
      const studData = await studRes.json();
      const filtered = studData.filter((s) => s.grade === selectedClass && s.status !== 'draft');
      setStudents(filtered);

      // 2. Fetch marks for this test
      const marksRes = await fetch(`/api/marks?testName=${encodeURIComponent(testName)}`);
      const marksRecords = await marksRes.json();

      // Map existing records
      const initialMarks = {};
      filtered.forEach((s) => {
        const record = marksRecords.find((m) => m.studentId === s.id);
        initialMarks[s.id] = {
          marksObtained: record ? record.marksObtained.toString() : '',
          remarks: record ? record.remarks : ''
        };
      });
      setMarksData(initialMarks);
    } catch (err) {
      setMessage(`Error loading marks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass, testName]);

  const handleMarkChange = (studentId, value) => {
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: value
      }
    }));
  };

  const handleRemarksChange = (studentId, value) => {
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const recordsArray = Object.keys(marksData)
      .filter((studentId) => marksData[studentId].marksObtained !== '')
      .map((studentId) => ({
        studentId: parseInt(studentId),
        marksObtained: parseInt(marksData[studentId].marksObtained),
        maxMarks: parseInt(maxMarks),
        remarks: marksData[studentId].remarks
      }));

    try {
      const response = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName,
          subject,
          records: recordsArray
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save marks');
      }

      setMessage('Marks saved successfully!');
    } catch (err) {
      setMessage(`Error saving marks: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Count low marks (below 50%)
  let lowCount = 0;
  Object.keys(marksData).forEach((studentId) => {
    const obtained = parseFloat(marksData[studentId]?.marksObtained);
    if (!isNaN(obtained) && maxMarks > 0) {
      const percentage = (obtained / maxMarks) * 100;
      if (percentage < 50) {
        lowCount++;
      }
    }
  });

  return (
    <div>
      <div className="panel" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '22px' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>
              Test Name <span className="req">*</span>{' '}
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(common for all)</span>
            </label>
            <input
              type="text"
              className="inp"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Class / Subject</label>
            <select
              className="inp"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSubject(e.target.value.includes('Science') ? 'Science' : 'Maths');
              }}
            >
              <option value="Class 9">Class 9 · Science</option>
              <option value="Class 10">Class 10 · Maths</option>
              <option value="Class 11">Class 11 · Maths</option>
              <option value="Class 12">Class 12 · Maths</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Maximum Marks</label>
            <input
              type="number"
              className="inp"
              value={maxMarks}
              onChange={(e) => setMaxMarks(parseInt(e.target.value) || 0)}
            />
          </div>
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
        <div style={{ fontWeight: 600, padding: '20px' }}>Loading student list...</div>
      ) : (
        <div className="panel">
          <div className="panel-h">
            <h4>Enter Marks & Mistakes</h4>
            {lowCount > 0 && (
              <span className="pill p-low">
                <svg className="ic" style={{ width: '14px', height: '14px' }}>
                  <use href="#i-bell" />
                </svg>{' '}
                {lowCount} below 50%
              </span>
            )}
          </div>

          <table className="tbl">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Student</th>
                <th style={{ width: '120px' }}>Marks / {maxMarks}</th>
                <th>%</th>
                <th>Mistakes / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const studentId = student.id;
                const obtainedStr = marksData[studentId]?.marksObtained || '';
                const obtainedNum = parseFloat(obtainedStr);
                const remarks = marksData[studentId]?.remarks || '';

                let percentage = 0;
                let isLow = false;
                if (!isNaN(obtainedNum) && maxMarks > 0) {
                  percentage = Math.round((obtainedNum / maxMarks) * 100);
                  isLow = percentage < 50;
                }

                return (
                  <tr key={studentId} className={isLow ? 'row-low' : ''}>
                    <td>
                      <b>{student.rollNo}</b>
                    </td>
                    <td>
                      <div className="who">
                        {student.name}
                        {isLow && <span className="pill p-low" style={{ marginLeft: '6px' }}>LOW</span>}
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="inp"
                        style={{
                          padding: '7px 12px',
                          width: '80px',
                          display: 'inline-block',
                          borderColor: isLow ? 'var(--red)' : '',
                          color: isLow ? 'var(--red)' : ''
                        }}
                        value={obtainedStr}
                        onChange={(e) => handleMarkChange(studentId, e.target.value)}
                        placeholder="0"
                        min="0"
                        max={maxMarks}
                      />
                    </td>
                    <td>
                      <b>{obtainedStr !== '' ? `${percentage}%` : '—'}</b>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="inp"
                        style={{
                          padding: '7px 12px',
                          width: '100%',
                          background: isLow ? 'rgba(255, 77, 77, 0.05)' : '',
                          borderColor: isLow ? 'rgba(255, 77, 77, 0.2)' : ''
                        }}
                        value={remarks}
                        onChange={(e) => handleRemarksChange(studentId, e.target.value)}
                        placeholder="Remarks..."
                      />
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                    No students in this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
            <small style={{ color: 'var(--muted)' }}>
              🔴 Rows below 50% are auto-highlighted for Staff & Director views.
            </small>
            <button
              type="button"
              className="btn btn-pri"
              onClick={handleSave}
              disabled={saving || students.length === 0}
            >
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
