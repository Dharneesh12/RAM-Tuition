import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api.js';

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [publishDate, setPublishDate] = useState('2026-07-08');
  const [expiryDate, setExpiryDate] = useState('');
  const [audience, setAudience] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/notices');
      const data = await response.json();
      // Sort notices so the latest is at the top
      setNotices(data.reverse());
    } catch (err) {
      setMessage(`Error loading notices: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title || !messageText) {
      setMessage('Error: Please fill in title and message.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await apiFetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message: messageText,
          publishDate,
          expiryDate: expiryDate || null,
          audience
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish notice');
      }

      // Add to list, clear inputs
      setNotices([data, ...notices]);
      setTitle('');
      setMessageText('');
      setExpiryDate('');
      setAudience('All');
      setMessage('Notice published successfully!');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
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

      <div className="grid2" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
        {/* Left Side: Notice List */}
        <div className="panel">
          <div className="panel-h">
            <h4>Published Notices</h4>
          </div>
          {loading ? (
            <div style={{ fontWeight: 600 }}>Loading notices...</div>
          ) : (
            <div className="notices">
              {notices.map((notice, idx) => {
                // Apply alternating color borders matching the UI mockup
                // index % 3: 0 -> blue (default notice), 1 -> g (gold), 2 -> m (mint)
                let borderClass = '';
                if (idx % 3 === 1) borderClass = 'g';
                else if (idx % 3 === 2) borderClass = 'm';

                return (
                  <div key={notice.id} className={`notice ${borderClass}`}>
                    <b>{notice.title}</b>
                    <p>{notice.message}</p>
                    <div className="meta">
                      Published {notice.publishDate} · For: {notice.audience}
                      {notice.expiryDate && ` · Expires ${notice.expiryDate}`}
                    </div>
                  </div>
                );
              })}
              {notices.length === 0 && (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>
                  No announcements published yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Create Notice Form */}
        <div className="panel" style={{ alignSelf: 'start' }}>
          <div className="panel-h">
            <h4>Create Notice</h4>
          </div>
          <form onSubmit={handlePublish}>
            <div className="field">
              <label>
                Title <span className="req">*</span>
              </label>
              <input
                type="text"
                className="inp"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notice title…"
                required
              />
            </div>
            <div className="field">
              <label>
                Message <span className="req">*</span>
              </label>
              <textarea
                className="inp"
                style={{ height: '90px', resize: 'none' }}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write the announcement…"
                required
              ></textarea>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="field">
                <label>Publish Date</label>
                <input
                  type="date"
                  className="inp"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Expiry (optional)</label>
                <input
                  type="date"
                  className="inp"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label>Audience</label>
              <div className="chipset">
                {['All', 'Staff', 'Class 10', 'Class 12'].map((aud) => (
                  <span
                    key={aud}
                    className="subj"
                    style={
                      audience === aud
                        ? { background: 'var(--blue)', color: '#fff' }
                        : {}
                    }
                    onClick={() => setAudience(aud)}
                  >
                    {aud}
                  </span>
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
