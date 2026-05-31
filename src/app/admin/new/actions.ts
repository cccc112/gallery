'use server';

import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createArtwork(formData: FormData) {
  const artistId = '94c64b59-994c-41c3-882d-127e9086e927'; // 模擬藝術家 ID
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const artType = formData.get('artType') as string; // 'physical' | 'digital'
  const previewFileUrl = formData.get('previewFileUrl') as string || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600';
  
  const priceInput = formData.get('price') as string;
  const price = priceInput ? Number(priceInput) : null;

  const isRentable = formData.get('isRentable') === 'true';
  const monthlyRentPriceInput = formData.get('monthlyRentPrice') as string;
  const monthlyRentPrice = isRentable && monthlyRentPriceInput ? Number(monthlyRentPriceInput) : null;
  const depositAmountInput = formData.get('depositAmount') as string;
  const depositAmount = isRentable && depositAmountInput ? Number(depositAmountInput) : null;

  // 實體欄位
  const widthInput = formData.get('width') as string;
  const width = artType === 'physical' && widthInput ? Number(widthInput) : null;
  const heightInput = formData.get('height') as string;
  const height = artType === 'physical' && heightInput ? Number(heightInput) : null;
  const depthInput = formData.get('depth') as string;
  const depth = artType === 'physical' && depthInput ? Number(depthInput) : null;
  const weightInput = formData.get('weight') as string;
  const weight = artType === 'physical' && weightInput ? Number(weightInput) : null;
  const stockInput = formData.get('stock') as string;
  const stock = artType === 'physical' && stockInput ? Number(stockInput) : null;

  // 數位欄位
  const highResFileUrlInput = formData.get('highResFileUrl') as string;
  const highResFileUrl = artType === 'digital' 
    ? (highResFileUrlInput || 'https://example.com/private/custom-art-highres.png') 
    : null;

  // 伺服器端資料庫整合驗證 (對應 DB Check Constraints)
  if (artType === 'physical') {
    if (!width || !height || stock === null) {
      throw new Error('實體藝術品必須填寫寬度、高度與庫存！');
    }
  } else if (artType === 'digital') {
    if (!highResFileUrl) {
      throw new Error('數位藝術品必須填寫高解析度原始檔連結！');
    }
  }

  if (isRentable) {
    if (!monthlyRentPrice || !depositAmount) {
      throw new Error('啟動租用方案時，月租金與押金必填！');
    }
  }

  // 寫入 Supabase 資料庫
  try {
    await sql`
      INSERT INTO public.artworks (
        artist_id, title, description, art_type, price, 
        is_rentable, monthly_rent_price, deposit_amount, 
        width, height, depth, weight, stock, 
        high_res_file_url, preview_file_url
      ) VALUES (
        ${artistId}, ${title}, ${description}, ${artType}, ${price},
        ${isRentable}, ${monthlyRentPrice}, ${depositAmount},
        ${width}, ${height}, ${depth}, ${weight}, ${stock},
        ${highResFileUrl}, ${previewFileUrl}
      )
    `;
  } catch (error) {
    console.error('Database write error:', error);
    throw new Error('資料庫上架失敗，請檢查資料結構限制！');
  }

  revalidatePath('/gallery');
  revalidatePath('/admin');
  redirect('/admin');
}
