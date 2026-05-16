import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { getShops } from '../../api/shop-service/shop-api';
import type { Shop } from '../../api/shop-service/shop-api';
import { getApiErrorMessage } from '../../api/api';

interface ShopsResponse {
  data: Shop[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const LIMIT = 12;

export default function ShopListingPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    getShops(page, LIMIT)
      .then((raw) => {
        if (cancelled) return;
        if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
          const res = raw as ShopsResponse;
          setShops(res.data);
          setMeta({ total: res.meta.total, page: res.meta.page, totalPages: res.meta.totalPages });
        } else if (Array.isArray(raw)) {
          setShops(raw as Shop[]);
          setMeta({ total: (raw as Shop[]).length, page: 1, totalPages: 1 });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'No se pudieron cargar las tiendas'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page]);

  const visitShop = (shop: Shop) => {
    const id = shop.shopId ?? shop.id ?? '';
    const name = shop.shopName ?? shop.name ?? '';
    if (!id || !name) return;
    navigate(`/${encodeURIComponent(name)}?id=${encodeURIComponent(id)}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border-color, #2a2a2a)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface-color, #121212)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Store size={24} style={{ color: 'var(--primary, #9ACD32)' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Open<span style={{ color: 'var(--primary, #9ACD32)' }}>Store</span>
          </span>
        </Link>
        <span style={{ color: 'var(--text-secondary, #888)', fontSize: '0.875rem' }}>
          {meta.total > 0 ? `${meta.total} tiendas disponibles` : ''}
        </span>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Explorar tiendas
          </h1>
          <p style={{ color: 'var(--text-secondary, #888)', fontSize: '1rem' }}>
            Descubre y visita las tiendas disponibles en la plataforma.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary, #888)' }}>
            Cargando tiendas…
          </div>
        )}

        {!loading && error && (
          <div style={{
            background: 'rgba(255,77,79,0.1)',
            border: '1px solid rgba(255,77,79,0.3)',
            color: '#ff4d4f',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && shops.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            color: 'var(--text-secondary, #888)',
          }}>
            <Store size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.1rem' }}>No hay tiendas disponibles todavía.</p>
          </div>
        )}

        {!loading && !error && shops.length > 0 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2.5rem',
            }}>
              {shops.map((shop) => {
                const id = shop.shopId ?? shop.id ?? '';
                const name = shop.shopName ?? shop.name ?? 'Sin nombre';
                return (
                  <div
                    key={id}
                    style={{
                      background: 'var(--surface-color, #1a1a1a)',
                      border: '1px solid var(--border-color, #2a2a2a)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
                    }}
                    onClick={() => visitShop(shop)}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.borderColor = 'var(--primary, #9ACD32)';
                      el.style.transform = 'translateY(-2px)';
                      el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.borderColor = 'var(--border-color, #2a2a2a)';
                      el.style.transform = 'translateY(0)';
                      el.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: 'rgba(154,205,50,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}>
                      <Store size={24} style={{ color: 'var(--primary, #9ACD32)' }} />
                    </div>

                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      marginBottom: '0.4rem',
                      color: 'var(--text-color, #fff)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {name}
                    </h3>

                    {shop.phoneNumber && shop.phoneNumber !== '000000000' && (
                      <p style={{
                        color: 'var(--text-secondary, #888)',
                        fontSize: '0.8rem',
                        marginBottom: '1rem',
                      }}>
                        📞 {shop.phoneNumber}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: 'var(--primary, #9ACD32)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginTop: shop.phoneNumber && shop.phoneNumber !== '000000000' ? 0 : '1rem',
                    }}>
                      <ExternalLink size={14} />
                      Visitar tienda
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--surface-color, #1a1a1a)',
                    border: '1px solid var(--border-color, #333)',
                    borderRadius: '8px',
                    color: page <= 1 ? 'var(--text-secondary, #555)' : 'var(--text-color, #fff)',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>

                <span style={{ color: 'var(--text-secondary, #888)', fontSize: '0.875rem' }}>
                  Página {meta.page} de {meta.totalPages}
                </span>

                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--surface-color, #1a1a1a)',
                    border: '1px solid var(--border-color, #333)',
                    borderRadius: '8px',
                    color: page >= meta.totalPages ? 'var(--text-secondary, #555)' : 'var(--text-color, #fff)',
                    cursor: page >= meta.totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
