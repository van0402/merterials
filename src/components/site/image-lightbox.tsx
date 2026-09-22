'use client';

import { useEffect, useState } from 'react';

interface ImageLightboxProps {
  images: string[];
}

export function ImageLightbox({ images }: ImageLightboxProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function close() {
    setOpenIndex(null);
  }
  function prev() {
    setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }
  function next() {
    setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
  }

  useEffect(() => {
    if (openIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [openIndex, images.length]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt=""
            onClick={() => setOpenIndex(i)}
            className="h-[110px] w-full cursor-pointer rounded-xl object-cover transition hover:opacity-80"
          />
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ✕
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:left-6"
          >
            ‹
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[openIndex]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:right-6"
          >
            ›
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {openIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}