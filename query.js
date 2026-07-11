const postgres = require('postgres');
const sql = postgres('postgresql://postgres.akabubzxgpbiemcgpzuf:Richhcir0122@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres', { ssl: 'require' });

async function test() {
  try {
    const search = '';
    const type = 'all';
    const rentable = false;
    const artworks = await sql`
        SELECT a.*, u.display_name as artist_name,
               (SELECT COUNT(*) FROM public.page_views pv WHERE pv.artwork_id = a.id) as views_count,
               (SELECT COUNT(*) FROM public.favorites f WHERE f.artwork_id = a.id) as likes_count
        FROM public.artworks a
        JOIN public.users u ON a.artist_id = u.id
        WHERE 
          (${search} = '' OR a.title ILIKE ${'%' + search + '%'} OR a.description ILIKE ${'%' + search + '%'})
          AND (${type} = 'all' OR a.art_type = ${type})
          AND (${rentable} = false OR a.is_rentable = true)
        ORDER BY a.created_at DESC
      `;
    console.log(artworks);
  } catch (err) {
    console.error(err);
  }
  sql.end();
}
test();
