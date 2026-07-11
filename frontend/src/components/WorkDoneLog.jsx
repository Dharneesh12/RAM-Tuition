import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api.js';

const CLASS_OPTIONS = ['Class 9 · Science', 'Class 10 · Maths', 'Class 10 · Science', 'Class 11 · Maths', 'Class 12 · Maths'];

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}><span>{type === 'success' ? '✅' : '❌'}</span>{msg}</div>;
}

function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="danger-icon">🗑️</div>
        <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: '1.15rem', textAlign: 'center', marginBottom: 8 }}>Delete Entry?</h3>
        <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '.88rem', marginBottom: 24 }}>
          <b style={{ color: 'var(--ink)' }}>{item.topic}</b> ({item.classSubject}) will be permanently removed.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-red" style={{ flex: 1 }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function EntryModal({ entry, onSave, onClose }) {
  const [form, setForm] = useState({
    date: entry.date || '',
    classSubject: entry.classSubject || CLASS_OPTIONS[1],
    topic: entry.topic || '',
    staffName: entry.staffName || '',
    remarks: entry.remarks || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.topic.trim() || !form.staffName.trim()) { setErr('Topic and staff name are required.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await apiFetch(`/api/workdone/${entry.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, remarks: form.remarks || '—' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSave(data);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h3>✏️ Edit Work Done Entry</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {err && <div style={{ background: 'var(--red-bg)', color: '#d13636', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontWeight: 600, fontSize: '.87rem' }}>⚠️ {err}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="field">
            <label>Date</label>
            <input className="inp" value={form.date} onChange={e => upd('date', e.target.value)} placeholder="e.g. 08 Jul" />
          </div>
          <div className="field">
            <label>Class & Subject</label>
            <select className="inp" value={form.classSubject} onChange={e => upd('classSubject', e.target.value)}>
              {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Topic / Portion Completed <span className="req">*</span></label>
            <input className="inp" value={form.topic} onChange={e => upd('topic', e.target.value)} />
          </div>
          <div className="field">
            <label>Staff Name <span className="req">*</span></label>
            <input className="inp" value={form.staffName} onChange={e => upd('staffName', e.target.value)} />
          </div>
          <div className="field">
            <label>Remarks</label>
            <input className="inp" value={form.remarks} onChange={e => upd('remarks', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-pri" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Update Entry'}</button>
        </div>
      </div>
    </div>
  );
}

export default function WorkDoneLog({ user }) {
  const [entries, setEntries] = useState([]);
  const [selectedTab, setSelectedTab] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [classSubject, setClassSubject] = useState('Class 10 · Maths');
  const [topic, setTopic] = useState('');
  const [remarks, setRemarks] = useState('');
  const [staffName, setStaffName] = useState(user ? user.name : 'Suganya K');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/workdone');
      const data = await response.json();
      setEntries([...data].reverse());
    } catch (err) {
      showToast(`Error loading entries: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!topic) { showToast('Topic field is required.', 'error'); return; }
    setSaving(true);
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${now.getDate().toString().padStart(2, '0')} ${months[now.getMonth()]}`;
    try {
      const response = await apiFetch('/api/workdone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, classSubject, topic, staffName, remarks: remarks || '—' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add work done entry');
      setEntries([data, ...entries]);
      setTopic(''); setRemarks(''); setShowAddForm(false);
      showToast('Work done log added successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = (updated) => {
    setEntries(prev => prev.map(en => en.id === updated.id ? updated : en));
    showToast('Entry updated!');
    setModal(null);
  };

  const handleDelete = async () => {
    const en = modal.entry;
    try {
      const res = await apiFetch(`/api/workdone/${en.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setEntries(prev => prev.filter(x => x.id !== en.id));
      showToast('Entry deleted.');
    } catch (e) { showToast(e.message, 'error'); }
    setModal(null);
  };

  const filteredEntries = entries.filter((entry) => {
    if (selectedTab === 'Class 10') return entry.classSubject.includes('Class 10');
    if (selectedTab === 'Class 12') return entry.classSubject.includes('Class 12');
    return true;
  });

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {modal?.type === 'edit' && <EntryModal entry={modal.entry} onSave={handleUpdate} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <DeleteModal item={modal.entry} onConfirm={handleDelete} onCancel={() => setModal(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="seg">
          <span className={selectedTab === 'All' ? 'on' : ''} onClick={() => setSelectedTab('All')}>All</span>
          <span className={selectedTab === 'Class 10' ? 'on' : ''} onClick={() => setSelectedTab('Class 10')}>Class 10</span>
          <span className={selectedTab === 'Class 12' ? 'on' : ''} onClick={() => setSelectedTab('Class 12')}>Class 12</span>
        </div>
        <button className="btn btn-mint" onClick={() => setShowAddForm(!showAddForm)}>
          <svg className="ic" style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
            <use href="#i-plus" />
          </svg>
          {showAddForm ? 'Close Form' : 'Add Entry'}
        </button>
      </div>

      {showAddForm && (
        <div className="panel" style={{ marginBottom: '18px' }}>
          <div className="panel-h"><h4>Log Portion Completed</h4></div>
          <form onSubmit={handleAddEntry} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Class & Subject</label>
              <select className="inp" value={classSubject} onChange={(e) => setClassSubject(e.target.value)}>
                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Topic / Portion Completed</label>
              <input type="text" className="inp" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Trigonometry Heights & Distances" required />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Staff Name</label>
              <input type="text" className="inp" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Remarks</label>
              <input type="text" className="inp" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g., Practice sums assigned" />
            </div>
            <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn btn-pri" disabled={saving}>{saving ? 'Adding...' : 'Save Log Entry'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-h"><h4>Recent Work Done Entries</h4></div>
        {loading ? (
          <div style={{ fontWeight: 600, padding: '20px' }}>Loading log entries...</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Class / Subject</th>
                <th>Topic / Portion Completed</th>
                <th>Staff</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const isScience = entry.classSubject.includes('Science');
                const badgeStyle = isScience ? { background: '#e6f9f4', color: '#07a98f' } : {};
                return (
                  <tr key={entry.id}>
                    <td><b>{entry.date}</b></td>
                    <td><span className="subj" style={badgeStyle}>{entry.classSubject}</span></td>
                    <td><b>{entry.topic}</b></td>
                    <td>{entry.staffName}</td>
                    <td style={{ color: 'var(--ink2)' }}>{entry.remarks}</td>
                    <td>
                      <div className="act-btns">
                        <button className="act-btn edit" title="Edit entry" onClick={() => setModal({ type: 'edit', entry })}>
                          <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-clip" /></svg>
                        </button>
                        <button className="act-btn del" title="Delete entry" onClick={() => setModal({ type: 'delete', entry })}>
                          <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-trash" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No work done entries recorded for this filter.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
