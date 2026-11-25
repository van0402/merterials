// Chèn dữ liệu cấu trúc (schema.org) cho Google đọc
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // thay "<" để nội dung do người dùng nhập không phá được thẻ script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
