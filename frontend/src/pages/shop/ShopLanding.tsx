import { useEffect, useState } from 'react';
import { ShoppingCart, Search, Star, Heart, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getShopById, getShops } from '../../api/shop-service/shop-api';
import type { Shop } from '../../api/shop-service/shop-api';
import { getProductsByShop } from '../../api/product-service/product-api';
import type { Product } from '../../api/product-service/product-api';

export default function ShopLanding() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // If no ID is provided, we can either list shops or pick the first one. Let's just try loading one.
  useEffect(() => {
    loadShop();
  }, [id]);

  const loadShop = async () => {
    try {
      setLoading(true);
      let targetId = id;
      if (!targetId) {
        // Just pick the first shop available if none provided in URL
        const shopsRes = await getShops(1, 1);
        if (shopsRes.data && shopsRes.data.length > 0) {
          targetId = String(shopsRes.data[0].id);
        }
      }

      if (targetId) {
        const [shopData, productsData] = await Promise.all([
          getShopById(Number(targetId)),
          getProductsByShop(targetId)
        ]);
        setShop(shopData);
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading shop data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Shop...</div>;
  }

  if (!shop) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Store not found</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Go to Homepage</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Store Header */}
      <header style={{ backgroundColor: 'var(--surface-color)', padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ color: 'var(--text-color)' }}><ArrowLeft size={24} /></Link>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{shop.name}</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', display: 'none', '@media (min-width: 768px)': { display: 'block' } } as any}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" placeholder="Search products..." className="input-field" style={{ paddingLeft: '2.5rem', width: '300px', borderRadius: '999px', backgroundColor: 'var(--bg-color)' }} />
            </div>
            
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--text-color)' }}>Login / Register</Link>
            
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>
              <Heart size={24} />
            </button>
            <Link to="/cart" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', display: 'flex', alignItems: 'center' }}>
              <ShoppingCart size={24} />
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: 'var(--primary)', color: '#000', fontSize: '0.75rem', fontWeight: 700, width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Store Hero */}
      <section style={{ 
        position: 'relative', 
        height: '60vh', 
        minHeight: '400px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=1600&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Welcome to {shop.name}</h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Discover our new collection of premium products.</p>
          <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem', borderRadius: '999px' }}>
            Shop Now
          </button>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>All Products</h2>
        </div>

        {products.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>This store doesn't have any products yet.</p>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
            {products.map(product => (
              <div key={product.productId} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: '250px', backgroundColor: '#f0f0f0' }}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition)' }} className="product-image" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      No Image
                    </div>
                  )}
                  <button style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'var(--surface-color)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', color: 'var(--text-color)' }}>
                    <Heart size={18} />
                  </button>
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', color: '#FAAD14' }}>
                    <Star size={14} fill="currentColor" />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>4.5 (10)</span>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0', flex: 1 }}>{product.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${product.price?.toFixed(2)}</span>
                    <button className="btn btn-primary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', padding: '4rem 2rem', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>{shop.name}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Providing the best products. Powered by OpenStore.</p>
          </div>
          <div>
            <h4 style={{ marginBottom: '1.5rem' }}>Shop</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link to="#" style={{ color: 'var(--text-secondary)' }}>All Products</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '1.5rem' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link to="#" style={{ color: 'var(--text-secondary)' }}>Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '3rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
