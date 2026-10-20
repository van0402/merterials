import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { daysLeft, timeAgo } from '@/lib/sourcing';
import { CloseSourcingPostButton } from '@/components/site/close-sourcing-post-button';
import { SourcingPostDialog } from '@/components/site/sourcing-post-dialog';

// Nhãn và màu cho từng trạng thái
const STATUS_UI = {
  open: { label: 'Đang nhận báo giá', cls: 'border-[#d7ebdf] bg-[#edf8f3] text-[#167a55]' },
  pending: { label: 'Chờ duyệt', cls: 'border-[#efdfae] bg-[#fff8e6] text-[#9c700d]' },
  rejected: { label: 'Bị từ chối', cls: 'border-[#f0d1d1] bg-[#fff1f1] text-[#b74141]' },
  closed: { label: 'Đã đóng', cls: 'border-[#e2e6ea] bg-[#f3f5f7] text-[#667085]' },
  expired: { label: 'Đã hết hạn', cls: 'border-[#e2e6ea] bg-[#f3f5f7] text-[#667085]' },
} as const;

type StatusKey = keyof typeof STATUS_UI;

function statusOf(p: { status: string; expiresAt: Date | null }): StatusKey {
  if (p.status === 'APPROVED') return p.expiresAt && p.expiresAt.getTime() > Date.now() ? 'open' : 'expired';
  if (p.status === 'PENDING') return 'pending';
  if (p.status === 'REJECTED') return 'rejected';
  return 'closed';
}

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default async function MySourcingPostsPage() {
  const userId = (await headers()).get('x-user-id'); // proxy.ts đã gắn sau khi kiểm tra đăng nhập
  if (!userId) redirect('/login');

  const [posts, categories] = await Promise.all([
    prisma.sourcingPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        category: { select: { name: true } },
        quotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            supplierProfile: { select: { id: true, companyName: true, phone: true, contactEmail: true } },
          },
        },
      },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  const rows = posts.map((p) => ({ post: p, status: statusOf(p) }));
  const countOf = (s: StatusKey) => rows.filter((r) => r.status === s).length;

  const summary = [
    { label: 'Tổng bài', value: rows.length, color: 'text-[#25324a]' },
    { label: 'Chờ duyệt', value: countOf('pending'), color: 'text-[#c2410c]' },
    { label: 'Đang nhận báo giá', value: countOf('open'), color: 'text-[#167a55]' },
    { label: 'Cần xử lý', value: countOf('rejected'), color: 'text-[#b74141]' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-1.5 text-[11px] font-black uppercase tracking-[0.13em] text-orange-500">
            Quản lý nhu cầu mua
          </div>
          <h1 className="text-[32px] font-extrabold tracking-tight text-[#25324a]">Bài của tôi</h1>
          <p className="mt-2 text-sm text-[#748196]">
            Theo dõi trạng thái bài đăng, báo giá nhận được và quản lý nhu cầu mua của bạn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/can-mua"
            className="rounded-xl border border-[#e7ecf2] bg-white px-4 py-2.5 text-[13px] font-extrabold text-[#42516a]"
          >
            ← Cần mua
          </Link>
          <SourcingPostDialog categories={categories} />
        </div>
      </div>

      <section className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#e7ecf2] bg-white px-4 py-3.5 shadow-[0_7px_20px_rgba(31,45,61,0.035)]">
            <span className="text-[11.5px] font-bold text-[#748196]">{s.label}</span>
            <strong className={`mt-1 block text-[22px] font-extrabold ${s.color}`}>{s.value}</strong>
          </div>
        ))}
      </section>

      <section className="mt-6 space-y-3">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-[#748196]">
            Bạn chưa đăng nhu cầu mua nào. Bấm &quot;+ Đăng nhu cầu mua&quot; để bắt đầu.
          </div>
        )}

        {rows.map(({ post: p, status }) => {
          const ui = STATUS_UI[status];
          return (
            <article
              key={p.id}
              className={`rounded-[18px] border border-[#e7ecf2] bg-white p-[18px] shadow-[0_10px_30px_rgba(31,45,61,0.055)] ${status === 'closed' || status === 'expired' ? 'opacity-85' : ''}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                <div>
                  <h2 className="max-w-[720px] text-[16.5px] font-bold leading-snug text-[#25324a]">{p.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-2 text-[11.5px] text-[#7a8697]">
                    {[p.category?.name, p.province, `Đăng ${timeAgo(p.createdAt).toLowerCase()}`]
                      .filter(Boolean)
                      .map((t, i) => (
                        <span key={i}>{i > 0 && '· '}{t}</span>
                      ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className={`whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-extrabold ${ui.cls}`}>
                    {ui.label}
                  </span>
                  {status === 'open' && (
                    <span className="text-[11.5px] font-extrabold text-[#8a5b18]">Còn {daysLeft(p.expiresAt)} ngày</span>
                  )}
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line text-[13.2px] leading-relaxed text-[#607087]">{p.content}</p>

              {status === 'rejected' && (
                <div className="mt-3 rounded-xl border border-[#f0d6d6] bg-[#fff7f7] px-3.5 py-3">
                  <div className="text-[11px] font-black uppercase tracking-wide text-[#a83f3f]">Lý do từ chối</div>
                  <p className="mt-1 text-[12.8px] text-[#7b4747]">{p.rejectReason || 'Admin không ghi lý do.'}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f6] pt-3.5 text-[11.5px] text-[#7e8998]">
                <span>
                  {p.quotes.length > 0 && (
                    <b className="mr-3 font-extrabold text-[#c2410c]">{p.quotes.length} báo giá</b>
                  )}
                  {status === 'pending' && `Thời hạn ${p.durationDays} ngày sẽ bắt đầu sau khi admin duyệt.`}
                  {status === 'rejected' && 'Bạn có thể đăng bài mới với nội dung đã chỉnh sửa.'}
                  {(status === 'closed' || status === 'expired') && 'Bài không còn nhận thêm báo giá.'}
                </span>
                {status === 'open' && <CloseSourcingPostButton postId={p.id} />}
              </div>

              {p.quotes.length > 0 && (
                <details open={status === 'open'} className="group mt-4 border-t border-dashed border-[#e6ebf0] pt-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <strong className="text-[13px] text-[#25324a]">Báo giá nhận được</strong>
                    <span className="text-[11.5px] font-bold text-[#c2410c]">
                      <span className="group-open:hidden">Xem báo giá ▾</span>
                      <span className="hidden group-open:inline">Ẩn báo giá ▴</span>
                    </span>
                  </summary>
                  <p className="mt-1 text-[11.5px] text-[#748196]">Chỉ bạn nhìn thấy nội dung này</p>

                  {p.quotes.map((q) => (
                    <div key={q.id} className="relative mt-2.5 rounded-[14px] border border-[#e7ecf2] bg-white py-3.5 pl-[17px] pr-[15px]">
                      <span className="absolute bottom-3.5 left-0 top-3.5 w-[3px] rounded-full bg-[#e8a96e]" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] border border-[#e4eaf1] bg-[#f4f7fa] text-[10.5px] font-black text-[#3f5570]">
                            {initialsOf(q.supplierProfile.companyName)}
                          </div>
                          <div>
                            <div className="text-[13.5px] font-bold text-[#25324a]">{q.supplierProfile.companyName}</div>
                            <span className="mt-0.5 inline-flex rounded-full border border-[#d7ebdf] bg-[#edf8f3] px-1.5 py-0.5 text-[9.5px] font-extrabold text-[#167a55]">
                              ✓ Đã duyệt
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#8a95a4]">{timeAgo(q.createdAt)}</span>
                      </div>
                      <p className="mt-2.5 whitespace-pre-line text-[12.8px] leading-relaxed text-[#56667c] sm:ml-[46px]">{q.message}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dashed border-[#edf0f3] pt-2.5 text-[11.5px] text-[#7b8697] sm:ml-[46px]">
                        <span>☎ <b className="text-[#344054]">{q.supplierProfile.phone}</b></span>
                        {q.supplierProfile.contactEmail && (
                          <span>✉ <b className="text-[#344054]">{q.supplierProfile.contactEmail}</b></span>
                        )}
                        <Link href={`/suppliers/${q.supplierProfile.id}`} className="ml-auto font-extrabold text-[#c2410c]">
                          Xem hồ sơ →
                        </Link>
                      </div>
                    </div>
                  ))}
                </details>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}