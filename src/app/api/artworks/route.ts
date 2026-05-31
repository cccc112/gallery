import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // 1. 驗證登入狀態
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    // 2. 解析表單欄位
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const artType = formData.get('art_type') as 'physical' | 'digital';
    const price = formData.get('price') ? Number(formData.get('price')) : null;
    const isRentable = formData.get('is_rentable') === 'true';
    const monthlyRentPrice = formData.get('monthly_rent_price') ? Number(formData.get('monthly_rent_price')) : null;
    const depositAmount = formData.get('deposit_amount') ? Number(formData.get('deposit_amount')) : null;
    const stock = formData.get('stock') ? Number(formData.get('stock')) : (artType === 'physical' ? 1 : null);
    const width = formData.get('width') ? Number(formData.get('width')) : null;
    const height = formData.get('height') ? Number(formData.get('height')) : null;
    const depth = formData.get('depth') ? Number(formData.get('depth')) : null;
    const weight = formData.get('weight') ? Number(formData.get('weight')) : null;

    // 3. 必填驗證
    if (!title || !artType) {
      return NextResponse.json({ error: '作品名稱與類型為必填' }, { status: 400 });
    }

    // 4. 處理圖片上傳
    let previewFileUrl: string | null = null;
    const imageFile = formData.get('image') as File | null;
    const imageUrl = formData.get('image_url') as string | null;

    if (imageFile && imageFile.size > 0) {
      // 上傳到 Supabase Storage
      const fileExt = imageFile.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('artwork-images')
        .upload(filePath, uint8Array, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json(
          { error: `圖片上傳失敗: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from('artwork-images')
        .getPublicUrl(uploadData.path);

      previewFileUrl = publicUrlData.publicUrl;
    } else if (imageUrl) {
      previewFileUrl = imageUrl;
    }

    // 5. 寫入 artworks 資料表（artist_id 強制綁定為當前用戶）
    const result = await sql`
      INSERT INTO public.artworks (
        artist_id,
        title,
        description,
        art_type,
        price,
        is_rentable,
        monthly_rent_price,
        deposit_amount,
        stock,
        width,
        height,
        depth,
        weight,
        preview_file_url,
        created_at
      ) VALUES (
        ${user.id},
        ${title},
        ${description},
        ${artType},
        ${price},
        ${isRentable},
        ${isRentable ? monthlyRentPrice : null},
        ${isRentable ? depositAmount : null},
        ${stock},
        ${width},
        ${height},
        ${depth},
        ${weight},
        ${previewFileUrl},
        NOW()
      )
      RETURNING id, title
    `;

    return NextResponse.json({
      success: true,
      artwork: result[0],
    });
  } catch (error: any) {
    console.error('Artwork creation error:', error);
    return NextResponse.json(
      { error: error.message || '發布失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
