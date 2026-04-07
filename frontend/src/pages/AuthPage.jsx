import React, { useState } from 'react';
import { Compass, Mail, Lock, User as UserIcon } from 'lucide-react';

const API_BASE = import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : '/api';

function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMSG('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMSG('');

    try {
      const endpoint = isLogin ? `${API_BASE}/users/login` : `${API_BASE}/users/register`;
      const bodyParams = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyParams)
      });

      const data = await res.json();

      if (res.ok && data.token) {
        onLoginSuccess(data.token, data.name || (data.user && data.user.name));
      } else {
        setErrorMSG(data.message || 'Authentication failed');
      }
    } catch (err) {
      setErrorMSG('Network error: server may be unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header text-center mb-4">
          <div className="logo-container" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <Compass size={40} strokeWidth={2.5} color="var(--primary-color)" />
            <span className="logo-text" style={{ fontSize: '2rem' }}>TripHub</span>
          </div>
          <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to access your trips.' : 'Join to start splitting expenses easily.'}
          </p>
        </div>

        {errorMSG && <div className="auth-error">{errorMSG}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <UserIcon size={18} />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Rachel Green" 
                  required={!isLogin} 
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                minLength={isLogin ? undefined : 6}
              />
            </div>
          </div>

          <button type="submit" className="primary-btn mt-4" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-footer mt-4 text-center">
          <p style={{ color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span className="auth-link" onClick={toggleMode}>
              {isLogin ? "Sign Up" : "Log In"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
