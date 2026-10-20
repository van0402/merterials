import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET!
);

// Dùng cho route công khai: không bắt đăng nhập, nhưng KHÔNG bao giờ tin header danh tính do client gửi.
// Có token hợp lệ thì gắn danh tính thật, không thì coi như khách.
async function passWithOptionalIdentity(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete('x-user-id');
    requestHeaders.delete('x-user-role');

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            requestHeaders.set('x-user-id', payload.userId as string);
            requestHeaders.set('x-user-role', payload.role as string);
        } catch {
            // token hỏng hoặc hết hạn: coi như khách
        }
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define protected routes
    const isAdminRoute = pathname.startsWith('/api/admin') || pathname.startsWith('/admin');
    const isSessionRoute = pathname === '/api/auth/me';
    const isSupportApiRoute = pathname.startsWith('/api/support');
    const isNotificationsApiRoute = pathname.startsWith('/api/notifications');
    const isLoginRoute = pathname === '/login';
    const isSupplierApplyRoute = pathname === '/register-supplier' || pathname.startsWith('/supplier') || pathname.startsWith('/api/supplier');
    const isSourcingApiRoute = pathname.startsWith('/api/sourcing'); // API "Cần mua": bắt buộc đăng nhập
    const isSourcingPageRoute = pathname.startsWith('/can-mua/dang-bai') || pathname.startsWith('/can-mua/cua-toi'); // trang đăng bài, bài của tôi
    // Commission maturation is also called by trusted schedulers without a user cookie.
    const cronToken =
        request.headers.get('x-cron-secret') ??
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (
        pathname === '/api/admin/commissions/mature' &&
        cronToken &&
        cronToken === process.env.CRON_SECRET
    ) {
        return NextResponse.next();
    }

            if (!isAdminRoute && !isSessionRoute && !isSupportApiRoute && !isNotificationsApiRoute && !isLoginRoute && !isSupplierApplyRoute && !isSourcingApiRoute && !isSourcingPageRoute) {
        return passWithOptionalIdentity(request);
    }

    // 2. Get token from cookies
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        if (isLoginRoute) return NextResponse.next();

        // If it's an API route, return 401
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }
        // If it's a page route, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // 3. Verify JWT
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userRole = payload.role as string;

        if (isLoginRoute) {
            return NextResponse.redirect(new URL(userRole === 'ADMIN' ? '/admin' : '/', request.url));
        }

        // 4. Role-based access control
        if (isAdminRoute && userRole !== 'ADMIN') {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json(
                    { error: 'Forbidden: Admin access required' },
                    { status: 403 }
                );
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }
        // 5. Forward verified identity to the route handler as request headers.
        // Setting response headers here would expose them to the client but would
        // not make them available through request.headers in API handlers.
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.userId as string);
        requestHeaders.set('x-user-role', userRole);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (error) {
        if (isLoginRoute) return NextResponse.next();

        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/admin/:path*',
        '/api/admin/:path*',
        '/api/auth/me',
        '/api/support/:path*',
        '/api/:path*',
        '/api/notifications/:path*',
        '/login',
        '/register-supplier',
        '/supplier/:path*',
        '/api/supplier/:path*',
        '/api/sourcing/:path*',
        '/can-mua/dang-bai',
        '/can-mua/cua-toi',
    ],
};
