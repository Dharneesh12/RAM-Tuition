import React from 'react';

export default function ReportsOverview() {
  const reports = [
    { title: 'Portion Completion Report', desc: 'Syllabus coverage index for Class 10 & 12 board preparations.', status: '92% completed', type: 'portion' },
    { title: 'Fee Recovery Audit', desc: 'Summary of paid and outstanding fee logs for Q2 financial review.', status: '74% collected', type: 'financial' },
    { title: 'High-Alert Academic Report', desc: 'Student test logs highlighting score cards scoring below 50%.', status: '2 students marked', type: 'academic' },
    { title: 'Monthly Attendance Compilation', desc: 'Staff and student log summaries showing standard attendance rates.', status: '94% average rate', type: 'attendance' }
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        {reports.map((rep, idx) => (
          <div key={idx} className="panel">
            <div className="panel-h" style={{ marginBottom: '10px' }}>
              <h4>{rep.title}</h4>
              <span className="pill p-paid" style={rep.type === 'financial' || rep.type === 'attendance' ? {} : rep.type === 'academic' ? { background: 'var(--red-bg)', color: 'var(--red)' } : { background: 'var(--sky)', color: 'var(--blue-d)' }}>
                {rep.status}
              </span>
            </div>
            <p style={{ color: 'var(--ink2)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '14px' }}>
              {rep.desc}
            </p>
            <button className="btn btn-gh" style={{ padding: '8px 16px', fontSize: '.8rem' }}>
              Download PDF Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
