'use client';

import { useEffect, useRef, useState } from 'react';
import { CategoryShelf } from '@/components/site/category-shelf';
import { Search as SearchIcon, Camera, MapPin, ChevronDown, TrendingUp, ShieldCheck, Shield, Package, Factory, FileCheck2, Map as MapIcon } from 'lucide-react';
import { AnimatedCounter } from '@/components/site/animated-counter';
import { useRouter } from 'next/navigation';
const SEARCH_EXAMPLES = [
  'Hạt nhựa TPE/TPR',
  'Khuôn thổi chai PET',
  'Nhôm định hình 6063',
  'Cảm biến công nghiệp',
  'Bao bì Carton 5 lớp',
];

const PLACEHOLDER_EXAMPLES = {
  product: [
    'Ví dụ: hạt nhựa TPE chống trượt...',
    'Ví dụ: nhôm định hình 6063-T5...',
    'Ví dụ: bao bì Carton 5 lớp...',
    'Ví dụ: cảm biến công nghiệp...',
  ],
  supplier: [
    'Ví dụ: An Phát Nhựa Kỹ Thuật...',
    'Ví dụ: xưởng ép nhựa tại Bắc Ninh...',
    'Ví dụ: nhà máy gia công CNC...',
    'Ví dụ: đối tác OEM linh kiện...',
  ],
};

type HeroStat = {
  icon: typeof Shield;
  iconBg: string;
  iconColor: string;
  label: string;
  target?: number;
  suffix?: string;
  value?: string;
};

const HERO_STATS: HeroStat[] = [
  { icon: Shield, iconBg: '#fff0df', iconColor: '#f97316', target: 520, suffix: '+', label: 'Xưởng đã kiểm định' },
  { icon: Package, iconBg: '#e0edff', iconColor: '#3b82f6', target: 3200, suffix: '+', label: 'Quy cách nguyên liệu' },
  { icon: FileCheck2, iconBg: '#dcfce7', iconColor: '#16a34a', value: 'ISO / RoHS', label: 'Chuẩn chứng từ xuất' },
  { icon: MapIcon, iconBg: '#f1e6fe', iconColor: '#9333ea', target: 48, suffix: ' KCN', label: 'Bắc - Trung - Nam' },
];

export default function Home() {
  const [mode, setMode] = useState<'product' | 'supplier'>('product');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const categoriesRef = useRef<HTMLDivElement>(null);

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
      alert('Hãy nhập nhu cầu cần tìm nhà cung cấp.');
      return;
    }
    const params = new URLSearchParams({ q: query.trim(), mode });
    router.push(`/tim-kiem?${params.toString()}`);
  }

    const [realCompanies, setRealCompanies] = useState<
    { id: string; companyName: string; industryRaw: string | null; country: string; _count: { materials: number } }[]
  >([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    fetch('/api/public/companies')
      .then((res) => res.json())
      .then((data) => data.success && setRealCompanies(data.companies))
      .finally(() => setLoadingCompanies(false));
  }, []);

    const SHELF_CATEGORIES = [
    { id: '1', slug: 'tu-dong-hoa', name: 'Tự động hóa, Robot & Smart Factory', icon: '⚙', imageUrl: '/images/lap-dat-thiet-bi-cong-nghiep.jpg' },
    { id: '2', slug: 'nhua-polymer', name: 'Nhựa & Polymer', icon: '◈', imageUrl: '/images/nhuaa.jpg' },
    { id: '3', slug: 'may-moc-thiet-bi', name: 'Máy móc & Thiết bị công nghiệp', icon: '⛭', imageUrl: '/images/congnghiep.jpg' },
  ];

  const shelves = SHELF_CATEGORIES.map((category, i) => {
    const companies = realCompanies
      .slice(i * 8, i * 8 + 8)
      .map((c) => ({
        id: c.id,
        companyName: c.companyName,
        specialty: c.industryRaw || 'Chưa cập nhật ngành nghề',
        country: c.country,
        tags: (c.industryRaw || '')
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
            <b>Nhôm định hình 6063</b>
            <span>Máy móc &amp; Thiết bị</span>
          </div>
          <div className="hero-chip" style={{ left: '2%', top: '58px', animationDelay: '2.2s' }}>
            <b>Xưởng ép nhựa</b>
            <span>Bắc Ninh · Hải Phòng</span>
          </div>

          <span className="eyebrow">Hệ sinh thái kết nối 500+ nhà máy sản xuất trực tiếp</span>
          <h1>
            Nền tảng Tìm kiếm &amp; Kết nối
            <br />
            <span className="hero-accent">Nguồn Cung Ứng Vật Liệu B2B Tin Cậy</span>
          </h1>
          <p className="lead">
            Tìm kiếm theo quy cách kỹ thuật, vật tư sản xuất hoặc nhà xưởng trực tiếp — 100% đối tác đều được thẩm định hồ sơ năng lực &amp; pháp lý.
          </p>

          <div className="search-card">
            <div className="search-toggle-row">
              <div className="search-toggle">
                <button className={mode === 'product' ? 'active' : ''} onClick={() => setMode('product')}>
                  <Package className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  Sản phẩm &amp; Vật liệu
                </button>
                <button className={mode === 'supplier' ? 'active' : ''} onClick={() => setMode('supplier')}>
                  <Factory className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  Nhà xưởng &amp; Đối tác
                </button>
              </div>
              <div className="search-verified">
                <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                Kiểm định ISO / RoHS chuẩn B2B
              </div>
            </div>
            <div className="search-row">
              <SearchIcon className="search-icon" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={PLACEHOLDER_EXAMPLES[mode === 'product' ? 'product' : 'supplier'][placeholderIndex % PLACEHOLDER_EXAMPLES[mode === 'product' ? 'product' : 'supplier'].length]}
              />
              <button type="button" className="search-camera" aria-label="Tìm kiếm bằng hình ảnh">
                <Camera className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
              <button type="button" className="search-location">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                Toàn quốc (KCN chính)
                <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              </button>
              <button className="btn btn-primary" onClick={doSearch}>
                <SearchIcon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                Tìm kiếm
              </button>
            </div>
            <div className="examples">
              <div className="examples-label">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                Nhu cầu cao
              </div>
              <div className="example-pills">
                {SEARCH_EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => setQuery(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-stats">
            {HERO_STATS.map((s) => (
              <div className="hero-stat" key={s.label}>
                <div className="hero-stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>
                  <s.icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <strong>{s.target !== undefined ? <AnimatedCounter target={s.target} suffix={s.suffix ?? ''} /> : s.value}</strong>
                  <span>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="categories">
          <div className="container">
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
              <a className="cat-card" href="/danh-muc/tu-dong-hoa">
                <div className="cat-icon"><img src="/icon/robotic-arm.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>Tự động hóa, Robot &amp; Smart Factory</strong>
                <span>Robot công nghiệp, AMR, MES/IoT nhà máy</span>
              </a>
              <a className="cat-card" href="/danh-muc/nhua-polymer">
                <div className="cat-icon"><img src="/icon/layers.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>Nhựa &amp; Polymer</strong>
                <span>Hạt nhựa TPE/TPR, masterbatch, khuôn thổi</span>
              </a>
              <a className="cat-card" href="/danh-muc/may-moc-thiet-bi">
                <div className="cat-icon"><img src="/icon/water-pump.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>Máy móc &amp; Thiết bị công nghiệp</strong>
                <span>Máy ép nhựa, máy nén khí, máy hàn siêu âm</span>
              </a>
              <a className="cat-card" href="/danh-muc/hoa-chat-hoa-dau">
                <div className="cat-icon"><img src="/icon/molecule.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>Hóa chất &amp; Hóa dầu</strong>
                <span>Chất màu, keo công nghiệp, hóa dầu</span>
              </a>
              <a className="cat-card" href="/danh-muc/vat-lieu-moi">
                <div className="cat-icon"><img src="/icon/recycle.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>Vật liệu mới &amp; Vật liệu đặc biệt</strong>
                <span>PTFE, vật liệu quang điện, vật liệu công nghệ cao</span>
              </a>
              <a className="cat-card" href="/danh-muc/khuon-mau-co-khi">
                <div className="cat-icon"><img src="/icon/mechanical.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>Khuôn mẫu &amp; Gia công cơ khí chính xác</strong>
                <span>Khuôn thổi/ép, gia công CNC, cơ khí chính xác</span>
              </a>
              <a className="cat-card" href="/danh-muc/dien-dien-tu-cap">
                <div className="cat-icon"><img src="/icon/electric-panel.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>Điện, Điện tử &amp; Cáp</strong>
                <span>Dây cáp điện, cảm biến, thiết bị chiếu sáng</span>
              </a>
              <a className="cat-card" href="/danh-muc/in-an">
                <div className="cat-icon"><img src="/icon/print.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>In ấn &amp; Vật liệu in</strong>
                <span>Máy in nhãn, RFID, vật tư in Flexo</span>
              </a>
              <a className="cat-card" href="/danh-muc/cntt-phan-mem-ai">
                <div className="cat-icon"><img src="/icon/technology.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>CNTT, Phần mềm &amp; AI</strong>
                <span>Giải pháp IoT nhà máy, AI bảo trì thiết bị</span>
              </a>
              <a className="cat-card" href="/danh-muc/an-toan-nang-luong">
                <div className="cat-icon"><img src="/icon/energy-storage.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>An toàn công nghiệp &amp; Năng lượng</strong>
                <span>Thiết bị an toàn PCCC, tiết kiệm năng lượng</span>
              </a>
              <a className="cat-card" href="/danh-muc/do-luong-kiem-tra">
                <div className="cat-icon"><img src="/icon/vision.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>Đo lường, Kiểm tra &amp; Machine Vision</strong>
                <span>3D scan, laser đo lường, kiểm định CNC</span>
              </a>
              <a className="cat-card" href="/danh-muc/kho-van-nang-ha">
                <div className="cat-icon"><img src="/icon/scissor-lift.png" alt="" className="h-5 w-5 shrink-0 object-contain" /></div>
                <strong>Kho vận &amp; Thiết bị nâng hạ</strong>
                <span>Xe nâng, kho thông minh, ắc quy công nghiệp</span>
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
        </section>

        {loadingCompanies && (
          <section className="mx-auto max-w-[1320px] px-4 py-10">
            <h2 className="mb-1 text-2xl font-black tracking-tight">Công ty tiêu biểu trên hệ thống</h2>
            <p className="mb-2 text-muted-foreground">Một số nhà cung cấp đã được duyệt và công khai.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex animate-pulse flex-col gap-2.5 rounded-[14px] border border-orange-100 bg-white p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 flex-none rounded-[10px] bg-slate-200" />
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                  </div>
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                  <div className="h-5 w-16 rounded-full bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </section>
        )}

        {!loadingCompanies && shelves.length > 0 && (
        <section className="mx-auto max-w-[1320px] px-4 py-10">
  <h2 className="mb-1 text-2xl font-black tracking-tight">Công ty tiêu biểu trên hệ thống</h2>
  <p className="mb-2 text-muted-foreground">Một số nhà cung cấp đã được duyệt và công khai.</p>
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
                <div className="ai-result">
                  <span>📦 Bao bì carton</span>
                  <span>📍 Miền Bắc</span>
                  <span>📈 50.000 hộp/tháng</span>
                  <span>🚚 Giao định kỳ</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container cta">
          <h2>Bạn là nhà cung cấp?</h2>
          <p>Tạo hồ sơ doanh nghiệp, giới thiệu năng lực và tiếp cận khách hàng đang có nhu cầu nguyên vật liệu thực tế.</p>
          <div className="cta-actions">
            <button className="btn btn-primary">Đăng ký nhà cung cấp</button>
            <button className="btn btn-ghost">Tìm hiểu thêm</button>
          </div>
        </div>
      </main>
    </div>
    
  );
}
