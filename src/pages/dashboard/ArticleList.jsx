import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, imageUrl } from '../../api/client';

function formatDate(value) {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .getAllArticles()
      .then(setArticles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`مقاله‌ی «${title}» حذف بشه؟`)) return;
    try {
      await api.deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="dash-head">
        <h1>مقالات وبلاگ</h1>
        <Link to="/dashboard/articles/new" className="btn btn-solid">+ مقاله جدید</Link>
      </div>

      {loading && <p className="state-msg">در حال بارگذاری...</p>}
      {error && <p className="state-msg">{error}</p>}

      {!loading && !error && articles.length === 0 && (
        <p className="state-msg">هنوز مقاله‌ای ثبت نشده. روی «مقاله جدید» کلیک کن.</p>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>کاور</th>
                <th>عنوان</th>
                <th>دسته</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.coverImage ? (
                      <img className="dash-thumb" src={imageUrl(a.coverImage)} alt={a.title} />
                    ) : (
                      <div className="dash-thumb" />
                    )}
                  </td>
                  <td>{a.title}</td>
                  <td>{a.tag}</td>
                  <td>
                    <span className={`status-badge ${a.status === 'draft' ? 'draft' : 'published'}`}>
                      {a.status === 'draft' ? 'پیش‌نویس' : 'منتشر شده'}
                    </span>
                  </td>
                  <td>{formatDate(a.createdAt)}</td>
                  <td>
                    <div className="dash-row-actions">
                      <a href={`/blog/${a.slug}`} target="_blank" rel="noreferrer" className="icon-btn">مشاهده</a>
                      <Link to={`/dashboard/articles/${a.id}/edit`} className="icon-btn">ویرایش</Link>
                      <button className="icon-btn danger" onClick={() => handleDelete(a.id, a.title)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
