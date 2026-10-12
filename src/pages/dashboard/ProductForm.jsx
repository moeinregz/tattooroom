import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, imageUrl } from '../../api/client';

const emptyForm = {
  name: '',
  slug: '',
  category: '',
  price: '',
  stock: '',
  shortDescription: '',
  description: '',
  metaTitle: '',
  metaDescription: '',
  tags: '',
  features: '',
  warranty: '',
  images: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .getProduct(id)
      .then((p) => {
        setForm({
          name: p.name,
          slug: p.slug || '',
          category: p.category,
          price: p.price,
          stock: p.stock,
          shortDescription: p.shortDescription || '',
          description: p.description || '',
          metaTitle: p.metaTitle || '',
          metaDescription: p.metaDescription || '',
          tags: (p.tags || []).join(', '),
          features: (p.features || []).map((f) => `${f.label}: ${f.value}`).join('\n'),
          warranty: p.warranty || '',
          images: (p.images || []).join('\n'),
        });
        setExistingImage(p.image || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (imageFile) data.append('image', imageFile);

    try {
      if (isEdit) {
        await api.updateProduct(id, data);
      } else {
        await api.createProduct(data);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="state-msg">در حال بارگذاری...</p>;

  return (
    <>
      <div className="dash-head">
        <h1>{isEdit ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h1>
        <Link to="/dashboard" className="btn btn-ghost">بازگشت به لیست</Link>
      </div>

      <div className="dash-form-card">
        {error && <div className="form-error">{error}</div>}

        <label className="image-drop">
          {imageFile ? (
            <img src={URL.createObjectURL(imageFile)} alt="پیش‌نمایش" />
          ) : existingImage ? (
            <img src={imageUrl(existingImage)} alt="تصویر فعلی" />
          ) : null}
          <div>{imageFile || existingImage ? 'برای تغییر تصویر کلیک کن' : 'برای آپلود تصویر محصول کلیک کن'}</div>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </label>

        <form onSubmit={handleSubmit}>
          <div className="dash-form-grid">
            <div className="field">
              <label>نام محصول</label>
              <input value={form.name} onChange={handleChange('name')} required />
            </div>
            <div className="field full">
              <label>نامک آدرس (Slug) — خالی بگذار تا خودکار از روی نام ساخته شود</label>
              <input
                value={form.slug}
                onChange={handleChange('slug')}
                placeholder="مثلاً پماد-ترمیم-تتو"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
              <small style={{ opacity: 0.7 }}>
                همینه که توی آدرس صفحه‌ی محصول میاد: tattooroom.ir/product/همینجا — اگه نام محصول طولانی یا نامناسبه، اینجا یه نسخه‌ی کوتاه و تمیز خودت بذار.
              </small>
            </div>
            <div className="field">
              <label>دسته‌بندی</label>
              <input value={form.category} onChange={handleChange('category')} placeholder="مثلاً مراقبت پس از تتو" required />
            </div>
            <div className="field">
              <label>قیمت (تومان)</label>
              <input type="number" min="0" value={form.price} onChange={handleChange('price')} required />
            </div>
            <div className="field">
              <label>موجودی</label>
              <input type="number" min="0" value={form.stock} onChange={handleChange('stock')} required />
            </div>
            <div className="field full">
              <label>توضیح کوتاه (نمایش روی کارت محصول)</label>
              <input value={form.shortDescription} onChange={handleChange('shortDescription')} required />
            </div>
            <div className="field full">
              <label>توضیح کامل</label>
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                placeholder={'برای فهرست مطالب خودکار، هر بخش را با ## شروع کنید. مثال:\n## معرفی\nمتن معرفی...\n## نحوه استفاده\nمتن نحوه استفاده...'}
                rows={6}
              />
            </div>
          </div>

          <h3 className="dash-form-subheading">مشخصات فنی، برچسب‌ها و گارانتی</h3>
          <div className="dash-form-grid">
            <div className="field full">
              <label>ویژگی‌های فنی (در هر خط: «برچسب: مقدار»)</label>
              <textarea
                value={form.features}
                onChange={handleChange('features')}
                placeholder={'حجم: 30 میلی‌لیتر\nکشور سازنده: ایران\nنوع پوست: همه انواع پوست'}
                rows={4}
              />
            </div>
            <div className="field full">
              <label>برچسب‌ها (با کاما جدا کنید)</label>
              <input value={form.tags} onChange={handleChange('tags')} placeholder="مراقبت پوست, ترمیمی, ضدآب" />
            </div>
            <div className="field full">
              <label>گارانتی</label>
              <input value={form.warranty} onChange={handleChange('warranty')} placeholder="۷ روز ضمانت بازگشت کالا + گارانتی اصالت" />
            </div>
            <div className="field full">
              <label>گالری تصاویر اضافه (هر آدرس تصویر در یک خط)</label>
              <textarea
                value={form.images}
                onChange={handleChange('images')}
                placeholder={'/uploads/gallery-1.jpg\nhttps://example.com/gallery-2.jpg'}
                rows={3}
              />
            </div>
          </div>

          <h3 className="dash-form-subheading">متادیتا (سئو)</h3>
          <div className="dash-form-grid">
            <div className="field full">
              <label>عنوان متا (Meta Title)</label>
              <input
                value={form.metaTitle}
                onChange={handleChange('metaTitle')}
                placeholder="عنوانی که در نتایج گوگل و تب مرورگر نمایش داده می‌شود"
              />
            </div>
            <div className="field full">
              <label>توضیحات متا (Meta Description)</label>
              <textarea
                value={form.metaDescription}
                onChange={handleChange('metaDescription')}
                placeholder="توضیح کوتاهی که در نتایج جستجو زیر عنوان نمایش داده می‌شود"
              />
            </div>
          </div>

          <button className="btn btn-solid" disabled={saving}>
            {saving ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'افزودن محصول'}
          </button>
        </form>
      </div>
    </>
  );
}
