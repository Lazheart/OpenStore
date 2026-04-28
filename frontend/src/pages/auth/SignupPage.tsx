import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../config/AuthContext';

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', storeName: '', email: '' });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: 'usr_new',
      firstName: formData.firstName || 'New',
      lastName: formData.lastName || 'User',
      email: formData.email || 'user@example.com',
      storeName: formData.storeName || 'My Store',
      storeUrl: formData.storeName.toLowerCase().replace(/\s+/g, '') || 'mystore'
    });
    navigate('/owner');
  };
  return (
    <div className="animate-fade-in" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Left side - Decoration/Feature */}
      <div style={{ flex: 1, backgroundColor: '#000', color: '#fff', display: 'none', flexDirection: 'column', justifyContent: 'center', padding: '4rem', '@media (min-width: 1024px)': { display: 'flex' } } as any}>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>Start your journey with <span style={{ color: 'var(--primary)' }}>OpenStore</span>.</h2>
          <p style={{ fontSize: '1.25rem', color: '#A0A0A0', marginBottom: '3rem', lineHeight: 1.6 }}>
            Join thousands of merchants who are building their dream businesses on our high-performance platform.
          </p>
          
          <div className="card" style={{ backgroundColor: '#121212', border: '1px solid #2C2C2C', color: '#fff' }}>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--surface-color)' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="sidebar-logo" style={{ marginBottom: '1rem', display: 'flex', '@media (min-width: 1024px)': { display: 'none' } } as any}>
            <Store size={32} />
            <span style={{ fontSize: '1.75rem' }}>Open</span><span style={{ color: 'var(--primary)', fontSize: '1.75rem' }}>Store</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Create your store</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Get started and create your store.</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>First Name</label>
              <div style={{ position: 'relative' }}>
                <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="text" className="input-field" placeholder="John" style={{ paddingLeft: '3rem', height: '45px' }} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Last Name</label>
              <div style={{ position: 'relative' }}>
                <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="text" className="input-field" placeholder="Doe" style={{ paddingLeft: '3rem', height: '45px' }} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
              </div>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Store Name</label>
            <div style={{ position: 'relative' }}>
              <Store size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="input-field" placeholder="My Awesome Store" style={{ paddingLeft: '3rem', height: '45px' }} value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} required />
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
              <input type="password" className="input-field" placeholder="••••••••" style={{ paddingLeft: '3rem', height: '45px' }} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '50px', fontSize: '1.125rem', marginTop: '1rem' }}>
            Create Store
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
  );
}
