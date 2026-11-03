# Luồng hoạt động của người dùng — Supply Merterial (SMEE)

Tài liệu mô tả đầy đủ các thao tác mà từng loại tài khoản có thể làm trên web, dựa theo đúng code hiện tại (không phải kế hoạch hay mong muốn). Có 3 loại tài khoản: **Người mua (USER)**, **Doanh nghiệp (SUPPLIER)**, **Admin**.

> Lưu ý quan trọng về cơ chế: khi một Người mua nộp hồ sơ đăng ký làm nhà cung cấp, tài khoản của họ **vẫn giữ role USER** cho tới khi admin duyệt. Role chỉ đổi thành `SUPPLIER` đúng lúc admin bấm duyệt ở `/admin/sellers`. Trong lúc chờ duyệt, họ vẫn vào được `/supplier/dashboard` — coi như màn hình "theo dõi tiến trình đăng ký", không phải khu vực dành riêng cho nhà cung cấp đã được xác nhận.

---

## A. Tài khoản Người mua (role: USER) — mặc định sau khi đăng ký

### 1. Đăng ký / đăng nhập
- **Đăng ký**: `/register` — bằng email + mật khẩu, hoặc nút Google (OAuth). Phải xác thực email qua mã OTP gửi về hộp thư (`/verify-email`) trước khi dùng được tài khoản email/mật khẩu.
- **Đăng nhập**: `/login` — email + mật khẩu, hoặc Google. Sai mật khẩu bị giới hạn số lần thử (rate limit) để chống brute-force.
- **Quên mật khẩu**: gửi email đặt lại mật khẩu (qua Resend).
- **Đăng xuất**: xoá phiên, các trang cần đăng nhập sẽ chuyển về `/login`.

### 2. Duyệt web công khai (không bắt buộc đăng nhập)
- Trang chủ `/`: danh mục ngành nghề, công ty/sản phẩm nổi bật.
- Danh sách nhà cung cấp `/suppliers`: tìm theo tên, lọc theo ngành nghề/khu vực/loại hình doanh nghiệp, sắp xếp, phân trang.
- Chi tiết nhà cung cấp `/suppliers/[id]`: thông tin công ty, sản phẩm, năng lực, thông tin liên hệ.
- Sản phẩm: danh sách `/products`, chi tiết `/products/[id]` (lọc theo giá, danh mục, công ty đã xác minh).
- Trang theo danh mục `/danh-muc/[slug]`: công ty thuộc đúng ngành đó.
- Tìm kiếm bằng AI `/tim-kiem`: nhập câu tiếng Việt tự nhiên, AI trả công ty/sản phẩm phù hợp (dùng gói miễn phí Gemini, giới hạn khoảng 20 lượt/ngày).

### 3. Gửi yêu cầu báo giá (RFQ)
- Bấm "Liên hệ" ở một công ty hoặc sản phẩm → điền nội dung, gửi.
- **Gửi được cả khi chưa đăng nhập** (nhập tên, điện thoại, email khách).
- Có giới hạn gửi liên tiếp (chống spam).
- Nhà cung cấp nhận được: email báo (trả lời email là gửi thẳng cho khách) + thông báo real-time trong dashboard.

### 4. Đăng bài "Cần mua"
- `/can-mua/dang-bai` (bắt buộc đăng nhập): điền tiêu đề, nội dung, thời hạn → bài ở trạng thái **chờ duyệt**.
- Sau khi admin duyệt: bài hiện công khai, nhưng **ẩn email/số điện thoại** người đăng với khách vãng lai.
- Nhà cung cấp xem bài công khai và gửi báo giá cho người đăng.
- `/can-mua/cua-toi`: người đăng xem các bài của mình và báo giá nhận được — **chỉ người đăng thấy báo giá của chính mình**, người khác không xem được.
- Bài tự động ẩn khi quá hạn.

### 5. Trở thành nhà cung cấp
- Vào `/register-supplier` → form đăng ký 4 bước: thông tin công ty, ngành nghề & năng lực, tải giấy tờ (giấy ĐKKD dạng PDF/ảnh, hồ sơ năng lực, logo, chứng nhận ISO/CE/RoHS...), bắt buộc điền **người liên hệ**.
- Giới hạn file: PNG/JPG/WEBP/PDF, tối đa 10MB/file.
- Gửi xong → tạo hồ sơ `SupplierProfile` trạng thái **PENDING**, vào thẳng `/supplier/dashboard` để theo dõi (xem mục B bên dưới) — nhưng **chưa hiện công khai** trên web, role vẫn là USER.

### 6. Thông báo
- Có sự kiện liên quan (được trả lời RFQ, bài Cần mua có báo giá mới...) → hiện thông báo tức thời trên "mascot" góc màn hình (qua socket.io), không cần tải lại trang.

---

## B. Tài khoản Doanh nghiệp / Nhà cung cấp (role: SUPPLIER)

Có được **sau khi admin duyệt** hồ sơ ở mục A.5. Trước khi duyệt, tài khoản vẫn là USER và chỉ thấy bản "đang chờ xử lý" của các mục dưới đây.

### 1. Kích hoạt
- Admin duyệt ở `/admin/sellers` → role đổi `USER → SUPPLIER`, hồ sơ chuyển `PENDING → APPROVED`, công ty **hiện công khai ngay** trên `/suppliers`, `/products`, trang chủ, trang danh mục.
- Nếu bị **từ chối**: hồ sơ chuyển `REJECTED`, người nộp thấy lý do từ chối trong dashboard, công ty không hiện công khai. Admin có thể **tạm khóa** (`SUSPENDED`) một công ty đang hoạt động nếu cần.

### 2. Dashboard tổng quan — `/supplier/dashboard`
- Số liệu thật: số sản phẩm đang đăng, tổng số yêu cầu báo giá đã nhận.
- Checklist hoàn thiện hồ sơ (ngành nghề, hồ sơ năng lực, chứng nhận).
- Timeline trạng thái: đăng ký → khai báo → admin kiểm tra → kích hoạt.

### 3. Quản lý hồ sơ công ty — `/supplier/dashboard/profile`
- Sửa thông tin công ty: mô tả, số điện thoại, người liên hệ, ngành nghề, năng lực.
- Đổi logo, ảnh bìa, thêm/xóa ảnh trong thư viện ảnh.
- Xem trạng thái từng giấy tờ đã nộp, tải thêm giấy tờ mới.
  - *Ảnh (logo, ảnh bìa, ảnh sản phẩm) vẫn là link công khai dạng `/files/smee/...`.*
  - *Giấy tờ pháp lý (giấy ĐKKD, hồ sơ năng lực, chứng nhận) xem qua đường dẫn riêng `/api/supplier/documents/...`, chỉ admin hoặc chính chủ hồ sơ mới mở được — người khác bị từ chối.*

### 4. Quản lý sản phẩm — `/supplier/dashboard/products`
- Thêm sản phẩm mới (`.../products/new`): tên, giá (khoảng min–max), đơn vị, mô tả, ảnh, ngành hàng.
- Sửa / ẩn / xóa sản phẩm (`.../products/[id]/edit`).
- **Chỉ sản phẩm `isActive = true` VÀ công ty đã `APPROVED`** mới hiện ở `/products` và trang chi tiết công ty — nếu công ty còn PENDING, sản phẩm thêm vào vẫn nằm im, không ai bên ngoài thấy.

### 5. Quản lý yêu cầu báo giá — `/supplier/dashboard/inquiries`
- Xem danh sách RFQ khách gửi (cả khách vãng lai lẫn người mua đã đăng nhập).
- Nhận thông báo mascot + email khi có RFQ mới.

### 6. Phản hồi "Cần mua"
- Xem các bài đăng "Cần mua" công khai, gửi báo giá cho người đăng bài.

---

## C. Tài khoản Admin (nội bộ SMEE)

Đăng nhập cùng `/login`, khác ở `role = ADMIN`. Mọi trang `/admin/*` và API `/api/admin/*` đều bị chặn nếu không phải admin (401/403).

### 1. Dashboard — `/admin`
- Số liệu thật (không phải số giả): tổng hồ sơ, đã duyệt, chờ duyệt, số RFQ trong tháng, RFQ chờ xử lý, bài "Cần mua" chờ duyệt.
- Danh sách 5 công ty mới nhất, link thẳng tới trang sửa.
- Thanh bên hiện số đếm cạnh "Duyệt doanh nghiệp" / "Duyệt bài Cần mua" khi có việc đang chờ (ẩn khi về 0).

### 2. Quản lý thành viên — `/admin/companies`
- Xem/tìm/sửa mọi công ty (cả tự đăng ký lẫn admin nhập tay qua Import Excel).
- Xem giấy tờ đã nộp của từng công ty (qua link an toàn, không phải link công khai).

### 3. Duyệt doanh nghiệp — `/admin/sellers`
- 4 tab: Chờ duyệt / Đã duyệt / Từ chối / Tạm khóa.
- **Duyệt**: role lên SUPPLIER, công ty công khai ngay.
- **Từ chối**: kèm lý do, người nộp thấy lý do trong dashboard của họ.
- Có thao tác hàng loạt (chọn nhiều hồ sơ duyệt/từ chối cùng lúc).

### 4. Duyệt bài "Cần mua" — `/admin/sourcing`
- Duyệt hoặc từ chối bài đăng trước khi nó hiện công khai.

### 5. RFQ / Leads — `/admin/inquiries`
- Xem toàn bộ yêu cầu báo giá phát sinh trong hệ thống (không chỉ của một công ty).

### 6. Import Excel — `/admin/import`
- Nhập hàng loạt công ty từ file Excel mẫu, tạo thành hồ sơ nháp để duyệt tiếp như hồ sơ tự đăng ký.

### 7. Vận hành hạ tầng (làm qua SSH, không phải giao diện web)
- Deploy bản mới lên VPS, sao lưu database + ảnh hằng đêm, theo dõi log, quay lại bản cũ khi có lỗi.

---

## Cơ chế dùng chung cho cả 3 loại tài khoản
- **Thông báo thời gian thực**: mascot góc màn hình báo ngay khi có sự kiện liên quan (RFQ mới, báo giá mới...), qua socket.io, không cần tải lại trang.
- **Giới hạn số lần thử**: áp dụng cho đăng nhập, đăng ký, quên mật khẩu, gửi RFQ liên tiếp — chống brute-force và spam.
- **Giới hạn file tải lên**: chỉ nhận PNG/JPG/WEBP/PDF, tối đa 10MB/file; đuôi file được xác định theo nội dung thật (MIME type), không theo tên người dùng đặt, để chặn file giả dạng.

## Phần đã có trong code nhưng chưa thật sự hoạt động (để không hiểu nhầm là đã xong)
- `/admin/suppliers`: trang dùng dữ liệu giả, không nối với thanh điều hướng admin — không dùng trong thực tế.
- `/admin/support` và khung chat hỗ trợ (`support-chat-widget`): đã viết code nhưng chưa được gắn vào trang nào cho người dùng thấy.
- Tính năng Yêu thích (Favorite) và Đánh giá (Review): có sẵn trong database nhưng chưa có giao diện để dùng.
- Trang Tin tức (`/news`): không tồn tại trong code hiện tại, dù có nhắc tới trước đây — cần xác nhận lại nếu vẫn muốn làm.
