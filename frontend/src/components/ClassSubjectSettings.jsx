import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api.js';

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}><span>{type === 'success' ? '✅' : '❌'}</span>{msg}</div>;
}

// Reusable add/list/remove card for one config list (classes or subjects)
function ConfigCard({ title, icon, singular, items, endpoint, accent, onChange, showToast }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/config/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onChange(data.list);
      setValue('');
      showToast(`${singular} "${value.trim()}" added`);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const remove = async (name) => {
    try {
      const res = await apiFetch(`/api/config/${endpoint}/${encodeURIComponent(name)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onChange(data.list);
      showToast(`${singular} "${name}" removed`);
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="panel">
      <div className="panel-h">
        <h4>{icon} {title}</h4>
        <span className="pill p-paid" style={{ background: `${accent}18`, color: accent }}>{items.length}</span>
      </div>

      <form onSubmit={add} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input className="inp" placeholder={`Add a ${singular.toLowerCase()}…`} value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn btn-pri" disabled={busy} style={{ flexShrink: 0 }}>
          <svg className="ic" style={{ width: 18, height: 18 }}><use href="#i-plus" /></svg>
          Add
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 && <div className="empty-state" style={{ padding: '30px 10px' }}><p>No {title.toLowerCase()} yet.</p></div>}
        {items.map((name) => (
          <div key={name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 12, background: 'var(--sky2)', border: '1px solid var(--line)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{name}</span>
            <button className="act-btn del" title={`Remove ${singular}`} onClick={() => remove(name)}>
              <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-trash" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClassSubjectSettings() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/config');
      const data = await res.json();
      setClasses(data.classes || []);
      setSubjects(data.subjects || []);
    } catch (e) { showToast('Failed to load configuration', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 20, fontWeight: 600, color: 'var(--muted)' }}>Loading configuration…</div>;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <h3>Classes & Subjects</h3>
          <p>Manage the classes and subjects used across admissions, marks, attendance and more</p>
        </div>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <ConfigCard title="Classes" icon="🏫" singular="Class" items={classes} endpoint="classes"
          accent="#3B5BFF" onChange={setClasses} showToast={showToast} />
        <ConfigCard title="Subjects" icon="📚" singular="Subject" items={subjects} endpoint="subjects"
          accent="#10D9B8" onChange={setSubjects} showToast={showToast} />
      </div>

      <div style={{ marginTop: 16, fontSize: '.82rem', color: 'var(--muted)' }}>
        Changes apply everywhere the next time a page loads its dropdowns (Admission, Students, Attendance, Marks, Work Done, User Management).
      </div>
    </div>
  );
}
