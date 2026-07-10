import React from 'react';

export default function StaffDirectory() {
  const staff = [
    { id: 1, name: 'Suganya K', email: 'suganya@ramtuitioncentre.com', role: 'Mathematics Teacher', classes: ['Class 10', 'Class 12'], subjects: ['Mathematics'], joined: '2021-06-01' },
    { id: 2, name: 'Mohan R', email: 'mohan@ramtuitioncentre.com', role: 'Science Teacher', classes: ['Class 9', 'Class 10'], subjects: ['Physics', 'Chemistry', 'Biology'], joined: '2022-05-15' },
    { id: 3, name: 'Naveen Raj', email: 'naveen@ramtuitioncentre.com', role: 'English Instructor', classes: ['Class 10', 'Class 11', 'Class 12'], subjects: ['English'], joined: '2023-01-10' },
    { id: 4, name: 'Meera G', email: 'meera@ramtuitioncentre.com', role: 'Social Science Educator', classes: ['Class 9', 'Class 10'], subjects: ['History', 'Civics', 'Geography'], joined: '2023-08-01' }
  ];

  return (
    <div className="panel">
      <div className="panel-h" style={{ marginBottom: '22px' }}>
        <div>
          <h4 style={{ fontSize: '1.2rem' }}>Staff Directory</h4>
          <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '2px' }}>
            Tuition centre teachers, assignments, and profiles
          </p>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th>Instructor</th>
            <th>Role / Specialization</th>
            <th>Assigned Classes</th>
            <th>Subjects taught</th>
            <th>Date Joined</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => {
            const colors = [
              'linear-gradient(145deg,#3B5BFF,#2743d9)',
              'linear-gradient(145deg,#10D9B8,#07a98f)',
              'linear-gradient(145deg,#FFB020,#e8940a)',
              'linear-gradient(145deg,#6C5CE7,#4c3fd0)'
            ];
            const bgGradient = colors[s.id % colors.length];
            const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            return (
              <tr key={s.id}>
                <td>
                  <div className="who">
                    <span className="av" style={{ background: bgGradient }}>
                      {initials}
                    </span>
                    <div>
                      <b>{s.name}</b>
                      <br />
                      <small style={{ color: 'var(--muted)' }}>{s.email}</small>
                    </div>
                  </div>
                </td>
                <td>{s.role}</td>
                <td>
                  <div className="chipset">
                    {s.classes.map((cls, idx) => (
                      <span key={idx} className="subj" style={{ background: 'var(--sky2)', color: 'var(--ink)' }}>
                        {cls}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{s.subjects.join(', ')}</td>
                <td>{s.joined}</td>
                <td>
                  <span className="pill p-present">Active</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
