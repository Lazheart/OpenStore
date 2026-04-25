
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { PublicLayout } from './components/PublicLayout';
import HomePage from './pages/home/HomePage';
import AdminPanel from './pages/admin/AdminPanel';
import OwnerPanel from './pages/owner/OwnerPanel';
import ProfilePage from './pages/profile/ProfilePage';
import ShopLanding from './pages/shop/ShopLanding';
import CartDetailPage from './pages/cart/CartDetailPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import { ThemeProvider } from './config/ThemeConfig';
import { AuthProvider } from './config/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
          </Route>
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/shop" element={<ShopLanding />} />
          <Route path="/cart" element={<CartDetailPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/owner" element={<OwnerPanel />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
