// Nội dung Điều khoản sử dụng và Chính sách bảo mật (hiện trong popup lúc đăng ký).
// Điền thông tin thật vào LEGAL_INFO trước khi đưa lên website chính thức.

export const LEGAL_INFO = {
  operatorName: 'Smee Academy',
  supportEmail: 'Nvan04494@gmail.com',
  phone: '0368998140',
  address: 'Tp Bắc Ninh, Việt Nam',
};

export interface LegalSection {
  title: string;
  items: string[]; // mỗi phần tử là 1 đoạn; bắt đầu bằng "- " thì hiện dạng gạch đầu dòng
}

export interface LegalDoc {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

const { operatorName, supportEmail, phone, address } = LEGAL_INFO;

const TERMS: LegalDoc = {
  title: 'Điều khoản sử dụng',
  updatedAt: '10/2026',
  sections: [
    {
      title: '1. Dịch vụ',
      items: [
        `SMEE (${operatorName}) là nền tảng kết nối doanh nghiệp mua và nhà cung cấp. SMEE chỉ đóng vai trò trung gian giới thiệu, không phải bên bán hay bên mua trong các giao dịch giữa người dùng.`,
      ],
    },
    {
      title: '2. Tài khoản',
      items: [
        'Bạn cung cấp thông tin chính xác, giữ bí mật mật khẩu và chịu trách nhiệm với mọi hoạt động trên tài khoản của mình.',
      ],
    },
    {
      title: '3. Nhà cung cấp "Đã duyệt"',
      items: [
        'Nhãn này nghĩa là hồ sơ đã được SMEE xem xét theo thông tin được cung cấp. Đây không phải là bảo đảm về chất lượng, giá cả hay uy tín. Bạn cần tự kiểm tra trước khi giao dịch.',
      ],
    },
    {
      title: '4. Đăng nhu cầu mua ("Cần mua")',
      items: [
        '- Bài đăng được admin duyệt trước khi hiển thị. SMEE có quyền từ chối hoặc gỡ bài vi phạm.',
        '- Bài có thời hạn hiển thị (7, 15 hoặc 30 ngày tính từ lúc được duyệt) và tự ẩn khi hết hạn.',
        '- Báo giá chỉ người đăng bài nhìn thấy.',
        '- Không đăng thông tin nhạy cảm, bí mật kinh doanh hoặc dữ liệu nội bộ không muốn công khai.',
      ],
    },
    {
      title: '5. Hành vi bị cấm',
      items: [
        'Đăng thông tin sai sự thật hoặc lừa đảo, spam, quảng cáo không liên quan, mạo danh, thu thập dữ liệu hàng loạt, xâm phạm quyền sở hữu trí tuệ, hoặc nội dung vi phạm pháp luật. Vi phạm có thể bị gỡ bài hoặc khóa tài khoản.',
      ],
    },
    {
      title: '6. Giao dịch giữa người dùng',
      items: [
        'Việc thương lượng, thanh toán, giao nhận hàng do hai bên tự thỏa thuận và tự chịu trách nhiệm. SMEE không tham gia và không chịu trách nhiệm về tranh chấp phát sinh, nhưng sẽ hỗ trợ cung cấp thông tin trong phạm vi pháp luật cho phép.',
      ],
    },
    {
      title: '7. Giới hạn trách nhiệm',
      items: [
        'Dịch vụ được cung cấp "như hiện có". SMEE không bảo đảm dịch vụ không gián đoạn và không chịu trách nhiệm về thiệt hại gián tiếp phát sinh từ việc sử dụng nền tảng, trong phạm vi pháp luật cho phép.',
      ],
    },
    {
      title: '8. Thay đổi điều khoản và liên hệ',
      items: [
        'SMEE có thể cập nhật điều khoản và sẽ thông báo trên website. Việc tiếp tục sử dụng nghĩa là bạn đồng ý với bản mới.',
        `Liên hệ: ${supportEmail}`,
      ],
    },
  ],
};

const PRIVACY: LegalDoc = {
  title: 'Chính sách bảo mật',
  updatedAt: '10/2026',
  sections: [
    {
      title: '1. Dữ liệu chúng tôi thu thập',
      items: [
        '- Tài khoản: họ tên, email, số điện thoại, mật khẩu (lưu dạng mã hóa).',
        '- Hồ sơ nhà cung cấp: tên công ty, mã số thuế, địa chỉ, thông tin liên hệ, sản phẩm.',
        '- Nội dung bạn gửi: yêu cầu báo giá, bài "Cần mua", báo giá, tin nhắn hỗ trợ.',
        '- Dữ liệu kỹ thuật: cookie đăng nhập, địa chỉ IP (dùng để chống spam).',
      ],
    },
    {
      title: '2. Mục đích sử dụng',
      items: [
        'Vận hành tài khoản, kết nối người mua với nhà cung cấp, gửi thông báo và email liên quan, chống gian lận và spam, cải thiện dịch vụ.',
      ],
    },
    {
      title: '3. Thông tin hiển thị công khai',
      items: [
        '- Hồ sơ nhà cung cấp đã duyệt được hiển thị công khai.',
        '- Với bài "Cần mua", chỉ hiển thị tên rút gọn (ví dụ "Nguyễn H."), không công khai email và số điện thoại.',
        '- Báo giá chỉ người đăng bài xem được. Yêu cầu báo giá chỉ gửi tới công ty bạn chọn.',
      ],
    },
    {
      title: '4. Chia sẻ dữ liệu',
      items: [
        'SMEE không bán dữ liệu cá nhân. Dữ liệu chỉ được chuyển cho: (a) bên bạn chủ động gửi yêu cầu; (b) nhà cung cấp dịch vụ kỹ thuật của chúng tôi (gửi email, lưu trữ, hạ tầng máy chủ, dịch vụ AI tìm kiếm của bên thứ ba), chỉ để vận hành dịch vụ; (c) cơ quan nhà nước khi có yêu cầu hợp pháp.',
      ],
    },
    {
      title: '5. Tìm kiếm AI',
      items: [
        'Khi dùng "AI Supplier Search", nội dung bạn nhập có thể được gửi tới nhà cung cấp dịch vụ AI để xử lý. Vui lòng không nhập thông tin nhạy cảm.',
      ],
    },
    {
      title: '6. Lưu trữ và bảo mật',
      items: [
        'Dữ liệu được lưu trên hệ thống có biện pháp bảo vệ hợp lý (mã hóa mật khẩu, kiểm soát truy cập). Không hệ thống nào an toàn tuyệt đối. Dữ liệu được giữ khi tài khoản còn hoạt động và theo thời hạn pháp luật yêu cầu.',
      ],
    },
    {
      title: '7. Quyền của bạn',
      items: [
        `Bạn có quyền truy cập, chỉnh sửa, yêu cầu xóa dữ liệu hoặc rút lại sự đồng ý bằng cách liên hệ ${supportEmail}. Chúng tôi phản hồi trong thời gian hợp lý theo quy định.`,
      ],
    },
    {
      title: '8. Cookie',
      items: ['Chúng tôi dùng cookie cần thiết để giữ phiên đăng nhập. Không dùng cookie quảng cáo của bên thứ ba.'],
    },
    {
      title: '9. Liên hệ',
      items: [`${operatorName}`, `Địa chỉ: ${address}`, `Email: ${supportEmail}`, `Điện thoại: ${phone}`],
    },
  ],
};

export const LEGAL_DOCS = { terms: TERMS, privacy: PRIVACY };
export type LegalDocKey = keyof typeof LEGAL_DOCS;
