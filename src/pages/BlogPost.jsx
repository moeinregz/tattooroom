import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, imageUrl } from '../api/client';
import { useSeo, absoluteUrl } from '../lib/seo';

function formatDate(value) {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

// strips HTML tags so the rich-text article body can be reused as a plain
// description in meta tags / structured data without leaking markup.
function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function BlogPost() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getArticle(slug)
      .then((a) => {
        setArticle(a);
        api
          .getArticles({ tag: a.tag })
          .then((list) => setRelated(list.filter((x) => x.id !== a.id).slice(0, 2)))
          .catch(() => setRelated([]));
      })
      .catch(() => setError('این مقاله پیدا نشد.'))
      .finally(() => setLoading(false));
  }, [slug]);

  useSeo({
    title: article ? article.metaTitle || article.title : 'مقاله پیدا نشد',
    description: article ? article.metaDescription || article.excerpt || stripHtml(article.body).slice(0, 160) : undefined,
    path: `/blog/${slug}`,
    type: 'article',
    image: article?.coverImage ? imageUrl(article.coverImage) : undefined,
    noindex: !article,
    jsonLd: article
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title,
          description: article.excerpt || stripHtml(article.body).slice(0, 160),
          image: article.coverImage ? imageUrl(article.coverImage) : undefined,
          datePublished: article.createdAt,
          dateModified: article.updatedAt || article.createdAt,
          author: { '@type': 'Organization', name: 'TattooRoom' },
          publisher: { '@type': 'Organization', name: 'TattooRoom' },
          mainEntityOfPage: absoluteUrl(`/blog/${slug}`),
        }
      : null,
  });

  if (loading) {
    return (
      <section className="light-sec" style={{ paddingTop: 150 }}>
        <div className="wrap"><p className="state-msg">در حال بارگذاری مقاله...</p></div>
      </section>
    );
  }

  if (error || !article) {
    return (
      <section className="light-sec" style={{ paddingTop: 150 }}>
        <div className="wrap">
          <p className="state-msg">{error || 'این مقاله پیدا نشد.'}</p>
          <div style={{ textAlign: 'center' }}>
            <Link to="/blog" className="btn btn-solid">بازگشت به وبلاگ</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-hero post-hero">
        <div className="wrap">
          <div className="crumbs">
            <Link to="/">خانه</Link> / <Link to="/blog">وبلاگ</Link> / {article.title}
          </div>
          <span className="post-tag">{article.tag}</span>
          <h1>{article.title}</h1>
          <div className="post-meta">
            <span>{formatDate(article.createdAt)}</span>
            <span>{article.readTime} دقیقه مطالعه</span>
          </div>
        </div>
      </section>

      <section className="light-sec">
        <div className="wrap post-wrap">
          {article.coverImage && (
            <div className="post-cover">
              <img src={imageUrl(article.coverImage)} alt={article.title} />
            </div>
          )}

          <div className="prose" dangerouslySetInnerHTML={{ __html: article.body }} />

          <div className="post-back">
            <Link to="/blog" className="btn btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              بازگشت به همه مقالات
            </Link>
          </div>

          {related.length > 0 && (
            <div className="post-related">
              <h3>مقالات مرتبط</h3>
              <div className="article-grid">
                {related.map((a) => (
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
            </div>
          )}
        </div>
      </section>
    </>
  );
}
