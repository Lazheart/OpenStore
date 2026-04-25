import { useState } from 'react';
import { User, Mail, Shield, CreditCard, Bell, LogOut, Check } from 'lucide-react';
import { useAuth } from '../../config/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };
  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage your account settings and preferences.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        {/* Navigation Sidebar for Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('general')} className="btn" style={{ justifyContent: 'flex-start', backgroundColor: activeTab === 'general' ? 'var(--primary)' : 'transparent', color: activeTab === 'general' ? '#000' : 'var(--text-secondary)', fontWeight: activeTab === 'general' ? 600 : 400 }}>
            <User size={18} /> General
          </button>
          <button onClick={() => setActiveTab('security')} className="btn" style={{ justifyContent: 'flex-start', backgroundColor: activeTab === 'security' ? 'var(--primary)' : 'transparent', color: activeTab === 'security' ? '#000' : 'var(--text-secondary)' }}>
            <Shield size={18} /> Security
          </button>
          <button onClick={() => setActiveTab('billing')} className="btn" style={{ justifyContent: 'flex-start', backgroundColor: activeTab === 'billing' ? 'var(--primary)' : 'transparent', color: activeTab === 'billing' ? '#000' : 'var(--text-secondary)' }}>
            <CreditCard size={18} /> Billing
          </button>
          <button onClick={() => setActiveTab('notifications')} className="btn" style={{ justifyContent: 'flex-start', backgroundColor: activeTab === 'notifications' ? 'var(--primary)' : 'transparent', color: activeTab === 'notifications' ? '#000' : 'var(--text-secondary)' }}>
            <Bell size={18} /> Notifications
          </button>
          <div style={{ margin: '1rem 0', borderBottom: '1px solid var(--border-color)' }}></div>
          <button onClick={handleLogout} className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--danger)' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* Profile Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {activeTab === 'general' && (
          <>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Personal Information</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontSize: '2rem',
                fontWeight: 700
              }}>
                {user ? getInitials(user.firstName, user.lastName) : 'U'}
              </div>
              <div>
                <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Change Avatar</button>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label>First Name</label>
                <input type="text" className="input-field" defaultValue={user?.firstName || ''} />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input type="text" className="input-field" defaultValue={user?.lastName || ''} />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="email" className="input-field" defaultValue={user?.email || ''} style={{ paddingLeft: '2.5rem' }} disabled />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Check size={14} color="var(--success)" /> Email verified
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Store Details</h3>
            <div className="input-group">
              <label>Store Name</label>
              <input type="text" className="input-field" defaultValue={user?.storeName || ''} />
            </div>
            <div className="input-group">
              <label>Store URL</label>
              <div style={{ display: 'flex' }}>
                <span style={{ 
                  padding: '0.75rem 1rem', 
                  backgroundColor: 'rgba(0,0,0,0.05)', 
                  border: '1px solid var(--border-color)', 
                  borderRight: 'none',
                  borderRadius: 'var(--border-radius) 0 0 var(--border-radius)',
                  color: 'var(--text-secondary)'
                }}>
                  openstore.com/
                </span>
                <input type="text" className="input-field" defaultValue={user?.storeUrl || ''} style={{ borderRadius: '0 var(--border-radius) var(--border-radius) 0' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn btn-outline">Cancel</button>
            <button className="btn btn-primary">Save Changes</button>
          </div>
          </>)}

          {activeTab === 'security' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Security Settings</h3>
              <div className="input-group">
                <label>Current Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label>Confirm New Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <button className="btn btn-primary">Update Password</button>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Billing Information</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You are currently on the <strong>Pro Plan</strong> ($29/month).</p>
              <button className="btn btn-outline" style={{ marginBottom: '1rem' }}>Change Plan</button>
              <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Payment Method</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' }}>
                <CreditCard size={24} color="var(--primary)" />
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>Visa ending in 4242</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Expires 12/28</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Notification Preferences</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="checkbox" defaultChecked />
                  <span>Email me when a new order is placed</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="checkbox" defaultChecked />
                  <span>Email me when a product is low on stock</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="checkbox" />
                  <span>Send me weekly performance reports</span>
                </label>
                <button className="btn btn-primary" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>Save Preferences</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
