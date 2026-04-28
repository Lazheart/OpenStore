import { Link, useNavigate } from 'react-router-dom';
import { Store, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../config/AuthContext';
import React, { useState } from 'react';

import { login as apiLogin } from '../../api/user-service/user-service';
import { getApiErrorMessage } from '../../api/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await apiLogin({ email, password });
      login(response);
      
      if (response.role === 'OWNER') {
        navigate('/owner');
      } else if (response.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/shop');
      }
    } catch (err: any) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="animate-fade-in" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Left side - Login Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3rem' }}>
          <div className="sidebar-logo" style={{ marginBottom: '1rem' }}>
            <Store size={32} />
            <span style={{ fontSize: '1.75rem' }}>Open</span><span style={{ color: 'var(--primary)', fontSize: '1.75rem' }}>Store</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Enter your details to access your store dashboard.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="email" className="input-field" placeholder="you@example.com" style={{ paddingLeft: '3rem', height: '50px' }} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <a href="#" style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500 }}>Forgot password?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" style={{ paddingLeft: '3rem', height: '50px' }} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '50px', fontSize: '1.125rem', marginTop: '1rem' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create a store</Link>
        </p>
      </div>

      {/* Right side - Decoration/Feature */}
      <div className="auth-login-hero">
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
            <Store size={32} color="#000" />
          </div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>Manage your business with ease.</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Access all your tools, track your sales, and grow your brand from a single, powerful dashboard.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.125rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(154,205,50,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>✓</div>
              Real-time analytics
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.125rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(154,205,50,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>✓</div>
              Secure transactions
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.125rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(154,205,50,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>✓</div>
              Global reach
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
