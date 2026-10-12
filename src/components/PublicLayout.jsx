import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function PublicLayout({ children }) {
  const location = useLocation();

  // scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // reveal-on-scroll animations — observes existing .reveal/.reveal-stagger
  // elements AND keeps watching the DOM so elements that mount later (e.g.
  // after an async data fetch resolves) still get picked up and revealed.
  useEffect(() => {
    // Track "already observed" state per-effect-run (in a local Set) instead
    // of writing a flag onto the DOM node itself. A DOM-attribute flag
    // survives React 18 StrictMode's dev-only mount→cleanup→mount cycle: the
    // first (throwaway) run would mark every element as tracked and then
    // disconnect its observer, so the second (real) observer would find
    // every element already "tracked" and skip observing them — leaving
    // them permanently stuck at opacity: 0 until the elements are recreated
    // (e.g. by navigating away and back). Scoping the flag to this effect's
    // own closure avoids that entirely.
    const tracked = new Set();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const track = (el) => {
      if (tracked.has(el)) return;
      tracked.add(el);
      io.observe(el);
    };

    document.querySelectorAll('.reveal, .reveal-stagger').forEach(track);

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.('.reveal, .reveal-stagger')) track(node);
          node.querySelectorAll?.('.reveal, .reveal-stagger').forEach(track);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [location.pathname]);

  // custom ink cursor (desktop only)
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    const move = (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    };
    const onOver = (e) => {
      if (e.target.closest('a, button, .prod-card, .svc-card')) cursor.classList.add('big');
    };
    const onOut = (e) => {
      if (e.target.closest('a, button, .prod-card, .svc-card')) cursor.classList.remove('big');
    };

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <>
      <div className="grain"></div>
      <div className="ink-cursor" id="cursor"></div>
      <Header />
      {children}
      <Footer />
    </>
  );
}
