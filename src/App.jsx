import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Cart from './pages/Cart';
import NotFound from './pages/NotFound';

import AccountLogin from './pages/account/Login';
import AccountRegister from './pages/account/Register';
import AccountLayout from './pages/account/AccountLayout';
import Profile from './pages/account/Profile';
import Orders from './pages/account/Orders';
import Wishlist from './pages/account/Wishlist';
import Addresses from './pages/account/Addresses';

import DashboardLogin from './pages/dashboard/DashboardLogin';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import ProductList from './pages/dashboard/ProductList';
import ProductForm from './pages/dashboard/ProductForm';
import ArticleList from './pages/dashboard/ArticleList';
import ArticleForm from './pages/dashboard/ArticleForm';
import OrderList from './pages/dashboard/OrderList';

export default function App() {
  return (
    <Routes>
      {/* public site */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
      <Route path="/product/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
      <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
      <Route path="/blog/:slug" element={<PublicLayout><BlogPost /></PublicLayout>} />
      <Route
        path="/cart"
        element={
          <PublicLayout>
            <CustomerProtectedRoute>
              <Cart />
            </CustomerProtectedRoute>
          </PublicLayout>
        }
      />

      {/* customer account */}
      <Route path="/account/login" element={<PublicLayout><AccountLogin /></PublicLayout>} />
      <Route path="/account/register" element={<PublicLayout><AccountRegister /></PublicLayout>} />
      <Route
        path="/account"
        element={
          <PublicLayout>
            <CustomerProtectedRoute>
              <AccountLayout />
            </CustomerProtectedRoute>
          </PublicLayout>
        }
      >
        <Route index element={<Profile />} />
        <Route path="profile" element={<Profile />} />
        <Route path="orders" element={<Orders />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="addresses" element={<Addresses />} />
      </Route>

      {/* dashboard */}
      <Route path="/dashboard/login" element={<DashboardLogin />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="articles" element={<ArticleList />} />
        <Route path="articles/new" element={<ArticleForm />} />
        <Route path="articles/:id/edit" element={<ArticleForm />} />
        <Route path="orders" element={<OrderList />} />
      </Route>

      {/* unknown routes get a real 404 page (noindex) instead of silently
          rendering Home — showing Home for any bad URL would make search
          engines treat every typo'd/removed link as duplicate homepage
          content */}
      <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
    </Routes>
  );
}
