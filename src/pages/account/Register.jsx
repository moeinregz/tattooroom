import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useSeo } from '../../lib/seo';

export default function AccountRegister() {
  useSeo({ title: 'ثبت‌نام', path: '/account/register', noindex: true });

  const { register } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/account';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }
    setLoading(true);
    try {
      await register(phone, name, password);
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
          <div className="crumbs"><Link to="/">خانه</Link> / ثبت‌نام</div>
          <h1>ساخت حساب کاربری</h1>
          <p>یک حساب کاربری بساز تا سبد خرید، سفارش‌ها، علاقه‌مندی‌ها و امتیازات وفاداری‌ات همیشه در دسترس باشه.</p>
        </div>
      </section>

      <section className="light-sec">
        <div className="wrap">
          <div className="auth-card">
            {error && <div className="form-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>نام و نام خانوادگی</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <div className="field">
                <label>شماره موبایل</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" required />
              </div>
              <div className="field">
                <label>رمز عبور</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="field">
                <label>تکرار رمز عبور</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
              </div>
              <button className="btn btn-solid btn-block" disabled={loading}>
                {loading ? 'در حال ساخت حساب...' : 'ثبت‌نام'}
              </button>
            </form>
            <p className="auth-switch">
              قبلاً ثبت‌نام کردی؟ <Link to={`/account/login?next=${encodeURIComponent(next)}`}>وارد شو</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
