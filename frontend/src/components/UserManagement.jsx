import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api.js';

/* ── tiny reusable toast ── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast ${type}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {msg}
    </div>
  );
}

/* ── Delete confirm modal ── */
function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="danger-icon">🗑️</div>
        <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: '1.15rem', textAlign: 'center', marginBottom: 8 }}>
          Delete User?
        </h3>
        <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '.88rem', marginBottom: 24 }}>
          <b style={{ color: 'var(--ink)' }}>{item.name}</b> ({item.role}) will be permanently removed. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-red" style={{ flex: 1 }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── User form modal ── */
function UserModal({ user, onSave, onClose }) {
  const isEdit = Boolean(user?.id);
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    password: '',
    role: user?.role || 'student',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) { setErr('Name and username are required.'); return; }
    if (!isEdit && !form.password.trim()) { setErr('Password is required for new users.'); return; }
    setSaving(true);
    setErr('');
    try {
      const body = { name: form.name, username: form.username, role: form.role };
      if (form.password) body.password = form.password;
      const url = isEdit ? `/api/users/${user.id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSave(data, isEdit);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const roleColors = { director: '#3B5BFF', staff: '#10D9B8', student: '#FFB020' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <h3>{isEdit ? '✏️ Edit User' : '➕ Create User'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {err && <div style={{ background: 'var(--red-bg)', color: '#d13636', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontWeight: 600, fontSize: '.87rem' }}>⚠️ {err}</div>}

        <div className="field">
          <label>Full Name <span className="req">*</span></label>
          <input className="inp" placeholder="e.g. Arjun Kumar" value={form.name} onChange={e => upd('name', e.target.value)} />
        </div>

        <div className="field">
          <label>Username / Email <span className="req">*</span></label>
          <input className="inp" placeholder="e.g. arjun@ramtuitioncentre.com" value={form.username} onChange={e => upd('username', e.target.value)} />
        </div>

        <div className="field">
          <label>{isEdit ? 'New Password (leave blank to keep current)' : 'Password'} {!isEdit && <span className="req">*</span>}</label>
          <input className="inp" type="password" placeholder={isEdit ? '••••••••' : 'Min. 6 characters'} value={form.password} onChange={e => upd('password', e.target.value)} />
        </div>

        <div className="field">
          <label>Role <span className="req">*</span></label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['student', 'staff', 'director'].map(r => (
              <div
                key={r}
                onClick={() => upd('role', r)}
                style={{
                  flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${form.role === r ? roleColors[r] : 'var(--line)'}`,
                  background: form.role === r ? `${roleColors[r]}18` : 'rgba(255,255,255,0.8)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>
                  {r === 'student' ? '🎓' : r === 'staff' ? '👩‍🏫' : '👑'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '.8rem', color: form.role === r ? roleColors[r] : 'var(--ink2)', textTransform: 'capitalize' }}>{r}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-pri" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [modal, setModal] = useState(null); // { type: 'create'|'edit'|'delete', user? }
  const [toast, setToast] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) { showToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const handleSave = (savedUser, isEdit) => {
    if (isEdit) {
      setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
      showToast(`${savedUser.name} updated successfully!`);
    } else {
      setUsers(prev => [...prev, savedUser]);
      showToast(`${savedUser.name} created successfully!`);
    }
    setModal(null);
  };

  const handleDelete = async () => {
    const u = modal.user;
    try {
      const res = await apiFetch(`/api/users/${u.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setUsers(prev => prev.filter(x => x.id !== u.id));
      showToast(`${u.name} deleted.`, 'success');
    } catch (e) { showToast(e.message, 'error'); }
    setModal(null);
  };

  const filtered = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const gradients = {
    director: 'linear-gradient(145deg,#3B5BFF,#2743d9)',
    staff: 'linear-gradient(145deg,#10D9B8,#07a98f)',
    student: 'linear-gradient(145deg,#FFB020,#e8940a)',
  };

  const roleCounts = { director: 0, staff: 0, student: 0 };
  users.forEach(u => { if (roleCounts[u.role] !== undefined) roleCounts[u.role]++; });

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {modal?.type === 'create' && <UserModal onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <UserModal user={modal.user} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <DeleteModal item={modal.user} onConfirm={handleDelete} onCancel={() => setModal(null)} />}

      {/* Summary Cards */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 22 }}>
        {[
          { label: 'Director Accounts', count: roleCounts.director, cls: 'k1', emoji: '👑' },
          { label: 'Staff Accounts', count: roleCounts.staff, cls: 'k2', emoji: '👩‍🏫' },
          { label: 'Student Accounts', count: roleCounts.student, cls: 'k3', emoji: '🎓' },
        ].map((c, i) => (
          <div key={i} className={`kpi ${c.cls}`} style={{ cursor: 'pointer' }} onClick={() => setFilterRole(i === 0 ? 'director' : i === 1 ? 'staff' : 'student')}>
            <div className="kic" style={{ fontSize: '1.4rem' }}>{c.emoji}</div>
            <div className="big">{c.count}</div>
            <div className="lbl">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Header + search + add */}
      <div className="page-header">
        <div>
          <h3>User Management</h3>
          <p>Create and manage login accounts for students, staff, and directors</p>
        </div>
        <button className="btn btn-pri" onClick={() => setModal({ type: 'create' })}>
          <svg className="ic" style={{ width: 18, height: 18 }}><use href="#i-plus" /></svg>
          Create User
        </button>
      </div>

      <div className="panel">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="seg">
            {['all', 'director', 'staff', 'student'].map(r => (
              <span key={r} className={filterRole === r ? 'on' : ''} onClick={() => setFilterRole(r)}>
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
              </span>
            ))}
          </div>
          <input
            className="inp"
            style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
            placeholder="🔍  Search by name or username…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontWeight: 600 }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>No users found{search ? ' matching your search' : ''}.</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>User</th>
                <th>Username / Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="who">
                        <span className="av" style={{ background: gradients[u.role] || gradients.student }}>{initials}</span>
                        <div>
                          <b>{u.name}</b>
                          <br />
                          <small style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '.7rem' }}>ID #{u.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '.82rem', color: 'var(--ink2)' }}>{u.username}</span>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role === 'director' ? '👑' : u.role === 'staff' ? '👩‍🏫' : '🎓'} {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="act-btns">
                        <button className="act-btn edit" title="Edit user" onClick={() => setModal({ type: 'edit', user: u })}>
                          <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-clip" /></svg>
                        </button>
                        <button className="act-btn del" title="Delete user" onClick={() => setModal({ type: 'delete', user: u })}>
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
