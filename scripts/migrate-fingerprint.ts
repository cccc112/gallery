import postgres from 'postgres';
import crypto from 'crypto';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  try {
    // 1. Add column
    await sql`ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS fingerprint TEXT UNIQUE`;
    console.log('Added fingerprint column to artworks');

    // 2. Backfill existing artworks
    const existing = await sql`SELECT id, artist_id, title, created_at FROM public.artworks WHERE fingerprint IS NULL`;
    console.log(`Found ${existing.length} artworks without fingerprint`);

    for (const art of existing) {
      const dataString = `${art.title}-${art.artist_id}-${new Date(art.created_at).getTime()}`;
      const fingerprint = crypto.createHash('sha256').update(dataString).digest('hex');
      await sql`UPDATE public.artworks SET fingerprint = ${fingerprint} WHERE id = ${art.id}`;
      console.log(`Updated artwork ${art.id} with fingerprint ${fingerprint}`);
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

main();
