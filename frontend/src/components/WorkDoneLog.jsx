import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api.js';

export default function WorkDoneLog({ user }) {
  const [entries, setEntries] = useState([]);
  const [selectedTab, setSelectedTab] = useState('All'); // 'All', 'Class 10', 'Class 12'
  const [showAddForm, setShowAddForm] = useState(false);
  const [classSubject, setClassSubject] = useState('Class 10 · Maths');
  const [topic, setTopic] = useState('');
  const [remarks, setRemarks] = useState('');
  const [staffName, setStaffName] = useState(user ? user.name : 'Suganya K');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/workdone');
      const data = await response.json();
      setEntries(data.reverse()); // latest first
    } catch (err) {
      setMessage(`Error loading entries: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!topic) {
      setMessage('Error: Topic field is required.');
      return;
    }

    setSaving(true);
    setMessage('');

    // Format current date as "DD MMM" (e.g. "08 Jul")
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${now.getDate().toString().padStart(2, '0')} ${months[now.getMonth()]}`;

    try {
      const response = await apiFetch('/api/workdone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          classSubject,
          topic,
          staffName,
          remarks: remarks || '—'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add work done entry');
      }

      setEntries([data, ...entries]);
      setTopic('');
      setRemarks('');
      setShowAddForm(false);
      setMessage('Work done log added successfully!');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Filter entries based on active tab
  const filteredEntries = entries.filter((entry) => {
    if (selectedTab === 'Class 10') return entry.classSubject.includes('Class 10');
    if (selectedTab === 'Class 12') return entry.classSubject.includes('Class 12');
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="seg">
          <span className={selectedTab === 'All' ? 'on' : ''} onClick={() => setSelectedTab('All')}>
            All
          </span>
          <span className={selectedTab === 'Class 10' ? 'on' : ''} onClick={() => setSelectedTab('Class 10')}>
            Class 10
          </span>
          <span className={selectedTab === 'Class 12' ? 'on' : ''} onClick={() => setSelectedTab('Class 12')}>
            Class 12
          </span>
        </div>

        <button className="btn btn-mint" onClick={() => setShowAddForm(!showAddForm)}>
          <svg className="ic" style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
            <use href="#i-plus" />
          </svg>
          {showAddForm ? 'Close Form' : 'Add Entry'}
        </button>
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

      {/* Add Log Form overlay/panel */}
      {showAddForm && (
        <div className="panel" style={{ marginBottom: '18px' }}>
          <div className="panel-h">
            <h4>Log Portion Completed</h4>
          </div>
          <form onSubmit={handleAddEntry} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Class & Subject</label>
              <select className="inp" value={classSubject} onChange={(e) => setClassSubject(e.target.value)}>
                <option value="Class 9 · Science">Class 9 · Science</option>
                <option value="Class 10 · Maths">Class 10 · Maths</option>
                <option value="Class 10 · Science">Class 10 · Science</option>
                <option value="Class 11 · Maths">Class 11 · Maths</option>
                <option value="Class 12 · Maths">Class 12 · Maths</option>
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Topic / Portion Completed</label>
              <input
                type="text"
                className="inp"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Trigonometry Heights & Distances"
                required
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Staff Name</label>
              <input
                type="text"
                className="inp"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Remarks</label>
              <input
                type="text"
                className="inp"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g., Practice sums assigned"
              />
            </div>
            <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn btn-pri" disabled={saving}>
                {saving ? 'Adding...' : 'Save Log Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Panel */}
      <div className="panel">
        <div className="panel-h">
          <h4>Recent Work Done Entries</h4>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const isScience = entry.classSubject.includes('Science');
                const badgeStyle = isScience
                  ? { background: '#e6f9f4', color: '#07a98f' }
                  : {};

                return (
                  <tr key={entry.id}>
                    <td>
                      <b>{entry.date}</b>
                    </td>
                    <td>
                      <span className="subj" style={badgeStyle}>
                        {entry.classSubject}
                      </span>
                    </td>
                    <td>
                      <b>{entry.topic}</b>
                    </td>
                    <td>{entry.staffName}</td>
                    <td style={{ color: 'var(--ink2)' }}>{entry.remarks}</td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                    No work done entries recorded for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
