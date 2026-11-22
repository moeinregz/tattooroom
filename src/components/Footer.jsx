export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="brand">
              <span className="brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 16 L14 6 Q17 3 19 5 Q21 7 18 10 L8 20 Z" />
                  <circle cx="17" cy="6" r="1.2" fill="currentColor" />
                </svg>
              </span>
              <span className="brand-name">Tattoo<span>Room</span></span>
            </div>
            <p>استودیوی لوکس تتو و آرایش دائم؛ جایی که هنر و دقت با پوستِ تو ترکیب می‌شه.</p>
          </div>
          <div className="foot-col">
            <b>دسترسی سریع</b>
            <ul>
              <li><a href="/#about">درباره ما</a></li>
              <li><a href="/#services">خدمات</a></li>
              <li><a href="/shop">فروشگاه</a></li>
              <li><a href="/blog">وبلاگ</a></li>
              <li><a href="/#testimonials">نظرات مشتریان</a></li>
            </ul>
          </div>
          <div className="foot-col">
            <b>تماس</b>
            <ul>
              <li><a href="tel:09129234145" style={{ direction: 'ltr', display: 'inline-block' }}>09129234145</a></li>
              <li><a href="/#contact">فرم رزرو وقت</a></li>
              <li><a href="#">اینستاگرام</a></li>
              <li><a href="#">تلگرام</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© تمامی حقوق برای TattooRoom محفوظ است.</span>
          <span>طراحی‌شده با ❤ برای هنر ماندگار</span>
        </div>
      </div>
    </footer>
  );
}
