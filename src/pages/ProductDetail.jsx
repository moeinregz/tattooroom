import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { getVoterId } from '../api/voter';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
import { useSeo, absoluteUrl } from '../lib/seo';

function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value || 0) + ' تومان';
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
}

// splits admin-authored description into sections. Lines starting with "## "
// become headings that power the auto-generated table of contents.
function parseDescriptionSections(text) {
  if (!text || !text.trim()) return [];
  const lines = text.split('\n');
  const sections = [];
  lines.forEach((line) => {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      sections.push({ title: match[1].trim(), body: [] });
    } else {
      if (!sections.length) sections.push({ title: 'معرفی محصول', body: [] });
      sections[sections.length - 1].body.push(line);
    }
  });
  return sections
    .map((s, i) => ({ id: `sec-${i}`, title: s.title, body: s.body.join('\n').trim() }))
    .filter((s) => s.body);
}

const TRUST_BADGES = [
  {
    label: 'ضمانت اصالت کالا',
    icon: <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />,
  },
  {
    label: 'ارسال سریع به سراسر کشور',
    icon: <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7v-5ZM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
  },
  {
    label: '۷ روز ضمانت بازگشت کالا',
    icon: <path d="M4 12a8 8 0 1 1 3 6.2M4 12v5M4 12H9" />,
  },
  {
    label: 'پشتیبانی تخصصی',
    icon: <path d="M4 13a8 8 0 0 1 16 0M4 13v4a2 2 0 0 0 2 2h1v-6H5a1 1 0 0 0-1 1Zm16 0v4a2 2 0 0 1-2 2h-1v-6h2a1 1 0 0 1 1 1Z" />,
  },
  {
    label: 'پرداخت امن و مطمئن',
    icon: <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3ZM9 12l2 2 4-4" />,
  },
];

// pool of generic spec-style features used as a live preview when a product
// has no admin-entered features yet — swap out once real feature data exists.
const MOCK_FEATURE_POOL = [
  { label: 'برند', value: 'اورجینال و تضمینی' },
  { label: 'کشور سازنده', value: 'وارداتی' },
  { label: 'نوع بسته‌بندی', value: 'استاندارد و بهداشتی' },
  { label: 'مناسب برای', value: 'استفاده حرفه‌ای و خانگی' },
  { label: 'تاریخ انقضا', value: 'حداقل ۱۲ ماه' },
  { label: 'رنگ', value: 'مشکی' },
  { label: 'حجم / وزن', value: '۵۰ میلی‌لیتر' },
  { label: 'گارانتی اصالت', value: 'دارد' },
  { label: 'روش استفاده', value: 'طبق دستورالعمل سازنده' },
  { label: 'استاندارد کیفیت', value: 'تایید شده' },
];

function getQuickFeatures(product) {
  if (product.features?.length) return product.features.slice(0, 5);
  const seed = String(product.id || product.name || '')
    .split('')
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 5 }, (_, i) => MOCK_FEATURE_POOL[(seed + i * 3) % MOCK_FEATURE_POOL.length]);
}

const PAYMENT_METHODS = [
  { label: 'پرداخت اینترنتی (درگاه بانکی)', icon: <path d="M3 8h18M3 8v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8M3 8l2-3h14l2 3M7 15h4" /> },
  { label: 'واریز کارت به کارت', icon: <path d="M3 6h18v12H3zM3 10h18M6 15h4" /> },
  { label: 'پرداخت در محل', icon: <path d="M12 2v20M17 5.5c0-1.6-2.2-2.5-5-2.5s-5 .9-5 2.5S9.2 8 12 8s5 .9 5 2.5S14.8 13 12 13s-5-.9-5-2.5" /> },
];

const iconWrap = (children, size = 22) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={size} height={size}>
    {children}
  </svg>
);

// ---------------------------------------------------------------------------

function ProfileBox({ customer, onIdentify, busy }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  if (customer?.phone) {
    return (
      <div className="pd-profile-box identified">
        <div className="profile-avatar">{(customer.name || 'ک').trim().charAt(0)}</div>
        <div className="profile-info">
          <div className="profile-name">{customer.name || 'کاربر تتوروم'}</div>
          <button type="button" className="profile-points-btn" onClick={() => setShowHistory((v) => !v)}>
            <span className="coin">🪙</span>
            {new Intl.NumberFormat('fa-IR').format(customer.points || 0)} امتیاز
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <path d={showHistory ? 'M18 15 12 9 6 15' : 'M6 9l6 6 6-6'} />
            </svg>
          </button>
        </div>
        {showHistory && (
          <ul className="profile-history">
            {(customer.history || []).length === 0 && <li className="empty">هنوز امتیازی ثبت نشده.</li>}
            {(customer.history || []).slice(0, 6).map((h, i) => (
              <li key={i}>
                <span>{h.label || h.reason}</span>
                <b>+{h.amount}</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <form
      className="pd-profile-box form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || phone.trim().length < 6) return;
        onIdentify(name.trim(), phone.trim());
      }}
    >
      <div className="profile-form-head">
        {iconWrap(<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3ZM9 12l2 2 4-4" />, 20)}
        <span>پروفایل و امتیاز خودتو بساز</span>
      </div>
      <p>با ثبت نام و شماره، به‌ازای خرید و ثبت نظر امتیاز جمع می‌کنی.</p>
      <div className="profile-form-fields">
        <input placeholder="نام شما" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="شماره موبایل" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" />
      </div>
      <button className="btn btn-ghost-blue" disabled={busy} type="submit">
        {busy ? 'در حال ثبت...' : 'ساخت پروفایل و شروع امتیازگیری'}
      </button>
    </form>
  );
}

function RatingBars({ summary }) {
  const count = summary?.count || 0;
  return (
    <div className="rating-bars">
      {[5, 4, 3, 2, 1].map((star) => {
        const n = summary?.breakdown?.[star] || 0;
        const pct = count ? Math.round((n / count) * 100) : 0;
        return (
          <div className="rating-bar-row" key={star}>
            <span className="bar-label">{star} ستاره</span>
            <span className="bar-track"><span className="bar-fill" style={{ width: `${pct}%` }} /></span>
            <span className="bar-count">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewItem({ review, onLike }) {
  return (
    <div className="review-item">
      <div className="review-head">
        <div className="review-avatar">{(review.name || 'ک').charAt(0)}</div>
        <div>
          <div className="review-name">{review.name}</div>
          <div className="review-meta">
            <StarRating value={review.rating} size={13} />
            <span>{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </div>
      <p className="review-comment">{review.comment}</p>
      <button type="button" className={`review-like-btn ${review.likedByMe ? 'active' : ''}`} onClick={() => onLike(review.id)}>
        {iconWrap(<path d="M7 10v11M2 10h4l3-8a2 2 0 0 1 2 2v5h6.5a2 2 0 0 1 1.94 2.5l-1.5 6A2 2 0 0 1 15 21H7" />, 16)}
        مفید بود
        <span>{review.likes || 0}</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthed: accountIsAuthed, refreshCartCount } = useCustomerAuth();
  const voterId = useMemo(() => getVoterId(), []);
  const tabsRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');

  const [cartBusy, setCartBusy] = useState(false);
  const [cartMsg, setCartMsg] = useState('');

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avg: 0, count: 0, breakdown: {} });
  const [reviewForm, setReviewForm] = useState({ name: '', comment: '', rating: 5 });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const [customer, setCustomer] = useState(() => {
    try {
      return {
        name: localStorage.getItem('tattooroom_customer_name') || '',
        phone: localStorage.getItem('tattooroom_customer_phone') || '',
        points: Number(localStorage.getItem('tattooroom_customer_points') || 0),
        history: [],
      };
    } catch {
      return { name: '', phone: '', points: 0, history: [] };
    }
  });
  const [profileBusy, setProfileBusy] = useState(false);
  const [callBanner, setCallBanner] = useState('');

  const [related, setRelated] = useState([]);

  useEffect(() => {
    setStatus('loading');
    setActiveTab('specs');
    setActiveImage(0);
    setQty(1);
    setCallBanner('');
    api
      .getProduct(id)
      .then((p) => {
        setProduct(p);
        setLiked(!!p.likedBy?.includes(voterId));
        setLikeCount(p.likes || (p.likedBy || []).length || 0);
        setSummary(p.rating || { avg: 0, count: 0, breakdown: {} });
        setStatus('ready');
      })
      .catch((err) => setStatus(err.message.includes('پیدا') ? 'notfound' : 'error'));
  }, [id, voterId]);

  useSeo({
    title: product ? product.metaTitle || product.name : status === 'notfound' ? 'محصول پیدا نشد' : undefined,
    description: product ? product.metaDescription || product.shortDescription : undefined,
    path: `/product/${id}`,
    type: 'product',
    image: product?.image ? imageUrl(product.image) : undefined,
    noindex: !product,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.shortDescription || product.description,
          image: [product.image, ...(product.images || [])].filter(Boolean).map(imageUrl),
          sku: product.id,
          category: product.category,
          // NOTE: the site displays prices in Toman but schema.org needs an
          // ISO 4217 currency code — Iran's official currency is the Rial
          // (IRR), and 1 Toman = 10 Rial, hence the ×10 conversion below.
          offers: {
            '@type': 'Offer',
            url: absoluteUrl(`/product/${id}`),
            priceCurrency: 'IRR',
            price: (Number(product.price) || 0) * 10,
            availability:
              (product.stock ?? 0) > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          },
          ...(summary?.count
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: summary.avg,
                  reviewCount: summary.count,
                },
              }
            : {}),
        }
      : null,
  });

  useEffect(() => {
    if (!product) return;
    api
      .getReviews(product.id)
      .then(({ reviews: list, summary: s }) => {
        setReviews(list.map((r) => ({ ...r, likedByMe: !!r.likedBy?.includes(voterId) })));
        setSummary(s);
      })
      .catch(() => {});
  }, [product?.id, voterId]);

  useEffect(() => {
    if (!product) return;
    api
      .getProducts({ category: product.category })
      .then((list) => setRelated(list.filter((p) => p.id !== product.id).slice(0, 4)))
      .catch(() => {});
  }, [product?.id, product?.category]);

  const syncProfile = (profile) => {
    if (!profile) return;
    setCustomer((c) => ({ ...c, ...profile }));
    try {
      localStorage.setItem('tattooroom_customer_name', profile.name || '');
      localStorage.setItem('tattooroom_customer_phone', profile.phone || '');
      localStorage.setItem('tattooroom_customer_points', String(profile.points || 0));
    } catch {
      /* ignore */
    }
  };

  const handleIdentify = async (name, phone) => {
    setProfileBusy(true);
    try {
      const profile = await api.identifyCustomer({ name, phone });
      syncProfile(profile);
    } catch (err) {
      setCallBanner(err.message);
    } finally {
      setProfileBusy(false);
    }
  };

  const handleToggleLike = async () => {
    setLiked((v) => !v);
    setLikeCount((n) => n + (liked ? -1 : 1));
    try {
      const res = await api.likeProduct(product.id, voterId);
      setLiked(res.liked);
      setLikeCount(res.likes);
    } catch {
      /* optimistic state stays as-is on failure */
    }
  };

  const handleReviewLike = async (reviewId) => {
    setReviews((list) =>
      list.map((r) => (r.id === reviewId ? { ...r, likedByMe: !r.likedByMe, likes: r.likes + (r.likedByMe ? -1 : 1) } : r))
    );
    try {
      const res = await api.likeReview(product.id, reviewId, voterId);
      setReviews((list) => list.map((r) => (r.id === reviewId ? { ...r, likes: res.likes, likedByMe: res.liked } : r)));
    } catch {
      /* ignore */
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMsg('');
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return;
    setReviewSubmitting(true);
    try {
      const payload = { ...reviewForm, phone: customer.phone || undefined };
      const res = await api.addReview(product.id, payload);
      setReviews((list) => [{ ...res.review, likedByMe: false }, ...list]);
      setSummary(res.summary);
      setReviewForm({ name: '', comment: '', rating: 5 });
      if (res.pointsAwarded) {
        syncProfile(res.profile);
        setReviewMsg(`نظر شما ثبت شد و ${res.pointsAwarded} امتیاز به پروفایلت اضافه شد 🎉`);
      } else {
        setReviewMsg('نظر شما با موفقیت ثبت شد. ممنون از وقتی که گذاشتی!');
      }
    } catch (err) {
      setReviewMsg(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBuyClick = async (e) => {
    if (!customer.phone || !customer.name) {
      e.preventDefault();
      setCallBanner('برای دریافت امتیاز خرید، اول از بخش پایین پروفایلت رو بساز، بعد دوباره تماس بگیر.');
      document.getElementById('pd-profile-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    try {
      const res = await api.buyIntent(product.id, { name: customer.name, phone: customer.phone });
      if (res.pointsAwarded) {
        syncProfile(res.profile);
        setCallBanner(`${res.pointsAwarded} امتیاز برای این خرید به پروفایلت اضافه شد 🎁`);
      }
    } catch {
      /* the phone call itself must never be blocked by a points-service hiccup */
    }
  };

  const handleAddToCart = async () => {
    if (!accountIsAuthed) {
      navigate(`/account/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setCartBusy(true);
    setCartMsg('');
    try {
      await api.addToCart(product.id, qty);
      await refreshCartCount();
      setCartMsg('به سبد خرید اضافه شد ✓');
      setTimeout(() => setCartMsg(''), 2200);
    } catch (err) {
      setCartMsg(err.message);
    } finally {
      setCartBusy(false);
    }
  };

  const scrollToReviews = () => {
    setActiveTab('reviews');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (status === 'loading') {
    return (
      <section className="light-sec">
        <div className="wrap"><p className="state-msg">در حال بارگذاری محصول...</p></div>
      </section>
    );
  }

  if (status !== 'ready') {
    return (
      <section className="light-sec">
        <div className="wrap">
          <p className="state-msg">
            {status === 'notfound' ? 'این محصول پیدا نشد.' : 'در دریافت اطلاعات محصول مشکلی پیش اومد.'}
          </p>
          <div style={{ textAlign: 'center' }}>
            <Link to="/shop" className="btn btn-ghost">بازگشت به فروشگاه</Link>
          </div>
        </div>
      </section>
    );
  }

  const inStock = product.stock > 0;
  const images = [product.image, ...(product.images || [])].filter(Boolean);
  const quickFeatures = getQuickFeatures(product);
  const sections = parseDescriptionSections(product.description);
  const specRows = [
    ...(product.features || []),
    { label: 'دسته‌بندی', value: product.category },
    { label: 'کد محصول', value: product.id },
    { label: 'وضعیت موجودی', value: inStock ? `موجود (${product.stock} عدد)` : 'ناموجود' },
    { label: 'گارانتی', value: product.warranty || '۷ روز ضمانت بازگشت کالا' },
  ];

  return (
    <section className="light-sec">
      <div className="wrap">
        <div className="crumbs">
          <Link to="/" style={{ color: 'var(--maserati)' }}>خانه</Link> /{' '}
          <Link to="/shop" style={{ color: 'var(--maserati)' }}>فروشگاه</Link> /{' '}
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} style={{ color: 'var(--maserati)' }}>
            {product.category}
          </Link>{' '}
          / {product.name}
        </div>

        <div className="product-detail">
          {/* ---------------- gallery ---------------- */}
          <div className="pd-gallery">
            <div className="pd-media">
              <button type="button" className={`pd-like-btn ${liked ? 'active' : ''}`} onClick={handleToggleLike} aria-label="افزودن به علاقه‌مندی‌ها">
                {iconWrap(<path d="M12 21s-7-4.35-9.5-8.5C.9 9 2 5.5 5.3 4.6 7.6 4 9.8 5 12 7.3 14.2 5 16.4 4 18.7 4.6 22 5.5 23.1 9 21.5 12.5 19 16.65 12 21 12 21Z" />, 20)}
                {likeCount > 0 && <span className="like-count">{likeCount}</span>}
              </button>
              {images[activeImage] ? (
                <img src={imageUrl(images[activeImage])} alt={product.name} />
              ) : (
                <svg viewBox="0 0 100 140" fill="none">
                  <rect x="20" y="46" width="60" height="70" rx="14" fill="#2c5578" />
                  <rect x="32" y="20" width="36" height="34" rx="8" fill="#9fc0d6" />
                </svg>
              )}
            </div>
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((img, i) => (
                  <button
                    type="button"
                    key={img + i}
                    className={`pd-thumb ${i === activeImage ? 'active' : ''}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={imageUrl(img)} alt={`${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}

            {/* quick feature line — keeps the space under the photo from being empty */}
            <div className="pd-quickspecs">
              {quickFeatures.map((f, i) => (
                <div className="pd-quickspec-item" key={i}>
                  {iconWrap(<path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />, 16)}
                  <div className="qs-text">
                    <span className="qs-label">{f.label}</span>
                    <span className="qs-value">{f.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* trust badges, shown as their own row right below the photo */}
            <div className="pd-trust-row">
              {TRUST_BADGES.map((b) => (
                <div className="pd-trust-col" key={b.label}>
                  {iconWrap(b.icon, 20)}
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------- info ---------------- */}
          <div className="pd-info">
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="pd-category">{product.category}</Link>
            <h1 className="pd-name">{product.name}</h1>

            <button type="button" className="pd-rating-row" onClick={scrollToReviews}>
              <StarRating value={summary.avg} size={16} />
              <span className="pd-rating-num">{summary.avg || '—'}</span>
              <span className="pd-rating-count">
                {summary.count > 0 ? `(${new Intl.NumberFormat('fa-IR').format(summary.count)} نظر)` : '(هنوز نظری ثبت نشده، اولین نفر باش)'}
              </span>
            </button>

            {(product.shortDescription || product.description) && (
              <p className="pd-desc">{product.shortDescription || product.description}</p>
            )}

            <div className="pd-price-box">
              <div className="pd-price">{formatPrice(product.price)}</div>
              {product.points > 0 && (
                <div className="pd-points-chip">
                  {iconWrap(<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3ZM9 12l2 2 4-4" />, 15)}
                  با خرید این کالا <b>{new Intl.NumberFormat('fa-IR').format(product.points)}</b> امتیاز می‌گیری
                </div>
              )}
            </div>

            <span className={`pd-stock ${inStock ? 'in' : 'out'}`}>
              {inStock ? `موجود در انبار (${product.stock} عدد)` : 'ناموجود'}
            </span>

            {inStock && (
              <div className="pd-qty">
                <span>تعداد:</span>
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span className="qty-value">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
                {qty > 1 && <span className="qty-total">جمع: {formatPrice(product.price * qty)}</span>}
              </div>
            )}

            <div className="pd-cta-row">
              {inStock && (
                <button type="button" className="btn btn-solid" onClick={handleAddToCart} disabled={cartBusy}>
                  {cartBusy ? 'در حال افزودن...' : 'افزودن به سبد خرید'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6" />
                    <circle cx="9" cy="20" r="1.4" />
                    <circle cx="17" cy="20" r="1.4" />
                  </svg>
                </button>
              )}
              <a href="tel:09129234145" className="btn btn-ghost" onClick={handleBuyClick}>
                برای خرید تماس بگیر
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
              <button type="button" className={`btn btn-ghost pd-wish-btn ${liked ? 'active' : ''}`} onClick={handleToggleLike}>
                {iconWrap(<path d="M12 21s-7-4.35-9.5-8.5C.9 9 2 5.5 5.3 4.6 7.6 4 9.8 5 12 7.3 14.2 5 16.4 4 18.7 4.6 22 5.5 23.1 9 21.5 12.5 19 16.65 12 21 12 21Z" />, 18)}
                {liked ? 'در علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
              </button>
            </div>

            {cartMsg && <div className="pd-call-banner">{cartMsg}</div>}


            {callBanner && <div className="pd-call-banner">{callBanner}</div>}

            <div className="pd-payment-row">
              <span className="pd-payment-title">روش‌های پرداخت:</span>
              {PAYMENT_METHODS.map((m) => (
                <span className="pd-payment-item" key={m.label}>
                  {iconWrap(m.icon, 16)}
                  {m.label}
                </span>
              ))}
            </div>

            <div className="pd-warranty-box">
              {iconWrap(<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />, 20)}
              <div>
                <div className="warranty-title">گارانتی این کالا</div>
                <div className="warranty-text">{product.warranty || 'اصالت کالا و ۷ روز ضمانت بازگشت وجه تضمین می‌شود.'}</div>
              </div>
            </div>

            {product.tags?.length > 0 && (
              <div className="pd-tags-row">
                {product.tags.map((t) => (
                  <Link key={t} to={`/shop?search=${encodeURIComponent(t)}`} className="tag-chip">#{t}</Link>
                ))}
              </div>
            )}

            <div id="pd-profile-anchor">
              <ProfileBox customer={customer} onIdentify={handleIdentify} busy={profileBusy} />
            </div>
          </div>
        </div>

        {/* ---------------- tabs ---------------- */}
        <div className="pd-tabs" ref={tabsRef}>
          <div className="pd-tabs-nav">
            <button type="button" className={activeTab === 'specs' ? 'active' : ''} onClick={() => setActiveTab('specs')}>مشخصات</button>
            <button type="button" className={activeTab === 'desc' ? 'active' : ''} onClick={() => setActiveTab('desc')}>توضیحات</button>
            <button type="button" className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>
              نظرات {summary.count > 0 && `(${summary.count})`}
            </button>
          </div>

          {activeTab === 'specs' && (
            <div className="pd-tab-panel">
              <table className="spec-table">
                <tbody>
                  {specRows.map((row, i) => (
                    <tr key={i}>
                      <th>{row.label}</th>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'desc' && (
            <div className="pd-tab-panel desc-panel">
              {sections.length === 0 ? (
                <p className="state-msg" style={{ padding: '20px 0' }}>توضیحی برای این محصول ثبت نشده.</p>
              ) : (
                <>
                  {sections.length > 1 && (
                    <div className="desc-toc">
                      <div className="desc-toc-title">فهرست مطالب</div>
                      <ul>
                        {sections.map((s) => (
                          <li key={s.id}>
                            <a
                              href={`#${s.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                            >
                              {s.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {sections.map((s) => (
                    <div className="desc-section" id={s.id} key={s.id}>
                      <h3>{s.title}</h3>
                      <p>{s.body}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="pd-tab-panel reviews-panel">
              <div className="review-summary">
                <div className="review-summary-avg">
                  <div className="avg-num">{summary.avg || 0}</div>
                  <StarRating value={summary.avg} size={18} />
                  <div className="avg-count">از {new Intl.NumberFormat('fa-IR').format(summary.count || 0)} نظر</div>
                </div>
                <RatingBars summary={summary} />
              </div>

              <div className="review-list">
                {reviews.length === 0 && <p className="state-msg" style={{ padding: '10px 0' }}>هنوز نظری برای این محصول ثبت نشده. اولین نفر باش!</p>}
                {reviews.map((r) => (
                  <ReviewItem key={r.id} review={r} onLike={handleReviewLike} />
                ))}
              </div>

              <form className="review-form" onSubmit={handleReviewSubmit}>
                <h4>نظرت رو ثبت کن</h4>
                <div className="review-form-row">
                  <label>امتیاز شما</label>
                  <StarRating value={reviewForm.rating} size={22} interactive onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} />
                </div>
                <div className="review-form-fields">
                  <input
                    placeholder="نام شما"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <textarea
                    placeholder="نظرت درباره این محصول چیه؟"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    required
                  />
                </div>
                {reviewMsg && <div className="review-form-msg">{reviewMsg}</div>}
                <button className="btn btn-solid" disabled={reviewSubmitting} type="submit">
                  {reviewSubmitting ? 'در حال ثبت...' : 'ثبت نظر'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ---------------- related products ---------------- */}
        {related.length > 0 && (
          <div className="related-section">
            <h2>محصولات مرتبط</h2>
            <div className="shop-grid related-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
