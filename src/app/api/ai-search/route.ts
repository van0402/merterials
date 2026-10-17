import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { analyzeSearchNeed } from '@/lib/ai';

// Cho phép route chạy tối đa 30 giây (tránh bị cắt sớm trên Vercel khi Gemini chậm)
export const maxDuration = 30;

const bodySchema = z.object({ text: z.string().trim().min(5).max(500) });

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const rateLimit = await checkRateLimit(ip, 'ai-search', 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Bạn thao tác quá nhanh, thử lại sau ít phút nhé.' },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Mô tả nhu cầu cần từ 5 tới 500 ký tự.' },
      { status: 400 },
    );
  }

  try {
    const need = await analyzeSearchNeed(parsed.data.text);
    return NextResponse.json({ success: true, need });
  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json(
      { success: false, error: 'Chưa phân tích được lúc này, bạn thử lại hoặc dùng tìm nhanh nhé.' },
      { status: 502 },
    );
  }
}