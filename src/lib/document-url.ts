// Giấy tờ nhà cung cấp không còn mở link công khai, phải đi qua API kiểm tra quyền.
export function documentViewUrl(fileUrl: string) {
  const marker = '/supplier-documents/';
  const i = fileUrl.indexOf(marker);
  if (i === -1) return fileUrl;
  return `/api/supplier/documents/${fileUrl.slice(i + marker.length)}`;
}