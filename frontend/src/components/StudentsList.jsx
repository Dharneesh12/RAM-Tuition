import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api.js';

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}><span>{type === 'success' ? '✅' : '❌'}</span>{msg}</div>;
}

function DeleteModal({ student, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="danger-icon">🗑️</div>
        <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: '1.15rem', textAlign: 'center', marginBottom: 8 }}>Delete Student?</h3>
        <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '.88rem', marginBottom: 24 }}>
          <b style={{ color: 'var(--ink)' }}>{student.name}</b> ({student.rollNo}) and all their records will be permanently removed.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-red" style={{ flex: 1 }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function EditStudentModal({ student, onSave, onClose }) {
  const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English', 'History', 'Civics', 'Geography'];
  const [form, setForm] = useState({
    name: student.name || '',
    grade: student.grade || 'Class 10',
    board: student.board || 'State Board',
    school: student.school || '',
    email: student.email || '',
    fatherName: student.fatherName || '',
    fatherWhatsapp: student.fatherWhatsapp || '',
    motherName: student.motherName || '',
    motherWhatsapp: student.motherWhatsapp || '',
    subjects: student.subjects || [],
    status: student.status || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSubject = (sub) => setForm(f => ({
    ...f,
    subjects: f.subjects.includes(sub) ? f.subjects.filter(s => s !== sub) : [...f.subjects, sub]
  }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || form.subjects.length === 0) {
      setErr('Name, email, and at least one subject are required.'); return;
    }
    setSaving(true); setErr('');
    try {
      const res = await apiFetch(`/api/students/${student.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSave(data);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-h">
          <h3>✏️ Edit Student — {student.rollNo}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {err && <div style={{ background: 'var(--red-bg)', color: '#d13636', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontWeight: 600, fontSize: '.87rem' }}>⚠️ {err}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="field">
            <label>Student Name <span className="req">*</span></label>
            <input className="inp" value={form.name} onChange={e => upd('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Class / Grade</label>
            <select className="inp" value={form.grade} onChange={e => upd('grade', e.target.value)}>
              {['Class 9', 'Class 10', 'Class 11', 'Class 12'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Board</label>
            <select className="inp" value={form.board} onChange={e => upd('board', e.target.value)}>
              <option value="State Board">State Board</option>
              <option value="CBSE">CBSE</option>
            </select>
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>School</label>
            <input className="inp" value={form.school} onChange={e => upd('school', e.target.value)} />
          </div>
          <div className="field">
            <label>Email <span className="req">*</span></label>
            <input className="inp" type="email" value={form.email} onChange={e => upd('email', e.target.value)} />
          </div>
          <div className="field">
            <label>Status</label>
            <select className="inp" value={form.status} onChange={e => upd('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="field">
            <label>Father's Name</label>
            <input className="inp" value={form.fatherName} onChange={e => upd('fatherName', e.target.value)} />
          </div>
          <div className="field">
            <label>Father's WhatsApp</label>
            <input className="inp" value={form.fatherWhatsapp} onChange={e => upd('fatherWhatsapp', e.target.value)} />
          </div>
          <div className="field">
            <label>Mother's Name</label>
            <input className="inp" value={form.motherName} onChange={e => upd('motherName', e.target.value)} />
          </div>
          <div className="field">
            <label>Mother's WhatsApp</label>
            <input className="inp" value={form.motherWhatsapp} onChange={e => upd('motherWhatsapp', e.target.value)} />
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Subjects <span className="req">*</span></label>
            <div className="chipset" style={{ marginTop: 4 }}>
              {SUBJECTS.map(sub => (
                <span key={sub} className="subj"
                  style={form.subjects.includes(sub) ? { background: 'var(--blue)', color: '#fff' } : {}}
                  onClick={() => toggleSubject(sub)}>{sub}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-pri" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Update Student'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsList({ setActiveTab }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch student directory');
      const data = await res.json();
      setStudents(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleDelete = async () => {
    const s = modal.student;
    try {
      const res = await apiFetch(`/api/students/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setStudents(prev => prev.filter(x => x.id !== s.id));
      showToast(`${s.name} deleted.`);
    } catch (e) { showToast(e.message, 'error'); }
    setModal(null);
  };

  const handleSave = (updated) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    showToast(`${updated.name} updated!`);
    setModal(null);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.rollNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colors = [
    'linear-gradient(145deg,#3B5BFF,#2743d9)',
    'linear-gradient(145deg,#10D9B8,#07a98f)',
    'linear-gradient(145deg,#FFB020,#e8940a)',
    'linear-gradient(145deg,#6C5CE7,#4c3fd0)'
  ];

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {modal?.type === 'edit' && <EditStudentModal student={modal.student} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <DeleteModal student={modal.student} onConfirm={handleDelete} onCancel={() => setModal(null)} />}

      <div className="page-header">
        <div>
          <h3>Student Directory</h3>
          <p>List of admitted students and active registration drafts</p>
        </div>
        <button className="btn btn-pri" onClick={() => setActiveTab('admission')}>
          <svg className="ic" style={{ width: 18, height: 18 }}><use href="#i-plus" /></svg>
          Admit Student
        </button>
      </div>

      <div className="panel">
        <div style={{ marginBottom: 18 }}>
          <input type="text" className="inp" placeholder="🔍  Search by name, roll number, or school..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ fontWeight: 600, padding: '20px', color: 'var(--muted)', textAlign: 'center' }}>Loading student directory…</div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => {
                const bgGradient = colors[s.id % colors.length];
                const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <tr key={s.id}>
                    <td><b style={{ fontFamily: 'var(--mono)', fontSize: '.8rem' }}>{s.rollNo || '—'}</b></td>
                    <td>
                      <div className="who">
                        <span className="av" style={{ background: bgGradient }}>{initials}</span>
                        <div><b>{s.name}</b><br /><small style={{ color: 'var(--muted)' }}>{s.email}</small></div>
                      </div>
                    </td>
                    <td>
                      <span className="subj" style={{ background: 'var(--sky2)', color: 'var(--ink)' }}>{s.grade}</span>
                      {s.board && <div style={{ marginTop: 4, fontSize: '.7rem', fontWeight: 700, color: s.board === 'CBSE' ? 'var(--indigo)' : 'var(--mint-d)' }}>{s.board}</div>}
                    </td>
                    <td style={{ fontSize: '.82rem', color: 'var(--ink2)', maxWidth: 160 }}>{s.school}</td>
                    <td>
                      <div style={{ fontSize: '.78rem', lineHeight: 1.6 }}>
                        <span>👨 {s.fatherName}</span><br />
                        <span style={{ color: 'var(--muted)' }}>{s.fatherWhatsapp}</span><br />
                        <span>👩 {s.motherName}</span><br />
                        <span style={{ color: 'var(--muted)' }}>{s.motherWhatsapp}</span>
                      </div>
                    </td>
                    <td>
                      <div className="chipset">
                        {Array.isArray(s.subjects) && s.subjects.map((sub, idx) => (
                          <span key={idx} className="subj">{sub}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {s.status === 'draft' ? (
                        <span className="pill" style={{ background: 'var(--line)', color: 'var(--muted)' }}>Draft</span>
                      ) : (
                        <span className="status-dot active">Active</span>
                      )}
                    </td>
                    <td>
                      <div className="act-btns">
                        <button className="act-btn edit" title="Edit student" onClick={() => setModal({ type: 'edit', student: s })}>
                          <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-clip" /></svg>
                        </button>
                        <button className="act-btn del" title="Delete student" onClick={() => setModal({ type: 'delete', student: s })}>
                          <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-trash" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No students found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
