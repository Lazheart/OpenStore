import { useEffect, useState } from 'react';
import { AlertCircle, Bell, CreditCard, Eye, EyeOff, LogOut, Mail, Shield, User, Edit2 } from 'lucide-react';
import { useAuth } from '../../config/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/api';
import { getMe, type MeResponse, updateProfile, verifyPassword } from '../../api/user-service/user-service';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [showGeneralVerifyModal, setShowGeneralVerifyModal] = useState(false);
  const [showSecurityVerifyModal, setShowSecurityVerifyModal] = useState(false);
  const [securityVerifyPassword, setSecurityVerifyPassword] = useState('');
  const [securityVerifyError, setSecurityVerifyError] = useState('');
  const [securityVerificationCode, setSecurityVerificationCode] = useState('');
  const [generalForm, setGeneralForm] = useState({ name: '', phoneNumber: '' });
  const [securityForm, setSecurityForm] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [showSecurityVerifyPassword, setShowSecurityVerifyPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const authEmail = user?.email || '';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const data = await getMe();
        const mergedProfile = {
          ...data,
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          phoneNumber: data.phoneNumber || '',
        };

        setProfile(mergedProfile);
        setGeneralForm({
          name: mergedProfile.name || '',
          phoneNumber: mergedProfile.phoneNumber || '',
        });
        setSecurityForm((current) => ({
          ...current,
          email: mergedProfile.email || authEmail,
        }));
      } catch (error) {
        setGeneralError(getApiErrorMessage(error, 'No se pudo cargar el perfil'));
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [authEmail, user?.email, user?.name]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  };

  const handleVerifyPasswordForEdit = async () => {
    if (!verifyPasswordInput) {
      setVerifyError('Debes ingresar tu contraseña actual');
      return;
    }

    try {
      setGeneralSaving(true);
      setVerifyError('');
      const verifyResponse = await verifyPassword({ email: authEmail, password: verifyPasswordInput });
      setVerificationCode(verifyResponse.code);
      setIsEditingGeneral(true);
      setShowGeneralVerifyModal(false);
      setVerifyPasswordInput('');
    } catch (error) {
      setVerifyError(getApiErrorMessage(error, 'Contraseña incorrecta'));
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleVerifySecurityPassword = async () => {
    if (!securityVerifyPassword) {
      setSecurityVerifyError('Debes ingresar tu contraseña actual');
      return;
    }

    try {
      setSecuritySaving(true);
      setSecurityVerifyError('');
      const verifyResponse = await verifyPassword({ email: authEmail, password: securityVerifyPassword });
      setSecurityVerificationCode(verifyResponse.code);
      setIsEditingSecurity(true);
      setShowSecurityVerifyModal(false);
      setSecurityVerifyPassword('');
    } catch (error) {
      setSecurityVerifyError(getApiErrorMessage(error, 'Contraseña incorrecta'));
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!securityVerificationCode) {
      setSecurityError('No tienes permisos para editar (falta código)');
      return;
    }

    const hasEmailChange = securityForm.email.trim() && securityForm.email.trim() !== (profile?.email || user?.email || '');
    const hasPasswordChange = Boolean(securityForm.newPassword || securityForm.confirmPassword);

    if (!hasEmailChange && !hasPasswordChange) {
      setSecurityError('No hay cambios para guardar');
      return;
    }

    if (hasPasswordChange) {
      if (!securityForm.newPassword || securityForm.newPassword.length < 8) {
        setSecurityError('La nueva contraseña debe tener al menos 8 caracteres');
        return;
      }

      if (securityForm.newPassword !== securityForm.confirmPassword) {
        setSecurityError('Las contraseñas no coinciden');
        return;
      }
    }

    try {
      setSecuritySaving(true);
      await updateProfile({
        email: hasEmailChange ? securityForm.email : undefined,
        password: hasPasswordChange ? securityForm.newPassword : undefined,
        code: securityVerificationCode,
      });

      setProfile((current) => ({
        ...current,
        email: hasEmailChange ? securityForm.email : current?.email,
      }));

      setSecuritySuccess('Cambios de seguridad actualizados correctamente');
      setIsEditingSecurity(false);
      setSecurityVerificationCode('');
      setSecurityForm((current) => ({
        ...current,
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      setSecurityError(getApiErrorMessage(error, 'No se pudo actualizar la seguridad'));
    } finally {
      setSecuritySaving(false);
    }
  };

  const submitGeneralUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verificationCode) {
      setGeneralError('No tienes permisos para editar (falta código)');
      return;
    }

    try {
      setGeneralSaving(true);
      setGeneralError('');
      await updateProfile({
        name: generalForm.name,
        phoneNumber: generalForm.phoneNumber || undefined,
        code: verificationCode,
      });

      setProfile((current) => ({
        ...current,
        name: generalForm.name,
        phoneNumber: generalForm.phoneNumber,
      }));
      setGeneralSuccess('Perfil actualizado correctamente');
      setIsEditingGeneral(false);
      setVerificationCode('');
    } catch (error) {
      setGeneralError(getApiErrorMessage(error, 'No se pudo actualizar el perfil'));
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingGeneral(false);
    setVerificationCode('');
    setGeneralError('');
    setGeneralForm({
      name: profile?.name || user?.name || '',
      phoneNumber: profile?.phoneNumber || '',
    });
  };

  if (loadingProfile) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading profile...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage your account settings and preferences.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {activeTab === 'general' && (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Personal Information</h3>
                  {!isEditingGeneral && (
                    <button className="btn btn-outline" onClick={() => { setVerifyError(''); setShowGeneralVerifyModal(true); }} style={{ padding: '0.5rem', borderRadius: '50%' }} title="Edit Profile">
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>

                {generalError && (
                  <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} />
                    {generalError}
                  </div>
                )}

                {generalSuccess && (
                  <div style={{ backgroundColor: 'rgba(82, 196, 26, 0.12)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {generalSuccess}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, rgba(255,255,255,0.85) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontSize: '2rem',
                    fontWeight: 800,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
                  }}>
                    {getInitials(profile?.name || user?.name || 'U')}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{profile?.name || user?.name || 'User'}</p>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{profile?.email || user?.email || ''}</p>
                  </div>
                </div>

                <form onSubmit={submitGeneralUpdate} className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label>Name</label>
                    <input type="text" className="input-field" disabled={!isEditingGeneral} value={generalForm.name} onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label>Phone Number</label>
                    <input type="tel" className="input-field" disabled={!isEditingGeneral} value={generalForm.phoneNumber} onChange={(e) => setGeneralForm({ ...generalForm, phoneNumber: e.target.value })} />
                  </div>

                  {isEditingGeneral && (
                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <button type="button" className="btn btn-outline" onClick={handleCancelEdit}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={generalSaving}>Save Changes</button>
                    </div>
                  )}
                </form>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Security Settings</h3>

              {securityError && (
                <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} />
                  {securityError}
                </div>
              )}

              {securitySuccess && (
                <div style={{ backgroundColor: 'rgba(82, 196, 26, 0.12)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {securitySuccess}
                </div>
              )}

              <form onSubmit={handleSaveSecurity} className="grid" style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email Address</p>
                      {!isEditingSecurity ? (
                        <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>{securityForm.email || authEmail}</p>
                      ) : (
                        <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                          <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                          <input type="email" className="input-field" value={securityForm.email} style={{ paddingLeft: '2.5rem' }} onChange={(e) => setSecurityForm({ ...securityForm, email: e.target.value })} />
                        </div>
                      )}
                    </div>
                    {!isEditingSecurity ? (
                      <button type="button" className="btn btn-outline" onClick={() => { setSecurityError(''); setShowSecurityVerifyModal(true); }} style={{ padding: '0.5rem', borderRadius: '50%' }} title="Edit Email">
                        <Edit2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Change Password</p>
                      <p style={{ margin: '0.35rem 0 0', fontWeight: 600, color: 'var(--text-secondary)' }}>••••••••</p>
                    </div>
                    {!isEditingSecurity ? (
                      <button type="button" className="btn btn-outline" onClick={() => { setSecurityError(''); setShowSecurityVerifyModal(true); }} style={{ padding: '0.5rem', borderRadius: '50%' }} title="Update Password">
                        <Edit2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>

                {isEditingSecurity ? (
                  <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="input-group">
                      <label>New Password</label>
                      <input type="password" className="input-field" value={securityForm.newPassword} onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })} placeholder="••••••••" />
                    </div>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Confirm New Password</label>
                      <input type="password" className="input-field" value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} placeholder="••••••••" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setIsEditingSecurity(false);
                          setSecurityVerificationCode('');
                          setSecurityError('');
                          setSecurityForm((current) => ({
                            ...current,
                            email: profile?.email || user?.email || '',
                            newPassword: '',
                            confirmPassword: '',
                          }));
                        }}
                      >
                        Cancel
                      </button>
                      <button className="btn btn-primary" type="submit" disabled={securitySaving}>Save Changes</button>
                    </div>
                  </div>
                ) : null}
              </form>
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

      {showGeneralVerifyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
            <h3 style={{ marginTop: 0 }}>Habilitar Edición</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Ingresa tu contraseña actual para poder editar tu perfil.</p>
            
            {verifyError && (
              <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                {verifyError}
              </div>
            )}

            <div className="input-group">
              <div style={{ position: 'relative' }}>
                <input type={showVerifyPassword ? 'text' : 'password'} className="input-field" value={verifyPasswordInput} onChange={(e) => setVerifyPasswordInput(e.target.value)} placeholder="Contraseña" />
                <button type="button" onClick={() => setShowVerifyPassword(!showVerifyPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                  {showVerifyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => { setShowGeneralVerifyModal(false); setVerifyPasswordInput(''); setVerifyError(''); }} type="button">Cancel</button>
              <button className="btn btn-primary" onClick={handleVerifyPasswordForEdit} disabled={generalSaving}>Verify & Edit</button>
            </div>
          </div>
        </div>
      )}

      {showSecurityVerifyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
            <h3 style={{ marginTop: 0 }}>Verificar Contraseña</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Ingresa tu contraseña actual para poder editar tu seguridad.</p>
            
            {securityVerifyError && (
              <div style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                {securityVerifyError}
              </div>
            )}

            <div className="input-group">
              <div style={{ position: 'relative' }}>
                <input type={showSecurityVerifyPassword ? 'text' : 'password'} className="input-field" value={securityVerifyPassword} onChange={(e) => setSecurityVerifyPassword(e.target.value)} placeholder="Contraseña" />
                <button type="button" onClick={() => setShowSecurityVerifyPassword(!showSecurityVerifyPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                  {showSecurityVerifyPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => { setShowSecurityVerifyModal(false); setSecurityVerifyPassword(''); setSecurityVerifyError(''); }} type="button">Cancel</button>
              <button className="btn btn-primary" onClick={handleVerifySecurityPassword} disabled={securitySaving}>Verify & Edit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
