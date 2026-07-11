import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api.js';

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}><span>{type === 'success' ? '✅' : '❌'}</span>{msg}</div>;
}

function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="danger-icon">🗑️</div>
        <h3 style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: '1.15rem', textAlign: 'center', marginBottom: 8 }}>Delete Notice?</h3>
        <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '.88rem', marginBottom: 24 }}>
          <b style={{ color: 'var(--ink)' }}>{item.title}</b> will be permanently removed from the board.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-red" style={{ flex: 1 }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function NoticeModal({ notice, onSave, onClose }) {
  const [form, setForm] = useState({
    title: notice.title || '',
    message: notice.message || '',
    publishDate: notice.publishDate || '2026-07-08',
    expiryDate: notice.expiryDate || '',
    audience: notice.audience || 'All',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) { setErr('Title and message are required.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await apiFetch(`/api/notices/${notice.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expiryDate: form.expiryDate || null }),
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
          <h3>✏️ Edit Notice</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {err && <div style={{ background: 'var(--red-bg)', color: '#d13636', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontWeight: 600, fontSize: '.87rem' }}>⚠️ {err}</div>}
        <div className="field">
          <label>Title <span className="req">*</span></label>
          <input className="inp" value={form.title} onChange={e => upd('title', e.target.value)} />
        </div>
        <div className="field">
          <label>Message <span className="req">*</span></label>
          <textarea className="inp" style={{ height: 90, resize: 'none' }} value={form.message} onChange={e => upd('message', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label>Publish Date</label>
            <input type="date" className="inp" value={form.publishDate} onChange={e => upd('publishDate', e.target.value)} />
          </div>
          <div className="field">
            <label>Expiry (optional)</label>
            <input type="date" className="inp" value={form.expiryDate || ''} onChange={e => upd('expiryDate', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Audience</label>
          <div className="chipset">
            {['All', 'Staff', 'Class 10', 'Class 12'].map(aud => (
              <span key={aud} className="subj" style={form.audience === aud ? { background: 'var(--blue)', color: '#fff' } : {}} onClick={() => upd('audience', aud)}>{aud}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-gh" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-pri" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Update Notice'}</button>
        </div>
      </div>
    </div>
  );
}

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [publishDate, setPublishDate] = useState('2026-07-08');
  const [expiryDate, setExpiryDate] = useState('');
  const [audience, setAudience] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/notices');
      const data = await response.json();
      setNotices([...data].reverse()); // latest first
    } catch (err) {
      showToast(`Error loading notices: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title || !messageText) { showToast('Please fill in title and message.', 'error'); return; }
    setSaving(true);
    try {
      const response = await apiFetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message: messageText, publishDate, expiryDate: expiryDate || null, audience }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to publish notice');
      setNotices([data, ...notices]);
      setTitle(''); setMessageText(''); setExpiryDate(''); setAudience('All');
      showToast('Notice published successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = (updated) => {
    setNotices(prev => prev.map(n => n.id === updated.id ? updated : n));
    showToast('Notice updated!');
    setModal(null);
  };

  const handleDelete = async () => {
    const n = modal.notice;
    try {
      const res = await apiFetch(`/api/notices/${n.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setNotices(prev => prev.filter(x => x.id !== n.id));
      showToast('Notice deleted.');
    } catch (e) { showToast(e.message, 'error'); }
    setModal(null);
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {modal?.type === 'edit' && <NoticeModal notice={modal.notice} onSave={handleUpdate} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <DeleteModal item={modal.notice} onConfirm={handleDelete} onCancel={() => setModal(null)} />}

      <div className="grid2" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
        {/* Left: Notice List */}
        <div className="panel">
          <div className="panel-h"><h4>Published Notices</h4></div>
          {loading ? (
            <div style={{ fontWeight: 600 }}>Loading notices...</div>
          ) : (
            <div className="notices">
              {notices.map((notice, idx) => {
                let borderClass = '';
                if (idx % 3 === 1) borderClass = 'g';
                else if (idx % 3 === 2) borderClass = 'm';
                return (
                  <div key={notice.id} className={`notice ${borderClass}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <b>{notice.title}</b>
                      <div className="act-btns" style={{ flexShrink: 0 }}>
                        <button className="act-btn edit" title="Edit notice" onClick={() => setModal({ type: 'edit', notice })}>
                          <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-clip" /></svg>
                        </button>
                        <button className="act-btn del" title="Delete notice" onClick={() => setModal({ type: 'delete', notice })}>
                          <svg className="ic" style={{ width: 15, height: 15 }}><use href="#i-trash" /></svg>
                        </button>
                      </div>
                    </div>
                    <p>{notice.message}</p>
                    <div className="meta">
                      Published {notice.publishDate} · For: {notice.audience}
                      {notice.expiryDate && ` · Expires ${notice.expiryDate}`}
                    </div>
                  </div>
                );
              })}
              {notices.length === 0 && (
                <div className="empty-state"><div className="icon">📢</div><p>No announcements published yet.</p></div>
              )}
            </div>
          )}
        </div>

        {/* Right: Create Notice Form */}
        <div className="panel" style={{ alignSelf: 'start' }}>
          <div className="panel-h"><h4>Create Notice</h4></div>
          <form onSubmit={handlePublish}>
            <div className="field">
              <label>Title <span className="req">*</span></label>
              <input type="text" className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter notice title…" required />
            </div>
            <div className="field">
              <label>Message <span className="req">*</span></label>
              <textarea className="inp" style={{ height: '90px', resize: 'none' }} value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Write the announcement…" required></textarea>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="field">
                <label>Publish Date</label>
                <input type="date" className="inp" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Expiry (optional)</label>
                <input type="date" className="inp" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Audience</label>
              <div className="chipset">
                {['All', 'Staff', 'Class 10', 'Class 12'].map((aud) => (
                  <span key={aud} className="subj" style={audience === aud ? { background: 'var(--blue)', color: '#fff' } : {}} onClick={() => setAudience(aud)}>{aud}</span>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-pri" style={{ width: '100%' }} disabled={saving}>
              <svg className="ic" style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <use href="#i-mega" />
              </svg>
              {saving ? 'Publishing...' : 'Publish Notice'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
