import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../config/AuthContext';

import { register as apiRegister } from '../../api/user-service/user-service';
import { getApiErrorMessage } from '../../api/api';

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authRes = await apiRegister({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        role: 'OWNER',
      });
      
      login(authRes); // Actualiza contexto de autenticación

      navigate('/owner');
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Error al crear la cuenta'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="animate-fade-in" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Left side - Decoration/Feature */}
      <div className="auth-signup-hero" style={{ flex: '0 0 50%', display: 'flex', alignItems: 'center', paddingLeft: '4rem' }}>
        <div style={{ maxWidth: '400px', margin: '0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          
          <Link to="/" className="sidebar-logo" style={{ marginBottom: '3rem', textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }}>
            <Store size={32} />
            <span style={{ fontSize: '1.75rem', marginLeft: '0.5rem' }}>Open</span><span style={{ color: 'var(--primary)', fontSize: '1.75rem' }}>Store</span>
          </Link>

          <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>Start your journey with <span style={{ color: 'var(--primary)' }}>OpenStore</span>.</h2>
          <p style={{ fontSize: '1.25rem', color: '#A0A0A0', marginBottom: '3rem', lineHeight: 1.6 }}>
            Join thousands of merchants who are building their dream businesses on our high-performance platform.
          </p>
          
          <div className="card" style={{ backgroundColor: '#121212', border: '1px solid #2C2C2C', color: '#fff', textAlign: 'left', width: '100%' }}>
            <p style={{ fontSize: '1.125rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
              "OpenStore completely transformed how we sell online. The setup was instant, and the design tools are incredibly powerful."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
              <div>
                <p style={{ fontWeight: 600, margin: 0 }}>Sarah Jenkins</p>
                <p style={{ color: '#A0A0A0', fontSize: '0.875rem', margin: 0 }}>Founder, TechHaven</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', backgroundColor: 'var(--surface-color)' }}>
        <div style={{ maxWidth: '450px', width: '100%', margin: '0 0 0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <Link to="/" className="sidebar-logo auth-signup-mobile-logo" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
            <Store size={32} />
            <span style={{ fontSize: '1.75rem', marginLeft: '0.5rem' }}>Open</span><span style={{ color: 'var(--primary)', fontSize: '1.75rem' }}>Store</span>
          </Link>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Create your store</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Get started and create your store.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="input-field" placeholder="John Doe" style={{ paddingLeft: '3rem', height: '45px' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="email" className="input-field" placeholder="you@example.com" style={{ paddingLeft: '3rem', height: '45px' }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-field" placeholder="••••••••" style={{ paddingLeft: '3rem', height: '45px' }} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '50px', fontSize: '1.125rem', marginTop: '1rem' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            By creating an account, you agree to our <a href="#" style={{ color: 'var(--primary)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>.
          </p>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
          Already have a store? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
