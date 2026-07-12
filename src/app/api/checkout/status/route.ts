import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const type = searchParams.get('type'); // 'buy' or 'rent'

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let isPaid = false;
    let statusMsg = 'pending';

    if (type === 'rent') {
      const rentals = await sql`SELECT status FROM public.rentals WHERE payment_transaction_id = ${sessionId} LIMIT 1`;
      if (rentals.length > 0) {
        if (rentals[0].status === 'active') {
          isPaid = true;
          statusMsg = 'paid';
        }
      } else {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
    } else {
      const orders = await sql`SELECT payment_status FROM public.orders WHERE payment_transaction_id = ${sessionId} LIMIT 1`;
      if (orders.length > 0) {
        if (orders[0].payment_status === 'paid' || orders[0].payment_status === 'completed') {
          isPaid = true;
          statusMsg = 'paid';
        } else if (orders[0].payment_status === 'failed') {
          statusMsg = 'failed';
        }
      } else {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ status: statusMsg, isPaid });

  } catch (error: any) {
    console.error('Checkout status API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
