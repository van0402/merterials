'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type SupplierStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

type SessionUser = {
  hasSupplierProfile: boolean;
  supplierStatus: SupplierStatus | null;
};

type Props = {
  variant?: 'link' | 'home';
  className?: string;
};

const entries = {
  DRAFT: {
    label: 'Hoàn thiện hồ sơ',
    href: '/supplier/dashboard/profile',
  },
  PENDING: {
    label: 'Xem trạng thái hồ sơ',
    href: '/supplier/dashboard',
  },
  APPROVED: {
    label: 'Quản lý gian hàng',
    href: '/supplier/dashboard',
  },
  REJECTED: {
    label: 'Cập nhật hồ sơ',
    href: '/supplier/dashboard/profile',
  },
  SUSPENDED: {
    label: 'Xem trạng thái tài khoản',
    href: '/supplier/dashboard',
  },
};

export function SupplierEntry({
  variant = 'link',
  className,
}: Props) {
  const pathname = usePathname();
  const [session, setSession] = useState<{
    user: SessionUser | null;
    checkedPath: string;
  } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setFailed(false);

      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok && response.status !== 401) {
          throw new Error('Không thể kiểm tra tài khoản');
        }

        const data = response.ok ? await response.json() : null;

        if (!controller.signal.aborted) {
          setSession({
            user: data?.user ?? null,
            checkedPath: pathname,
          });
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }

    void load();

    return () => controller.abort();
  }, [pathname]);

  if (failed) {
    return (
      <Link href="/register-supplier" className={className}>
        Mở khu vực nhà cung cấp
      </Link>
    );
  }

  if (!session || session.checkedPath !== pathname) {
    return (
      <span className={className} aria-busy="true">
        Đang kiểm tra…
      </span>
    );
  }

  const user = session.user;
  const status = user?.supplierStatus;
  const entry = user?.hasSupplierProfile
    ? entries[status ?? 'PENDING']
    : {
        label: 'Đăng ký nhà cung cấp',
        href: '/register-supplier',
      };

  if (variant === 'link') {
    return (
      <Link href={entry.href} className={className}>
        {entry.label}
      </Link>
    );
  }

  const approved = status === 'APPROVED';
  const title = approved
    ? 'Phát triển gian hàng của bạn'
    : user?.hasSupplierProfile
      ? 'Hồ sơ nhà cung cấp của bạn'
      : 'Bạn là nhà cung cấp?';

  const description = approved
    ? 'Bổ sung sản phẩm và cập nhật hồ sơ để khách hàng hiểu rõ năng lực doanh nghiệp.'
    : status === 'PENDING'
      ? 'Hồ sơ đang chờ xét duyệt. Bạn có thể theo dõi trạng thái tại đây.'
      : status === 'REJECTED'
        ? 'Xem lý do xét duyệt và cập nhật hồ sơ doanh nghiệp.'
        : status === 'SUSPENDED'
          ? 'Gian hàng đang tạm khóa. Vui lòng xem thông tin trong trang quản lý.'
          : status === 'DRAFT'
            ? 'Tiếp tục hoàn thiện thông tin doanh nghiệp của bạn.'
            : 'Tạo hồ sơ doanh nghiệp, giới thiệu năng lực và tiếp cận khách hàng có nhu cầu.';

  return (
    <div className="container cta">
      <h2>{title}</h2>
      <p>{description}</p>

      <div className="cta-actions">
        <Link
          href={
            approved
              ? '/supplier/dashboard/products/new'
              : entry.href
          }
          className="btn btn-primary"
        >
          {approved ? 'Đăng sản phẩm' : entry.label}
        </Link>

        {approved && (
          <Link
            href="/supplier/dashboard/profile"
            className="btn btn-ghost"
          >
            Quản lý hồ sơ
          </Link>
        )}
      </div>
    </div>
  );
}