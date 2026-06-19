'use server';

import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const VALID_ART_TYPES = ['physical', 'digital', 'photography'] as const;
type ArtType = typeof VALID_ART_TYPES[number];

export async function createArtwork(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/new');

  const artistId = user.id;
  const title = (formData.get('title') as string)?.trim();
  const description = formData.get('description') as string;
  const artType = formData.get('artType') as string;

  // 驗證 art_type
  if (!VALID_ART_TYPES.includes(artType as ArtType)) {
    throw new Error('無效的藝術品類型');
  }

  const previewFileUrl = (formData.get('previewFileUrl') as string)?.trim();
  if (!previewFileUrl) throw new Error('請填寫預覽圖片連結');
  if (!title) throw new Error('請填寫作品名稱');

  const priceInput = formData.get('price') as string;
  const price = priceInput ? Number(priceInput) : null;

  const isRentable = formData.get('isRentable') === 'true';
  const monthlyRentPriceInput = formData.get('monthlyRentPrice') as string;
  const monthlyRentPrice = isRentable && monthlyRentPriceInput ? Number(monthlyRentPriceInput) : null;
  const depositAmountInput = formData.get('depositAmount') as string;
  const depositAmount = isRentable && depositAmountInput ? Number(depositAmountInput) : null;

  // ── 實體 / 攝影 共用欄位（尺寸）──
  const isPhysical = artType === 'physical' || artType === 'photography';
  const widthInput = formData.get('width') as string;
  const width = isPhysical && widthInput ? Number(widthInput) : null;
  const heightInput = formData.get('height') as string;
  const height = isPhysical && heightInput ? Number(heightInput) : null;
  const depthInput = formData.get('depth') as string;
  const depth = artType === 'physical' && depthInput ? Number(depthInput) : null;
  const weightInput = formData.get('weight') as string;
  const weight = isPhysical && weightInput ? Number(weightInput) : null;
  const stockInput = formData.get('stock') as string;
  const stock = isPhysical && stockInput ? Number(stockInput) : (artType === 'digital' ? 1 : null);

  // ── 數位專屬 ──
  const highResFileUrlInput = formData.get('highResFileUrl') as string;
  const highResFileUrl = artType === 'digital' ? (highResFileUrlInput?.trim() || null) : null;

  // ── 攝影專屬 ──
  const editionSizeInput = formData.get('edition_size') as string;
  const editionSize = artType === 'photography' && editionSizeInput ? Number(editionSizeInput) : null;
  const printMaterial = artType === 'photography'
    ? ((formData.get('print_material') as string)?.trim() || null)
    : null;

  // ── 驗證 ──
  if (artType === 'physical') {
    if (!width || !height || stock === null) throw new Error('實體藝術品必須填寫寬度、高度與庫存！');
  }
  if (artType === 'photography') {
    if (!width || !height || stock === null) throw new Error('攝影作品必須填寫沖印尺寸與庫存！');
  }
  if (artType === 'digital') {
    if (!highResFileUrl) throw new Error('數位藝術品必須填寫高解析度原始檔連結！');
  }
  if (isRentable && (!monthlyRentPrice || !depositAmount)) {
    throw new Error('啟動租用方案時，月租金與押金必填！');
  }

  try {
    await sql`
      INSERT INTO public.artworks (
        artist_id, title, description, art_type, price,
        is_rentable, monthly_rent_price, deposit_amount,
        width, height, depth, weight, stock,
        high_res_file_url, preview_file_url,
        edition_size, print_material
      ) VALUES (
        ${artistId}, ${title}, ${description}, ${artType}, ${price},
        ${isRentable}, ${monthlyRentPrice}, ${depositAmount},
        ${width}, ${height}, ${depth}, ${weight}, ${stock},
        ${highResFileUrl}, ${previewFileUrl},
        ${editionSize}, ${printMaterial}
      )
    `;
  } catch (error: any) {
    console.error('Database write error:', error);
    // 若是欄位不存在（尚未跑 migration），提示更清楚
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      throw new Error('請先在 Supabase 執行 Migration SQL（加入 edition_size、print_material 欄位）');
    }
    throw new Error('資料庫上架失敗，請檢查資料是否完整！');
  }

  revalidatePath('/gallery');
  revalidatePath('/admin');
  redirect('/admin');
}
