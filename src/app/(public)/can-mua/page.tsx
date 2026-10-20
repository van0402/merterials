import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { Bell, Hourglass, Lock, ShieldCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { SourcingQuoteDialog } from '@/components/site/sourcing-quote-dialog';
import { SOURCING_AREAS, daysLeft, shortName, timeAgo } from '@/lib/sourcing';
import {SourcingPostDialog} from '@/components/site/sourcing-post-dialog';
const PAGE_SIZE = 10;

export default async function SourcingBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; area?: string; page?: string }>;
}) {
  const { q = '', category = '', area = '', page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  // Chỉ lấy bài ĐÃ DUYỆT và CÒN HẠN, rồi áp bộ lọc người dùng chọn
  const where: Prisma.SourcingPostWhereInput = {
    status: 'APPROVED',
    expiresAt: { gt: new Date() },
    ...(q.trim()
      ? {
          OR: [
            { title: { contains: q.trim(), mode: 'insensitive' } },
            { content: { contains: q.trim(), mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(area ? { province: area } : {}),
  };

  const [posts, total, categories] = await Promise.all([
    prisma.sourcingPost.findMany({
      where,
      include: {
        user: { select: { name: true } }, // chỉ lấy tên, sẽ rút gọn trước khi hiển thị
        category: { select: { name: true } },
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.sourcingPost.count({ where }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Tạo đường dẫn sang trang khác mà vẫn giữ bộ lọc
  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (area) params.set('area', area);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/can-mua?${qs}` : '/can-mua';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-5 rounded-[28px] border border-orange-200/70 bg-white/80 p-7 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.14em] text-orange-500">Bảng tin nhu cầu B2B</div>
        <h1 className="mt-2 text-[30px] font-black leading-tight tracking-tight sm:text-[36px]">
          Doanh nghiệp đang cần mua gì?
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-500">
          Đăng nhu cầu mua vật tư, thiết bị hoặc dịch vụ. Nhà cung cấp đã được duyệt có thể gửi báo giá riêng qua hệ
          thống. Thông tin liên hệ không bắt buộc công khai.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SourcingPostDialog categories={categories} />
          <Link
  href="/can-mua/cua-toi"
  className="rounded-xl border border-[#e7ecf2] bg-white px-4 py-3 text-sm font-extrabold text-[#42516a]"
>
  Bài của tôi
</Link>
          <span className="text-sm text-slate-500">{total} nhu cầu đang mở</span>
        </div>
      </section>

      {/* Bộ lọc: form GET, bấm "Tìm bài" thì trang tải lại với ?q=...&category=...&area=... */}
      <form
        action="/can-mua"
        method="GET"
        className="mb-4 grid gap-2.5 rounded-2xl border bg-white p-3.5 sm:grid-cols-[1.5fr_1fr_1fr_auto]"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm nhu cầu, vật liệu, thiết bị..."
          className="h-11 rounded-lg border px-3.5 text-sm outline-none focus:border-orange-300"
        />
        <select name="category" defaultValue={category} className="h-11 rounded-lg border bg-white px-3 text-sm">
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="area" defaultValue={area} className="h-11 rounded-lg border bg-white px-3 text-sm">
          <option value="">Toàn quốc</option>
          {SOURCING_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-lg bg-orange-500 px-5 text-sm font-extrabold text-white">
          Tìm bài
        </button>
      </form>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="space-y-3">
          {posts.map((p) => {
            const short = shortName(p.user.name); // "Nguyễn Văn Hùng" -> "Nguyễn H."
            const initials = short.split(' ').map((w) => w[0]).join('').toUpperCase();
            return (
              <article key={p.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[17px] font-black leading-snug">{p.title}</h2>
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[11.5px] font-bold">
                      {p.category && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{p.category.name}</span>
                      )}
                      {p.province && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{p.province}</span>
                      )}
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                        Còn {daysLeft(p.expiresAt)} ngày
                      </span>
                    </div>
                  </div>
                  {p._count.quotes > 0 && (
                    <div className="shrink-0 text-right">
                      <b className="block text-orange-500">{p._count.quotes} báo giá</b>
                      <span className="text-[11px] text-slate-500">đã gửi riêng</span>
                    </div>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-slate-600">{p.content}</p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#e4eaf1] bg-[#f3f6fa] text-[11px] font-black text-[#344b68]">
                      {initials}
                    </div>
                    <div>
                      <b className="text-[12.5px]">{short}</b>
                      <span className="block text-[11px] text-slate-500">
                        Thành viên đã đăng nhập · {timeAgo(p.createdAt)}
                      </span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[12px] text-slate-500">
                    <Lock className="h-3.5 w-3.5" />
                    Liên hệ qua hệ thống
                  </span>
                  <SourcingQuoteDialog postId={p.id} postTitle={p.title} />
                </div>
              </article>
            );
          })}

          {posts.length === 0 && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Chưa có nhu cầu nào phù hợp. Thử bỏ bớt bộ lọc hoặc quay lại sau.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-sm">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="rounded-lg border bg-white px-3.5 py-2 font-bold">
                  ← Trang trước
                </Link>
              ) : (
                <span />
              )}
              <span className="text-slate-500">
                Trang {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className="rounded-lg border bg-white px-3.5 py-2 font-bold">
                  Trang sau →
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </section>

        <aside className="h-max rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="font-black">Quy tắc bảng tin</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
            Bài đăng chỉ hiển thị sau khi admin duyệt. Không đăng thông tin nhạy cảm hoặc dữ liệu nội bộ không muốn
            công khai.
          </p>
          <div className="mt-4 space-y-2.5">
            {[
              { Icon: Lock, title: 'Báo giá riêng tư', text: 'Chỉ người đăng nhìn thấy báo giá.' },
              { Icon: ShieldCheck, title: 'Nhà cung cấp đã duyệt', text: 'Chỉ nhà cung cấp đã duyệt mới gửi được báo giá.' },
              { Icon: Hourglass, title: 'Có thời hạn', text: 'Bài hết hạn sẽ tự ngừng hiển thị.' },
              { Icon: Bell, title: 'Chuông và email', text: 'Người đăng nhận thông báo khi có báo giá mới.' },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="flex gap-2.5 rounded-xl bg-slate-50 p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <div>
                  <b className="text-[12px]">{title}</b>
                  <span className="mt-0.5 block text-[11px] text-slate-500">{text}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}