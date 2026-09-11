# SMEE Creator Commerce

SMEE quản lý tập trung chương trình KOL/KOC, seller, referral, commission và payout.
Ứng dụng là một Next.js 16 monolith sử dụng React 19, TypeScript, PostgreSQL và Prisma.

## Mô hình kinh doanh

### KOL/KOC giới thiệu bằng link

| Tier | Số đơn hoàn tất | Hoa hồng | Quyền lợi |
| --- | ---: | ---: | --- |
| Standard | 0–4 | 5% | Referral link và dashboard |
| VIP | 5–9 | 6% | Xin hỗ trợ quảng cáo và chăm sóc cá nhân |
| SVIP | Từ 10 | 7% | Toàn bộ quyền VIP và hỗ trợ ekip media |

Tier và quyền lợi được cập nhật tự động khi conversion được ghi nhận hoặc hoàn tiền.

### KOL/KOC trực tiếp bán sản phẩm

1. KOL/KOC gửi seller application.
2. SMEE đánh giá và duyệt/từ chối.
3. Seller đã duyệt được tạo sản phẩm.
4. SMEE thu phí 15–20% doanh thu; mức phí giảm theo doanh thu tích lũy.
5. Nếu seller đồng thời là referrer của chính đơn đó, hệ thống chỉ tạo seller earning.
6. Nếu seller và referrer là hai người khác nhau, seller earning và referral commission được tách riêng.

## Chạy local

Yêu cầu Node.js 20+ và PostgreSQL 14+.

```bash
cp .env.example .env.local
npm ci
npx prisma migrate deploy
npm run db:generate
npm run db:seed
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

Tài khoản seed được điều khiển bằng `SEED_ADMIN_EMAIL` và
`SEED_ADMIN_PASSWORD`. Không sử dụng mật khẩu mặc định trong môi trường thật.

## Lệnh kiểm tra

```bash
npm run typecheck
npm test
npm run build
docker compose build
docker compose up -d
npm run test:e2e
```

## Biến môi trường bắt buộc

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: khóa ký JWT, tối thiểu 32 ký tự ngẫu nhiên.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`: gửi OTP và email giao dịch.
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`: URL ứng dụng và website bán hàng.
- `WEBHOOK_SECRET`: xác minh HMAC cho conversion/refund webhook.
- `CRON_SECRET`: xác thực job mature commission.

Xem [.env.example](./.env.example) để biết danh sách đầy đủ.

## API nghiệp vụ chính

- `POST /api/affiliate/seller`: KOL/KOC gửi hoặc cập nhật seller application.
- `GET|POST /api/affiliate/seller/products`: quản lý sản phẩm seller.
- `GET|PUT /api/admin/sellers`: SMEE đánh giá seller và đặt mức phí 15–20%.
- `POST /api/track/referral`: tạo attribution cho một click.
- `POST /api/track/conversion`: conversion từ tracking SDK.
- `POST /api/webhook/conversion`: conversion webhook có HMAC/API key.
- `POST /api/webhook/refund`: hoàn tiền theo conversion external ID.
- `POST /api/admin/commissions/mature`: mature commission bằng admin hoặc cron.
- `GET|POST|PUT|DELETE /api/admin/payouts`: payout nguyên tử và idempotent.

Mọi conversion, refund, payout và maturation request phải có một
`Idempotency-Key` ổn định. Webhook conversion/refund cũng chấp nhận key trong body.

## Cấu trúc

```text
prisma/
  schema.prisma        Database schema
  migrations/          PostgreSQL migrations
  seed.ts              SMEE development seed
src/
  app/admin/            SMEE dashboard
  app/affiliate/        KOL/KOC portal
  app/api/              Route handlers
  lib/api-auth.ts       requireUser/requireAdmin/requireAffiliate
  lib/commission-policy.ts
  lib/conversion-service.ts
  lib/refund-service.ts
tests/
  unit/
  e2e/
```

## Nguyên tắc an toàn dữ liệu

- Tiền được lưu bằng integer cents.
- Tất cả luồng thay đổi balance dùng Prisma transaction.
- API route không tin `x-user-id` từ client; middleware ghi đè header sau khi xác minh JWT.
- API keys lưu dưới dạng hash.
- Conversion/refund tìm theo external ID, không hoàn tiền theo email khách hàng.
- Click attribution tách khỏi lead referral.

## License

MIT
