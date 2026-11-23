import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://supply.smee.vn';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Trang riêng tư, không cho Google vào
      disallow: ['/admin', '/supplier', '/api', '/login', '/register', '/verify-email', '/can-mua/cua-toi'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}