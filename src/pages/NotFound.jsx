import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

export default function NotFound() {
  useSeo({
    title: 'صفحه پیدا نشد (۴۰۴)',
    description: 'صفحه‌ای که دنبالش بودی پیدا نشد یا جابه‌جا شده.',
    path: typeof window !== 'undefined' ? window.location.pathname : '/404',
    noindex: true,
  });

  return (
    <section className="light-sec" style={{ paddingTop: 150, paddingBottom: 150, textAlign: 'center' }}>
      <div className="wrap">
        <h1 className="h-section">۴۰۴ — این صفحه پیدا نشد</h1>
        <p className="lede" style={{ maxWidth: 520, margin: '0 auto 30px' }}>
          آدرسی که وارد کردی وجود نداره یا جابه‌جا شده. می‌تونی از فروشگاه یا صفحه اصلی ادامه بدی.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-solid">بازگشت به صفحه اصلی</Link>
          <Link to="/shop" className="btn btn-light">مشاهده فروشگاه</Link>
        </div>
      </div>
    </section>
  );
}
