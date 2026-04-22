
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus, Search } from 'lucide-react';

export default function OwnerPanel() {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Store Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Here's what's happening with your store today.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Sales</p>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 0' }}>$3,240.50</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(154, 205, 50, 0.1)', borderRadius: 'var(--border-radius)', color: 'var(--primary)' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <p style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={16} /> +15% from yesterday
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Orders</p>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 0' }}>42</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(154, 205, 50, 0.1)', borderRadius: 'var(--border-radius)', color: 'var(--primary)' }}>
              <ShoppingCart size={24} />
            </div>
          </div>
          <p style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={16} /> +5% from yesterday
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Products</p>
              <h2 style={{ fontSize: '2rem', margin: '0.5rem 0 0' }}>156</h2>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(154, 205, 50, 0.1)', borderRadius: 'var(--border-radius)', color: 'var(--primary)' }}>
              <Package size={24} />
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>3 out of stock</p>
        </div>
      </div>

      <div className="card mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Recent Orders</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" placeholder="Search orders..." className="input-field" style={{ paddingLeft: '2.5rem', width: '250px' }} />
            </div>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><a href="#" style={{ fontWeight: 600 }}>#ORD-092</a></td>
                <td>Jane Cooper</td>
                <td>Today, 10:45 AM</td>
                <td><span className="badge badge-success">Fulfilled</span></td>
                <td>$124.99</td>
              </tr>
              <tr>
                <td><a href="#" style={{ fontWeight: 600 }}>#ORD-091</a></td>
                <td>Wade Warren</td>
                <td>Today, 09:12 AM</td>
                <td><span className="badge badge-primary">Processing</span></td>
                <td>$85.50</td>
              </tr>
              <tr>
                <td><a href="#" style={{ fontWeight: 600 }}>#ORD-090</a></td>
                <td>Esther Howard</td>
                <td>Yesterday, 04:30 PM</td>
                <td><span className="badge badge-success">Fulfilled</span></td>
                <td>$210.00</td>
              </tr>
              <tr>
                <td><a href="#" style={{ fontWeight: 600 }}>#ORD-089</a></td>
                <td>Cameron Williamson</td>
                <td>Yesterday, 02:15 PM</td>
                <td><span className="badge" style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: 'var(--danger)' }}>Cancelled</span></td>
                <td>$45.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
