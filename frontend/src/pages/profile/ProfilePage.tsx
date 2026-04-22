import { User, Mail, Shield, CreditCard, Bell, LogOut, Check } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage your account settings and preferences.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        {/* Navigation Sidebar for Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn" style={{ justifyContent: 'flex-start', backgroundColor: 'var(--primary)', color: '#000', fontWeight: 600 }}>
            <User size={18} /> General
          </button>
          <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-secondary)' }}>
            <Shield size={18} /> Security
          </button>
          <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-secondary)' }}>
            <CreditCard size={18} /> Billing
          </button>
          <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-secondary)' }}>
            <Bell size={18} /> Notifications
          </button>
          <div style={{ margin: '1rem 0', borderBottom: '1px solid var(--border-color)' }}></div>
          <button className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--danger)' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* Profile Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
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
                JD
              </div>
              <div>
                <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Change Avatar</button>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label>First Name</label>
                <input type="text" className="input-field" defaultValue="John" />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input type="text" className="input-field" defaultValue="Doe" />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="email" className="input-field" defaultValue="john.doe@example.com" style={{ paddingLeft: '2.5rem' }} disabled />
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
              <input type="text" className="input-field" defaultValue="TechHaven" />
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
                <input type="text" className="input-field" defaultValue="techhaven" style={{ borderRadius: '0 var(--border-radius) var(--border-radius) 0' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn btn-outline">Cancel</button>
            <button className="btn btn-primary">Save Changes</button>
          </div>

        </div>
      </div>
    </div>
  );
}
