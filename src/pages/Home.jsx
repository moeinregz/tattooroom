import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import ProductCard from '../components/ProductCard';
import { useSeo } from '../lib/seo';

function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
}

const SHOWCASE_CATEGORIES = ['رنگ تتو', 'دستگاه تتو', 'ریموور'];

const testimonials = [
  {
    text: 'دقتِ کارشون فوق‌العاده‌ست. قبل از شروع، کل طرح رو باهام مشورت کردن و نتیجه دقیقا همون چیزی شد که می‌خواستم.',
    name: 'سارا احمدی',
    role: 'تتو ساعد',
    initials: 'س.ا',
  },
  {
    text: 'آرایش دائم ابروم رو اینجا انجام دادم، طبیعی‌ترین نتیجه‌ای بود که تا حالا دیدم. محیط هم خیلی تمیز و آروم بود.',
    name: 'مینا کریمی',
    role: 'آرایش دائم ابرو',
    initials: 'م.ک',
  },
  {
    text: 'یه تتوی قدیمی داشتم که ازش راضی نبودم، اینجا با یه طرح جدید کاملا کاورش کردن. حرفه‌ای و بی‌نظیر.',
    name: 'علی رضایی',
    role: 'کاورآپ',
    initials: 'ع.ر',
  },
];

// generic icon shapes cycled deterministically across categories so every
// category card gets an icon without needing per-category art from the admin.
const CATEGORY_ICON_POOL = [
  <path key="1" d="M12 2c4 5 7 9 7 13a7 7 0 1 1-14 0c0-4 3-8 7-13Z" />,
  <path key="2" d="M6 3h12l-1 5H7ZM7 8l1 13h8l1-13M9 8v13M15 8v13" />,
  <path key="3" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />,
  <path key="4" d="M4 16 L14 6 Q17 3 19 5 Q21 7 18 10 L8 20 Z" />,
  <><circle key="5a" cx="12" cy="12" r="9" /><path key="5b" d="M9 12l2 2 4-4" /></>,
  <path key="6" d="M4 4h16v5H4zM6 9v11h12V9M10 13h4" />,
  <><circle key="7a" cx="12" cy="12" r="9" /><path key="7b" d="M8.5 12h7M12 8.5v7" /></>,
  <path key="8" d="M3 7h11v8H3zM14 10h4l3 3v2h-7v-5ZM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
];

function getCategoryIcon(name) {
  const seed = String(name).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return CATEGORY_ICON_POOL[seed % CATEGORY_ICON_POOL.length];
}

const SHOP_TRUST = [
  {
    title: 'ضمانت اصالت کالا',
    desc: 'تمام محصولات با ضمانت اصالت و پلمپ اصلی ارسال می‌شن.',
    icon: <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />,
  },
  {
    title: 'ارسال سریع به سراسر کشور',
    desc: 'ارسال از طریق پست و تیپاکس، معمولا بین ۱ تا ۳ روز کاری.',
    icon: <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7v-5ZM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
  },
  {
    title: '۷ روز ضمانت بازگشت کالا',
    desc: 'در صورت هر مشکلی، تا ۷ روز بعد از خرید امکان مرجوعی داری.',
    icon: <path d="M4 12a8 8 0 1 1 3 6.2M4 12v5M4 12H9" />,
  },
  {
    title: 'پشتیبانی تخصصی',
    desc: 'تیم پشتیبانی‌مون همیشه برای راهنمایی و مشاوره کنارته.',
    icon: <path d="M4 13a8 8 0 0 1 16 0M4 13v4a2 2 0 0 0 2 2h1v-6H5a1 1 0 0 0-1 1Zm16 0v4a2 2 0 0 1-2 2h-1v-6h2a1 1 0 0 1 1 1Z" />,
  },
  {
    title: 'پرداخت امن و مطمئن',
    desc: 'پرداخت آنلاین با درگاه بانکی معتبر و کاملا رمزنگاری‌شده.',
    icon: <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3ZM9 12l2 2 4-4" />,
  },
];

function HomeSearch() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?search=${encodeURIComponent(q.trim())}` : '/shop');
  };

  return (
    <form className="home-search-box reveal" onSubmit={submit}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="دنبال چه محصولی می‌گردی؟ مثلاً رنگ تتو، دستگاه، بی‌حسی..."
      />
      <button type="submit" className="btn btn-solid">جستجو</button>
    </form>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="form-card reveal"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      {sent ? (
        <div className="form-error" style={{ background: 'var(--steel-tint)', color: 'var(--maserati)' }}>
          درخواستت با موفقیت ثبت شد. به‌زودی باهات تماس می‌گیریم.
        </div>
      ) : (
        <>
          <div className="form-row">
            <div className="field"><label>نام و نام‌خانوادگی</label><input type="text" placeholder="مثلاً سارا احمدی" required /></div>
            <div className="field"><label>شماره تماس</label><input type="tel" placeholder="09xxxxxxxxx" required /></div>
          </div>
          <div className="form-row">
            <div className="field full">
              <label>نوع خدمت</label>
              <select>
                <option>تتو دائم</option>
                <option>آرایش دائم ابرو</option>
                <option>خط چشم و لب دائم</option>
                <option>ترمیم و کاورآپ</option>
                <option>مشاوره عمومی</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field full"><label>توضیحات</label><textarea placeholder="ایده یا سوالت رو اینجا بنویس..."></textarea></div>
          </div>
          <button type="submit" className="btn btn-solid">
            ارسال درخواست
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </>
      )}
    </form>
  );
}

export default function Home() {
  useSeo({
    path: '/',
    description:
      'TattooRoom؛ استودیوی لوکس تتو و آرایش دائم به‌همراه فروشگاه تخصصیِ رنگ تتو، دستگاه، بی‌حسی و محصولات مراقبت پس از تتو.',
  });

  const [allProducts, setAllProducts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [ti, setTi] = useState(0);

  useEffect(() => {
    api.getProducts().then(setAllProducts).catch(() => setAllProducts([]));
    api.getArticles().then((list) => setArticles(list.slice(0, 3))).catch(() => setArticles([]));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTi((i) => (i + 1) % testimonials.length), 5500);
    return () => clearInterval(id);
  }, []);

  const featured = useMemo(() => allProducts.slice(0, 4), [allProducts]);

  const [showcaseTab, setShowcaseTab] = useState(0);
  const showcaseGroups = useMemo(
    () =>
      SHOWCASE_CATEGORIES.map((cat) => ({
        cat,
        products: allProducts.filter((p) => p.category === cat).slice(0, 3),
      })),
    [allProducts]
  );
  const activeShowcase = showcaseGroups[showcaseTab] || { cat: '', products: [] };

  const newest = useMemo(
    () =>
      [...allProducts]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 4),
    [allProducts]
  );

  const categories = useMemo(() => {
    const map = new Map();
    allProducts.forEach((p) => {
      if (!p.category) return;
      map.set(p.category, (map.get(p.category) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [allProducts]);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero-section" id="top">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-blob a"></div>
          <div className="hero-blob b"></div>
          <div className="dot-pattern"></div>
        </div>

        <div className="wrap hero-grid">
          <div className="hero-copy on-blue reveal">
            <span className="hero-tag"><i></i> فروشگاه تخصصی لوازم و مراقبت تتو</span>
            <h1 className="h-display">هرچی برای تتوت<br />لازم داری، <em>اینجاست</em></h1>
            <p className="lede">
              از رنگ و دستگاه تا بی‌حسی و محصولات مراقبتی؛ همه با ضمانت اصالت کالا، بسته‌بندی استاندارد و
              ارسال سریع به سراسر کشور.
            </p>

            <HomeSearch />

            <div className="hero-quick-cats">
              <span>پرطرفدار:</span>
              {['رنگ تتو', 'دستگاه تتو', 'بی‌حسی', 'ریموور'].map((t) => (
                <Link key={t} to={`/shop?search=${encodeURIComponent(t)}`}>{t}</Link>
              ))}
            </div>

            <div className="hero-ctas">
              <Link to="/shop" className="btn btn-light">
                ورود به فروشگاه
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <a href="#contact" className="btn btn-ghost-blue">رزرو مشاوره حضوری</a>
            </div>

            <div className="hero-trust-mini">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7v-5ZM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /></svg>
                ارسال سریع
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" /></svg>
                ضمانت اصالت کالا
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12a8 8 0 1 1 3 6.2M4 12v5M4 12H9" /></svg>
                ۷ روز ضمانت بازگشت
              </span>
            </div>
          </div>

          <div className="hero-showcase reveal">
            <div className="showcase-card">
              <div className="showcase-tabs">
                {showcaseGroups.map((g, i) => (
                  <button
                    key={g.cat}
                    type="button"
                    className={i === showcaseTab ? 'active' : ''}
                    onClick={() => setShowcaseTab(i)}
                  >
                    {g.cat}
                  </button>
                ))}
              </div>

              {activeShowcase.products.length === 0 ? (
                <div className="spotlight-empty">به‌زودی محصولات این دسته اینجا نمایش داده می‌شن.</div>
              ) : (
                <div className="showcase-list">
                  {activeShowcase.products.map((p) => (
                    <Link key={p.id} to={`/product/${p.slug || p.id}`} className="showcase-item">
                      <span className="showcase-thumb">
                        {p.image ? (
                          <img src={imageUrl(p.image)} alt={p.name} />
                        ) : (
                          <svg viewBox="0 0 100 140" fill="none">
                            <rect x="20" y="46" width="60" height="70" rx="14" fill="#2c5578" />
                            <rect x="32" y="20" width="36" height="34" rx="8" fill="#9fc0d6" />
                          </svg>
                        )}
                      </span>
                      <span className="showcase-info">
                        <span className="showcase-name">{p.name}</span>
                        <span className="showcase-price">{formatPrice(p.price)}</span>
                      </span>
                      <svg className="showcase-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}

              <Link to={`/shop?category=${encodeURIComponent(activeShowcase.cat)}`} className="btn btn-solid showcase-more">
                مشاهده همه {activeShowcase.cat}
              </Link>
            </div>
            <div className="hero-float-chip">
              <b>+2400</b>
              <span>مشتری راضی</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="marquee-strip">
        <div className="marquee-track">
          <span>تتو دائم <i></i> آرایش دائم ابرو <i></i> میکروبلیدینگ <i></i> کاورآپ حرفه‌ای <i></i> طراحی اختصاصی <i></i> استودیوی لوکس</span>
          <span>تتو دائم <i></i> آرایش دائم ابرو <i></i> میکروبلیدینگ <i></i> کاورآپ حرفه‌ای <i></i> طراحی اختصاصی <i></i> استودیوی لوکس</span>
        </div>
      </div>

      {/* ============ CATEGORIES (blue cards, special border) ============ */}
      <section className="light-sec cat-sec" id="categories">
        <div className="wrap">
          {categories.length === 0 ? (
            <p className="lede" style={{ textAlign: 'center', margin: '0 auto' }}>هنوز محصولی ثبت نشده.</p>
          ) : (
            <div className="cat-card-grid reveal-stagger">
              {categories.map((c) => (
                <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="cat-card2">
                  <span className="cat-card2-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      {getCategoryIcon(c.name)}
                    </svg>
                  </span>
                  <span className="cat-card2-name">{c.name}</span>
                  <span className="cat-card2-count">{new Intl.NumberFormat('fa-IR').format(c.count)} محصول</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS (right after categories) ============ */}
      <section className="light-sec alt" id="products">
        <div className="wrap">
          <div className="card-outer">
            <div className="card-peek"></div>
            <div className="brand-card">
              <div className="dot-pattern"></div>
              <span className="watermark" style={{ top: '-4%', right: '-2%', transform: 'rotate(5deg)' }}>Featured</span>
              <div className="section-head on-blue reveal" style={{ position: 'relative', zIndex: 2 }}>
                <span className="kicker">محصولات ویژه</span>
                <h2 className="h-section">پرطرفدارترینِ فروشگاه</h2>
                <p className="lede">انتخاب‌هایی که بیشترین اعتماد مشتری‌های TattooRoom رو داشتن.</p>
              </div>

              {featured.length === 0 ? (
                <p className="lede" style={{ position: 'relative', zIndex: 2 }}>
                  هنوز محصولی ثبت نشده. از داشبورد اولین محصول رو اضافه کن.
                </p>
              ) : (
                <div className="prod-grid reveal-stagger">
                  {featured.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}

              <div className="prod-more reveal">
                <Link to="/shop" className="btn btn-light">مشاهده همه محصولات</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section className="light-sec" id="about">
        <div className="wrap about-grid">
          <div className="about-visual reveal">
            <div className="about-ring-deco"></div>
            <div className="about-frame">
              <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#dcebf3" />
                    <stop offset="100%" stopColor="#7fa4bd" />
                  </linearGradient>
                </defs>
                <rect width="400" height="500" fill="url(#skinGrad)" />
                <g fill="none" stroke="#2c5578" strokeWidth="1.4" opacity=".5">
                  <path d="M120,340 C110,300 130,260 100,230 C140,240 150,190 130,160 C170,175 190,130 175,90 C210,110 230,80 220,50" />
                  <circle cx="220" cy="50" r="4" fill="#2c5578" />
                  <path d="M260,380 C290,360 300,320 270,300 C300,290 310,250 280,230" />
                  <circle cx="280" cy="230" r="4" fill="#d9788f" />
                </g>
                <g stroke="#2c5578" strokeWidth="1" opacity=".12">
                  <line x1="0" y1="120" x2="400" y2="120" />
                  <line x1="0" y1="240" x2="400" y2="240" />
                  <line x1="0" y1="360" x2="400" y2="360" />
                </g>
              </svg>
            </div>
            <div className="about-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 2 15 9l7 1-5 5 1.5 7L12 18l-6.5 4L7 15 2 10l7-1Z" />
              </svg>
              <div><b>+9 سال</b><span>تجربه‌ی هنرمندان تیم</span></div>
            </div>
          </div>
          <div className="about-copy reveal">
            <span className="kicker">درباره TattooRoom</span>
            <h2 className="h-section">استودیویی که با پوستِ تو با احترام رفتار می‌کنه</h2>
            <p className="lede">
              TattooRoom از دلِ عشق به دقت و زیبایی شکل گرفته؛ فضایی خصوصی و لوکس که در اون هر طرح، قبل از اجرا با
              خودِ مشتری طراحی و تایید می‌شه.
            </p>
            <p>
              تیم ما ترکیبی از هنرمندانِ باتجربه‌ی تتو و متخصصانِ آرایش دائمه که با استانداردهای بهداشتی روز دنیا کار
              می‌کنن؛ از استریلیزاسیون کامل ابزار تا مشاوره‌ی تخصصی رنگ و طرح متناسب با پوست و چهره‌ی هر فرد.
            </p>
            <ul className="about-list">
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <div><b>بهداشت و استریل کامل</b><p>ابزار یک‌بارمصرف و استریلیزاسیون استاندارد در هر جلسه</p></div>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 20l9-5-9-5-9 5 9 5Z" />
                  <path d="M3 10l9-5 9 5" />
                </svg>
                <div><b>طراحی صد‌درصد اختصاصی</b><p>هر طرح مخصوص همون مشتری کشیده و تایید می‌شه</p></div>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21c-4-4-8-7.58-8-12A8 8 0 0 1 12 3a8 8 0 0 1 8 6c0 4.42-4 8-8 12Z" />
                </svg>
                <div><b>فضایی خصوصی و لوکس</b><p>محیطی آرام برای تجربه‌ای بدون استرس و کاملا شخصی</p></div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="light-sec" id="services">
        <div className="wrap">
          <div className="card-outer">
            <div className="card-peek"></div>
            <div className="brand-card">
              <div className="dot-pattern"></div>
              <span className="watermark" style={{ bottom: '-6%', left: '-2%', transform: 'rotate(-4deg)' }}>Services</span>
              <div className="section-head on-blue reveal" style={{ position: 'relative', zIndex: 2 }}>
                <span className="kicker">خدمات ما</span>
                <h2 className="h-section">هر آنچه برای زیباییِ ماندگار لازمه</h2>
              </div>
              <div className="svc-grid reveal-stagger">
                {[
                  { icon: <path d="M4 16 L14 6 Q17 3 19 5 Q21 7 18 10 L8 20 Z" />, title: 'تتو دائم', desc: 'از طرح‌های ظریف و مینیمال تا کارهای بزرگ و کاورآپ؛ با سوزن‌های استریل و رنگ‌های درجه‌یک.' },
                  { icon: <path d="M3 15c3-8 8-11 11-11 1 3-1 6-3 7 3-1 6 1 6 4-4-2-9-2-14 0Z" />, title: 'آرایش دائم ابرو', desc: 'میکروبلیدینگ و کامبو با طراحی متناسب با فرم صورت، برای ابروهایی طبیعی و پرپشت.' },
                  { icon: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.4" /></>, title: 'خط چشم و لب دائم', desc: 'حجم و رنگ طبیعی برای چشم و لب، با متدهای گیاهی و کم‌تهاجم.' },
                  { icon: <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />, title: 'ترمیم و کاورآپ', desc: 'پوشش و بازطراحی تتوهای قدیمی با طرح‌های جدید و هماهنگ با پوست.' },
                  { icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>, title: 'مشاوره‌ی اختصاصی', desc: 'جلسه‌ی مشاوره‌ی رایگان قبل از هر کار، برای انتخاب بهترین طرح، رنگ و اندازه.' },
                  { icon: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />, title: 'مراقبت پس از تتو', desc: 'راهنمای کامل و محصولات تخصصی برای بهبود سریع و ماندگاری بهترِ رنگ.' },
                ].map((s, i) => (
                  <div className="svc-card" key={s.title}>
                    <span className="svc-num">{String(i + 1).padStart(2, '0')}</span>
                    <div className="svc-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{s.icon}</svg>
                    </div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURE STRIP ============ */}
      <div className="light-sec alt">
        <div className="wrap">
          <div className="feat-strip reveal">
            <div className="feat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
              <b>گواهی بهداشت</b><span>استاندارد وزارت بهداشت</span>
            </div>
            <div className="feat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 21c-4-4-8-7.58-8-12A8 8 0 0 1 12 3a8 8 0 0 1 8 6c0 4.42-4 8-8 12Z" /></svg>
              <b>فضای خصوصی</b><span>یک مشتری در هر نوبت</span>
            </div>
            <div className="feat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2 15 9l7 1-5 5 1.5 7L12 18l-6.5 4L7 15 2 10l7-1Z" /></svg>
              <b>هنرمندان حرفه‌ای</b><span>+9 سال تجربه</span>
            </div>
            <div className="feat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>
              <b>ضمانت کیفیت</b><span>پیگیری تا بهبود کامل</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ NEWEST ARRIVALS ============ */}
      <section className="light-sec" id="new-arrivals">
        <div className="wrap">
          <div className="card-outer">
            <div className="card-peek"></div>
            <div className="brand-card">
              <div className="dot-pattern"></div>
              <span className="watermark" style={{ top: '-4%', right: '-2%', transform: 'rotate(5deg)' }}>New</span>
              <div className="section-head on-blue reveal" style={{ position: 'relative', zIndex: 2 }}>
                <span className="kicker">تازه‌ترین‌ها</span>
                <h2 className="h-section">جدیدترین محصولات فروشگاه</h2>
                <p className="lede">تازه‌ترین محصولاتی که به فروشگاه اضافه شدن رو از دست نده.</p>
              </div>

              {newest.length === 0 ? (
                <p className="lede" style={{ position: 'relative', zIndex: 2 }}>
                  هنوز محصولی ثبت نشده. از داشبورد اولین محصول رو اضافه کن.
                </p>
              ) : (
                <div className="prod-grid reveal-stagger">
                  {newest.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}

              <div className="prod-more reveal">
                <Link to="/shop" className="btn btn-light">مشاهده همه محصولات</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ARTICLES / BLOG ============ */}
      <section className="light-sec alt" id="articles">
        <div className="wrap">
          <div className="section-head center reveal">
            <span className="kicker">مجله TattooRoom</span>
            <h2 className="h-section">مقاله‌ها و راهنمای مراقبت</h2>
          </div>

          {articles.length === 0 ? (
            <p className="lede" style={{ textAlign: 'center', margin: '0 auto' }}>به‌زودی اولین مقاله منتشر می‌شه.</p>
          ) : (
            <>
              <div className="article-grid reveal-stagger">
                {articles.map((a) => (
                  <Link key={a.id} to={`/blog/${a.slug}`} className="article-card">
                    <div className="article-cover">
                      {a.coverImage ? (
                        <img src={imageUrl(a.coverImage)} alt={a.title} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <path d="M12 2c4 5 7 9 7 13a7 7 0 1 1-14 0c0-4 3-8 7-13Z" />
                        </svg>
                      )}
                    </div>
                    <div className="article-body">
                      <span className="article-tag">{a.tag}</span>
                      <h3>{a.title}</h3>
                      <p>{a.excerpt}</p>
                      <div className="article-meta">
                        <span>{new Intl.DateTimeFormat('fa-IR', { month: 'long', day: 'numeric' }).format(new Date(a.createdAt))}</span>
                        <span>{a.readTime} دقیقه مطالعه</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="prod-more reveal">
                <Link to="/blog" className="btn btn-solid">مشاهده همه مقالات</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ============ SHOP TRUST ============ */}
      <section className="light-sec" id="shop-trust">
        <div className="wrap">
          <div className="section-head center reveal">
            <span className="kicker">چرا TattooRoom؟</span>
            <h2 className="h-section">خیالت از خرید راحت باشه</h2>
          </div>
          <div className="trust-section-grid reveal-stagger">
            {SHOP_TRUST.map((t) => (
              <div className="trust-section-card" key={t.title}>
                <span className="trust-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">{t.icon}</svg>
                </span>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ============ TESTIMONIALS ============ */}
      <section className="light-sec alt" id="testimonials">
        <div className="wrap">
          <div className="section-head center reveal">
            <span className="kicker">نظرات مشتریان</span>
            <h2 className="h-section">تجربه‌ی کسانی که به ما اعتماد کردن</h2>
          </div>
          <div className="testi-wrap reveal">
            <div className="testi-quote">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 6c-3 2-4 5-4 8a4 4 0 0 0 4 4 4 4 0 0 0 0-8c0-2 1-3 2-4L7 6Zm10 0c-3 2-4 5-4 8a4 4 0 0 0 4 4 4 4 0 0 0 0-8c0-2 1-3 2-4l-2-0Z" />
              </svg>
            </div>
            {testimonials.map((t, i) => (
              <div className={`testi-slide ${i === ti ? 'active' : ''}`} key={t.name}>
                <p className="testi-text">{t.text}</p>
                <div className="testi-stars">★★★★★</div>
                <div className="testi-person">
                  <div className="testi-avatar">{t.initials}</div>
                  <div><b>{t.name}</b><span>{t.role}</span></div>
                </div>
              </div>
            ))}
            <div className="testi-dots">
              {testimonials.map((t, i) => (
                <button key={t.name} className={i === ti ? 'active' : ''} onClick={() => setTi(i)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section className="light-sec" id="contact">
        <div className="wrap">
          <div className="card-outer">
            <div className="card-peek"></div>
            <div className="brand-card">
              <div className="dot-pattern"></div>
              <span className="watermark" style={{ bottom: '-8%', right: '-2%', transform: 'rotate(-3deg)' }}>Contact</span>
              <div className="contact-grid">
                <div className="contact-info on-blue reveal">
                  <span className="kicker">تماس با ما</span>
                  <h2 className="h-section">وقتِ مشاوره‌ی رایگانت رو رزرو کن</h2>
                  <p className="lede">فرم رو پر کن تا تیم TattooRoom در سریع‌ترین زمان باهات تماس بگیره.</p>
                  <div className="cinfo-row phone">
                    <span className="ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <div><b>09129234145</b><span>پاسخگویی همه‌روزه، ۱۰ صبح تا ۹ شب</span></div>
                  </div>
                  <div className="cinfo-row">
                    <span className="ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <div><b>استودیو TattooRoom</b><span>آدرس دقیق پس از هماهنگی تلفنی</span></div>
                  </div>
                  <div className="social-row">
                    <a href="#" aria-label="اینستاگرام"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg></a>
                    <a href="#" aria-label="تلگرام"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4Z" /></svg></a>
                    <a href="tel:09129234145" aria-label="تماس"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg></a>
                  </div>
                </div>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
