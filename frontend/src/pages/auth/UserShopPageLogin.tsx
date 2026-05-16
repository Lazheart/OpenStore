import React, { useState } from 'react';
import { Lock, Mail, X, Store, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../config/AuthContext';
import { login as apiLogin } from '../../api/user-service/user-service';
import { getApiErrorMessage } from '../../api/api';

interface Props {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function UserShopPageLogin({ onSuccess, onClose }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await apiLogin({ email, password });
      login(response);
      onSuccess?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        style={{
          background: 'var(--surface-color, #1e1e1e)',
          border: '1px solid var(--border-color, #333)',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary, #888)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        )}

        <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Store size={36} style={{ color: 'var(--primary, #9ACD32)' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-color, #fff)', fontWeight: 700 }}>
            Iniciar sesión
          </h2>
          <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.875rem', margin: 0 }}>
            Accede para gestionar tus pedidos
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,77,79,0.1)',
            color: '#ff4d4f',
            border: '1px solid rgba(255,77,79,0.3)',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary, #888)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary, #888)',
                pointerEvents: 'none',
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                  background: 'var(--input-bg, rgba(255,255,255,0.05))',
                  border: '1px solid var(--border-color, #444)',
                  borderRadius: '8px',
                  color: 'var(--text-color, #fff)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary, #9ACD32)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color, #444)'; }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary, #888)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary, #888)',
                pointerEvents: 'none',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 2.75rem 0.65rem 2.5rem',
                  background: 'var(--input-bg, rgba(255,255,255,0.05))',
                  border: '1px solid var(--border-color, #444)',
                  borderRadius: '8px',
                  color: 'var(--text-color, #fff)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary, #9ACD32)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color, #444)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary, #888)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'rgba(154,205,50,0.5)' : 'var(--primary, #9ACD32)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '0.8rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
