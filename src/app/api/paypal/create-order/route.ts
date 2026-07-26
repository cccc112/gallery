import { NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const orderIdStr = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const order = await createPayPalOrder(amount, orderIdStr);
    
    // Return the PayPal order ID to the client
    return NextResponse.json({ id: order.id, customOrderId: orderIdStr });
  } catch (error: any) {
    console.error('Create PayPal Order Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
