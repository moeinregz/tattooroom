import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const STATUS_LABELS = {
  pending: 'در انتظار تایید',
  confirmed: 'تایید شده',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  cancelled: 'لغو شده',
};

function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api.getMyOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="state-msg">در حال بارگذاری سفارش‌ها...</p>;

  if (orders.length === 0) {
    return (
      <div className="account-card">
        <h2>سفارش‌های من</h2>
        <p className="state-msg">هنوز سفارشی ثبت نکردی.</p>
      </div>
    );
  }

  return (
    <div className="account-card">
      <h2>سفارش‌های من</h2>
      <div className="order-list">
        {orders.map((o) => (
          <div key={o.id} className="order-row">
            <button type="button" className="order-row-head" onClick={() => setOpenId(openId === o.id ? null : o.id)}>
              <div>
                <span className="order-id">سفارش #{o.id.slice(-6)}</span>
                <span className="order-date">{formatDate(o.createdAt)}</span>
              </div>
              <span className={`status-badge order-status-${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span>
              <span className="order-total">{formatPrice(o.total)}</span>
            </button>
            {openId === o.id && (
              <div className="order-items">
                {o.items.map((it) => (
                  <div key={it.productId} className="order-item">
                    <span>{it.name}</span>
                    <span>{it.qty} عدد</span>
                    <span>{formatPrice(it.lineTotal)}</span>
                  </div>
                ))}
                {o.address && (
                  <div className="order-address">
                    آدرس: {o.address.city} — {o.address.address}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
