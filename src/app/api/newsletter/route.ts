import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '請輸入有效的電子郵件' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error('[newsletter] 缺少 RESEND_API_KEY 或 RESEND_AUDIENCE_ID');
    return NextResponse.json({ error: '訂閱服務暫時無法使用' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          unsubscribed: false,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // 409 = 已訂閱，視為成功
      if (res.status === 409) {
        return NextResponse.json({ success: true, alreadySubscribed: true });
      }
      console.error('[newsletter] Resend error:', err);
      return NextResponse.json({ error: '訂閱失敗，請稍後再試' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[newsletter] fetch error:', err.message);
    return NextResponse.json({ error: '連線失敗，請稍後再試' }, { status: 500 });
  }
}
