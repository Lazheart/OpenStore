import { useCallback, useEffect, useState } from 'react';
import { Package, Plus, Edit2, Store, ArrowLeft, ChevronRight } from 'lucide-react';
import { getShops, createShop } from '../../api/shop-service/shop-api';
import type { Shop } from '../../api/shop-service/shop-api';
import { getProductsByShop, createProduct, updateProduct } from '../../api/product-service/product-api';
import type { Product } from '../../api/product-service/product-api';
import { getCurrentUser } from '../../api/user-service/user-service';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const getShopId = (shop: Shop): string =>
  String(shop.shopId ?? shop.id ?? '');

const getShopName = (shop: Shop): string =>
  shop.shopName ?? shop.name ?? 'Unnamed Store';

const getInitials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

/* Deterministic gradient from name */
const getBannerGradient = (name: string): string => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
};

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

interface ShopCardProps {
  shop: Shop;
  onClick: (shop: Shop) => void;
}

function ShopCard({ shop, onClick }: ShopCardProps) {
  const name = getShopName(shop);
  const initials = getInitials(name);
  const gradient = getBannerGradient(name);

  return (
    <div
      className="card"
      onClick={() => onClick(shop)}
      style={{
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        border: '1px solid var(--border-color)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
    >
      {/* Pseudo-banner */}
      <div
        style={{
          background: gradient,
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.95)',
            letterSpacing: '0.05em',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {initials}
        </span>
      </div>

      {/* Card body */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{name}</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Tap to manage
          </p>
        </div>
        <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */

export default function OwnerPanel() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  /* Create shop form */
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');

  /* Add product form */
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });
  const [newProductFile, setNewProductFile] = useState<File | null>(null);

  /* Edit product */
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const user = getCurrentUser();

  /* ── Load all owner shops ── */
  const loadShops = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getShops(1, 100);
      const allShops: Shop[] = data.data || [];
      // Filter by owner if uid available, otherwise show all
      const ownerShops = user?.uid
        ? allShops.filter((s) => String(s.owner_id ?? s.ownerId) === String(user.uid))
        : allShops;
      setShops(ownerShops.length > 0 ? ownerShops : allShops);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

  /* ── Load products for a shop ── */
  const loadProducts = useCallback(async (shopId: string) => {
    try {
      setProductsLoading(true);
      const prods = await getProductsByShop(shopId);
      setProducts(prods);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
    setShowAddProduct(false);
    setEditingProduct(null);
    void loadProducts(getShopId(shop));
  };

  const handleBack = () => {
    setSelectedShop(null);
    setProducts([]);
    setShowAddProduct(false);
    setEditingProduct(null);
  };

  /* ── Create shop ── */
  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createShop(shopName, shopPhone);
      setShopName('');
      setShopPhone('');
      await loadShops();
      // Auto-select the newly created shop
      if (created) handleSelectShop(created);
    } catch (error) {
      console.error('Error creating shop', error);
      alert('Error creating shop');
    }
  };

  /* ── Add product ── */
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;
    try {
      await createProduct(
        getShopId(selectedShop),
        newProduct.name,
        parseFloat(newProduct.price),
        newProduct.description,
        newProductFile ?? undefined
      );
      setShowAddProduct(false);
      setNewProduct({ name: '', price: '', description: '' });
      setNewProductFile(null);
      await loadProducts(getShopId(selectedShop));
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    }
  };

  /* ── Update product ── */
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !editingProduct) return;
    try {
      await updateProduct(
        getShopId(selectedShop),
        editingProduct.productId,
        editingProduct.name,
        editingProduct.price,
        editingProduct.availability
      );
      setEditingProduct(null);
      await loadProducts(getShopId(selectedShop));
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    }
  };

  /* ────────────────── RENDER ────────────────── */

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  /* ── SHOP DETAIL VIEW ── */
  if (selectedShop) {
    const shopDisplayName = getShopName(selectedShop);
    const gradient = getBannerGradient(shopDisplayName);
    const initials = getInitials(shopDisplayName);

    return (
      <div className="animate-fade-in">
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-outline"
              onClick={handleBack}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <ArrowLeft size={18} />
            </button>
            {/* Mini banner avatar */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{initials}</span>
            </div>
            <div>
              <h1 style={{ margin: 0 }}>{shopDisplayName}</h1>
              <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0', fontSize: '0.875rem' }}>
                Manage your products and store activity.
              </p>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingProduct(null);
              setShowAddProduct(!showAddProduct);
            }}
          >
            <Plus size={18} /> {showAddProduct ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {/* Add Product Form */}
        {showAddProduct && (
          <div className="card mb-6">
            <h3 style={{ marginBottom: '1rem' }}>Add New Product</h3>
            <form
              onSubmit={handleAddProduct}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}
            >
              <input
                type="text"
                placeholder="Product Name"
                className="input-field"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                className="input-field"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                className="input-field"
                rows={3}
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                className="input-field"
                onChange={(e) => setNewProductFile(e.target.files?.[0] ?? null)}
              />
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                Publish Product
              </button>
            </form>
          </div>
        )}

        {/* Edit Product Form */}
        {editingProduct && (
          <div className="card mb-6" style={{ border: '1px solid var(--primary)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Edit Product: {editingProduct.name}</h3>
            <form
              onSubmit={handleUpdateProduct}
              style={{ display: 'grid', gap: '1rem', maxWidth: '520px' }}
            >
              <input
                type="text"
                className="input-field"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                className="input-field"
                value={editingProduct.price}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                }
                required
              />
              <select
                className="input-field"
                value={editingProduct.availability ?? 'AVAILABLE'}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, availability: e.target.value })
                }
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
              </select>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products table */}
        <div className="card mb-6">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} /> Your Products
            </h3>
          </div>

          {productsLoading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading products...</p>
          ) : products.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No products published yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Availability</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.productId}>
                      <td style={{ fontWeight: 500 }}>{product.name}</td>
                      <td>{product.description?.substring(0, 50)}...</td>
                      <td>{product.availability ?? 'AVAILABLE'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                        ${product.price?.toFixed(2)}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          onClick={() => {
                            setShowAddProduct(false);
                            setEditingProduct(product);
                          }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── SHOPS LIST VIEW ── */
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>My Stores</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Select a store to manage its products.
        </p>
      </div>

      {shops.length === 0 ? (
        /* ── No shops: create one ── */
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <Store size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>Create Your Store</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              You don't have a store yet. Create one to start selling products.
            </p>

            <form
              onSubmit={handleCreateShop}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <input
                type="text"
                placeholder="Store Name"
                className="input-field"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="input-field"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">
                Create Store
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ── Shop cards grid ── */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {shops.map((shop) => (
            <ShopCard key={getShopId(shop) || getShopName(shop)} shop={shop} onClick={handleSelectShop} />
          ))}
        </div>
      )}
    </div>
  );
}
