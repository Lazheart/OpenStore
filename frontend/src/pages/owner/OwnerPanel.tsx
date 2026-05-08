import { useCallback, useEffect, useState } from 'react';
import { Package, Plus, Edit2, Store } from 'lucide-react';
import { getShops, createShop } from '../../api/shop-service/shop-api';
import type { Shop } from '../../api/shop-service/shop-api';
import { getProductsByShop, createProduct, updateProduct } from '../../api/product-service/product-api';
import type { Product } from '../../api/product-service/product-api';
import { getCurrentUser } from '../../api/user-service/user-service';

export default function OwnerPanel() {
  const [myShop, setMyShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });
  const [newProductFile, setNewProductFile] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const user = getCurrentUser();

  const loadProducts = useCallback(async (shopId: string) => {
    try {
      const prods = await getProductsByShop(shopId);
      setProducts(prods);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getShops(1, 100);
      const allShops: Shop[] = data.data || [];

      if (allShops.length > 0) {
        const userShop = allShops.find(s => String(s.owner_id) === String(user?.uid)) || allShops[allShops.length - 1];
        if (userShop) {
          setMyShop(userShop);
          if (userShop.id) {
            await loadProducts(String(userShop.id));
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadProducts, user?.uid]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createShop(shopName, shopPhone);
      const returnedId = (created.shopId ?? created.id) as string | undefined;
      const returnedName = created.shopName ?? created.name ?? shopName;
      const normalized: Shop = {
        id: returnedId,
        name: returnedName,
        owner_id: created.owner_id ?? created.ownerId,
        phoneNumber: created.phoneNumber,
      };
      setMyShop(normalized);
      setShopName('');
      setShopPhone('');
      if (returnedId) {
        await loadProducts(String(returnedId));
      }
    } catch (error) {
      console.error('Error creating shop', error);
      alert('Error creating shop');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myShop) return;
    try {
      await createProduct(
        String(myShop.id), 
        newProduct.name, 
        parseFloat(newProduct.price), 
        newProduct.description,
        newProductFile ?? undefined
      );
      setShowAddProduct(false);
      setNewProduct({ name: '', price: '', description: '' });
      setNewProductFile(null);
      await loadProducts(String(myShop.id));
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myShop || !editingProduct) return;
    try {
      await updateProduct(
        String(myShop.id),
        editingProduct.productId,
        editingProduct.name,
        editingProduct.price,
        editingProduct.availability,
      );
      setEditingProduct(null);
      await loadProducts(String(myShop.id));
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Error updating price');
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (!myShop) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <Store size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Create Your Store</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You don't have a store yet. Create one to start selling products.</p>
          
          <form onSubmit={handleCreateShop} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Store Name" 
              className="input-field" 
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Phone Number"
              className="input-field"
              value={shopPhone}
              onChange={e => setShopPhone(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">Create Store</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>{myShop.name} Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage your products and view store activity.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddProduct(!showAddProduct)}>
          <Plus size={18} /> {showAddProduct ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showAddProduct && (
        <div className="card mb-6">
          <h3 style={{ marginBottom: '1rem' }}>Add New Product</h3>
          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
            <input 
              type="text" 
              placeholder="Product Name" 
              className="input-field" 
              value={newProduct.name}
              onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              required
            />
            <input 
              type="number" 
              step="0.01"
              placeholder="Price ($)" 
              className="input-field" 
              value={newProduct.price}
              onChange={e => setNewProduct({...newProduct, price: e.target.value})}
              required
            />
            <textarea 
              placeholder="Description" 
              className="input-field" 
              rows={3}
              value={newProduct.description}
              onChange={e => setNewProduct({...newProduct, description: e.target.value})}
              required
            />
            <input
              type="file"
              accept="image/*"
              className="input-field"
              onChange={e => setNewProductFile(e.target.files?.[0] ?? null)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Publish Product</button>
          </form>
        </div>
      )}

      {editingProduct && (
        <div className="card mb-6" style={{ border: '1px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Edit Product: {editingProduct.name}</h3>
          <form onSubmit={handleUpdatePrice} style={{ display: 'grid', gap: '1rem', maxWidth: '520px' }}>
            <input 
              type="text" 
              className="input-field" 
              value={editingProduct.name}
              onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
              required
            />
            <input 
              type="number" 
              step="0.01"
              className="input-field" 
              value={editingProduct.price}
              onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
              required
            />
            <select
              className="input-field"
              value={editingProduct.availability ?? 'AVAILABLE'}
              onChange={e => setEditingProduct({...editingProduct, availability: e.target.value})}
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
            </select>
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditingProduct(null)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="card mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} /> Your Products
          </h3>
        </div>
        
        {products.length === 0 ? (
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
                {products.map(product => (
                  <tr key={product.productId}>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td>{product.description?.substring(0, 50)}...</td>
                    <td>{product.availability ?? 'AVAILABLE'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>${product.price?.toFixed(2)}</td>
                    <td>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit2 size={14} /> Edit Product
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
