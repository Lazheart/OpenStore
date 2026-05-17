import { useEffect, useState } from 'react';
import { Server } from 'lucide-react';
import DetailClientView from './DetailClientView';

type Client = {
  id: string;
  username: string;
  email: string;
  phone?: string;
  shopName?: string;
};

type Store = {
  id: string;
  name: string;
  ownerId: string;
  phone?: string;
};

export default function AdminPanel() {
  const [role, setRole] = useState<'owner' | 'admin'>('owner');
  const [userId, setUserId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClientsList, setSelectedClientsList] = useState<Client[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Try to infer role and id from localStorage 'user' object
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.role === 'admin') setRole('admin');
        else setRole('owner');
        if (u?.id) setUserId(String(u.id));
      }
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    if (role === 'owner') fetchOwnerClients();
    else fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, userId]);

  async function fetchOwnerClients() {
    if (!userId) return;
    try {
      const res = await fetch(`/api/owners/${userId}/clients`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const normalized = (data || []).map((c: any) => ({
        ...c,
        shopName: c.shopName ?? c.storeName ?? c.shop?.name ?? '',
      }));
      setClients(normalized);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  }

  async function fetchStores() {
    try {
      const res = await fetch('/api/admin/stores');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setStores(data || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  }

  async function onStoreClick(store: Store) {
    // Admin: fetch clients for owner id then show modal with list
    try {
      const res = await fetch(`/api/owners/${store.ownerId}/clients`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const normalized = (data || []).map((c: any) => ({
        ...c,
        shopName: c.shopName ?? c.storeName ?? c.shop?.name ?? store.name ?? '',
      }));
      setSelectedClientsList(normalized || []);
    } catch {
      setSelectedClientsList([
        { id: '1', username: 'demo1', email: 'demo1@example.com', phone: '+1-555-0001' },
      ]);
    }
    setSelectedClient(null);
    setModalOpen(true);
  }

  function onClientRowClick(c: Client) {
    setSelectedClient(c);
    setSelectedClientsList(null);
    setModalOpen(true);
  }

  function exportToCsv(filename: string, rows: Client[]) {
    if (!rows || !rows.length) return;
    const header = ['username', 'email', 'shopName', 'phone'];
    const csv = [header.join(',')].concat(
      rows.map(r => [r.username, r.email, r.shopName || '', r.phone || '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Admin Panel</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{role === 'owner' ? 'Clients registered in your stores' : 'All stores in the platform'}</p>
        </div>
        {role === 'owner' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn"
              onClick={() => exportToCsv('clients.csv', clients)}
              disabled={clients.length === 0}
              style={{ opacity: clients.length === 0 ? 0.6 : 1, cursor: clients.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              {clients.length === 0 ? 'No clients to export' : 'Export CSV'}
            </button>
          </div>
        )}
      </div>

      {role === 'owner' ? (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Store</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                    No hay clientes registrados todavía.
                  </td>
                </tr>
              ) : (
                clients.map(c => (
                  <tr key={c.id} onClick={() => onClientRowClick(c)} style={{ cursor: 'pointer' }}>
                    <td>{c.username}</td>
                    <td>{c.email}</td>
                    <td>{c.shopName || '-'}</td>
                    <td>{c.phone || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={18} /> Stores
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Owner ID</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                    No hay tiendas registradas todavía.
                  </td>
                </tr>
              ) : (
                stores.map(s => (
                  <tr key={s.id} onClick={() => onStoreClick(s)} style={{ cursor: 'pointer' }}>
                    <td>{s.name}</td>
                    <td>{s.ownerId}</td>
                    <td>{s.phone || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <DetailClientView
        open={modalOpen}
        client={selectedClient}
        clients={selectedClientsList || undefined}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
