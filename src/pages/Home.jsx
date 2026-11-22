import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { useSeo } from '../lib/seo';

export default function Home() {
  useSeo({
    path: '/',
    description:
      'TattooRoom؛ استودیوی لوکس تتو و آرایش دائم به‌همراه فروشگاه تخصصیِ رنگ تتو، دستگاه، بی‌حسی و محصولات مراقبت پس از تتو.',
  });

  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.getProducts().then((list) => setProducts(list.slice(0, 6))).catch(() => setProducts([]));
  }, []);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="v-hero" id="home">
        <div className="v-hero-bg" aria-hidden="true"></div>
        <div className="v-hero-content">
          <div className="v-tag">TATTOOROOM / LUXURY STUDIO</div>
          <h1>هنری که<br /><span>می‌ماند.</span></h1>
          <p className="v-desc">
            استودیوی لوکس تتو و آرایش دائم؛ طراحی اختصاصی، بهداشت کامل و فروشگاهی برای هر چیزی که تتوی تو لازم دارد.
          </p>
          <Link className="btn" to="/shop">ورود به فروشگاه</Link>
        </div>
      </section>

      {/* ============ COLLECTION ============ */}
      <section className="v-section" id="collection">
        <div className="v-section-head">
          <h2>منتخب فروشگاه</h2>
          <Link to="/shop">THE ART OF PERMANENT INK</Link>
        </div>
        {products.length === 0 ? (
          <p className="state-msg">هنوز محصولی ثبت نشده.</p>
        ) : (
          <div className="v-gallery">
            {products.map((p) => (
              <Link key={p.id} to={`/product/${p.slug || p.id}`} className="v-item">
                <div className="v-item-img">
                  {p.image && <img src={imageUrl(p.image)} alt={p.name} loading="lazy" />}
                </div>
                <h3>{p.name}</h3>
                <p>{p.category}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ============ ABOUT ============ */}
      <section className="v-about" id="about">
        <div className="v-about-img" aria-hidden="true"><span>T.</span></div>
        <div className="v-about-content">
          <div className="v-tag">ABOUT OUR STUDIO</div>
          <h2>زیبایی در جزئیات است.</h2>
          <p>
            ما باور داریم تتو فقط یک طرح نیست؛ بخشی از شخصیت و داستان شماست. طراحی اختصاصی، بهداشت کامل و
            سادگی، هویت اصلی کار ماست.
          </p>
        </div>
      </section>
    </>
  );
}
