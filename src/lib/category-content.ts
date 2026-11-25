// Nội dung giới thiệu cho từng trang danh mục (phục vụ SEO: trang có nội dung thật, không chỉ danh sách thẻ).
// Khoá là slug của danh mục. Nội dung mang tính tổng quan, không nêu số liệu hay cam kết riêng của SMEE.

export interface CategoryContent {
  intro: string[];
  uses: string[];
  tips: string[];
}

const COMMON_TIPS = [
  'Gửi yêu cầu báo giá cho 2–3 nhà cung cấp để so sánh giá, thời gian giao hàng và điều kiện thanh toán.',
  'Ưu tiên nhà cung cấp có hồ sơ doanh nghiệp rõ ràng; trên Supply Material, mọi nhà cung cấp hiển thị đều đã được SMEE duyệt hồ sơ.',
];

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  'tu-dong-hoa': {
    intro: [
      'Tự động hóa là nhóm giải pháp giúp nhà máy giảm thao tác thủ công, giữ chất lượng ổn định và theo dõi sản xuất theo thời gian thực. Danh mục này gồm robot công nghiệp, cobot, robot tự hành AMR/AGV, hệ thống MES, IoT nhà máy, cảm biến, PLC, biến tần và các thiết bị điều khiển.',
      'Nhu cầu tự động hóa thường bắt đầu từ một bài toán cụ thể như thiếu nhân công ở công đoạn lặp lại, sai lỗi do thao tác tay hoặc cần số liệu sản xuất chính xác để ra quyết định.',
    ],
    uses: [
      'Dây chuyền lắp ráp, đóng gói, xếp pallet',
      'Vận chuyển nội bộ bằng AMR/AGV',
      'Giám sát sản lượng, hiệu suất thiết bị (OEE) và bảo trì dự đoán bằng IoT',
      'Kiểm tra chất lượng bằng thị giác máy',
    ],
    tips: [
      'Xác định rõ bài toán (năng suất, độ chính xác, nhân công) trước khi xin báo giá.',
      'Hỏi về khả năng tích hợp với PLC, MES, ERP đang dùng và thời gian đào tạo vận hành.',
      'Yêu cầu thông tin bảo hành, hỗ trợ kỹ thuật và ví dụ dự án tương tự đã triển khai.',
      ...COMMON_TIPS,
    ],
  },
  'nhua-polymer': {
    intro: [
      'Nhựa và polymer là nguyên liệu nền của rất nhiều ngành: bao bì, đồ gia dụng, ô tô, điện tử, xây dựng. Danh mục này gồm hạt nhựa nguyên sinh và tái sinh, compound, masterbatch (hạt màu), TPE/TPR, PVC cùng các phụ gia và vật liệu polymer kỹ thuật.',
      'Chọn đúng loại nhựa quyết định độ bền, độ dẻo, khả năng chịu nhiệt và chi phí của sản phẩm cuối. Cùng một nhóm nhựa có thể có nhiều mác khác nhau với chỉ số chảy (MFI) và tính chất cơ lý khác nhau.',
    ],
    uses: [
      'Ép phun, ép đùn, thổi màng và thổi chai',
      'Sản xuất bao bì, đồ nhựa gia dụng, linh kiện kỹ thuật',
      'Pha màu sản phẩm bằng masterbatch',
      'Gia công cao su nhiệt dẻo TPE/TPR cho đế giày, gioăng, tay cầm',
    ],
    tips: [
      'Nêu rõ ứng dụng, phương pháp gia công và yêu cầu tiếp xúc thực phẩm (nếu có) khi hỏi mua.',
      'Yêu cầu bảng thông số kỹ thuật (TDS) và mẫu thử trước khi đặt số lượng lớn.',
      'Hỏi về số lượng đặt tối thiểu, quy cách đóng bao và thời gian giao hàng.',
      ...COMMON_TIPS,
    ],
  },
  'may-moc-thiet-bi': {
    intro: [
      'Máy móc và thiết bị công nghiệp là nhóm đầu tư lớn của nhà máy, từ máy ép nhựa, máy nén khí, máy hàn siêu âm đến máy đóng gói, máy cắt và thiết bị phụ trợ. Danh mục này kết nối bạn với nhà sản xuất, nhà phân phối và đơn vị lắp đặt, bảo trì.',
      'Ngoài giá máy, chi phí vòng đời gồm điện năng, vật tư tiêu hao, bảo dưỡng và thời gian dừng máy cũng ảnh hưởng đáng kể tới hiệu quả đầu tư.',
    ],
    uses: [
      'Trang bị mới hoặc mở rộng dây chuyền sản xuất',
      'Thay thế máy cũ, nâng cấp công suất',
      'Thiết bị phụ trợ: nén khí, làm mát, hút bụi, gia nhiệt',
      'Dịch vụ lắp đặt, bảo trì, cung cấp phụ tùng thay thế',
    ],
    tips: [
      'So sánh công suất, mức tiêu thụ điện và chi phí vật tư tiêu hao, không chỉ giá mua.',
      'Hỏi chính sách bảo hành, thời gian có phụ tùng và đội kỹ thuật hỗ trợ tại chỗ.',
      'Nếu có thể, xem máy đang vận hành tại một khách hàng khác.',
      ...COMMON_TIPS,
    ],
  },
  'hoa-chat-hoa-dau': {
    intro: [
      'Hoá chất và hoá dầu là đầu vào của sản xuất sơn, keo, chất tẩy rửa, xử lý bề mặt, xử lý nước và nhiều quy trình công nghiệp khác. Danh mục này gồm chất màu, keo công nghiệp, dung môi, phụ gia, dầu nhờn và các hoá chất chuyên dụng.',
      'Khi mua hoá chất, độ tinh khiết, nồng độ, quy cách đóng gói và điều kiện bảo quản vận chuyển đều quan trọng không kém giá.',
    ],
    uses: [
      'Sản xuất sơn, mực in, keo dán và chất phủ',
      'Phụ gia cho nhựa, cao su, vật liệu xây dựng',
      'Xử lý nước, xử lý bề mặt kim loại',
      'Dầu bôi trơn và hoá chất bảo trì thiết bị',
    ],
    tips: [
      'Yêu cầu phiếu an toàn hoá chất (SDS) và phiếu kiểm nghiệm (COA) của từng lô hàng.',
      'Xác nhận nhà cung cấp có điều kiện lưu kho, vận chuyển phù hợp với loại hoá chất.',
      'Hỏi rõ nồng độ, quy cách đóng gói và hạn sử dụng.',
      ...COMMON_TIPS,
    ],
  },
  'vat-lieu-moi': {
    intro: [
      'Vật liệu mới gồm các vật liệu kỹ thuật và công nghệ cao như PTFE, vật liệu composite, vật liệu quang điện, gốm kỹ thuật và hợp kim đặc biệt. Chúng thường được chọn khi vật liệu thông thường không đáp ứng yêu cầu về chịu nhiệt, chịu hoá chất, độ bền hoặc trọng lượng.',
      'Do thông số kỹ thuật quyết định hiệu quả sử dụng, bạn nên làm việc trực tiếp với nhà cung cấp để chọn đúng mác vật liệu cho ứng dụng của mình.',
    ],
    uses: [
      'Gioăng, ống, tấm chịu hoá chất và chịu nhiệt (PTFE)',
      'Linh kiện nhẹ, độ bền cao cho thiết bị và phương tiện',
      'Vật liệu cho pin mặt trời và công nghệ năng lượng',
      'Chi tiết kỹ thuật dùng trong môi trường khắc nghiệt',
    ],
    tips: [
      'Nêu rõ điều kiện làm việc: nhiệt độ, hoá chất tiếp xúc, tải trọng.',
      'Xin mẫu thử và thông số kỹ thuật chi tiết trước khi đặt hàng.',
      'Hỏi khả năng gia công theo bản vẽ nếu bạn cần chi tiết có hình dạng riêng.',
      ...COMMON_TIPS,
    ],
  },
  'khuon-mau-co-khi': {
    intro: [
      'Khuôn mẫu và gia công cơ khí chính xác là nền tảng của sản xuất hàng loạt: khuôn ép phun, khuôn thổi, khuôn dập, gia công CNC, tiện, phay, mài và các dịch vụ tooling. Chất lượng khuôn ảnh hưởng trực tiếp tới độ chính xác, tuổi thọ và giá thành sản phẩm.',
      'Với đơn hàng đặt riêng, bản vẽ kỹ thuật, dung sai và vật liệu là ba thông tin nhà cung cấp cần có để báo giá chính xác.',
    ],
    uses: [
      'Chế tạo khuôn ép phun, khuôn thổi, khuôn dập mới và sửa khuôn',
      'Gia công CNC chi tiết máy theo bản vẽ',
      'Làm mẫu thử, sản xuất loạt nhỏ',
      'Thiết kế và chế tạo đồ gá, jig, fixture',
    ],
    tips: [
      'Chuẩn bị bản vẽ 2D/3D, dung sai và vật liệu để nhận báo giá sát thực tế.',
      'Hỏi về thiết bị gia công, quy trình kiểm tra kích thước và thời gian chế tạo.',
      'Yêu cầu sản phẩm mẫu hoặc ví dụ khuôn đã làm tương tự.',
      ...COMMON_TIPS,
    ],
  },
  'dien-dien-tu-cap': {
    intro: [
      'Điện, điện tử và cáp gồm dây cáp điện, cáp tín hiệu, cảm biến, thiết bị chiếu sáng, tủ điện, linh kiện điện tử và vật tư đấu nối. Đây là nhóm vật tư dùng ở hầu hết nhà máy, công trình và thiết bị.',
      'Với vật tư điện, tiêu chuẩn kỹ thuật và độ an toàn quan trọng hơn giá rẻ: sai thông số có thể gây dừng máy hoặc mất an toàn.',
    ],
    uses: [
      'Đi dây, cấp nguồn cho nhà xưởng và công trình',
      'Cảm biến và linh kiện cho thiết bị tự động',
      'Chiếu sáng nhà xưởng, văn phòng',
      'Tủ điện, thiết bị đóng cắt và bảo vệ',
    ],
    tips: [
      'Xác nhận tiêu chuẩn, điện áp và tiết diện phù hợp với tải thực tế.',
      'Yêu cầu chứng nhận chất lượng và tem nhãn rõ ràng của nhà sản xuất.',
      'Hỏi khả năng cung cấp ổn định khi cần mua số lượng lớn hoặc nhiều đợt.',
      ...COMMON_TIPS,
    ],
  },
  'in-an': {
    intro: [
      'Ngành in ấn và bao bì gồm máy in nhãn, hệ thống RFID, vật tư in Flexo, mực in, màng bao bì và giải pháp đóng gói. Danh mục này phục vụ nhà in, nhà máy cần nhãn mác, bao bì và truy xuất nguồn gốc.',
      'Chọn đúng vật tư in và thiết bị giúp màu sắc ổn định, giảm hao hụt và đáp ứng yêu cầu của khách hàng cuối.',
    ],
    uses: [
      'In nhãn sản phẩm, tem truy xuất nguồn gốc, mã vạch',
      'Bao bì flexible, thùng carton, màng co',
      'Vật tư in Flexo: bản in, trục anilox, mực in',
      'Hệ thống RFID quản lý kho và sản xuất',
    ],
    tips: [
      'Nêu rõ chất liệu in, số màu, khổ in và sản lượng dự kiến.',
      'Yêu cầu in thử mẫu để kiểm tra màu và độ bám trước khi đặt hàng.',
      'Hỏi về vật tư đi kèm và chi phí vận hành lâu dài.',
      ...COMMON_TIPS,
    ],
  },
  'cntt-phan-mem-ai': {
    intro: [
      'Công nghệ thông tin, phần mềm và AI cho nhà máy gồm hệ thống IoT thu thập dữ liệu thiết bị, phần mềm quản lý sản xuất, giải pháp AI dự báo bảo trì và phân tích dữ liệu vận hành. Đây là lớp giải pháp giúp biến dữ liệu máy móc thành quyết định quản lý.',
      'Hiệu quả của giải pháp phụ thuộc nhiều vào việc triển khai và tích hợp với hệ thống sẵn có, nên cần làm việc kỹ với đơn vị cung cấp.',
    ],
    uses: [
      'Giám sát máy móc và dây chuyền theo thời gian thực',
      'Dự báo hỏng hóc, giảm thời gian dừng máy',
      'Báo cáo sản xuất tự động, truy xuất nguồn gốc',
      'Tích hợp dữ liệu giữa máy, MES và ERP',
    ],
    tips: [
      'Xác định mục tiêu đo được (giảm dừng máy, giảm phế phẩm) trước khi chọn giải pháp.',
      'Hỏi về khả năng kết nối với thiết bị và phần mềm hiện có.',
      'Làm rõ chi phí bản quyền, triển khai, đào tạo và hỗ trợ sau triển khai.',
      ...COMMON_TIPS,
    ],
  },
  'an-toan-nang-luong': {
    intro: [
      'An toàn và năng lượng gồm thiết bị phòng cháy chữa cháy, an toàn lao động, giải pháp tiết kiệm điện và năng lượng tái tạo cho nhà máy. Đây là nhóm vừa liên quan tuân thủ quy định vừa tác động trực tiếp tới chi phí vận hành.',
      'Với thiết bị an toàn, việc đạt tiêu chuẩn và có chứng nhận hợp quy là yêu cầu bắt buộc, không chỉ là lựa chọn.',
    ],
    uses: [
      'Hệ thống báo cháy, chữa cháy cho nhà xưởng',
      'Thiết bị bảo hộ và an toàn lao động',
      'Giải pháp tiết kiệm điện: biến tần, tụ bù, chiếu sáng hiệu suất cao',
      'Hệ thống điện mặt trời và lưu trữ năng lượng',
    ],
    tips: [
      'Yêu cầu chứng nhận hợp quy, kiểm định theo quy định hiện hành.',
      'Đề nghị khảo sát thực tế và tính toán mức tiết kiệm trước khi đầu tư.',
      'Hỏi chính sách bảo hành, bảo trì định kỳ và thời gian hỗ trợ.',
      ...COMMON_TIPS,
    ],
  },
  'do-luong-kiem-tra': {
    intro: [
      'Đo lường và kiểm tra gồm thiết bị quét 3D, đo laser, máy đo tọa độ, dịch vụ kiểm định và hiệu chuẩn. Nhóm này giúp nhà máy kiểm soát chất lượng, phát hiện sai lệch sớm và chứng minh sản phẩm đạt yêu cầu của khách hàng.',
      'Độ chính xác của phép đo phụ thuộc cả thiết bị lẫn việc hiệu chuẩn định kỳ, nên nên chọn đơn vị có dịch vụ hiệu chuẩn đi kèm.',
    ],
    uses: [
      'Kiểm tra kích thước chi tiết gia công, khuôn mẫu',
      'Quét 3D phục vụ thiết kế ngược và so sánh với bản vẽ',
      'Hiệu chuẩn, kiểm định thiết bị đo',
      'Kiểm tra chất lượng đầu vào và đầu ra dây chuyền',
    ],
    tips: [
      'Xác định độ chính xác và phạm vi đo cần thiết trước khi chọn thiết bị.',
      'Hỏi về dịch vụ hiệu chuẩn, chứng chỉ và phần mềm đi kèm.',
      'Yêu cầu đo thử trên mẫu thực tế của bạn.',
      ...COMMON_TIPS,
    ],
  },
  'kho-van-nang-ha': {
    intro: [
      'Kho vận và nâng hạ gồm xe nâng, xe đẩy, kệ kho, hệ thống kho thông minh, thiết bị nâng hạ và ắc quy công nghiệp. Đây là nhóm thiết bị quyết định tốc độ lưu chuyển hàng hoá và độ an toàn trong kho xưởng.',
      'Ngoài mua mới, nhiều doanh nghiệp còn thuê hoặc mua xe nâng đã qua sử dụng; khi đó tình trạng kỹ thuật và lịch sử bảo dưỡng là điều cần kiểm tra kỹ.',
    ],
    uses: [
      'Xếp dỡ, di chuyển hàng trong kho và nhà xưởng',
      'Lưu trữ hàng trên hệ thống kệ, kho tự động',
      'Nâng hạ người và vật liệu trên cao',
      'Cung cấp, thay thế ắc quy và sạc cho xe điện',
    ],
    tips: [
      'Xác định tải trọng, chiều cao nâng và điều kiện mặt bằng (lối đi, nền, thang máy).',
      'So sánh xe điện và xe dầu theo cường độ sử dụng và chi phí vận hành.',
      'Hỏi chính sách bảo hành, bảo dưỡng định kỳ và phụ tùng.',
      ...COMMON_TIPS,
    ],
  },
  'vat-lieu-xay-dung': {
    intro: [
      'Vật liệu xây dựng gồm các nhóm vật tư dùng cho công trình dân dụng, công nghiệp và hạ tầng: thép, xi măng, gạch, đá, cát, tấm lợp, vật liệu hoàn thiện, vật liệu cách nhiệt và chống thấm.',
      'Giá và chất lượng vật liệu xây dựng biến động theo thời điểm và khu vực, nên việc so sánh nhiều báo giá và kiểm tra chứng nhận chất lượng giúp tránh rủi ro cho công trình.',
    ],
    uses: [
      'Thi công nhà xưởng, văn phòng, công trình dân dụng',
      'Kết cấu thép và vật tư cơ khí xây dựng',
      'Vật liệu hoàn thiện, cách nhiệt, chống thấm',
      'Vật tư cho hạ tầng, nhà kho, khu công nghiệp',
    ],
    tips: [
      'Yêu cầu chứng nhận chất lượng và nguồn gốc xuất xứ của từng lô hàng.',
      'Hỏi chi phí vận chuyển và thời gian giao hàng tới công trình.',
      'Với đơn hàng lớn, nên thoả thuận rõ lịch giao hàng theo tiến độ thi công.',
      ...COMMON_TIPS,
    ],
  },
};
