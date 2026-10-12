import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { getVoterId } from '../api/voter';
import { useCustomerAuth } from '../context/CustomerAuthContext';

function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
}

export default function ProductCard({ product }) {
  const { profile, isAuthed, refreshCartCount } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const voterId = profile?.id || getVoterId();
  const [liked, setLiked] = useState(!!product.likedBy?.includes(voterId));
  const [cartBusy, setCartBusy] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    try {
      const res = await api.likeProduct(product.id, voterId);
      setLiked(res.liked);
    } catch {
      setLiked(!next);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      navigate(`/account/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setCartBusy(true);
    try {
      await api.addToCart(product.id, 1);
      await refreshCartCount();
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1600);
    } catch (err) {
      alert(err.message);
    } finally {
      setCartBusy(false);
    }
  };

  return (
    <div className="prod-card">
      <button
        type="button"
        className={`prod-like ${liked ? 'active' : ''}`}
        onClick={handleLike}
        aria-label="افزودن به علاقه‌مندی‌ها"
      >
        <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
          <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.4 1.1 4 2 .6-.9 2-2 4-2 3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21Z" />
        </svg>
      </button>

      <Link to={`/product/${product.slug || product.id}`} className="prod-media-link">
        <div className="prod-media">
          {product.image ? (
            <img src={imageUrl(product.image)} alt={product.name} />
          ) : (
            <svg viewBox="0 0 100 140" fill="none">
              <rect x="20" y="46" width="60" height="70" rx="14" fill="#2c5578" />
              <rect x="32" y="20" width="36" height="34" rx="8" fill="#9fc0d6" />
            </svg>
          )}
        </div>
      </Link>

      <div className="prod-body">
        <Link to={`/product/${product.slug || product.id}`} className="prod-title-link"><h3>{product.name}</h3></Link>
        <p>{product.shortDescription}</p>
        <div className="prod-price">{formatPrice(product.price)}</div>
        <div className="prod-actions">
          <button type="button" className="btn btn-solid prod-add-btn" onClick={handleAddToCart} disabled={cartBusy}>
            {justAdded ? 'اضافه شد ✓' : 'افزودن به سبد'}
          </button>
          <Link to={`/product/${product.slug || product.id}`} className="prod-cta">
            مشاهده
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
