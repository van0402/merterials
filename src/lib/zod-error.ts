// Đổi lỗi kỹ thuật của zod thành câu tiếng Việt nói rõ trường nào sai.
// Dùng chung cho mọi route có validate bằng zod (xem src/app/api/supplier/apply/route.ts, src/app/api/inquiries/route.ts).

type Issue = {
  path: PropertyKey[];
  code: string;
  message: string;
  origin?: string;
  minimum?: unknown;
  maximum?: unknown;
};

function describeIssue(issue: Issue, fieldLabels: Record<string, string>) {
  const label = fieldLabels[String(issue.path[0] ?? '')] ?? 'Thông tin';
  if (issue.code === 'custom') return issue.message;
  if (issue.code === 'too_big' && issue.origin === 'string') return `${label} quá dài (tối đa ${issue.maximum} ký tự)`;
  if (issue.code === 'too_small' && issue.origin === 'string') return `${label} quá ngắn (tối thiểu ${issue.minimum} ký tự)`;
  if (issue.code === 'too_small' && issue.origin === 'array') return issue.message;
  if (issue.code === 'invalid_format') return `${label} không đúng định dạng`;
  return `${label} không hợp lệ`;
}

/** Gộp tất cả lỗi zod thành 1 câu dễ hiểu, kèm tên trường lỗi đầu tiên (để FE focus đúng ô). */
export function describeZodIssues(issues: Issue[], fieldLabels: Record<string, string>) {
  const messages = [...new Set(issues.map((issue) => describeIssue(issue, fieldLabels)))];
  return { message: messages.join('. '), field: String(issues[0]?.path[0] ?? '') };
}
