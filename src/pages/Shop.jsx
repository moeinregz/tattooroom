import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import { useSeo } from '../lib/seo';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'همه';
  const search = searchParams.get('search') || '';

  // search-result and filtered pages (?search=..., ?category=...) get
  // noindex: they're near-duplicates of /shop with no unique content of
  // their own, so indexing them would just create duplicate-content noise.
  useSeo({
    title: category !== 'همه' ? `فروشگاه — ${category}` : 'فروشگاه',
    description: 'محصولات تخصصیِ مراقبت و ترمیمِ تتو و آرایش دائم؛ رنگ، دستگاه، بی‌حسی و ریموور.',
    path: '/shop',
    noindex: Boolean(search) || category !== 'همه',
  });

  useEffect(() => {
    setLoading(true);
    api
      .getProducts()
      .then(setProducts)
      .catch(() => setError('در دریافت محصولات مشکلی پیش اومد.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['همه', ...set];
  }, [products]);

  const setCategory = (c) => {
    const next = new URLSearchParams(searchParams);
    if (c === 'همه') next.delete('category');
    else next.set('category', c);
    setSearchParams(next);
  };

  const setSearch = (v) => {
    const next = new URLSearchParams(searchParams);
    if (!v) next.delete('search');
    else next.set('search', v);
    setSearchParams(next);
  };

  const filtered = products.filter((p) => {
    const matchesCategory = category === 'همه' || p.category === category;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="crumbs"><Link to="/">خانه</Link> / فروشگاه</div>
          <h1>فروشگاه محصولات TattooRoom</h1>
          <p>محصولات تخصصیِ مراقبت و ترمیمِ تتو و آرایش دائم.</p>
        </div>
      </section>

      <section className="light-sec">
        <div className="wrap">
          <div className="shop-toolbar">
            <div className="shop-filters">
              {categories.map((c) => (
                <button
                  key={c}
                  className={`chip ${category === c ? 'active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="shop-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="جستجوی محصول..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && <p className="state-msg">در حال بارگذاری محصولات...</p>}
          {error && <p className="state-msg">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="state-msg">محصولی با این مشخصات پیدا نشد.</p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="shop-grid">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
