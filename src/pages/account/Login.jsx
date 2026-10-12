import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useSeo } from '../../lib/seo';

export default function AccountLogin() {
  useSeo({ title: 'ورود به حساب کاربری', path: '/account/login', noindex: true });

  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/account';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      navigate(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="crumbs"><Link to="/">خانه</Link> / ورود</div>
          <h1>ورود به حساب کاربری</h1>
          <p>وارد شو تا به سبد خرید، سفارش‌ها و علاقه‌مندی‌هات دسترسی داشته باشی.</p>
        </div>
      </section>

      <section className="light-sec">
        <div className="wrap">
          <div className="auth-card">
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>شماره موبایل</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label>رمز عبور</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-solid btn-block" disabled={loading}>
                {loading ? 'در حال ورود...' : 'ورود'}
              </button>
            </form>
            <p className="auth-switch">
              حساب کاربری نداری؟ <Link to={`/account/register?next=${encodeURIComponent(next)}`}>ثبت‌نام کن</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
