import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useSeo } from '../lib/seo';

function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
}

export default function Cart() {
  // account/cart pages are per-user, have no unique public content, and
  // require login — keeping them out of the index avoids duplicate/empty
  // pages showing up in search results.
  useSeo({ title: 'سبد خرید', path: '/cart', noindex: true });

  const { profile, refreshCartCount } = useCustomerAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [addressId, setAddressId] = useState('');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.getCart().then(setCart).catch(() => setCart({ items: [], subtotal: 0, count: 0 })).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeQty = async (productId, qty) => {
    const updated = await api.setCartItemQty(productId, qty);
    setCart(updated);
    refreshCartCount();
  };

  const removeItem = async (productId) => {
    const updated = await api.removeCartItem(productId);
    setCart(updated);
    refreshCartCount();
  };

  const handleCheckout = async () => {
    setError('');
    const addresses = profile?.addresses || [];
    if (addresses.length > 0 && !addressId) {
      setError('یک آدرس برای ارسال انتخاب کن.');
      return;
    }
    setPlacing(true);
    try {
      const order = await api.checkout({ addressId: addressId || undefined, note });
      await refreshCartCount();
      navigate('/account/orders', { state: { justPlaced: order.id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <section className="light-sec" style={{ paddingTop: 150 }}>
        <div className="wrap"><p className="state-msg">در حال بارگذاری سبد خرید...</p></div>
      </section>
    );
  }

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="crumbs"><Link to="/">خانه</Link> / سبد خرید</div>
          <h1>سبد خرید</h1>
        </div>
      </section>

      <section className="light-sec">
        <div className="wrap">
          {cart.items.length === 0 ? (
            <div className="cart-empty">
              <p className="state-msg">سبد خریدت خالیه.</p>
              <Link to="/shop" className="btn btn-solid">رفتن به فروشگاه</Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {cart.items.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item-media">
                      {item.image ? (
                        <img src={imageUrl(item.image)} alt={item.name} />
                      ) : (
                        <svg viewBox="0 0 100 140" fill="none">
                          <rect x="20" y="46" width="60" height="70" rx="14" fill="#2c5578" />
                          <rect x="32" y="20" width="36" height="34" rx="8" fill="#9fc0d6" />
                        </svg>
                      )}
                    </div>
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">{formatPrice(item.price)}</span>
                    </div>
                    <div className="cart-qty">
                      <button type="button" onClick={() => changeQty(item.productId, item.qty - 1)}>−</button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => changeQty(item.productId, item.qty + 1)}>+</button>
                    </div>
                    <div className="cart-item-total">{formatPrice(item.lineTotal)}</div>
                    <button type="button" className="cart-remove" onClick={() => removeItem(item.productId)} aria-label="حذف">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <h3>خلاصه سفارش</h3>
                <div className="cart-summary-row">
                  <span>جمع کل ({cart.count} کالا)</span>
                  <b>{formatPrice(cart.subtotal)}</b>
                </div>

                {(profile?.addresses || []).length > 0 && (
                  <div className="field">
                    <label>آدرس ارسال</label>
                    <select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                      <option value="">انتخاب کن...</option>
                      {profile.addresses.map((a) => (
                        <option key={a.id} value={a.id}>{a.title} — {a.city}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(profile?.addresses || []).length === 0 && (
                  <p className="cart-address-hint">
                    آدرسی ثبت نکردی — <Link to="/account/addresses">از اینجا یکی اضافه کن</Link>، یا بدون آدرس ثبت کن و بعداً هماهنگ می‌کنیم.
                  </p>
                )}

                <div className="field">
                  <label>یادداشت (اختیاری)</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                </div>

                {error && <div className="form-error">{error}</div>}

                <button className="btn btn-solid btn-block" onClick={handleCheckout} disabled={placing}>
                  {placing ? 'در حال ثبت سفارش...' : 'ثبت سفارش'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
