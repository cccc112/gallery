import crypto from 'crypto';

export const LINEPAY_CHANNEL_ID = process.env.LINEPAY_CHANNEL_ID || '';
export const LINEPAY_CHANNEL_SECRET = process.env.LINEPAY_CHANNEL_SECRET || '';
export const LINEPAY_ENV = process.env.LINEPAY_ENV || 'sandbox';

const LINEPAY_SITE = LINEPAY_ENV === 'production' 
  ? 'https://api-pay.line.me' 
  : 'https://sandbox-api-pay.line.me';

/**
 * Generate LINE Pay V3 Signature
 */
function generateSignature(uri: string, requestBody: string, nonce: string): string {
  const message = `${LINEPAY_CHANNEL_SECRET}${uri}${requestBody}${nonce}`;
  const hmac = crypto.createHmac('sha256', LINEPAY_CHANNEL_SECRET);
  return hmac.update(message).digest('base64');
}

/**
 * Send Request to LINE Pay V3 API
 */
export async function requestLinePay(uri: string, body: any) {
  const nonce = crypto.randomUUID();
  const requestBody = JSON.stringify(body);
  const signature = generateSignature(uri, requestBody, nonce);

  const response = await fetch(`${LINEPAY_SITE}${uri}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature,
    },
    body: requestBody,
  });

  return await response.json();
}
