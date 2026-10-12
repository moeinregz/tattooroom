import { useState } from 'react';
import { api } from '../../api/client';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const empty = { title: '', province: '', city: '', address: '', postalCode: '', receiverPhone: '' };

export default function Addresses() {
  const { profile, setProfile } = useCustomerAuth();
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await api.addMyAddress(form);
      setProfile(updated);
      setForm(empty);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('این آدرس حذف بشه؟')) return;
    try {
      const updated = await api.deleteMyAddress(id);
      setProfile(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const addresses = profile?.addresses || [];

  return (
    <div className="account-card">
      <div className="dash-head" style={{ marginBottom: 20 }}>
        <h2>آدرس‌های من</h2>
        <button className="btn btn-solid" type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'انصراف' : '+ آدرس جدید'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="address-form">
          {error && <div className="form-error">{error}</div>}
          <div className="dash-form-grid">
            <div className="field">
              <label>عنوان آدرس</label>
              <input value={form.title} onChange={handleChange('title')} placeholder="مثلاً منزل، محل کار" />
            </div>
            <div className="field">
              <label>استان</label>
              <input value={form.province} onChange={handleChange('province')} />
            </div>
            <div className="field">
              <label>شهر</label>
              <input value={form.city} onChange={handleChange('city')} required />
            </div>
            <div className="field">
              <label>کد پستی</label>
              <input value={form.postalCode} onChange={handleChange('postalCode')} style={{ direction: 'ltr', textAlign: 'left' }} />
            </div>
            <div className="field full">
              <label>آدرس کامل</label>
              <textarea value={form.address} onChange={handleChange('address')} rows={2} required />
            </div>
            <div className="field">
              <label>شماره تماس گیرنده</label>
              <input value={form.receiverPhone} onChange={handleChange('receiverPhone')} placeholder={profile?.phone} style={{ direction: 'ltr', textAlign: 'left' }} />
            </div>
          </div>
          <button className="btn btn-solid" disabled={saving}>{saving ? 'در حال ذخیره...' : 'ذخیره آدرس'}</button>
        </form>
      )}

      {addresses.length === 0 && !showForm && <p className="state-msg">هنوز آدرسی ثبت نکردی.</p>}

      <div className="address-list">
        {addresses.map((a) => (
          <div key={a.id} className="address-card">
            <div>
              <b>{a.title}</b>
              <p>{a.province ? `${a.province}، ` : ''}{a.city} — {a.address}</p>
              {a.postalCode && <span className="address-meta">کد پستی: {a.postalCode}</span>}
              {a.receiverPhone && <span className="address-meta">تماس: {a.receiverPhone}</span>}
            </div>
            <button type="button" className="icon-btn danger" onClick={() => handleDelete(a.id)}>حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}
