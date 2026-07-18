import React, { useState } from 'react';
import { apiFetch } from '../api.js';

export default function AdmissionForm({ onAdmissionComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Meena Lakshmi');
  const [grade, setGrade] = useState('Class 10');
  const [board, setBoard] = useState('State Board');
  const [school, setSchool] = useState('Govt. Hr. Sec. School, Ganapathy');
  const [email, setEmail] = useState('meena@gmail.com');
  const [fatherName, setFatherName] = useState('Ramesh Kumar');
  const [fatherWhatsapp, setFatherWhatsapp] = useState('+91 98765 43210');
  const [motherName, setMotherName] = useState('Lakshmi Devi');
  const [motherWhatsapp, setMotherWhatsapp] = useState('+91 98765 12345');
  const [subjects, setSubjects] = useState(['Mathematics', 'Science']);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSubject = (sub) => {
    if (subjects.includes(sub)) {
      setSubjects(subjects.filter((s) => s !== sub));
    } else {
      setSubjects([...subjects, sub]);
    }
  };

  const handleSave = async (status) => {
    setMessage('');
    setLoading(true);

    const payload = {
      name,
      grade,
      board,
      school,
      email,
      fatherName,
      fatherWhatsapp,
      motherName,
      motherWhatsapp,
      subjects,
      photoUrl: photo ? photo.name : null,
      status // 'active' or 'draft'
    };

    try {
      const response = await apiFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit admission form');
      }

      if (status === 'draft') {
        setMessage('Draft saved successfully! You can find it in the admissions log.');
      } else {
        setMessage(`Student admitted successfully! A student login was created — username: ${email} · password: password`);
        if (onAdmissionComplete) {
          setTimeout(() => {
            onAdmissionComplete(data);
          }, 1000);
        }
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ maxWidth: '920px', margin: '0 auto' }}>
      <div className="panel-h">
        <h4>Personal & Academic Details</h4>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '.8rem', color: 'var(--muted)' }}>
          STEP {step} / 3
        </span>
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

      {step === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 22px' }}>
            <div className="field">
              <label>
                Student Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="inp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>
                Grade / Class <span className="req">*</span>
              </label>
              <select className="inp" value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>
            <div className="field">
              <label>
                Board <span className="req">*</span>
              </label>
              <select className="inp" value={board} onChange={(e) => setBoard(e.target.value)}>
                <option value="State Board">State Board</option>
                <option value="CBSE">CBSE</option>
              </select>
            </div>
            <div className="field">
              <label>
                School Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="inp"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>
                Email Address <span className="req">*</span>
              </label>
              <input
                type="email"
                className="inp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>
                Father's Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="inp"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>
                Father's WhatsApp <span className="req">*</span>
              </label>
              <input
                type="text"
                className="inp"
                value={fatherWhatsapp}
                onChange={(e) => setFatherWhatsapp(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>
                Mother's Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="inp"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>
                Mother's WhatsApp <span className="req">*</span>
              </label>
              <input
                type="text"
                className="inp"
                value={motherWhatsapp}
                onChange={(e) => setMotherWhatsapp(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>
              Subjects Enrolled <span className="req">*</span>{' '}
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(based on {grade})</span>
            </label>
            <div className="chipset" style={{ padding: '8px 0' }}>
              <span
                className="subj"
                style={
                  subjects.includes('Mathematics')
                    ? { background: 'var(--blue)', color: '#fff' }
                    : { opacity: 0.6 }
                }
                onClick={() => toggleSubject('Mathematics')}
              >
                {subjects.includes('Mathematics') ? '✓' : '+'} Mathematics
              </span>
              <span
                className="subj"
                style={
                  subjects.includes('Science')
                    ? { background: 'var(--mint)', color: '#fff' }
                    : { opacity: 0.6 }
                }
                onClick={() => toggleSubject('Science')}
              >
                {subjects.includes('Science') ? '✓' : '+'} Science
              </span>
              <span
                className="subj"
                style={
                  subjects.includes('English')
                    ? { background: 'var(--indigo)', color: '#fff' }
                    : { opacity: 0.6 }
                }
                onClick={() => toggleSubject('English')}
              >
                {subjects.includes('English') ? '✓' : '+'} English
              </span>
              <span
                className="subj"
                style={
                  subjects.includes('Social Science')
                    ? { background: 'var(--gold)', color: '#fff' }
                    : { opacity: 0.6 }
                }
                onClick={() => toggleSubject('Social Science')}
              >
                {subjects.includes('Social Science') ? '✓' : '+'} Social Science
              </span>
            </div>
          </div>

          <div className="field">
            <label>
              Passport-Size Photo <span className="req">*</span>
            </label>
            <div
              style={{
                border: '2px dashed var(--line)',
                borderRadius: '14px',
                padding: '26px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'var(--sky2)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  background: 'var(--sky)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--blue)'
                }}
              >
                <svg className="ic" style={{ width: '28px', height: '28px' }}>
                  <use href="#i-cam" />
                </svg>
              </div>
              <div>
                <b style={{ fontFamily: 'var(--disp)' }}>
                  {photo ? photo.name : 'Upload photo'}
                </b>
                <br />
                <small style={{ color: 'var(--muted)' }}>
                  JPG or PNG · Max 2 MB · passport size
                </small>
              </div>
              <input
                type="file"
                id="photo-upload"
                style={{ display: 'none' }}
                onChange={(e) => setPhoto(e.target.files[0])}
              />
              <button
                type="button"
                className="btn btn-gh"
                style={{ marginLeft: 'auto' }}
                onClick={() => document.getElementById('photo-upload').click()}
              >
                Choose file
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-gh"
              onClick={() => handleSave('draft')}
              disabled={loading}
            >
              Save Draft
            </button>
            <button
              type="button"
              className="btn btn-pri"
              onClick={() => handleSave('active')}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Register Student →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
