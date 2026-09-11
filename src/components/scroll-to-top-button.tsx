'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SHOW_AFTER_PX = 420;

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Button
      type="button"
      size="icon"
      aria-label="Kéo lên đầu trang"
      title="Kéo lên đầu trang"
      onClick={scrollToTop}
      className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full border border-white/70 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 text-white shadow-2xl shadow-orange-950/25 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-orange-500/35 sm:bottom-7 sm:right-7 ${
        visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
