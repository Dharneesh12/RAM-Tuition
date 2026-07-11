import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api.js';

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}><span>{type === 'success' ? '✅' : '❌'}</span>{msg}</div>;
}

// Build a CSV string from an array of objects and trigger a browser download.
const downloadCSV = (filename, rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function ReportsOverview() {
  const [data, setData] = useState({ students: [], fees: [], marks: [], workdone: [], staff: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [students, fees, marks, workdone, staff] = await Promise.all([
        apiFetch('/api/students').then(r => r.json()),
        apiFetch('/api/fees?month=July').then(r => r.json()),
        apiFetch('/api/marks?testName=' + encodeURIComponent('Unit Test 2 — Trigonometry')).then(r => r.json()),
        apiFetch('/api/workdone').then(r => r.json()),
        apiFetch('/api/staff').then(r => r.json()),
      ]);
      setData({ students, fees, marks, workdone, staff });
    } catch (e) {
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { students, fees, marks, workdone } = data;
  const nameOf = (id) => (students.find(s => s.id === id)?.name) || `Student #${id}`;
  const rollOf = (id) => (students.find(s => s.id === id)?.rollNo) || '—';

  // Derived metrics
  const collected = fees.filter(f => f.status === 'paid').reduce((a, f) => a + f.amount, 0);
  const pending = fees.filter(f => f.status === 'pending').reduce((a, f) => a + f.amount, 0);
  const collectionRate = fees.length ? Math.round((collected / (collected + pending)) * 100) : 0;
  const lowScorers = marks.filter(m => (m.marksObtained / m.maxMarks) * 100 < 50);

  const reports = [
    {
      title: 'Portion Completion Report',
      desc: 'Syllabus coverage log across all classes, compiled from the Work Done records.',
      status: `${workdone.length} entries logged`,
      type: 'portion',
      file: 'portion-completion-report.csv',
      build: () => workdone.map(w => ({
        Date: w.date, 'Class / Subject': w.classSubject, Topic: w.topic, Staff: w.staffName, Remarks: w.remarks,
      })),
    },
    {
      title: 'Fee Recovery Audit',
      desc: 'Paid and outstanding fee logs for the current billing cycle (July).',
      status: `${collectionRate}% collected`,
      type: 'financial',
      file: 'fee-recovery-audit.csv',
      build: () => fees.map(f => ({
        Roll: rollOf(f.studentId), Student: nameOf(f.studentId), Month: f.month,
        Amount: f.amount, Status: f.status,
      })),
    },
    {
      title: 'High-Alert Academic Report',
      desc: 'Students scoring below 50% who need remedial attention.',
      status: `${lowScorers.length} student${lowScorers.length === 1 ? '' : 's'} marked`,
      type: 'academic',
      file: 'high-alert-academic-report.csv',
      build: () => lowScorers.map(m => ({
        Roll: rollOf(m.studentId), Student: nameOf(m.studentId), Test: m.testName, Subject: m.subject,
        Score: `${m.marksObtained}/${m.maxMarks}`, Percentage: `${Math.round((m.marksObtained / m.maxMarks) * 100)}%`,
        Remarks: m.remarks,
      })),
    },
    {
      title: 'Student Roster Report',
      desc: 'Full list of admitted students with class, school, and parent contacts.',
      status: `${students.length} students`,
      type: 'roster',
      file: 'student-roster-report.csv',
      build: () => students.map(s => ({
        Roll: s.rollNo, Name: s.name, Class: s.grade, School: s.school, Email: s.email,
        Father: s.fatherName, 'Father WhatsApp': s.fatherWhatsapp, Mother: s.motherName, 'Mother WhatsApp': s.motherWhatsapp,
        Subjects: Array.isArray(s.subjects) ? s.subjects.join(' / ') : '', Status: s.status,
      })),
    },
  ];

  const handleDownload = (rep) => {
    const rows = rep.build();
    if (!rows.length) { showToast('No data available for this report yet.', 'error'); return; }
    downloadCSV(rep.file, rows);
    showToast(`Downloaded ${rep.file} (${rows.length} rows)`);
  };

  const badgeStyle = (type) =>
    type === 'academic' ? { background: 'var(--red-bg)', color: 'var(--red)' }
      : type === 'financial' || type === 'roster' ? {}
        : { background: 'var(--sky)', color: 'var(--blue-d)' };

  if (loading) return <div style={{ padding: 20, fontWeight: 600, color: 'var(--muted)' }}>Compiling reports…</div>;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        {reports.map((rep, idx) => (
          <div key={idx} className="panel">
            <div className="panel-h" style={{ marginBottom: '10px' }}>
              <h4>{rep.title}</h4>
              <span className="pill p-paid" style={badgeStyle(rep.type)}>{rep.status}</span>
            </div>
            <p style={{ color: 'var(--ink2)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '14px' }}>{rep.desc}</p>
            <button className="btn btn-gh btn-sm" onClick={() => handleDownload(rep)}>
              <svg className="ic" style={{ width: 16, height: 16 }}><use href="#i-file" /></svg>
              Download CSV Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
