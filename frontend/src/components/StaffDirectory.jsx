import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api.js';
import { useConfig } from '../useConfig.js';

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}><span>{type === 'success' ? '✅' : '❌'}</span>{msg}</div>;
}

function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="danger-icon">🗑️</div>
        <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: '1.15rem', textAlign: 'center', marginBottom: 8 }}>Remove Staff Member?</h3>
        <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '.88rem', marginBottom: 24 }}>
          <b style={{ color: 'var(--ink)' }}>{item.name}</b> will be permanently removed from the directory.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-red" style={{ flex: 1 }} onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
}

function StaffModal({ staff, onSave, onClose }) {
  const { classes: allClasses, subjects: allSubjects } = useConfig();
  const isEdit = Boolean(staff?.id);
  const [form, setForm] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || '',
    subjects: staff?.subjects || [],
    classes: staff?.classes || [],
    joined: staff?.joined || new Date().toISOString().split('T')[0],
    status: staff?.status || 'active',
    password: 'password',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleIn = (k, v) => setForm(f => ({
    ...f,
    [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      setErr('Name, email, and role are required.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const body = { ...form }; // subjects & classes are already arrays
      if (isEdit) delete body.password; // password only applies when creating the login
      const url = isEdit ? `/api/staff/${staff.id}` : '/api/staff';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSave(data, isEdit);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-h">
          <h3>{isEdit ? '✏️ Edit Staff Member' : '➕ Add Staff Member'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {err && <div style={{ background: 'var(--red-bg)', color: '#d13636', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontWeight: 600, fontSize: '.87rem' }}>⚠️ {err}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="field">
            <label>Full Name <span className="req">*</span></label>
            <input className="inp" placeholder="e.g. Suganya K" value={form.name} onChange={e => upd('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Email <span className="req">*</span></label>
            <input className="inp" type="email" placeholder="staff@ramtuitioncentre.com" value={form.email} onChange={e => upd('email', e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input className="inp" placeholder="+91 98765 XXXXX" value={form.phone} onChange={e => upd('phone', e.target.value)} />
          </div>
          <div className="field">
            <label>Role / Designation <span className="req">*</span></label>
            <input className="inp" placeholder="e.g. Mathematics Teacher" value={form.role} onChange={e => upd('role', e.target.value)} />
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Subjects Taught <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(tap to assign)</span></label>
            <div className="chipset" style={{ marginTop: 4 }}>
              {allSubjects.map(sub => (
                <span key={sub} className="subj"
                  style={form.subjects.includes(sub) ? { background: 'var(--mint)', color: '#fff' } : { opacity: 0.6 }}
                  onClick={() => toggleIn('subjects', sub)}>
                  {form.subjects.includes(sub) ? '✓ ' : '+ '}{sub}
                </span>
              ))}
              {allSubjects.length === 0 && <small style={{ color: 'var(--muted)' }}>No subjects configured yet.</small>}
            </div>
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Assigned Classes <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(tap to assign)</span></label>
            <div className="chipset" style={{ marginTop: 4 }}>
              {allClasses.map(cls => (
                <span key={cls} className="subj"
                  style={form.classes.includes(cls) ? { background: 'var(--blue)', color: '#fff' } : { opacity: 0.6 }}
                  onClick={() => toggleIn('classes', cls)}>
                  {form.classes.includes(cls) ? '✓ ' : '+ '}{cls}
                </span>
              ))}
              {allClasses.length === 0 && <small style={{ color: 'var(--muted)' }}>No classes configured yet.</small>}
            </div>
          </div>
          <div className="field">
            <label>Date Joined</label>
            <input className="inp" type="date" value={form.joined} onChange={e => upd('joined', e.target.value)} />
          </div>
          <div className="field">
            <label>Status</label>
            <select className="inp" value={form.status} onChange={e => upd('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {!isEdit && (
            <div className="field">
              <label>Portal Login Password</label>
              <input className="inp" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="Set a login password" />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-pri" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Staff' : 'Add Staff Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffDirectory() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/staff');
      const data = await res.json();
      setStaff(data);
    } catch (e) { showToast('Failed to load staff', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const handleSave = (saved, isEdit) => {
    if (isEdit) {
      setStaff(prev => prev.map(s => s.id === saved.id ? saved : s));
      showToast(`${saved.name} updated!`);
    } else {
      setStaff(prev => [...prev, saved]);
      showToast(`${saved.name} added to staff!`);
    }
    setModal(null);
  };

  const handleDelete = async () => {
    const s = modal.staff;
    try {
      const res = await apiFetch(`/api/staff/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setStaff(prev => prev.filter(x => x.id !== s.id));
      showToast(`${s.name} removed.`);
    } catch (e) { showToast(e.message, 'error'); }
    setModal(null);
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase()) ||
    (s.subjects || []).some(sub => sub.toLowerCase().includes(search.toLowerCase()))
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
      {modal?.type === 'create' && <StaffModal onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <StaffModal staff={modal.staff} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <DeleteModal item={modal.staff} onConfirm={handleDelete} onCancel={() => setModal(null)} />}

      <div className="page-header">
        <div>
          <h3>Staff Directory</h3>
          <p>Tuition centre teachers, assignments, and profiles</p>
        </div>
        <button className="btn btn-pri" onClick={() => setModal({ type: 'create' })}>
          <svg className="ic" style={{ width: 18, height: 18 }}><use href="#i-plus" /></svg>
          Add Staff
        </button>
      </div>

      <div className="panel">
        <div style={{ marginBottom: 18 }}>
          <input
            className="inp"
            placeholder="🔍  Search by name, role, or subject…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontWeight: 600 }}>Loading staff directory…</div>
        ) : filteredStaff.length === 0 ? (
          <div className="empty-state"><div className="icon">👩‍🏫</div><p>No staff members found.</p></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Instructor</th>
                <th>Role / Specialization</th>
                <th>Assigned Classes</th>
                <th>Subjects Taught</th>
                <th>Date Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s, idx) => {
                const bgGradient = colors[idx % colors.length];
                const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="who">
                        <span className="av" style={{ background: bgGradient }}>{initials}</span>
                        <div>
                          <b>{s.name}</b><br />
                          <small style={{ color: 'var(--muted)', fontSize: '.75rem' }}>{s.email}</small>
                          {s.phone && <><br /><small style={{ color: 'var(--muted)', fontSize: '.72rem', fontFamily: 'var(--mono)' }}>{s.phone}</small></>}
                        </div>
                      </div>
                    </td>
                    <td>{s.role}</td>
                    <td>
                      <div className="chipset">
                        {(s.classes || []).map((cls, i) => (
                          <span key={i} className="subj" style={{ background: 'var(--sky2)', color: 'var(--ink)' }}>{cls}</span>
                        ))}
                      </div>
                    </td>
                    <td>{(s.subjects || []).join(', ')}</td>
                    <td><span style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: 'var(--muted)' }}>{s.joined}</span></td>
                    <td>
                      <span className={`status-dot ${s.status || 'active'}`} style={{ fontWeight: 700, fontSize: '.82rem' }}>
                        {s.status === 'inactive' ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="act-btns">
                        <button className="act-btn edit" title="Edit" onClick={() => setModal({ type: 'edit', staff: s })}>
                          <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-clip" /></svg>
                        </button>
                        <button className="act-btn del" title="Remove" onClick={() => setModal({ type: 'delete', staff: s })}>
                          <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-trash" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
