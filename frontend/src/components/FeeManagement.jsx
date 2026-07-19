import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api.js';
import { useConfig } from '../useConfig.js';

export default function FeeManagement() {
  const { months } = useConfig();
  const [selectedMonth, setSelectedMonth] = useState('July');
  const [selectedTab, setSelectedTab] = useState('All'); // 'All', 'Paid', 'Pending'
  const [students, setStudents] = useState([]);
  const [feeRecords, setFeeRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch students
      const studRes = await apiFetch('/api/students');
      const studData = await studRes.json();
      setStudents(studData.filter(s => s.status !== 'draft'));

      // 2. Fetch fees for selected month
      const feeRes = await apiFetch(`/api/fees?month=${selectedMonth}`);
      const feeData = await feeRes.json();
      setFeeRecords(feeData);
    } catch (err) {
      setMessage(`Error loading fees: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const toggleFeeStatus = async (recordId, currentStatus) => {
    setUpdatingId(recordId);
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    
    try {
      const response = await apiFetch(`/api/fees/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update fee status');
      }

      // Update local state
      setFeeRecords(prev =>
        prev.map(rec => (rec.id === recordId ? { ...rec, status: newStatus } : rec))
      );
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div style={{ padding: '20px', fontWeight: 600 }}>Loading Fee Management...</div>;

  // Calculate KPIs
  let collectedAmount = 0;
  let pendingAmount = 0;
  let paidCount = 0;
  let pendingCount = 0;

  feeRecords.forEach(rec => {
    if (rec.status === 'paid') {
      collectedAmount += rec.amount;
      paidCount++;
    } else {
      pendingAmount += rec.amount;
      pendingCount++;
    }
  });

  const collectionRate = feeRecords.length > 0 ? Math.round((collectedAmount / (collectedAmount + pendingAmount)) * 100) : 0;

  // Format currencies
  const formatCurrency = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Combine student details with fee records
  const listItems = feeRecords.map(rec => {
    const student = students.find(s => s.id === rec.studentId);
    return {
      feeId: rec.id,
      amount: rec.amount,
      status: rec.status,
      studentName: student ? student.name : 'Unknown Student',
      studentRoll: student ? student.rollNo : '—',
      studentGrade: student ? student.grade : '—',
      studentId: student ? student.id : 0
    };
  });

  // Filter based on active tab
  const filteredList = listItems.filter(item => {
    if (selectedTab === 'Paid') return item.status === 'paid';
    if (selectedTab === 'Pending') return item.status === 'pending';
    return true;
  });

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

      {/* KPI Display */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi k1">
          <div className="kic" style={{ background: 'linear-gradient(145deg,#22C55E,#158a44)' }}>
            <svg className="ic">
              <use href="#i-check" />
            </svg>
          </div>
          <div className="big">{formatCurrency(collectedAmount)}</div>
          <div className="lbl">Collected · {paidCount} paid</div>
        </div>

        <div className="kpi k3">
          <div className="kic">
            <svg className="ic">
              <use href="#i-wallet" />
            </svg>
          </div>
          <div className="big">{formatCurrency(pendingAmount)}</div>
          <div className="lbl">Pending · {pendingCount} students</div>
        </div>

        <div className="kpi k2">
          <div className="kic">
            <svg className="ic">
              <use href="#i-chart" />
            </svg>
          </div>
          <div className="big">{collectionRate}%</div>
          <div className="lbl">Collection rate</div>
        </div>
      </div>

      {/* Data Table Panel */}
      <div className="panel">
        <div className="panel-h" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h4>Student Fee Status · {selectedMonth}</h4>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="inp"
              style={{ width: 'auto', padding: '8px 12px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="seg">
            <span className={selectedTab === 'All' ? 'on' : ''} onClick={() => setSelectedTab('All')}>
              All
            </span>
            <span className={selectedTab === 'Paid' ? 'on' : ''} onClick={() => setSelectedTab('Paid')}>
              Paid
            </span>
            <span className={selectedTab === 'Pending' ? 'on' : ''} onClick={() => setSelectedTab('Pending')}>
              Pending
            </span>
            </div>
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Roll</th>
              <th>Student</th>
              <th>Class</th>
              <th>Amount</th>
              <th>Month</th>
              <th style={{ textAlign: 'right' }}>Status (Click to toggle)</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item) => {
              const colors = [
                'linear-gradient(145deg,#3B5BFF,#2743d9)',
                'linear-gradient(145deg,#10D9B8,#07a98f)',
                'linear-gradient(145deg,#FFB020,#e8940a)',
                'linear-gradient(145deg,#6C5CE7,#4c3fd0)'
              ];
              const bgGradient = colors[item.studentId % colors.length];
              const initials = item.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <tr key={item.feeId}>
                  <td>
                    <b>{item.studentRoll}</b>
                  </td>
                  <td>
                    <div className="who">
                      <span className="av" style={{ background: bgGradient }}>
                        {initials}
                      </span>
                      {item.studentName}
                    </div>
                  </td>
                  <td>{item.studentGrade}</td>
                  <td>
                    <b>₹{item.amount.toLocaleString('en-IN')}</b>
                  </td>
                  <td>{selectedMonth}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className={`pill ${item.status === 'paid' ? 'p-paid' : 'p-pend'}`}
                      onClick={() => toggleFeeStatus(item.feeId, item.status)}
                      style={{ cursor: 'pointer', outline: 'none' }}
                      disabled={updatingId === item.feeId}
                    >
                      {updatingId === item.feeId ? 'Updating...' : item.status === 'paid' ? 'Paid' : 'Pending ▾'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                  No fee records found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
