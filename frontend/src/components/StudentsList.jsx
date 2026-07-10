import React, { useState, useEffect } from 'react';

export default function StudentsList({ setActiveTab }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('Failed to fetch student directory');
      }
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="panel-h" style={{ marginBottom: '22px' }}>
        <div>
          <h4 style={{ fontSize: '1.2rem' }}>Student Directory</h4>
          <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '2px' }}>
            List of admitted students and active registration drafts
          </p>
        </div>
        <button
          className="btn btn-pri"
          onClick={() => setActiveTab('admission')}
          style={{ height: 'fit-content' }}
        >
          <svg className="ic" style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
            <use href="#i-plus" />
          </svg>
          Admit Student
        </button>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <input
          type="text"
          className="inp"
          placeholder="🔍 Search by name, roll number, or school..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ fontWeight: 600, padding: '20px' }}>Loading student directory...</div>
      ) : error ? (
        <div style={{ color: 'var(--red)', padding: '20px' }}>{error}</div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Roll</th>
              <th>Student Details</th>
              <th>Class</th>
              <th>School / Address</th>
              <th>Parent Details</th>
              <th>Subjects</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => {
              const colors = [
                'linear-gradient(145deg,#3B5BFF,#2743d9)',
                'linear-gradient(145deg,#10D9B8,#07a98f)',
                'linear-gradient(145deg,#FFB020,#e8940a)',
                'linear-gradient(145deg,#6C5CE7,#4c3fd0)'
              ];
              const bgGradient = colors[s.id % colors.length];
              const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <tr key={s.id}>
                  <td>
                    <b>{s.rollNo || '—'}</b>
                  </td>
                  <td>
                    <div className="who">
                      <span className="av" style={{ background: bgGradient }}>
                        {initials}
                      </span>
                      <div>
                        <b>{s.name}</b>
                        <br />
                        <small style={{ color: 'var(--muted)' }}>{s.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{s.grade}</td>
                  <td>{s.school}</td>
                  <td>
                    <div style={{ fontSize: '.8rem' }}>
                      👨 {s.fatherName} ({s.fatherWhatsapp})
                      <br />
                      👩 {s.motherName} ({s.motherWhatsapp})
                    </div>
                  </td>
                  <td>
                    <div className="chipset">
                      {Array.isArray(s.subjects) &&
                        s.subjects.map((sub, idx) => (
                          <span key={idx} className="subj">
                            {sub}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td>
                    {s.status === 'draft' ? (
                      <span className="pill" style={{ background: 'var(--line)', color: 'var(--muted)' }}>
                        Draft
                      </span>
                    ) : (
                      <span className="pill p-present">Active</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                  No students found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
