# Supply Material (SMEE)

Nền tảng kết nối doanh nghiệp mua và nhà cung cấp B2B tại Việt Nam: danh bạ nhà cung cấp đã duyệt,
tìm kiếm (kể cả bằng AI), yêu cầu báo giá và bảng tin nhu cầu mua "Cần mua".

Ứng dụng là một Next.js 16 monolith (App Router) dùng React 19, TypeScript, PostgreSQL và Prisma.

## Chức năng chính

| Mảng | Mô tả |
| --- | --- |
| Danh bạ nhà cung cấp | Hồ sơ công ty, sản phẩm, danh mục; admin duyệt trước khi hiển thị công khai |
| Tìm kiếm | Tìm theo từ khóa/danh mục/khu vực và "AI Supplier Search" (Gemini) |
| Yêu cầu báo giá (RFQ) | Khách gửi yêu cầu tới công ty; công ty nhận thông báo và email |
| Cần mua | Người dùng đăng nhu cầu mua; admin duyệt; nhà cung cấp đã duyệt gửi báo giá riêng; bài có thời hạn 7/15/30 ngày |
| Quản trị | Duyệt hồ sơ nhà cung cấp, duyệt bài Cần mua, nhập công ty hàng loạt, hộp thư RFQ |
| Thông báo | Chuông thông báo trong ứng dụng và email (Resend hoặc SMTP) |

## Chạy local

Yêu cầu: Node.js 20+, Docker Desktop (PostgreSQL, Redis, MinIO chạy bằng Docker Compose).

```bash
cp .env.example .env        # rồi điền các biến bắt buộc (xem bên dưới)
npm ci
docker compose up -d        # app + db + redis + minio
npm run db:push             # tạo/cập nhật bảng theo prisma/schema
npm run db:seed             # tạo tài khoản admin ban đầu
```

Mở [http://localhost:3000](http://localhost:3000).

Lưu ý:
- Sau khi sửa `.env`, chạy `docker compose up -d app` để container nạp biến mới
  (`docker compose restart` **không** đọc lại `.env`).
- Sau khi đổi schema Prisma, chạy `npm run db:push` rồi `docker compose restart app`.
- Docker Compose ưu tiên biến môi trường của hệ điều hành hơn `.env`; nếu đổi biến mà không có tác dụng,
  kiểm tra xem biến đó có đang được đặt sẵn trong terminal/Windows hay không.

Tài khoản admin seed lấy từ `SEED_ADMIN_EMAIL` và `SEED_ADMIN_PASSWORD`.
Không dùng mật khẩu mặc định ở môi trường thật.

## Lệnh thường dùng

```bash
npm run typecheck   # kiểm tra kiểu TypeScript
npm test            # unit test
npm run build       # build production
npm run db:push     # đồng bộ schema vào database (đặt DATABASE_URL trước khi chạy)
```

## Biến môi trường

Bắt buộc:

- `DATABASE_URL`: chuỗi kết nối PostgreSQL.
- `JWT_SECRET`: khóa ký phiên đăng nhập, tối thiểu 32 ký tự ngẫu nhiên.
- `NEXT_PUBLIC_APP_URL`: URL gốc của website (dùng trong email, liên kết).
- `EMAIL_PROVIDER`: `resend` hoặc `smtp`.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`: khi dùng Resend (domain gửi phải được verify trên Resend).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: khi dùng SMTP.

Tùy chọn:

- `GEMINI_API_KEY`, `GEMINI_MODEL`: AI Supplier Search (gói miễn phí giới hạn khoảng 20 lượt/ngày).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`: đăng nhập bằng Google.
- `MINIO_*`: lưu trữ tệp tải lên.
- `REDIS_URL`, `NEXT_PUBLIC_SOCKET_URL`: thông báo realtime (Socket.IO không chạy trên Vercel).
- `CRON_SECRET`: xác thực các job định kỳ.

Xem [.env.example](./.env.example) để biết danh sách đầy đủ. **Không commit file `.env`.**

## Cấu trúc thư mục

```text
prisma/
  schema/             Schema chia theo mảng (user, supplier, category, sourcing, ...)
  seed.ts             Dữ liệu khởi tạo (admin)
src/
  app/(public)/       Trang công khai: trang chủ, tìm kiếm, danh mục, nhà cung cấp, Cần mua
  app/admin/          Trang quản trị
  app/supplier/       Khu vực dành cho nhà cung cấp
  app/api/            API route handlers
  components/         Thành phần giao diện dùng chung
  lib/                Logic dùng chung (xác thực, email, thông báo, rate-limit, sourcing, ...)
  proxy.ts            Kiểm tra đăng nhập và gắn danh tính cho request
scripts/              Công cụ dòng lệnh (phân loại danh mục, reset mật khẩu admin, ...)
tests/                Unit test
```

## Nguyên tắc xác thực

- `src/proxy.ts` chạy trên mọi `/api/*` và các trang cần đăng nhập. Nó **luôn xóa** header `x-user-id` /
  `x-user-role` do client gửi, rồi chỉ gắn lại khi JWT trong cookie hợp lệ.
- Route handler lấy người dùng qua `requireUser` / `requireAdmin` / `requireSupplier` trong `src/lib/api-auth.ts`.
- Không đọc `x-user-id` ở nơi nào mà `proxy.ts` không chạy.

## Triển khai

- Web chạy trên Vercel; cơ sở dữ liệu PostgreSQL (Neon). Đổi schema thì chạy `npm run db:push`
  với `DATABASE_URL` trỏ tới database cần cập nhật (dùng chuỗi kết nối **direct**, không dùng pooler).
- Thay đổi biến môi trường trên Vercel cần redeploy mới có hiệu lực.

## Ghi chú

Thư mục `docs/` và `wiki/` chứa tài liệu của giai đoạn đầu dự án (nền tảng affiliate ban đầu), một phần
đã lỗi thời. Tài liệu chính xác nhất là README này và mã nguồn.

## License

MIT
