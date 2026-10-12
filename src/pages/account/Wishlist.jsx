import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import ProductCard from '../../components/ProductCard';

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyWishlist().then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="account-card">
      <h2>علاقه‌مندی‌های من</h2>
      {loading && <p className="state-msg">در حال بارگذاری...</p>}
      {!loading && products.length === 0 && (
        <p className="state-msg">هنوز محصولی رو به علاقه‌مندی‌ها اضافه نکردی — روی آیکون قلب هر محصول بزن.</p>
      )}
      {!loading && products.length > 0 && (
        <div className="prod-grid account-wishlist-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
