'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LEGAL_DOCS, type LegalDocKey } from '@/lib/legal';

// Chữ bấm được (children) -> mở popup nội dung điều khoản / chính sách
const DEFAULT_TRIGGER_CLASS = 'font-semibold text-orange-600 underline-offset-2 hover:underline';

export function LegalDialog({
  doc,
  children,
  className = DEFAULT_TRIGGER_CLASS,
}: {
  doc: LegalDocKey;
  children: React.ReactNode;
  className?: string; // kiểu chữ của nút mở popup (mặc định: chữ cam gạch chân khi rê chuột)
}) {
  const [open, setOpen] = useState(false);
  const data = LEGAL_DOCS[doc];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>

      {open &&
        // Render ra ngoài form để không bị ảnh hưởng bởi hiệu ứng/transform của thẻ cha
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4" onClick={() => setOpen(false)}>
            <div
              className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b px-6 py-4">
                <div>
                  <b className="text-lg font-bold text-[#25324a]">{data.title}</b>
                  <p className="text-xs text-muted-foreground">Cập nhật: {data.updatedAt}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto px-6 py-5 text-[13.5px] leading-relaxed text-[#475569]">
                {data.sections.map((s) => (
                  <section key={s.title}>
                    <h3 className="mb-1.5 text-sm font-bold text-[#25324a]">{s.title}</h3>
                    <div className="space-y-1.5">
                      {s.items.map((item, i) =>
                        item.startsWith('- ') ? (
                          <p key={i} className="pl-4 -indent-3">
                            • {item.slice(2)}
                          </p>
                        ) : (
                          <p key={i}>{item}</p>
                        ),
                      )}
                    </div>
                  </section>
                ))}
              </div>

              <div className="border-t px-6 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-extrabold text-white"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
