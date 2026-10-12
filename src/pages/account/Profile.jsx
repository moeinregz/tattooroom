import { useState } from 'react';
import { api } from '../../api/client';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

export default function Profile() {
  const { profile, setProfile } = useCustomerAuth();
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await api.updateMyProfile({ name, email });
      setProfile(updated);
      setMessage('اطلاعات با موفقیت ذخیره شد.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <p className="state-msg">در حال بارگذاری...</p>;

  return (
    <div className="account-card">
      <h2>اطلاعات پروفایل</h2>
      {message && <div className="form-success">{message}</div>}
      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>نام و نام خانوادگی</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>شماره موبایل</label>
          <input value={profile.phone} disabled style={{ direction: 'ltr', textAlign: 'left', opacity: .7 }} />
        </div>
        <div className="field">
          <label>ایمیل (اختیاری)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ direction: 'ltr', textAlign: 'left' }} />
        </div>
        <button className="btn btn-solid" disabled={saving}>
          {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </form>

      <div className="points-summary">
        <div>
          <b>{new Intl.NumberFormat('fa-IR').format(profile.points || 0)}</b>
          <span>امتیاز وفاداری</span>
        </div>
        {profile.history?.length > 0 && (
          <ul className="points-history">
            {profile.history.slice(0, 6).map((h, i) => (
              <li key={i}>
                <span>{h.label}</span>
                <b className={h.amount >= 0 ? 'plus' : 'minus'}>{h.amount >= 0 ? `+${h.amount}` : h.amount}</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
