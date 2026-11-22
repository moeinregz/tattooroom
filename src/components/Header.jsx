import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthed, cartCount } = useCustomerAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

  const links = [
    { href: '/', label: 'خانه' },
    { href: '/shop', label: 'فروشگاه' },
    { href: '/blog', label: 'وبلاگ' },
    { href: '/#about', label: 'درباره ما' },
  ];

  return (
    <>
      <header id="siteHeader" className={scrolled ? 'scrolled' : ''}>
        <div className="wrap nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 16 L14 6 Q17 3 19 5 Q21 7 18 10 L8 20 Z" />
                <circle cx="17" cy="6" r="1.2" fill="currentColor" />
              </svg>
            </span>
            <span className="brand-name">Tattoo<span>Room</span></span>
          </Link>

          <nav className="nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </nav>

          <div className="nav-cta">
            <Link to="/cart" className="nav-icon-btn" aria-label="سبد خرید">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6" />
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="17" cy="20" r="1.4" />
              </svg>
              {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
            </Link>
            <Link to={isAuthed ? '/account' : '/account/login'} className="nav-icon-btn" aria-label="حساب کاربری">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.4" />
                <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
              </svg>
            </Link>
            <button
              className={`burger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="منو"
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="mm-link" onClick={() => setMenuOpen(false)}>{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="mobile-menu-foot">
          <div className="mm-account-links">
            <Link to="/cart" onClick={() => setMenuOpen(false)}>سبد خرید{cartCount > 0 ? ` (${cartCount})` : ''}</Link>
            <Link to={isAuthed ? '/account' : '/account/login'} onClick={() => setMenuOpen(false)}>
              {isAuthed ? 'حساب کاربری' : 'ورود / ثبت‌نام'}
            </Link>
          </div>
          <a className="mm-phone" href="tel:09129234145" style={{ direction: 'ltr', justifyContent: 'flex-end' }}>
            09129234145
          </a>
          <div className="mm-social">
            <a href="#" aria-label="اینستاگرام">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" />
              </svg>
            </a>
            <a href="#" aria-label="تلگرام">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
