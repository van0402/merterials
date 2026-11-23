'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hiệu ứng cuộn dùng chung cho các trang công khai:
 * - Cuộn mượt có quán tính (chỉ chuột/touchpad trên máy tính).
 * - Thanh tiến trình đọc ở đỉnh trang.
 * - Header ẩn khi cuộn xuống, hiện khi cuộn lên (phần tử có data-site-header).
 * - Các khối nằm dưới màn hình hiện dần khi cuộn tới.
 * Tự tắt khi người dùng bật "giảm chuyển động" trong hệ điều hành.
 */

const REVEAL_SELECTOR = [
  '[data-reveal]',
  'main section h2',
  'main section h2 + p',
  'main .grid > *',
].join(',');

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function canScrollInside(start: EventTarget | null, dy: number) {
  let el = start instanceof Element ? start : null;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) {
      if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    el = el.parentElement;
  }
  return false;
}

function pageLocked() {
  const b = getComputedStyle(document.body);
  const h = getComputedStyle(document.documentElement);
  return b.overflow === 'hidden' || b.overflowY === 'hidden' || h.overflowY === 'hidden' || document.body.hasAttribute('data-scroll-locked');
}

export function ScrollEffects() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(() => {});
  const scanRef = useRef<() => void>(() => {});

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = matchMedia('(pointer: coarse)').matches;
    const maxScroll = () => document.documentElement.scrollHeight - innerHeight;

    /* ---------- Cuộn mượt ---------- */
    let target = scrollY;
    let cur = scrollY;
    let lastSet = scrollY;
    let smoothing = false;
    let lastFrame = 0;

    const stopSmoothing = () => {
      smoothing = false;
      cur = target = lastSet = scrollY;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.shiftKey || e.defaultPrevented) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (performance.now() - lastFrame > 250) return; // trình duyệt không vẽ khung hình → cuộn mặc định
      if (pageLocked() || canScrollInside(e.target, e.deltaY)) return;
      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 40;
      else if (e.deltaMode === 2) d *= innerHeight;
      if (!smoothing) {
        cur = target = lastSet = scrollY;
        smoothing = true;
      }
      target = clamp(target + d, 0, maxScroll());
    };

    const onScroll = () => {
      // cuộn do thứ khác gây ra (kéo thanh cuộn, phím, link #, chuyển trang) → bỏ cuộn mượt
      if (!smoothing || Math.abs(scrollY - lastSet) > 3) stopSmoothing();
    };

    const onKey = (e: KeyboardEvent) => {
      if (['PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) stopSmoothing();
    };

    if (!reduce && !coarse) addEventListener('wheel', onWheel, { passive: false });
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('keydown', onKey);
    resetRef.current = stopSmoothing;

    /* ---------- Hiện dần khi cuộn tới ---------- */
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('sr-in');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    let parallax: HTMLElement[] = [];
    const scan = () => {
      if (reduce) return;
      parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
      const vh = innerHeight;
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        if (el.dataset.sr) return;
        el.dataset.sr = '1';
        // chỉ ẩn những gì đang nằm dưới màn hình, để nội dung phía trên không bị nháy
        if (el.getBoundingClientRect().top < vh) return;
        const parent = el.parentElement;
        const index = parent ? Array.prototype.indexOf.call(parent.children, el) : 0;
        el.style.setProperty('--sr-delay', `${(index % 4) * 80}ms`);
        el.classList.add('sr');
        io.observe(el);
      });
    };
    scanRef.current = scan;

    let scanTimer = 0;
    const mo = new MutationObserver(() => {
      clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scan, 120);
    });
    const main = document.querySelector('main');
    if (main) mo.observe(main, { childList: true, subtree: true });
    scan();

    /* ---------- Vòng lặp khung hình ---------- */
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    let prog = 0;
    let anchor = scrollY;
    let hidden = false;
    let raf = 0;

    const frame = () => {
      lastFrame = performance.now();
      if (smoothing) {
        cur = lerp(cur, target, 0.09);
        if (Math.abs(target - cur) < 0.5) {
          cur = target;
          smoothing = false;
        }
        window.scrollTo(0, cur);
        lastSet = scrollY;
      }

      const y = scrollY;
      const max = maxScroll();
      prog = reduce ? (max > 0 ? y / max : 0) : lerp(prog, max > 0 ? y / max : 0, 0.2);
      if (barRef.current) barRef.current.style.transform = `scaleX(${prog.toFixed(4)})`;

      // ảnh nền trôi chậm hơn nội dung
      if (y < innerHeight * 1.5) {
        parallax.forEach((el) => {
          if (!el.isConnected) return;
          el.style.transform = `translate3d(0, ${(y * Number(el.dataset.parallax || 0.3)).toFixed(1)}px, 0)`;
        });
      }

      if (header) {
        header.toggleAttribute('data-scrolled', y > 12);
        if (y < 240) {
          if (hidden) header.removeAttribute('data-hidden');
          hidden = false;
          anchor = y;
        } else if (!hidden && y - anchor > 80) {
          hidden = true;
          header.setAttribute('data-hidden', '');
          anchor = y;
        } else if (hidden && anchor - y > 40) {
          hidden = false;
          header.removeAttribute('data-hidden');
          anchor = y;
        } else if ((hidden && y > anchor) || (!hidden && y < anchor)) {
          anchor = y;
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(scanTimer);
      removeEventListener('wheel', onWheel);
      removeEventListener('scroll', onScroll);
      removeEventListener('keydown', onKey);
      io.disconnect();
      mo.disconnect();
      header?.removeAttribute('data-hidden');
    };
  }, []);

  // Chuyển trang: dừng cuộn mượt đang dở và quét lại các khối mới
  useEffect(() => {
    resetRef.current();
    const t = window.setTimeout(() => scanRef.current(), 60);
    return () => clearTimeout(t);
  }, [pathname]);

  return <div ref={barRef} className="scroll-progress" aria-hidden="true" />;
}
