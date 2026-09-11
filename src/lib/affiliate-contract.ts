import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { SMEE_CONTRACT_COMPANY, type AffiliateContractDocumentData } from './contract-template-fields';

export { SMEE_CONTRACT_COMPANY, type AffiliateContractDocumentData } from './contract-template-fields';

const paragraph = (text: string): Content => ({
  text,
  alignment: 'justify',
  margin: [0, 0, 0, 7],
  lineHeight: 1.25,
});

const clause = (number: string, text: string): Content => ({
  unbreakable: true,
  columnGap: 4,
  columns: [
    { text: number, width: 36, bold: true },
    { text, width: '*', alignment: 'justify', lineHeight: 1.25 },
  ],
  margin: [0, 0, 0, 7],
});

const section = (title: string, pageBreak?: 'before'): Content => ({
  text: title,
  bold: true,
  fontSize: 12,
  margin: [0, 8, 0, 8],
  pageBreak,
});

export function buildAffiliateContractDocument(
  data: AffiliateContractDocumentData,
): TDocumentDefinitions {
  const company = SMEE_CONTRACT_COMPANY;
  const signature = data.signatureData
    ? { image: data.signatureData, width: 115, height: 60, fit: [115, 60] as [number, number], alignment: 'center' as const }
    : { text: '\n\n(Ký và ghi rõ họ tên)', italics: true, alignment: 'center' as const };

  return {
    info: {
      title: `Hợp đồng KOL/KOC ${data.contractNumber}`,
      author: company.internationalName,
      subject: 'Hợp tác quảng bá dịch vụ quảng cáo và tiếp thị trực tuyến',
    },
    pageSize: 'A4',
    pageMargins: [58, 52, 58, 54],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10.5,
      lineHeight: 1.2,
    },
    footer: (currentPage, pageCount) => ({
      text: `Hợp đồng ${data.contractNumber} - Trang ${currentPage}/${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#666666',
      margin: [0, 16, 0, 0],
    }),
    styles: {
      title: { fontSize: 15, bold: true, alignment: 'center', margin: [0, 0, 0, 6] },
      subtitle: { fontSize: 10.5, alignment: 'center', margin: [0, 0, 0, 16] },
      partyTitle: { fontSize: 11, bold: true, margin: [0, 7, 0, 5] },
      label: { bold: true },
    },
    content: [
      { text: 'HỢP ĐỒNG HỢP TÁC QUẢNG BÁ DỊCH VỤ', style: 'title' },
      { text: 'QUẢNG CÁO VÀ TIẾP THỊ TRỰC TUYẾN', style: 'title' },
      { text: `Số: ${data.contractNumber}`, style: 'subtitle' },
      {
        table: {
          widths: [128, '*'],
          body: [
            [{ text: 'Ngày ký kết', bold: true }, data.signedDate],
            [{ text: 'ÔNG/BÀ', bold: true }, data.fullName.toUpperCase()],
            ['Địa chỉ', data.address],
            ['Điện thoại', data.phone],
            ['Email nhận hợp đồng', data.contractEmail],
            ['Email đăng nhập hệ thống', data.loginEmail],
            ['Mã KOL/KOC', data.affiliateCode],
            ['Số CCCD', data.citizenId],
            ['Ngày cấp CCCD', data.citizenIdIssuedAt],
            ['Nơi cấp CCCD', data.citizenIdIssuedBy],
            ['Chức danh', data.position || 'Không áp dụng'],
            ['Tài khoản ngân hàng', data.bankAccountNumber],
            ['Ngân hàng', data.bankName],
            ['Chi nhánh', data.bankBranch || 'Không cung cấp'],
            ['Tỉnh/Thành phố', data.bankProvince || 'Không cung cấp'],
            ['Chủ tài khoản', data.bankAccountHolder],
          ],
        },
        layout: {
          hLineWidth: () => 0.4,
          vLineWidth: () => 0.4,
          hLineColor: () => '#bbbbbb',
          vLineColor: () => '#bbbbbb',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 10],
      },
      { text: '(Sau đây gọi tắt là Đối Tác)', italics: true, margin: [0, 3, 0, 10] },
      paragraph('Đồng ý tham gia mạng lưới tiếp thị liên kết và quảng bá dịch vụ quảng cáo, truyền thông và tiếp thị trực tuyến của:'),
      { text: company.internationalName, style: 'partyTitle' },
      {
        ul: [
          `Mã số thuế: ${company.taxCode}`,
          `Địa chỉ thuế: ${company.taxAddress}`,
          `Địa chỉ: ${company.address}`,
          `Điện thoại: ${company.phone}`,
          'Đại diện: ..........................................................  Chức vụ: ..........................................................',
        ],
        margin: [12, 0, 0, 10],
      },
      { text: '(Sau đây gọi tắt là SMEE)', italics: true, margin: [0, 0, 0, 10] },
      paragraph('(SMEE và Đối Tác sau đây gọi riêng là một Bên và gọi chung là các Bên.)'),

      section('I. PHẠM VI HỢP TÁC VÀ GHI NHẬN HOA HỒNG', 'before'),
      clause('1.1', `Đối Tác là ${data.creatorType} hợp tác quảng bá các gói dịch vụ quảng cáo, truyền thông và tiếp thị trực tuyến do SMEE cung cấp. SMEE cấp mã tiếp thị liên kết riêng cho Đối Tác để ghi nhận lượt giới thiệu và hoa hồng.`),
      clause('1.2', `Khách hàng được ghi nhận cho Đối Tác theo nguyên tắc lượt giới thiệu hợp lệ cuối cùng trong thời hạn cookie ${data.cookieDurationDays} ngày, trừ trường hợp có gian lận, tự tạo đơn hoặc sử dụng một kênh trả phí khác làm thay đổi nguồn ghi nhận.`),
      clause('1.3', 'Đối Tác chỉ sử dụng nội dung trung thực, phù hợp pháp luật, quy chuẩn thương hiệu và hướng dẫn chiến dịch do SMEE công bố.'),
      clause('1.4', `Mức hoa hồng hiện tại của Đối Tác là ${data.referralRatePercent}% trên doanh thu hợp lệ. Chính sách tiêu chuẩn là 5%; đạt 5 đơn thành công lên VIP 6%; đạt 10 đơn thành công lên SVIP 7%.`),
      clause('1.5', 'VIP có quyền đề nghị hỗ trợ chạy quảng cáo và được chăm sóc khách hàng cá nhân. SVIP bao gồm quyền lợi VIP và có thể được hỗ trợ ekip media để xây dựng nội dung video hoặc hình ảnh.'),
      clause('1.6', 'Nếu Đối Tác đồng thời là người bán và người giới thiệu trong cùng một đơn hàng, Đối Tác chỉ nhận quyền lợi theo vai trò người bán; không cộng thêm hoa hồng giới thiệu.'),
      clause('1.7', `Hoa hồng được giữ trong ${data.commissionHoldDays} ngày để xử lý đối soát, hủy đơn hoặc hoàn tiền. Các khoản hoàn tiền có thể bị thu hồi hoặc cấn trừ vào kỳ tiếp theo.`),
      clause('1.8', 'SMEE có thể điều chỉnh chính sách hoa hồng và thông báo cho Đối Tác trước khi áp dụng. Chính sách mới là một phần của Hợp đồng này kể từ ngày có hiệu lực.'),
      clause('1.9', 'SMEE thực hiện khấu trừ, kê khai và nộp thuế thay cho Đối Tác khi pháp luật yêu cầu. Đối Tác chịu trách nhiệm về tính chính xác của thông tin thuế và hồ sơ cá nhân đã cung cấp.'),

      section('II. QUYỀN VÀ NGHĨA VỤ CỦA SMEE'),
      clause('2.1', 'Cung cấp tài khoản, mã giới thiệu và công cụ để Đối Tác theo dõi lượt giới thiệu, đơn hàng, hoa hồng và thanh toán.'),
      clause('2.2', 'Cung cấp thông tin dịch vụ, tài nguyên truyền thông và hỗ trợ hợp lý để Đối Tác triển khai hoạt động quảng bá.'),
      clause('2.3', 'Đối soát và thanh toán hoa hồng hợp lệ vào tài khoản ngân hàng do Đối Tác đăng ký, theo lịch và ngưỡng thanh toán được công bố trên hệ thống.'),
      clause('2.4', 'Bảo vệ dữ liệu cá nhân và hồ sơ hợp đồng của Đối Tác theo quy định pháp luật và chính sách bảo mật của SMEE.'),
      clause('2.5', 'Tạm dừng hoặc chấm dứt hợp tác khi phát hiện dấu hiệu gian lận, xâm phạm dữ liệu khách hàng, vi phạm pháp luật hoặc gây tổn hại nghiêm trọng đến uy tín và thương hiệu SMEE.'),

      section('III. CAM KẾT CỦA ĐỐI TÁC'),
      clause('3.1', 'Thông tin cá nhân, CCCD, chữ ký và tài khoản ngân hàng cung cấp cho SMEE là đầy đủ, chính xác và thuộc quyền sử dụng hợp pháp của Đối Tác.'),
      clause('3.2', 'Không quảng bá sai sự thật, spam, giả mạo thương hiệu, tự tạo giao dịch, mua từ khóa thương hiệu trái phép hoặc sử dụng dữ liệu khách hàng không có căn cứ pháp lý.'),
      clause('3.3', 'Không cam kết thay SMEE về giá, kết quả kinh doanh hoặc quyền lợi ngoài phạm vi tài liệu và chương trình đã được SMEE phê duyệt.'),
      clause('3.4', 'Phối hợp với SMEE giải quyết phản ánh của khách hàng và thông báo ngay khi phát hiện sự cố có thể ảnh hưởng đến các Bên.'),
      clause('3.5', 'Tự chịu trách nhiệm về nội dung, kênh truyền thông và nghĩa vụ pháp lý phát sinh từ hoạt động quảng bá do mình thực hiện.'),

      section('IV. ĐỐI SOÁT VÀ THANH TOÁN'),
      clause('4.1', 'Hai Bên đối soát các đơn hàng thành công theo dữ liệu trên hệ thống SMEE. Đơn bị hủy, hoàn tiền, gian lận hoặc không đủ điều kiện sẽ không được tính hoa hồng.'),
      clause('4.2', 'Khi nhận thông báo đối soát, Đối Tác phải phản hồi trong thời hạn nêu trên hệ thống. Hết thời hạn mà không có ý kiến thì số liệu được xem là đã thống nhất.'),
      clause('4.3', 'Thanh toán được thực hiện bằng chuyển khoản tới tài khoản nêu tại Hợp đồng. Đối Tác chịu trách nhiệm thông báo và cập nhật kịp thời khi thông tin ngân hàng thay đổi.'),

      section('V. HIỆU LỰC, CHẤM DỨT VÀ BẢO MẬT'),
      clause('5.1', 'Hợp đồng có hiệu lực từ ngày Đối Tác hoàn tất thông tin, xác nhận và tạo bản hợp đồng trên hệ thống SMEE; thời hạn là 01 năm và tự động gia hạn từng năm nếu không Bên nào thông báo chấm dứt trước ít nhất 15 ngày làm việc.'),
      clause('5.2', 'Một Bên có thể chấm dứt Hợp đồng khi Bên kia vi phạm nghiêm trọng, mất khả năng thanh toán, giải thể, phá sản hoặc không khắc phục vi phạm trong thời hạn hợp lý sau khi nhận thông báo.'),
      clause('5.3', 'Khi Hợp đồng chấm dứt, các Bên đối soát và xử lý các khoản công nợ, bồi hoàn hoặc cấn trừ còn tồn đọng theo quy định pháp luật và chính sách hợp lệ tại thời điểm chấm dứt.'),
      clause('5.4', 'Các Bên không tiết lộ nội dung Hợp đồng, dữ liệu khách hàng, thông tin kinh doanh và tài liệu nhận được trong quá trình hợp tác, trừ khi có chấp thuận hoặc phải cung cấp theo yêu cầu hợp pháp của cơ quan có thẩm quyền.'),

      section('VI. LUẬT ÁP DỤNG VÀ GIẢI QUYẾT TRANH CHẤP'),
      clause('6.1', 'Hợp đồng được điều chỉnh và giải thích theo pháp luật Việt Nam.'),
      clause('6.2', 'Tranh chấp trước hết được giải quyết bằng thương lượng thiện chí. Nếu không đạt thỏa thuận, một Bên có quyền đưa vụ việc ra Tòa án có thẩm quyền theo quy định pháp luật.'),
      clause('6.3', 'Bản PDF được tạo từ tài khoản đã xác thực, kèm dữ liệu chữ ký do Đối Tác cung cấp, là bản thể hiện nội dung mà Đối Tác xác nhận trên hệ thống.'),

      {
        unbreakable: true,
        columns: [
          {
            width: '*',
            alignment: 'center',
            stack: [
              { text: 'ĐẠI DIỆN SMEE', bold: true },
              { text: '\n\n\n(Ký, ghi rõ họ tên và đóng dấu)', italics: true },
            ],
          },
          {
            width: '*',
            alignment: 'center',
            stack: [
              { text: 'ĐỐI TÁC', bold: true },
              signature,
              { text: data.fullName.toUpperCase(), bold: true, margin: [0, 4, 0, 0] },
            ],
          },
        ],
        margin: [0, 24, 0, 0],
      },
    ],
  };
}
