import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { useSeo } from '../lib/seo';

function formatDate(value) {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

export default function Blog() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = searchParams.get('tag') || 'همه';
  const search = searchParams.get('search') || '';

  useSeo({
    title: tag !== 'همه' ? `مجله — ${tag}` : 'مجله',
    description: 'مقاله‌ها و راهنماهای مراقبت از تتو، انتخاب رنگ و تجهیزات؛ نوشته‌ی تیم TattooRoom.',
    path: '/blog',
    noindex: Boolean(search) || tag !== 'همه',
  });

  useEffect(() => {
    setLoading(true);
    api
      .getArticles()
      .then(setArticles)
      .catch(() => setError('در دریافت مقالات مشکلی پیش اومد.'))
      .finally(() => setLoading(false));
  }, []);

  const tags = useMemo(() => {
    const set = new Set(articles.map((a) => a.tag));
    return ['همه', ...set];
  }, [articles]);

  const setTag = (t) => {
    const next = new URLSearchParams(searchParams);
    if (t === 'همه') next.delete('tag');
    else next.set('tag', t);
    setSearchParams(next);
  };

  const setSearch = (v) => {
    const next = new URLSearchParams(searchParams);
    if (!v) next.delete('search');
    else next.set('search', v);
    setSearchParams(next);
  };

  const filtered = articles.filter((a) => {
    const matchesTag = tag === 'همه' || a.tag === tag;
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="crumbs"><Link to="/">خانه</Link> / وبلاگ</div>
          <h1>مجله TattooRoom</h1>
          <p>مقاله‌ها و راهنماهای مراقبت از تتو، انتخاب رنگ و تجهیزات؛ نوشته‌ی تیم TattooRoom.</p>
        </div>
      </section>

      <section className="light-sec">
        <div className="wrap">
          <div className="shop-toolbar">
            <div className="shop-filters">
              {tags.map((t) => (
                <button key={t} className={`chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="shop-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="جستجوی مقاله..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && <p className="state-msg">در حال بارگذاری مقالات...</p>}
          {error && <p className="state-msg">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="state-msg">مقاله‌ای با این مشخصات پیدا نشد.</p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="article-grid">
              {filtered.map((a) => (
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
                      <span>{formatDate(a.createdAt)}</span>
                      <span>{a.readTime} دقیقه مطالعه</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
