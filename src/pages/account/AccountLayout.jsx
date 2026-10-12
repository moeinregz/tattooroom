import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useSeo } from '../../lib/seo';

export default function AccountLayout() {
  // every /account/* page is private and behind a login wall — noindex
  // covers the whole section from one place.
  useSeo({ title: 'حساب کاربری', path: '/account', noindex: true });

  const { profile, logout } = useCustomerAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { to: '/account/profile', label: 'پروفایل' },
    { to: '/account/orders', label: 'سفارش‌های من' },
    { to: '/account/wishlist', label: 'علاقه‌مندی‌ها' },
    { to: '/account/addresses', label: 'آدرس‌ها' },
  ];

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="crumbs"><Link to="/">خانه</Link> / حساب کاربری</div>
          <h1>سلام {profile?.name || ''} 👋</h1>
          <p>
            {profile?.points || 0} امتیاز وفاداری داری
            {profile?.createdAt && ` — از ${new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(new Date(profile.createdAt))} همراه ما بودی`}
          </p>
        </div>
      </section>

      <section className="light-sec">
        <div className="wrap">
          <div className="account-shell">
            <aside className="account-nav">
              {tabs.map((t) => (
                <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                  {t.label}
                </NavLink>
              ))}
              <Link to="/cart">سبد خرید</Link>
              <button type="button" className="account-logout" onClick={handleLogout}>خروج از حساب</button>
            </aside>
            <div className="account-content">
              <Outlet />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
