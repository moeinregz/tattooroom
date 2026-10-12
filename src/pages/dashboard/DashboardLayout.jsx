import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSeo } from '../../lib/seo';

export default function DashboardLayout() {
  // the whole admin dashboard is private and behind login — never index it.
  useSeo({ title: 'داشبورد مدیریت', path: '/dashboard', noindex: true });

  const { username, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isProductsActive = location.pathname === '/dashboard';
  const isArticlesActive = location.pathname.startsWith('/dashboard/articles');
  const isOrdersActive = location.pathname.startsWith('/dashboard/orders');

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <div className="wrap">
          <Link to="/dashboard" className="brand">
            <span className="brand-mark" style={{ width: 36, height: 36 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 18, height: 18 }}>
                <path d="M4 16 L14 6 Q17 3 19 5 Q21 7 18 10 L8 20 Z" />
              </svg>
            </span>
            <span className="brand-name" style={{ fontSize: '1.05rem' }}>Tattoo<span>Room</span> داشبورد</span>
          </Link>
          <div className="dash-topbar-links">
            <Link to="/dashboard" className={isProductsActive ? 'active' : ''}>محصولات</Link>
            <Link to="/dashboard/orders" className={isOrdersActive ? 'active' : ''}>سفارش‌ها</Link>
            <Link to="/dashboard/articles" className={isArticlesActive ? 'active' : ''}>مقالات</Link>
            <Link to="/shop" target="_blank" rel="noreferrer">مشاهده فروشگاه</Link>
            <span style={{ opacity: 0.6, fontSize: '.85rem' }}>{username}</span>
            <button
              onClick={() => {
                logout();
                navigate('/dashboard/login');
              }}
            >
              خروج
            </button>
          </div>
        </div>
      </div>
      <div className="wrap dash-content">
        <Outlet />
      </div>
    </div>
  );
}
