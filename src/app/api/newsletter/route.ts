import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '請輸入有效的電子郵件' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email });

    if (error) {
      // 處理已經訂閱的狀況 (UNIQUE 衝突)
      if (error.code === '23505') {
        return NextResponse.json({ success: true, alreadySubscribed: true });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[newsletter] error:', err.message);
    return NextResponse.json({ error: '連線失敗，請稍後再試' }, { status: 500 });
  }
}
