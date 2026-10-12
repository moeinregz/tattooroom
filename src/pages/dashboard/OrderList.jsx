import { Fragment, useEffect, useState } from 'react';
import { api } from '../../api/client';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'در انتظار تایید' },
  { value: 'confirmed', label: 'تایید شده' },
  { value: 'shipped', label: 'ارسال شده' },
  { value: 'delivered', label: 'تحویل داده شده' },
  { value: 'cancelled', label: 'لغو شده' },
];

function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api.getAllOrders().then(setOrders).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await api.setOrderStatus(id, status);
      setOrders((list) => list.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="dash-head">
        <h1>سفارش‌های فروشگاه</h1>
      </div>

      {loading && <p className="state-msg">در حال بارگذاری...</p>}
      {error && <p className="state-msg">{error}</p>}
      {!loading && !error && orders.length === 0 && <p className="state-msg">هنوز سفارشی ثبت نشده.</p>}

      {!loading && !error && orders.length > 0 && (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>شماره</th>
                <th>مشتری</th>
                <th>مبلغ</th>
                <th>تاریخ</th>
                <th>وضعیت</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr>
                    <td>#{o.id.slice(-6)}</td>
                    <td>{o.customerName} — {o.customerPhone}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>
                      <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => setOpenId(openId === o.id ? null : o.id)}>
                        {openId === o.id ? 'بستن' : 'جزئیات'}
                      </button>
                    </td>
                  </tr>
                  {openId === o.id && (
                    <tr>
                      <td colSpan={6}>
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
                              آدرس: {o.address.province ? `${o.address.province}، ` : ''}{o.address.city} — {o.address.address}
                              {o.address.postalCode && ` (کدپستی: ${o.address.postalCode})`}
                            </div>
                          )}
                          {o.note && <div className="order-address">یادداشت: {o.note}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
