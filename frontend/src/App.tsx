
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import HomePage from './pages/home/HomePage';
import AdminPanel from './pages/admin/AdminPanel';
import OwnerPanel from './pages/owner/OwnerPanel';
import ProfilePage from './pages/profile/ProfilePage';
import ShopLanding from './pages/shop/ShopLanding';
import { ThemeProvider } from './config/ThemeConfig';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="owner" element={<OwnerPanel />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="/shop" element={<ShopLanding />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
