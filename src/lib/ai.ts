import { z } from 'zod';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export const searchNeedSchema = z.object({
  product: z.string().nullish(),
  province: z.string().nullish(),
  macroRegion: z.enum(['NORTH', 'CENTRAL', 'SOUTH']).nullish(),
  businessType: z
    .enum(['MANUFACTURER', 'DISTRIBUTOR', 'IMPORTER', 'OEM_ODM', 'SYSTEM_INTEGRATOR', 'TECHNICAL_SERVICE'])
    .nullish(),
  quantity: z.string().nullish(),
  extraRequirements: z.string().nullish(),
});

export type SearchNeed = z.infer<typeof searchNeedSchema>;

const SYSTEM_PROMPT = `Bạn là bộ phân tích câu tìm nguồn cung vật liệu/thiết bị công nghiệp tại Việt Nam.
Đọc câu của người dùng và trả về DUY NHẤT một JSON với đúng các khóa sau, khóa nào không có thông tin thì để null. Không được bịa thêm thông tin không có trong câu.

- - product: tên vật liệu/sản phẩm cần tìm, ngắn gọn 1-3 từ. Chỉ giữ tên vật liệu hoặc sản phẩm, BỎ các từ chỉ công đoạn hay loại hình doanh nghiệp (ép, gia công, xưởng, nhà máy, cung cấp). VD: "xưởng ép nhựa ABS" → "nhựa ABS"; "cần mua nhôm 6063" → "nhôm 6063"; "khay nhựa thực phẩm" → "khay nhựa thực phẩm".
- province: tên tỉnh/thành nếu người dùng nêu cụ thể (VD "Bắc Ninh", "Hải Phòng").
- macroRegion: "NORTH" nếu nói miền Bắc, "CENTRAL" nếu miền Trung, "SOUTH" nếu miền Nam; ngược lại null.
- businessType: một trong MANUFACTURER (xưởng, nhà máy, nhà sản xuất), DISTRIBUTOR (phân phối, đại lý), IMPORTER (nhập khẩu), OEM_ODM (gia công theo đơn hàng), SYSTEM_INTEGRATOR (tích hợp hệ thống), TECHNICAL_SERVICE (dịch vụ kỹ thuật); không rõ thì null.
- quantity: số lượng/sản lượng người dùng nêu, giữ nguyên cách nói (VD "20.000 sản phẩm/tháng").
- extraRequirements: yêu cầu khác như chứng nhận, thời gian giao hàng, nếu có.`;

const RETRYABLE_STATUS = new Set([429, 503]);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini hay trả 503 (quá tải) hoặc 429 (hết nhịp) thoáng qua, nên tự gọi lại vài lần trước khi bỏ cuộc.
async function callGemini(apiKey: string, body: unknown, attempts: number): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
      },
    );
    if (res.ok || !RETRYABLE_STATUS.has(res.status) || attempt >= attempts) return res;
    console.warn(`Gemini ${res.status}, thử lại lần ${attempt}/${attempts - 1}`);
    await sleep(1000 * attempt);
  }
}

export async function analyzeSearchNeed(text: string): Promise<SearchNeed> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY chưa được cấu hình');

  const res = await callGemini(
    apiKey,
    {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    },
    3,
  );

  if (!res.ok) {
    console.error('Gemini error:', res.status, await res.text());
    throw new Error(`Gemini trả lỗi ${res.status}`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof raw !== 'string') throw new Error('Gemini không trả về nội dung');

  return searchNeedSchema.parse(JSON.parse(raw));
}

export interface ReplyFacts {
  product?: string | null;
  region?: string | null;
  businessType?: string | null;
  quantity?: string | null;
  extraRequirements?: string | null;
  supplierCount: number;
  productCount: number;
  topSuppliers: { name: string; province: string | null }[];
}

const REPLY_PROMPT = `Bạn là trợ lý tìm nguồn cung trên sàn Supply Merterial, nói chuyện thân thiện như một người tư vấn thật.
Bạn nhận một JSON gồm nhu cầu của khách và KẾT QUẢ TÌM KIẾM THẬT. Hãy viết lời đáp tiếng Việt, 2-3 câu, xưng "mình", gọi khách là "bạn".
Quy tắc:
- Chỉ nói những gì có trong JSON. Không bịa tên công ty, con số, chứng nhận hay năng lực.
- Có kết quả: nói số lượng tìm thấy và nhắc tối đa 2 tên công ty đầu trong topSuppliers.
- Nếu khách nêu quantity hoặc extraRequirements: nói thẳng là mình chưa lọc được theo mục đó, gợi ý gửi yêu cầu báo giá để nhà cung cấp trả lời trực tiếp.
- supplierCount = 0 và productCount = 0: nói chưa thấy kết quả, gợi ý bỏ bớt bộ lọc khu vực hoặc gửi yêu cầu báo giá chung.
- Không dùng markdown, không gạch đầu dòng, không emoji.`;

const replyCache = new Map<string, string>();

export async function writeSearchReply(facts: ReplyFacts): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const cacheKey = JSON.stringify(facts);
  const cached = replyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await callGemini(
      apiKey,
      {
        systemInstruction: { parts: [{ text: REPLY_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(facts) }] }],
        generationConfig: { temperature: 0.7 },
      },
      2,
    );
    if (!res.ok) {
      console.error('Gemini reply error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string' || !text.trim()) return null;

    if (replyCache.size > 200) replyCache.clear();
    replyCache.set(cacheKey, text.trim());
    return text.trim();
  } catch (err) {
    console.error('Gemini reply failed:', err);
    return null;
  }
}