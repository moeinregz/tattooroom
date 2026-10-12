import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, imageUrl } from '../../api/client';
import RichEditor from '../../components/RichEditor';

const emptyForm = {
  title: '',
  slug: '',
  tag: '',
  excerpt: '',
  body: '',
  status: 'published',
  metaTitle: '',
  metaDescription: '',
};

export default function ArticleForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [coverFile, setCoverFile] = useState(null);
  const [existingCover, setExistingCover] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .getArticleAdmin(id)
      .then((a) => {
        setForm({
          title: a.title,
          slug: a.slug || '',
          tag: a.tag || '',
          excerpt: a.excerpt || '',
          body: a.body || '',
          status: a.status || 'published',
          metaTitle: a.metaTitle || '',
          metaDescription: a.metaDescription || '',
        });
        setExistingCover(a.coverImage || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.body || form.body === '<br>') {
      setError('متن مقاله نمی‌تواند خالی باشد.');
      return;
    }

    setSaving(true);
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (coverFile) data.append('cover', coverFile);

    try {
      if (isEdit) {
        await api.updateArticle(id, data);
      } else {
        await api.createArticle(data);
      }
      navigate('/dashboard/articles');
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
        <h1>{isEdit ? 'ویرایش مقاله' : 'مقاله جدید'}</h1>
        <Link to="/dashboard/articles" className="btn btn-ghost">بازگشت به لیست</Link>
      </div>

      <div className="dash-form-card">
        {error && <div className="form-error">{error}</div>}

        <label className="image-drop">
          {coverFile ? (
            <img src={URL.createObjectURL(coverFile)} alt="پیش‌نمایش" />
          ) : existingCover ? (
            <img src={imageUrl(existingCover)} alt="کاور فعلی" />
          ) : null}
          <div>{coverFile || existingCover ? 'برای تغییر تصویر کاور کلیک کن' : 'برای آپلود تصویر کاور کلیک کن'}</div>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          />
        </label>

        <form onSubmit={handleSubmit}>
          <div className="dash-form-grid">
            <div className="field full">
              <label>عنوان مقاله</label>
              <input value={form.title} onChange={handleChange('title')} required />
            </div>
            <div className="field">
              <label>دسته / برچسب</label>
              <input value={form.tag} onChange={handleChange('tag')} placeholder="مثلاً مراقبت پس از تتو" />
            </div>
            <div className="field">
              <label>وضعیت انتشار</label>
              <select value={form.status} onChange={handleChange('status')}>
                <option value="published">منتشر شده</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </div>
            <div className="field full">
              <label>نامک آدرس (Slug) — خالی بگذار تا خودکار ساخته شود</label>
              <input value={form.slug} onChange={handleChange('slug')} placeholder="مثلاً مراقبت-تتو-هفته-اول" style={{ direction: 'ltr', textAlign: 'left' }} />
            </div>
            <div className="field full">
              <label>خلاصه (نمایش روی کارت مقاله) — خالی بگذار تا از متن استخراج شود</label>
              <textarea value={form.excerpt} onChange={handleChange('excerpt')} rows={2} />
            </div>
          </div>

          <h3 className="dash-form-subheading">متن مقاله</h3>
          <RichEditor
            value={form.body}
            onChange={(html) => setForm((f) => ({ ...f, body: html }))}
            onUploadImage={async (file) => {
              const res = await api.uploadArticleImage(file);
              return imageUrl(res.url);
            }}
            placeholder="متن مقاله را همین‌جا بنویس؛ برای لینک و تصویر از نوار ابزار بالا استفاده کن..."
          />

          <h3 className="dash-form-subheading">متادیتا (سئو)</h3>
          <div className="dash-form-grid">
            <div className="field full">
              <label>عنوان متا (Meta Title)</label>
              <input value={form.metaTitle} onChange={handleChange('metaTitle')} placeholder="در نتایج گوگل و تب مرورگر نمایش داده می‌شود" />
            </div>
            <div className="field full">
              <label>توضیحات متا (Meta Description)</label>
              <textarea value={form.metaDescription} onChange={handleChange('metaDescription')} rows={2} />
            </div>
          </div>

          <button className="btn btn-solid" disabled={saving}>
            {saving ? 'در حال ذخیره...' : isEdit ? 'ذخیره تغییرات' : 'انتشار مقاله'}
          </button>
        </form>
      </div>
    </>
  );
}
