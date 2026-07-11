import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api.js';

export default function Login({ onLoginSuccess }) {
  const [role, setRole] = useState('director'); // 'director', 'staff', 'student'
  const [username, setUsername] = useState('director@ramtuitioncentre.com');
  const [password, setPassword] = useState('password');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync default credentials when role changes
  useEffect(() => {
    if (role === 'director') {
      setUsername('director@ramtuitioncentre.com');
    } else if (role === 'staff') {
      setUsername('staff@ramtuitioncentre.com');
    } else {
      setUsername('student@ramtuitioncentre.com');
    }
    setPassword('password');
    setError('');
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login-art">
        {/* Floating 3D SVGs matching original layout */}
        <svg className="f3" style={{ top: '60px', right: '70px', width: '80px' }} viewBox="0 0 100 90">
          <defs>
            <linearGradient id="lc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8fb2ff" />
              <stop offset="1" stopColor="#3B5BFF" />
            </linearGradient>
          </defs>
          <polygon points="50,8 96,28 50,48 4,28" fill="url(#lc)" />
          <polygon points="50,48 4,28 4,36 50,56" fill="#2743d9" />
          <polygon points="50,48 96,28 96,36 50,56" fill="#5f80ff" />
          <path d="M78 34 v18" stroke="#FFB020" strokeWidth="3" />
          <circle cx="78" cy="54" r="5" fill="#FFB020" />
        </svg>

        <svg className="f3" style={{ top: '180px', right: '180px', width: '64px', animationDelay: '1.4s' }} viewBox="0 0 100 100">
          <g fill="none" stroke="#10D9B8" strokeWidth="5">
            <ellipse cx="50" cy="50" rx="44" ry="16" />
            <ellipse cx="50" cy="50" rx="44" ry="16" transform="rotate(60 50 50)" />
            <ellipse cx="50" cy="50" rx="44" ry="16" transform="rotate(120 50 50)" />
          </g>
          <circle cx="50" cy="50" r="11" fill="#10D9B8" />
        </svg>

        <div className="lg">
          <span className="sb-logo" style={{ width: '40px', height: '40px' }}>
            <span>R</span>
          </span>{' '}
          RAM Tuition Centre
        </div>
        <h2>One platform for the whole tuition centre.</h2>
        <p>Managing Director, Staff and Students — each with a secure, role-based space. Since 1998, Ganapathy, Coimbatore.</p>
      </div>

      <div className="login-form">
        <h3>Welcome back 👋</h3>
        <p className="sub">Select your role and sign in to continue.</p>

        <div className="role-tabs">
          <div
            className={`role-tab ${role === 'director' ? 'on' : ''}`}
            onClick={() => setRole('director')}
          >
            <div className="ric" style={{ background: 'linear-gradient(145deg,#3B5BFF,#2743d9)' }}>
              <svg className="ic">
                <use href="#i-teacher" />
              </svg>
            </div>
            <small>Director</small>
          </div>

          <div
            className={`role-tab ${role === 'staff' ? 'on' : ''}`}
            onClick={() => setRole('staff')}
          >
            <div className="ric" style={{ background: 'linear-gradient(145deg,#10D9B8,#07a98f)' }}>
              <svg className="ic">
                <use href="#i-clip" />
              </svg>
            </div>
            <small>Staff</small>
          </div>

          <div
            className={`role-tab ${role === 'student' ? 'on' : ''}`}
            onClick={() => setRole('student')}
          >
            <div className="ric" style={{ background: 'linear-gradient(145deg,#FFB020,#e8940a)' }}>
              <svg className="ic">
                <use href="#i-user" />
              </svg>
            </div>
            <small>Student</small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--red)', marginBottom: '14px', fontSize: '.88rem', fontWeight: 600 }}>⚠️ {error}</div>}
          
          <div className="field">
            <label>Email / Username</label>
            <input
              type="text"
              className="inp"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              className="inp"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', fontSize: '.85rem' }}>
            <label style={{ color: 'var(--ink2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                style={{ width: '15px', height: '15px' }}
              />
              Keep me signed in
            </label>
            <span style={{ color: 'var(--blue)', fontWeight: 700, cursor: 'pointer' }}>Forgot password?</span>
          </div>

          <button type="submit" className="btn btn-pri" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );
}
