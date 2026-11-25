'use client';

import { useEffect, useRef, useState } from 'react';
import { CategoryShelf } from '@/components/site/category-shelf';
import { Search as SearchIcon, MapPin, ChevronDown, TrendingUp, ShieldCheck, Shield, Package, Factory, FileCheck2, Map as MapIcon, Sparkles, Flame } from 'lucide-react';
import { AnimatedCounter } from '@/components/site/animated-counter';
import { useRouter } from 'next/navigation';
import { useAiSearch } from '@/hooks/useAiSearch';
import { useI18n } from '@/components/i18n-provider';
import { SupplierEntry } from '@/components/site/supplier-entry';

type HeroStat = {
  icon: typeof Shield;
  iconBg: string;
  iconColor: string;
  label: string;
  target?: number;
  suffix?: string;
  value?: string;
};


export type HomeCompany = {
  id: string;
  companyName: string;
  industryRaw: string | null;
  country: string;
  logoUrl: string | null;
  categories: { category: { name: string } }[];
  materials: { name: string }[];
  _count: { materials: number };
};

// Giao diện trang chủ (client). Danh sách công ty do server lấy sẵn ở app/(public)/page.tsx
export function HomeClient({ initialCompanies }: { initialCompanies: HomeCompany[] }) {
  const [mode, setMode] = useState<'product' | 'ai'>('product');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [aiQuery, setAiQuery] = useState('');
  const { analyzing, askAi } = useAiSearch();
  const { t, get } = useI18n();
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((i) => i + 1);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  function scrollCategories(direction: 'left' | 'right') {
    const el = categoriesRef.current;
    if (!el) return;
    const amount = el.clientWidth;
    el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  }

  function doSearch() {
    if (!query.trim()) {
      alert(t('home.hero.emptySearch'));
      return;
    }
    const params = new URLSearchParams({ q: query.trim(), mode });
    router.push(`/tim-kiem?${params.toString()}`);
  }


  const realCompanies = initialCompanies;

  const SHELF_CATEGORIES = [
    { id: '1', slug: 'tu-dong-hoa', name: 'Tự động hóa, Robot & Smart Factory', icon: '⚙', imageUrl: '/images/lap-dat-thiet-bi-cong-nghiep.jpg' },
    { id: '2', slug: 'nhua-polymer', name: 'Nhựa & Polymer', icon: '◈', imageUrl: '/images/nhuaa.jpg' },
    { id: '3', slug: 'may-moc-thiet-bi', name: 'Máy móc & Thiết bị công nghiệp', icon: '⛭', imageUrl: '/images/congnghiep.jpg' },
  ];

  // TẠM (dữ liệu cứng để xem giao diện VIP): thẻ đầu mỗi khối là VIP theo bậc dưới đây.
  // Sau này thay bằng bậc VIP do admin đặt trong DB.
  const HARDCODED_VIP: Record<string, ('DIAMOND' | 'GOLD')[]> = {
    'tu-dong-hoa': ['DIAMOND', 'GOLD'],
    'nhua-polymer': ['DIAMOND'],
    'may-moc-thiet-bi': ['GOLD'],
  };

  const searchExamples =
    (get('home.hero.searchExamples') as string[]) ?? [];

  const aiExamples =
    (get('home.hero.aiExamples') as string[]) ?? [];

  const placeholders =
    (get('home.hero.placeholders') as {
      product: string[];
      supplier: string[];
    }) ?? {
      product: [],
      supplier: [],
    };

  const shelves = SHELF_CATEGORIES.map((category, i) => {
    const companies = realCompanies
      .slice(i * 6, i * 6 + 6)
      .map((c, idx) => ({
        vipTier: HARDCODED_VIP[category.slug]?.[idx] ?? null,
        id: c.id,
        logoUrl: c.logoUrl,
        companyName: c.companyName,
        country: c.country,
        productNames: c.materials.map((m) => m.name),
               tags: c.categories.length > 0
          ? c.categories.map((x) => x.category.name)
          : (c.industryRaw || '')
              .replace(/\([^)]*\)/g, '')
              .split(/[\/,&·]/)
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 2),
        productCount: c._count.materials,
      }));
    return { category: { ...category, _count: { suppliers: companies.length } }, companies };
  }).filter((shelf) => shelf.companies.length > 0);
  return (
    <div className="home-page">
      <main>
        <section className="hero">
          <div className="hero-bg" data-parallax="0.3" aria-hidden="true" />
          <div className="hero-network" aria-hidden="true">
            <svg viewBox="0 0 1040 340" preserveAspectRatio="none">
              <path className="hero-path" d="M10,220 C180,60 340,280 500,140 S800,50 1030,210" />
              <path className="hero-path p2" d="M20,90 C220,270 360,30 580,200 S840,310 1020,80" />
              <path className="hero-path p3" d="M60,290 C220,140 420,260 560,60 S800,140 1000,240" />
            </svg>
          </div>
          <div className="hero-node n1" style={{ left: '8%', top: '90px' }} aria-hidden="true" />
          <div className="hero-node n2" style={{ right: '10%', top: '110px' }} aria-hidden="true" />
          <div className="hero-node n3" style={{ left: '18%', top: '230px' }} aria-hidden="true" />
          <div className="hero-node n4" style={{ right: '20%', top: '220px' }} aria-hidden="true" />

          <div className="hero-chip" style={{ right: '0%', top: '12px', animationDelay: '1.4s' }}>
            <b>{t('home.hero.chip1Title')}</b>
            <span>{t('home.hero.chip1Desc')}</span>
          </div>
          <div className="hero-chip" style={{ left: '2%', top: '58px', animationDelay: '2.2s' }}>
            <b>{t('home.hero.chip2Title')}</b>
            <span>{t('home.hero.chip2Desc')}</span>
          </div>

          <span className="eyebrow">
            {t('home.hero.eyebrow')}
          </span>
          <h1>
            {t('home.hero.title')}
            <br />
            <span className="hero-accent">
              {t('home.hero.titleAccent')}
            </span>
          </h1>
          <p className="lead">
            {t('home.hero.description')}
          </p>

          <div className="search-card">
            <div className="search-toggle-row">
              <div className="search-toggle">
                <button className={mode === 'product' ? 'active' : ''} onClick={() => setMode('product')}>
                  <Package className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  {t('home.hero.productMode')}
                </button>
                <button className={mode === 'ai' ? 'active' : ''} onClick={() => setMode('ai')}>
                  <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  {t('home.hero.aiMode')}
                </button>
              </div>
              <div className="search-verified">
                <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                {t('home.hero.verified')}
              </div>
            </div>
            {mode === 'product' && (
              <>
                <div className="search-row">
                  <SearchIcon className="search-icon" strokeWidth={2} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      placeholders.product.length > 0
                        ? placeholders.product[
                        placeholderIndex % placeholders.product.length
                        ]
                        : ''
                    }
                  />
                  <button type="button" className="search-location">
                    <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {t('home.hero.location')}
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  </button>
                  <button className="btn btn-primary" onClick={doSearch}>
                    <SearchIcon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    {t('home.hero.searchButton')}
                  </button>
                </div>
                <div className="examples">
                  <div className="examples-label">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                    {t('home.hero.highDemand')}
                  </div>
                  <div className="example-pills">
                    {searchExamples.map((ex) => (
                      <button key={ex} onClick={() => setQuery(ex)}>
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {mode === 'ai' && (
              <div className="ai-panel">
                <div className="ai-panel-head">
                  <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  {t('home.hero.aiTitle')}
                </div>
                <textarea
                  className="ai-textarea"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder={t('home.hero.aiPlaceholder')}
                />
                <div className="ai-examples">
                  {aiExamples.map((ex) => (
                    <button key={ex} onClick={() => setAiQuery(ex)}>
                      {ex}
                    </button>
                  ))}
                </div>
                <div className="ai-panel-foot">
                  <button className="btn-ai" onClick={() => askAi(aiQuery)} disabled={analyzing}>
                    <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    {analyzing
                      ? t('home.hero.aiAnalyzing')
                      : t('home.hero.aiAnalyze')}
                  </button>
                </div>
              </div>
            )}
          </div>

         
        </section>

        <section id="categories">
          <div className="container">
            <div className="rounded-[32px] border border-[#f0d3b8] bg-[linear-gradient(180deg,#ffefdc_0%,#fff8f0_55%,#fff_100%)] p-5 shadow-[0_24px_60px_rgba(107,65,26,0.16)] sm:p-8">
              <div className="section-head">
                <div className="flex w-full items-center justify-between gap-4">
                  <h2>Danh mục nguyên vật liệu</h2>
                  <div className="eyebrow">Khám phá nhanh</div>
                </div>
              </div>
              <div className="categories-wrap">
                <button
                  type="button"
                  className="categories-arrow categories-arrow-left"
                  onClick={() => scrollCategories('left')}
                  aria-label="Xem danh mục trước"
                >
                  ‹
                </button>
                <div className="categories" ref={categoriesRef}>
                  <a className="cat-card cat-hot" href="/danh-muc/nhua-polymer">
                    <div className="cat-badge"><Flame className="h-3 w-3" strokeWidth={2.5} />Hot</div>
                    <div className="cat-icon"><img src="/icon/layers.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>Nhựa &amp; Polymer</strong>
                    <span>Hạt nhựa TPE/TPR, masterbatch, khuôn thổi</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/tu-dong-hoa">
                    <div className="cat-icon"><img src="/icon/robotic-arm.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>Tự động hóa, Robot &amp; Smart Factory</strong>
                    <span>Robot công nghiệp, AMR, MES/IoT nhà máy</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card cat-hot" href="/danh-muc/may-moc-thiet-bi">
                    <div className="cat-badge"><Flame className="h-3 w-3" strokeWidth={2.5} />Hot</div>
                    <div className="cat-icon"><img src="/icon/water-pump.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>Máy móc &amp; Thiết bị công nghiệp</strong>
                    <span>Máy ép nhựa, máy nén khí, máy hàn siêu âm</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/hoa-chat-hoa-dau">
                    <div className="cat-icon"><img src="/icon/molecule.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>Hóa chất &amp; Hóa dầu</strong>
                    <span>Chất màu, keo công nghiệp, hóa dầu</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/vat-lieu-moi">
                    <div className="cat-icon"><img src="/icon/recycle.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>Vật liệu mới &amp; Vật liệu đặc biệt</strong>
                    <span>PTFE, vật liệu quang điện, vật liệu công nghệ cao</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/khuon-mau-co-khi">
                    <div className="cat-icon"><img src="/icon/mechanical.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>Khuôn mẫu &amp; Gia công cơ khí chính xác</strong>
                    <span>Khuôn thổi/ép, gia công CNC, cơ khí chính xác</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/dien-dien-tu-cap">
                    <div className="cat-icon"><img src="/icon/electric-panel.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>Điện, Điện tử &amp; Cáp</strong>
                    <span>Dây cáp điện, cảm biến, thiết bị chiếu sáng</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/in-an">
                    <div className="cat-icon"><img src="/icon/print.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>In ấn &amp; Vật liệu in</strong>
                    <span>Máy in nhãn, RFID, vật tư in Flexo</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/cntt-phan-mem-ai">
                    <div className="cat-icon"><img src="/icon/technology.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>CNTT, Phần mềm &amp; AI</strong>
                    <span>Giải pháp IoT nhà máy, AI bảo trì thiết bị</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/an-toan-nang-luong">
                    <div className="cat-icon"><img src="/icon/energy-storage.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>An toàn công nghiệp &amp; Năng lượng</strong>
                    <span>Thiết bị an toàn PCCC, tiết kiệm năng lượng</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/do-luong-kiem-tra">
                    <div className="cat-icon"><img src="/icon/vision.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>Đo lường, Kiểm tra &amp; Machine Vision</strong>
                    <span>3D scan, laser đo lường, kiểm định CNC</span>
                    <div className="cat-arrow">→</div>
                  </a>
                  <a className="cat-card" href="/danh-muc/kho-van-nang-ha">
                    <div className="cat-icon"><img src="/icon/scissor-lift.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                    <strong>Kho vận &amp; Thiết bị nâng hạ</strong>
                    <span>Xe nâng, kho thông minh, ắc quy công nghiệp</span>
                    <div className="cat-arrow">→</div>
                  </a>
                </div>
                <button
                  type="button"
                  className="categories-arrow categories-arrow-right"
                  onClick={() => scrollCategories('right')}
                  aria-label="Xem thêm danh mục"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </section>

        {shelves.length > 0 && (
          <section className="mx-auto max-w-[1320px] max-md:!px-4 py-10">
            <h2 className="mb-1 text-2xl font-black tracking-tight">Công ty tiêu biểu trên hệ thống</h2>
            <p className="mb-5 text-muted-foreground sm:mb-2">Một số nhà cung cấp đã được duyệt và công khai.</p>
            {shelves.map(({ category, companies }, index) => (
              <CategoryShelf
                key={category.id}
                index={index}
                categorySlug={category.slug}
                categoryName={category.name}
                icon={category.icon}
                imageUrl={category.imageUrl}
                supplierCount={category._count.suppliers}
                companies={companies}
              />
            ))}
          </section>
        )}

        <section>
          <div className="container">
            <div className="ai-section">
              <div>
                <div className="eyebrow" style={{ background: '#2a3559', borderColor: '#39466f', color: '#ffd3ae' }}>
                  AI Supplier Matching
                </div>
                <h2>Mô tả nhu cầu như cách bạn vẫn nói.</h2>
                <p>
                  Không cần nhớ tên danh mục hay bộ lọc. Chỉ cần nhập nhu cầu bằng câu tự nhiên, hệ thống tự phân tích
                  nguyên vật liệu, khu vực, quy mô và tiêu chí để gợi ý supplier phù hợp.
                </p>
                <button className="btn btn-primary">Thử tìm bằng AI</button>
              </div>
              <div className="ai-prompt">
                <div className="mini">Yêu cầu của người mua</div>
                <div className="bubble">
                  “Tôi cần nhà cung cấp bao bì carton khoảng 50.000 hộp/tháng ở miền Bắc, ưu tiên doanh nghiệp có thể
                  giao định kỳ.”
                </div>
              </div>
            </div>
          </div>
        </section>

       <SupplierEntry variant="home" />
      </main>
    </div>

  );
}
