import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, imageUrl } from '../../api/client';

function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
}

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`محصول «${name}» حذف بشه؟`)) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="dash-head">
        <h1>محصولات فروشگاه</h1>
        <Link to="/dashboard/products/new" className="btn btn-solid">+ افزودن محصول</Link>
      </div>

      {loading && <p className="state-msg">در حال بارگذاری...</p>}
      {error && <p className="state-msg">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="state-msg">هنوز محصولی ثبت نشده. روی «افزودن محصول» کلیک کن.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>تصویر</th>
                <th>نام محصول</th>
                <th>دسته‌بندی</th>
                <th>قیمت</th>
                <th>موجودی</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.image ? (
                      <img className="dash-thumb" src={imageUrl(p.image)} alt={p.name} />
                    ) : (
                      <div className="dash-thumb" />
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <div className="dash-row-actions">
                      <Link to={`/dashboard/products/${p.id}/edit`} className="icon-btn">ویرایش</Link>
                      <button className="icon-btn danger" onClick={() => handleDelete(p.id, p.name)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
