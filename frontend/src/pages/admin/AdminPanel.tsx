import { Activity, Users, DollarSign, Server, Database } from 'lucide-react';

export default function AdminPanel() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>System Administration</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Overview of OpenStore Platform infrastructure</p>
        </div>
        <button className="btn btn-primary">
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Tenants</p>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 0' }}>1,248</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(154, 205, 50, 0.1)', borderRadius: 'var(--border-radius)', color: 'var(--primary)' }}>
              <Users size={24} />
            </div>
          </div>
          <p style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 500 }}>+12% from last month</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Platform Revenue</p>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 0' }}>$48,590</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(154, 205, 50, 0.1)', borderRadius: 'var(--border-radius)', color: 'var(--primary)' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <p style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 500 }}>+8.4% from last month</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>System Status</p>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 0' }}>99.99%</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(82, 196, 26, 0.1)', borderRadius: 'var(--border-radius)', color: 'var(--success)' }}>
              <Activity size={24} />
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>All services operational</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={20} /> Infrastructure Nodes
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Status</th>
                <th>Load</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>us-east-1</td>
                <td><span className="badge badge-success">Healthy</span></td>
                <td>42%</td>
              </tr>
              <tr>
                <td>eu-central-1</td>
                <td><span className="badge badge-success">Healthy</span></td>
                <td>38%</td>
              </tr>
              <tr>
                <td>ap-southeast-1</td>
                <td><span className="badge badge-primary">Scaling</span></td>
                <td>89%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} /> Service Health
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                <span style={{ fontWeight: 500 }}>Auth Service</span>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>12ms latency</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                <span style={{ fontWeight: 500 }}>Product Service</span>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>24ms latency</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                <span style={{ fontWeight: 500 }}>Order Service</span>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>18ms latency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
