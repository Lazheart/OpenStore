import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

export default function CartDetailPage() {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Premium Wireless Headphones', price: 299.99, quantity: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
    { id: 3, name: 'Ergonomic Desk Chair', price: 349.00, quantity: 2, image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80' },
  ]);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(items => items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 15.00 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={20} /> Back to Shop
          </Link>
        </header>

        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <ShoppingBag size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
            <h2 style={{ marginBottom: '1rem' }}>Your cart is empty</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Looks like you haven't added any products to your cart yet.</p>
            <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '2rem', '@media (min-width: 1024px)': { gridTemplateColumns: '2fr 1fr' } } as any}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cartItems.map(item => (
                <div key={item.id} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1rem' }}>
                  <img src={item.image} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--border-radius)' }} />
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>{item.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>${item.price.toFixed(2)}</p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'var(--surface-color)', border: 'none', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                        <Minus size={16} />
                      </button>
                      <span style={{ width: '40px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'var(--surface-color)', border: 'none', padding: '0.5rem', cursor: 'pointer', borderLeft: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <p style={{ fontWeight: 700, width: '100px', textAlign: 'right', margin: 0 }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    
                    <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="card" style={{ alignSelf: 'flex-start', position: 'sticky', top: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Order Summary</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ fontWeight: 600 }}>${shipping.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Estimated Tax</span>
                <span style={{ fontWeight: 600 }}>${tax.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>${total.toFixed(2)}</span>
              </div>
              
              <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.125rem', padding: '1rem' }}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
