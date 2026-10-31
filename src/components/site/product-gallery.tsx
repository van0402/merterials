'use client';

import { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  alt: string;
  from: string; // màu nền khi chưa có ảnh
  to: string;
  icon: string; // icon theo ngành, rỗng thì không hiện
}

export function ProductGallery({ images, alt, from, to, icon }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const hasImages = images.length > 0;

  return (
    <div>
      <div
        className="relative h-[300px] overflow-hidden rounded-2xl border border-[#e8ebf0] sm:h-[400px]"
        style={hasImages ? undefined : { background: `linear-gradient(120deg, ${from}, ${to})` }}
      >
        {hasImages ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[index]} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <>
            {icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/icon/${icon}.png`}
                alt=""
                className="absolute bottom-2.5 right-8 h-[230px] w-[230px] -rotate-6 opacity-[0.16] mix-blend-multiply"
              />
            )}
            <span className="absolute bottom-3.5 left-3.5 rounded-full bg-white/90 px-3 py-1 text-[11.5px] font-semibold text-[#4a5b75]">
              Nhà cung cấp chưa đăng ảnh sản phẩm
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-[60px] w-[76px] flex-none overflow-hidden rounded-[10px] border-2 ${i === index ? 'border-[#ea6a12]' : 'border-[#e8ebf0]'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}