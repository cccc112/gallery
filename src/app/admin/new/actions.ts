'use server';

import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createArtwork(formData: FormData) {
  // 從 session 取得真實登入用戶 ID
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/new');

  const artistId = user.id;

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const artType = formData.get('artType') as string;

  // 驗證 art_type 是有效值
  if (artType !== 'physical' && artType !== 'digital') {
    throw new Error('無效的藝術品類型');
  }

  const previewFileUrl = formData.get('previewFileUrl') as string;
  if (!previewFileUrl?.trim()) {
    throw new Error('請填寫預覽圖片連結');
  }

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

  // 數位欄位（無 fallback，必填）
  const highResFileUrlInput = formData.get('highResFileUrl') as string;
  const highResFileUrl = artType === 'digital' ? (highResFileUrlInput?.trim() || null) : null;

  // 伺服器端驗證
  if (!title?.trim()) throw new Error('請填寫作品名稱');

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
    throw new Error('資料庫上架失敗，請檢查資料是否完整！');
  }

  revalidatePath('/gallery');
  revalidatePath('/admin');
  redirect('/admin');
}
