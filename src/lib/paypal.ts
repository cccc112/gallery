const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';
// Set to 'https://api-m.paypal.com' for production
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 */
export async function generatePayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    // cache: 'no-store' is important so next.js doesn't cache the short-lived token
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('PayPal token generation failed:', errorBody);
    throw new Error('Failed to generate PayPal Access Token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a PayPal order
 */
export async function createPayPalOrder(amountTwd: number, orderIdStr: string) {
  const accessToken = await generatePayPalAccessToken();
  const url = `${PAYPAL_API_BASE}/v2/checkout/orders`;
  
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: orderIdStr,
        amount: {
          currency_code: 'TWD',
          value: amountTwd.toString(),
        },
        description: 'Blanc Coin Top-up',
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('PayPal create order failed:', errorBody);
    throw new Error('Failed to create PayPal order');
  }

  return response.json();
}

/**
 * Capture a PayPal order
 */
export async function capturePayPalOrder(orderId: string) {
  const accessToken = await generatePayPalAccessToken();
  const url = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('PayPal capture order failed:', errorBody);
    throw new Error('Failed to capture PayPal order');
  }

  return response.json();
}
