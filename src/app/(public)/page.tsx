'use client';

import { useRef, useState } from 'react';
import { CategoryShelf } from '@/components/site/category-shelf';

const SEARCH_EXAMPLES = [
  'Hạt nhựa TPE/TPR chống trượt',
  'Máy ép nhựa Injection 120 tấn',
  'Khuôn thổi chai PET 500ml',
  'Cảm biến quang điện công nghiệp',
];

export default function Home() {
  const [mode, setMode] = useState<'product' | 'supplier'>('product');
  const [query, setQuery] = useState('');
  const categoriesRef = useRef<HTMLDivElement>(null);

  function scrollCategories(direction: 'left' | 'right') {
    const el = categoriesRef.current;
    if (!el) return;
    const amount = el.clientWidth;
    el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  }

  function demoSearch() {
    alert(query ? `Demo tìm kiếm (${mode === 'product' ? 'Sản phẩm' : 'Nhà cung cấp'}): ${query}` : 'Hãy nhập nhu cầu cần tìm nhà cung cấp.');
  }
  const shelves = [
  {
    category: { id: '1', slug: 'tu-dong-hoa', name: 'Tự động hóa, Robot & Smart Factory', icon: '⚙', _count: { suppliers: 42 } },
    companies: [
      { id: '1', companyName: 'Việt Automation Solutions', specialty: 'Hệ thống tự động hóa nhà máy' },
      { id: '2', companyName: 'Hanel Robotics', specialty: 'Cobot & tay máy công nghiệp' },
      { id: '3', companyName: 'Sao Mai Smart Factory', specialty: 'Giải pháp MES & IoT nhà máy' },
      { id: '4', companyName: 'Đông Dương Mechatronics', specialty: 'Kỹ thuật cơ điện tử' },
      { id: '5', companyName: 'VinaTech Vision Systems', specialty: 'Machine vision & kiểm tra' },
      { id: '6', companyName: 'FPT Industrial IoT', specialty: 'Nền tảng IoT công nghiệp' },
      { id: '7', companyName: 'Thăng Long Automation', specialty: 'Tủ điện & điều khiển PLC' },
      { id: '8', companyName: 'MTech Robotics Việt Nam', specialty: 'AMR & kho thông minh' },
    ],
  },
  {
    category: { id: '2', slug: 'nhua-polymer', name: 'Nhựa & Polymer', icon: '◈', _count: { suppliers: 28 } },
    companies: [
      { id: '9', companyName: 'Đồng Nai Polymer', specialty: 'Hạt nhựa kỹ thuật' },
      { id: '10', companyName: 'An Phát Nhựa Kỹ Thuật', specialty: 'TPE / TPR chuyên dụng' },
      { id: '11', companyName: 'Nam Việt Masterbatch', specialty: 'Hạt màu & phụ gia nhựa' },
      { id: '12', companyName: 'Tiền Phong Compounding', specialty: 'Phối trộn vật liệu polymer' },
      { id: '13', companyName: 'Long Thành TPE/TPR', specialty: 'Nhựa đàn hồi nhiệt dẻo' },
      { id: '14', companyName: 'Bình Dương Extrusion', specialty: 'Công nghệ đùn nhựa' },
      { id: '15', companyName: 'Việt Hưng Nhựa Công Nghiệp', specialty: 'Nhựa kỹ thuật đa dụng' },
      { id: '16', companyName: 'Sài Gòn Polyme Xanh', specialty: 'Polymer tái sinh' },
    ],
  },
  {
    category: { id: '3', slug: 'may-moc-thiet-bi', name: 'Máy móc & Thiết bị công nghiệp', icon: '⛭', _count: { suppliers: 19 } },
    companies: [
      { id: '17', companyName: 'Hòa Phát Máy Công Nghiệp', specialty: 'Máy ép nhựa & khuôn mẫu' },
      { id: '18', companyName: 'Đại Việt Air Compressor', specialty: 'Máy nén khí công nghiệp' },
      { id: '19', companyName: 'Thành Công Cơ Điện', specialty: 'Thiết bị cơ điện nhà xưởng' },
      { id: '20', companyName: 'Vạn Xuân Machinery', specialty: 'Phụ tùng máy công nghiệp' },
      { id: '21', companyName: 'Sông Hồng Thiết Bị CN', specialty: 'Thiết bị dây chuyền sản xuất' },
      { id: '22', companyName: 'Phú Thái Ultrasonic', specialty: 'Máy hàn siêu âm' },
      { id: '23', companyName: 'Việt Á Máy Ép', specialty: 'Máy ép nhựa Injection' },
      { id: '24', companyName: 'Kim Long Industrial', specialty: 'Thiết bị & phụ tùng máy' },
    ],
  },
];

  return (
    <div className="home-page">
      <main>
               <section className="hero">
          <span className="eyebrow">Nền tảng tìm nhà cung cấp B2B</span>
          <h1>
            Công cụ tìm kiếm B2B đáng tin cậy của bạn
          </h1>
          <p className="lead">
            Tìm theo sản phẩm cụ thể hoặc theo tên công ty — mọi nhà cung cấp trên hệ thống đều đã qua xác minh hồ sơ.
          </p>

          <div className="search-card">
            <div className="search-toggle">
              <button className={mode === 'product' ? 'active' : ''} onClick={() => setMode('product')}><img src="/icon/order.png" alt="" className="h-5 w-5 shrink-0 object-contain" />Sản phẩm</button>
              <button className={mode === 'supplier' ? 'active' : ''} onClick={() => setMode('supplier')}><img src="/icon/global-connection.png" alt="" className="h-5 w-5 shrink-0 object-contain" />Nhà cung cấp</button>
            </div>
            <div className="search-row">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === 'product' ? 'Ví dụ: hạt nhựa TPE chống trượt, khuôn thổi PET 500ml...' : 'Ví dụ: An Phát Nhựa Kỹ Thuật, Hanel Robotics...'}
              />
              <button className="btn btn-primary" onClick={demoSearch}>Tìm kiếm</button>
            </div>
            <div className="examples">
              <div className="examples-label">Tìm kiếm phổ biến</div>
              <div className="example-pills">
                {SEARCH_EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => setQuery(ex)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="container stats">
          <div className="stat"><strong>512+</strong><span>Nhà cung cấp đã xác minh</span></div>
          <div className="stat"><strong>12</strong><span>Ngành hàng công nghiệp</span></div>
          <div className="stat"><strong>2.400+</strong><span>Sản phẩm &amp; vật liệu</span></div>
          <div className="stat"><strong>48</strong><span>Tỉnh, thành phố</span></div>
        </div>

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

        <section className="mx-auto max-w-6xl px-4 py-10">
  <h2 className="mb-1 text-2xl font-black tracking-tight">Khám phá theo công ty theo ngành nổi bật</h2>
  <p className="mb-2 text-muted-foreground">3 ngành đang có nhiều nhà cung cấp nhất trên hệ thống.</p>
  {shelves.map(({ category, companies }, index) => (
    <CategoryShelf
      key={category.id}
      index={index}
      categorySlug={category.slug}
      categoryName={category.name}
      icon={category.icon}
      supplierCount={category._count.suppliers}
      companies={companies}
    />
  ))}
</section>

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
