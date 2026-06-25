import crypto from 'crypto';

// 預設為綠界官方提供的測試用金鑰
export const ECPAY_HASH_KEY = process.env.ECPAY_HASH_KEY || '5294y06JbISpM5x9';
export const ECPAY_HASH_IV = process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS';
export const ECPAY_MERCHANT_ID = process.env.ECPAY_MERCHANT_ID || '2000132';

// 綠界的 URL Encode 規則與標準 JS 有微小差異
function ecpayUrlEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/%2d/gi, '-')
    .replace(/%5f/gi, '_')
    .replace(/%2e/gi, '.')
    .replace(/%21/gi, '!')
    .replace(/%2a/gi, '*')
    .replace(/%28/gi, '(')
    .replace(/%29/gi, ')')
    .toLowerCase();
}

export function generateCheckMacValue(params: Record<string, any>) {
  // 1. 按參數名稱字母排序
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 組合字串 (HashKey + 參數 + HashIV)
  let rawStr = `HashKey=${ECPAY_HASH_KEY}`;
  for (const key of sortedKeys) {
    if (key !== 'CheckMacValue' && params[key] !== '') {
      rawStr += `&${key}=${params[key]}`;
    }
  }
  rawStr += `&HashIV=${ECPAY_HASH_IV}`;
  
  // 3. URL Encode 並轉小寫
  const encodedStr = ecpayUrlEncode(rawStr);
  
  // 4. SHA256 雜湊並轉大寫
  const checkMacValue = crypto.createHash('sha256').update(encodedStr).digest('hex').toUpperCase();
  
  return checkMacValue;
}
